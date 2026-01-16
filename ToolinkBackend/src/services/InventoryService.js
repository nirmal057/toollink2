import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import EmailService from './EmailService.js';
import PredictionService from './PredictionService.js';
import logger from '../utils/logger.js';

class InventoryService {
    /**
     * Real-time stock tracking with automatic alerts
     */
    static async updateStock(inventoryId, updateData, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const inventory = await Inventory.findById(inventoryId);
            if (!inventory) {
                throw new Error('Inventory item not found');
            }

            const previousStock = inventory.current_stock;
            const { quantity, operation, reference, notes } = updateData;

            // Update stock based on operation
            switch (operation) {
                case 'stock-in':
                    inventory.current_stock += quantity;
                    break;
                case 'stock-out':
                    if (inventory.current_stock < quantity) {
                        throw new Error('Insufficient stock for operation');
                    }
                    inventory.current_stock -= quantity;
                    break;
                case 'adjustment':
                    inventory.current_stock = quantity;
                    break;
                default:
                    throw new Error('Invalid operation type');
            }

            // Add movement record
            inventory.movements = inventory.movements || [];
            inventory.movements.push({
                type: operation,
                quantity: operation === 'adjustment' ? quantity - previousStock : quantity,
                previousStock,
                newStock: inventory.current_stock,
                reference,
                performedBy: userId,
                timestamp: new Date(),
                notes
            });

            inventory.updated_by = userId;
            inventory.quantity = inventory.current_stock; // Sync fields
            await inventory.save({ session });

            // Check for low stock alerts
            await this.checkAndTriggerAlerts(inventory, previousStock);

            // Update prediction models
            await PredictionService.updateStockPrediction(inventory);

            await session.commitTransaction();

            logger.info(`Stock updated for ${inventory.name}: ${previousStock} → ${inventory.current_stock}`);

            return {
                success: true,
                inventory,
                previousStock,
                movement: inventory.movements[inventory.movements.length - 1]
            };

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Multi-warehouse stock checking
     */
    static async checkStockAvailability(materialId, requiredQuantity, preferredWarehouse = null) {
        try {
            // Get stock across all warehouses for this material
            const inventoryItems = await Inventory.find({
                $or: [
                    { materialId },
                    { name: { $regex: materialId, $options: 'i' } },
                    { sku: materialId }
                ],
                status: 'active'
            }).populate('warehouse');

            if (inventoryItems.length === 0) {
                return {
                    available: false,
                    totalStock: 0,
                    locations: [],
                    message: 'Material not found in any warehouse'
                };
            }

            const availability = {
                available: false,
                totalStock: 0,
                requiredQuantity,
                locations: [],
                recommendations: []
            };

            let totalAvailable = 0;

            for (const item of inventoryItems) {
                const availableStock = item.current_stock - (item.reserved_stock || 0);
                totalAvailable += availableStock;

                availability.locations.push({
                    warehouseId: item.warehouse?._id,
                    warehouseName: item.warehouse?.name || item.location,
                    availableStock,
                    distance: preferredWarehouse ?
                        await this.calculateWarehouseDistance(preferredWarehouse, item.warehouse?._id) : 0,
                    canFulfill: availableStock >= requiredQuantity
                });
            }

            availability.totalStock = totalAvailable;
            availability.available = totalAvailable >= requiredQuantity;

            // Sort locations by distance and availability
            availability.locations.sort((a, b) => {
                if (a.canFulfill && !b.canFulfill) return -1;
                if (!a.canFulfill && b.canFulfill) return 1;
                return a.distance - b.distance;
            });

            // Generate recommendations
            if (availability.available) {
                if (availability.locations[0].canFulfill) {
                    availability.recommendations.push('Single warehouse fulfillment possible');
                } else {
                    availability.recommendations.push('Multi-warehouse fulfillment required');
                }
            } else {
                const shortage = requiredQuantity - totalAvailable;
                availability.recommendations.push(`Shortage of ${shortage} units. Consider partial fulfillment or reorder.`);
            }

            return availability;

        } catch (error) {
            logger.error('Stock availability check failed:', error);
            throw error;
        }
    }

    /**
     * Calculate distance between warehouses (simplified for Sri Lanka)
     */
    static async calculateWarehouseDistance(warehouse1Id, warehouse2Id) {
        try {
            if (warehouse1Id === warehouse2Id) return 0;

            const [warehouse1, warehouse2] = await Promise.all([
                Warehouse.findById(warehouse1Id),
                Warehouse.findById(warehouse2Id)
            ]);

            if (!warehouse1 || !warehouse2) return 999; // High distance for missing data

            // Simplified distance calculation for Sri Lankan provinces
            const distanceMatrix = {
                'Colombo-Kandy': 115,
                'Colombo-Galle': 119,
                'Colombo-Jaffna': 396,
                'Kandy-Galle': 142,
                'Kandy-Jaffna': 281,
                'Galle-Jaffna': 515
            };

            const key1 = `${warehouse1.location.city}-${warehouse2.location.city}`;
            const key2 = `${warehouse2.location.city}-${warehouse1.location.city}`;

            return distanceMatrix[key1] || distanceMatrix[key2] || 50; // Default 50km

        } catch (error) {
            logger.error('Distance calculation failed:', error);
            return 50; // Default distance
        }
    }

    /**
     * Automatic low stock alerts and notifications
     */
    static async checkAndTriggerAlerts(inventory, previousStock) {
        try {
            const isLowStock = inventory.current_stock <= inventory.min_stock_level;
            const wasLowStock = previousStock <= inventory.min_stock_level;
            const isOutOfStock = inventory.current_stock === 0;

            // Trigger low stock alert
            if (isLowStock && !wasLowStock) {
                await this.triggerLowStockAlert(inventory);
            }

            // Trigger out of stock alert
            if (isOutOfStock) {
                await this.triggerOutOfStockAlert(inventory);
            }

            // Trigger restock suggestion
            if (isLowStock) {
                await this.generateRestockSuggestion(inventory);
            }

        } catch (error) {
            logger.error('Alert triggering failed:', error);
        }
    }

    /**
     * Trigger low stock alert notification
     */
    static async triggerLowStockAlert(inventory) {
        try {
            // Get admin and warehouse staff
            const alertUsers = await User.find({
                role: { $in: ['admin', 'warehouse', 'manager'] },
                isActive: true
            });

            for (const user of alertUsers) {
                await Notification.create({
                    userId: user._id,
                    title: 'Low Stock Alert',
                    message: `${inventory.name} is running low. Current: ${inventory.current_stock} ${inventory.unit}, Minimum: ${inventory.min_stock_level} ${inventory.unit}`,
                    category: 'inventory',
                    type: 'low-stock',
                    priority: 'high',
                    data: {
                        inventoryId: inventory._id,
                        itemName: inventory.name,
                        currentStock: inventory.current_stock,
                        minLevel: inventory.min_stock_level,
                        sku: inventory.sku
                    }
                });

                // Send email alert for critical items
                if (inventory.current_stock <= (inventory.min_stock_level * 0.5)) {
                    await EmailService.sendLowStockAlert(user.email, inventory);
                }
            }

            logger.info(`Low stock alert triggered for ${inventory.name}`);

        } catch (error) {
            logger.error('Low stock alert failed:', error);
        }
    }

    /**
     * Trigger out of stock alert
     */
    static async triggerOutOfStockAlert(inventory) {
        try {
            const alertUsers = await User.find({
                role: { $in: ['admin', 'warehouse', 'manager'] },
                isActive: true
            });

            for (const user of alertUsers) {
                await Notification.create({
                    userId: user._id,
                    title: '🚨 OUT OF STOCK',
                    message: `${inventory.name} is completely out of stock! Immediate reorder required.`,
                    category: 'inventory',
                    type: 'out-of-stock',
                    priority: 'critical',
                    data: {
                        inventoryId: inventory._id,
                        itemName: inventory.name,
                        sku: inventory.sku,
                        urgency: 'immediate'
                    }
                });

                // Send immediate email alert
                await EmailService.sendOutOfStockAlert(user.email, inventory);
            }

            logger.warn(`OUT OF STOCK alert triggered for ${inventory.name}`);

        } catch (error) {
            logger.error('Out of stock alert failed:', error);
        }
    }

    /**
     * Generate intelligent restock suggestions
     */
    static async generateRestockSuggestion(inventory) {
        try {
            // Get historical usage data
            const historicalUsage = await this.getHistoricalUsage(inventory._id, 30); // Last 30 days

            // Calculate optimal reorder quantity
            const avgDailyUsage = historicalUsage.totalUsage / 30;
            const leadTimeDays = 7; // Typical lead time in Sri Lanka
            const safetyStock = avgDailyUsage * 3; // 3 days safety stock

            const reorderPoint = (avgDailyUsage * leadTimeDays) + safetyStock;
            const economicOrderQuantity = Math.ceil(avgDailyUsage * 30); // 30 days supply

            // Consider seasonal factors for Sri Lanka
            const currentMonth = new Date().getMonth() + 1;
            const seasonalMultiplier = this.getSeasonalMultiplier(currentMonth, inventory.category);
            const adjustedEOQ = Math.ceil(economicOrderQuantity * seasonalMultiplier);

            const suggestion = {
                inventoryId: inventory._id,
                itemName: inventory.name,
                currentStock: inventory.current_stock,
                reorderPoint,
                suggestedQuantity: adjustedEOQ,
                reasoning: {
                    avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
                    leadTimeDays,
                    safetyStock: Math.ceil(safetyStock),
                    seasonalFactor: seasonalMultiplier,
                    urgency: inventory.current_stock <= (reorderPoint * 0.5) ? 'high' : 'medium'
                },
                estimatedCost: adjustedEOQ * (inventory.cost || 0),
                supplier: inventory.supplier_info?.name || 'To be determined'
            };

            // Store suggestion for admin review
            await this.storeRestockSuggestion(suggestion);

            logger.info(`Restock suggestion generated for ${inventory.name}: ${adjustedEOQ} units`);

            return suggestion;

        } catch (error) {
            logger.error('Restock suggestion generation failed:', error);
            return null;
        }
    }

    /**
     * Get historical usage data
     */
    static async getHistoricalUsage(inventoryId, days) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const inventory = await Inventory.findById(inventoryId);
            const movements = inventory.movements || [];

            const outboundMovements = movements.filter(movement =>
                movement.type === 'stock-out' &&
                movement.timestamp >= startDate
            );

            const totalUsage = outboundMovements.reduce((sum, movement) => sum + movement.quantity, 0);

            return {
                totalUsage,
                days,
                avgDailyUsage: totalUsage / days,
                movements: outboundMovements.length
            };

        } catch (error) {
            logger.error('Historical usage calculation failed:', error);
            return { totalUsage: 0, days, avgDailyUsage: 0, movements: 0 };
        }
    }

    /**
     * Get seasonal multiplier for Sri Lankan construction patterns
     */
    static getSeasonalMultiplier(month, category) {
        // Sri Lankan construction patterns
        const seasonalFactors = {
            cement: {
                // Higher demand during dry season (Jan-Apr, Jul-Sep)
                1: 1.2, 2: 1.3, 3: 1.4, 4: 1.3,  // Dry season peak
                5: 0.8, 6: 0.7, 7: 1.1, 8: 1.2,   // Monsoon reduction, then recovery
                9: 1.2, 10: 0.9, 11: 0.8, 12: 1.1 // End year construction push
            },
            steel: {
                1: 1.1, 2: 1.2, 3: 1.3, 4: 1.2,
                5: 0.9, 6: 0.8, 7: 1.0, 8: 1.1,
                9: 1.1, 10: 1.0, 11: 0.9, 12: 1.2
            },
            roofing: {
                // Higher demand before monsoon seasons
                1: 1.0, 2: 1.1, 3: 1.3, 4: 1.4,  // Pre-monsoon preparation
                5: 0.7, 6: 0.6, 7: 0.8, 8: 0.9,   // Monsoon season low
                9: 1.2, 10: 0.9, 11: 0.8, 12: 1.1
            },
            default: {
                1: 1.0, 2: 1.0, 3: 1.1, 4: 1.1,
                5: 0.9, 6: 0.8, 7: 0.9, 8: 1.0,
                9: 1.0, 10: 0.9, 11: 0.9, 12: 1.1
            }
        };

        const categoryKey = Object.keys(seasonalFactors).find(key =>
            category.toLowerCase().includes(key)
        ) || 'default';

        return seasonalFactors[categoryKey][month] || 1.0;
    }

    /**
     * Store restock suggestion for admin review
     */
    static async storeRestockSuggestion(suggestion) {
        try {
            // Create notification for procurement team
            const procurementUsers = await User.find({
                role: { $in: ['admin', 'manager'] },
                isActive: true
            });

            for (const user of procurementUsers) {
                await Notification.create({
                    userId: user._id,
                    title: 'Restock Suggestion',
                    message: `Consider reordering ${suggestion.itemName}. Suggested quantity: ${suggestion.suggestedQuantity} units (Estimated cost: Rs. ${suggestion.estimatedCost?.toLocaleString()})`,
                    category: 'procurement',
                    type: 'restock-suggestion',
                    priority: suggestion.reasoning.urgency === 'high' ? 'high' : 'medium',
                    data: suggestion
                });
            }

            logger.info(`Restock suggestion stored for ${suggestion.itemName}`);

        } catch (error) {
            logger.error('Failed to store restock suggestion:', error);
        }
    }

    /**
     * Unit conversion handling for multi-unit inventory
     */
    static convertUnits(quantity, fromUnit, toUnit) {
        const conversions = {
            // Weight conversions
            'kg-tons': 0.001,
            'tons-kg': 1000,
            'g-kg': 0.001,
            'kg-g': 1000,

            // Length conversions
            'mm-cm': 0.1,
            'cm-mm': 10,
            'cm-m': 0.01,
            'm-cm': 100,
            'm-km': 0.001,
            'km-m': 1000,

            // Volume conversions
            'ml-liters': 0.001,
            'liters-ml': 1000,
            'liters-gallons': 0.264172,
            'gallons-liters': 3.78541,

            // Area conversions
            'sqft-sqm': 0.092903,
            'sqm-sqft': 10.7639,

            // Construction specific
            'bags-kg': 50, // Standard cement bag
            'kg-bags': 0.02,
            'sheets-sqm': 2.4, // Standard sheet size
            'sqm-sheets': 0.417
        };

        const conversionKey = `${fromUnit}-${toUnit}`;
        const factor = conversions[conversionKey];

        if (factor) {
            return {
                convertedQuantity: quantity * factor,
                conversionFactor: factor,
                fromUnit,
                toUnit
            };
        }

        // If no conversion found, return original
        return {
            convertedQuantity: quantity,
            conversionFactor: 1,
            fromUnit,
            toUnit,
            warning: 'No conversion available, using original units'
        };
    }

    /**
     * Get comprehensive inventory analytics
     */
    static async getInventoryAnalytics(warehouseId = null) {
        try {
            const filter = warehouseId ? { warehouse: warehouseId } : {};

            const analytics = await Inventory.aggregate([
                { $match: { ...filter, status: 'active' } },
                {
                    $group: {
                        _id: null,
                        totalItems: { $sum: 1 },
                        totalValue: { $sum: { $multiply: ['$current_stock', '$cost'] } },
                        lowStockItems: {
                            $sum: {
                                $cond: [
                                    { $lte: ['$current_stock', '$min_stock_level'] },
                                    1,
                                    0
                                ]
                            }
                        },
                        outOfStockItems: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$current_stock', 0] },
                                    1,
                                    0
                                ]
                            }
                        },
                        avgStockLevel: { $avg: '$current_stock' },
                        categories: { $addToSet: '$category' }
                    }
                }
            ]);

            const result = analytics[0] || {
                totalItems: 0,
                totalValue: 0,
                lowStockItems: 0,
                outOfStockItems: 0,
                avgStockLevel: 0,
                categories: []
            };

            // Add category breakdown
            result.categoryBreakdown = await Inventory.aggregate([
                { $match: { ...filter, status: 'active' } },
                {
                    $group: {
                        _id: '$category',
                        itemCount: { $sum: 1 },
                        totalValue: { $sum: { $multiply: ['$current_stock', '$cost'] } },
                        lowStockCount: {
                            $sum: {
                                $cond: [
                                    { $lte: ['$current_stock', '$min_stock_level'] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                { $sort: { totalValue: -1 } }
            ]);

            // Add trending data
            result.trends = await this.getInventoryTrends(warehouseId);

            return result;

        } catch (error) {
            logger.error('Inventory analytics failed:', error);
            throw error;
        }
    }

    /**
     * Get inventory trending data
     */
    static async getInventoryTrends(warehouseId = null, days = 30) {
        try {
            const filter = warehouseId ? { warehouse: warehouseId } : {};
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // This would typically come from a dedicated analytics collection
            // For now, we'll provide a simplified version
            return {
                stockMovementTrend: 'stable', // Could be 'increasing', 'decreasing', 'stable'
                topMovingItems: [], // Would contain actual data from movements
                slowMovingItems: [], // Items with low turnover
                seasonalForecast: 'normal', // Based on current season
                restockAlerts: 0 // Number of items needing restock
            };

        } catch (error) {
            logger.error('Inventory trends calculation failed:', error);
            return {};
        }
    }
}

export default InventoryService;
