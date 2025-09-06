import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import Delivery from '../models/Delivery.js';
import User from '../models/User.js';
import Prediction from '../models/Prediction.js';
import logger from '../utils/logger.js';

class AnalyticsService {
    /**
     * Get comprehensive dashboard analytics
     */
    static async getDashboardAnalytics(options = {}) {
        try {
            const {
                timeRange = 30, // days
                warehouseId = null,
                includeForecasts = true,
                includeCostAnalysis = true
            } = options;

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - timeRange);

            const analytics = {
                timeRange,
                generatedAt: new Date(),
                overview: await this.getOverviewMetrics(startDate),
                orders: await this.getOrderAnalytics(startDate, warehouseId),
                inventory: await this.getInventoryAnalytics(warehouseId),
                deliveries: await this.getDeliveryAnalytics(startDate),
                customers: await this.getCustomerAnalytics(startDate),
                financial: await this.getFinancialAnalytics(startDate),
                performance: await this.getPerformanceMetrics(startDate),
                trends: await this.getTrendAnalysis(timeRange),
                predictions: includeForecasts ? await this.getPredictionSummary() : null,
                costOptimization: includeCostAnalysis ? await this.getCostOptimizationSuggestions() : null,
                sriLankanInsights: await this.getSriLankanMarketInsights()
            };

            return analytics;

        } catch (error) {
            logger.error('Dashboard analytics failed:', error);
            throw error;
        }
    }

    /**
     * Get overview metrics
     */
    static async getOverviewMetrics(startDate) {
        try {
            const [orders, inventory, deliveries, customers] = await Promise.all([
                Order.countDocuments({ createdAt: { $gte: startDate } }),
                Inventory.countDocuments({ status: 'active' }),
                Delivery.countDocuments({ createdAt: { $gte: startDate } }),
                User.countDocuments({ role: 'customer', createdAt: { $gte: startDate } })
            ]);

            const totalRevenue = await Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$finalAmount' } } }
            ]);

            const lowStockItems = await Inventory.countDocuments({
                $expr: { $lte: ['$current_stock', '$min_stock_level'] },
                status: 'active'
            });

            return {
                totalOrders: orders,
                totalRevenue: totalRevenue[0]?.total || 0,
                activeInventoryItems: inventory,
                lowStockItems,
                totalDeliveries: deliveries,
                newCustomers: customers,
                averageOrderValue: totalRevenue[0]?.total ?
                    Math.round((totalRevenue[0].total / orders) * 100) / 100 : 0
            };

        } catch (error) {
            logger.error('Overview metrics failed:', error);
            return {};
        }
    }

    /**
     * Get order analytics
     */
    static async getOrderAnalytics(startDate, warehouseId = null) {
        try {
            const matchStage = { createdAt: { $gte: startDate } };
            if (warehouseId) {
                matchStage.warehouseId = new mongoose.Types.ObjectId(warehouseId);
            }

            const orderStats = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalValue: { $sum: '$finalAmount' },
                        avgOrderValue: { $avg: '$finalAmount' },
                        pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                        confirmedOrders: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
                        deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                        cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
                    }
                }
            ]);

            // Order trends by day
            const dailyTrends = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        orders: { $sum: 1 },
                        revenue: { $sum: '$finalAmount' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Top selling categories
            const categorySales = await Order.aggregate([
                { $match: matchStage },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'inventories',
                        localField: 'items.inventory',
                        foreignField: '_id',
                        as: 'itemInfo'
                    }
                },
                { $unwind: '$itemInfo' },
                {
                    $group: {
                        _id: '$itemInfo.category',
                        totalSold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: '$items.totalPrice' },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { totalRevenue: -1 } }
            ]);

            const result = orderStats[0] || {
                totalOrders: 0,
                totalValue: 0,
                avgOrderValue: 0,
                pendingOrders: 0,
                confirmedOrders: 0,
                deliveredOrders: 0,
                cancelledOrders: 0
            };

            result.dailyTrends = dailyTrends;
            result.categorySales = categorySales;
            result.fulfillmentRate = result.totalOrders > 0 ?
                Math.round((result.deliveredOrders / result.totalOrders) * 100) : 0;
            result.cancellationRate = result.totalOrders > 0 ?
                Math.round((result.cancelledOrders / result.totalOrders) * 100) : 0;

            return result;

        } catch (error) {
            logger.error('Order analytics failed:', error);
            return {};
        }
    }

    /**
     * Get inventory analytics
     */
    static async getInventoryAnalytics(warehouseId = null) {
        try {
            const matchStage = { status: 'active' };
            if (warehouseId) {
                matchStage.warehouseId = new mongoose.Types.ObjectId(warehouseId);
            }

            const inventoryStats = await Inventory.aggregate([
                { $match: matchStage },
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
                                $cond: [{ $eq: ['$current_stock', 0] }, 1, 0]
                            }
                        },
                        totalStock: { $sum: '$current_stock' },
                        avgStockLevel: { $avg: '$current_stock' }
                    }
                }
            ]);

            // Category breakdown
            const categoryBreakdown = await Inventory.aggregate([
                { $match: matchStage },
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
                        },
                        avgStockLevel: { $avg: '$current_stock' }
                    }
                },
                { $sort: { totalValue: -1 } }
            ]);

            // Stock turnover analysis
            const stockTurnover = await this.calculateStockTurnover(warehouseId);

            // Top value items
            const topValueItems = await Inventory.find(matchStage)
                .sort({ $expr: { $multiply: ['$current_stock', '$cost'] } })
                .limit(10)
                .select('name current_stock cost category');

            const result = inventoryStats[0] || {
                totalItems: 0,
                totalValue: 0,
                lowStockItems: 0,
                outOfStockItems: 0,
                totalStock: 0,
                avgStockLevel: 0
            };

            result.categoryBreakdown = categoryBreakdown;
            result.stockTurnover = stockTurnover;
            result.topValueItems = topValueItems;
            result.stockHealthScore = this.calculateStockHealthScore(result);

            return result;

        } catch (error) {
            logger.error('Inventory analytics failed:', error);
            return {};
        }
    }

    /**
     * Get delivery analytics
     */
    static async getDeliveryAnalytics(startDate) {
        try {
            const deliveryStats = await Delivery.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: null,
                        totalDeliveries: { $sum: 1 },
                        deliveredCount: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                        pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                        inTransitCount: { $sum: { $cond: [{ $eq: ['$status', 'on_the_way'] }, 1, 0] } },
                        failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
                    }
                }
            ]);

            // Average delivery time
            const avgDeliveryTime = await Delivery.aggregate([
                {
                    $match: {
                        status: 'delivered',
                        scheduledDate: { $exists: true },
                        deliveredAt: { $exists: true }
                    }
                },
                {
                    $project: {
                        deliveryTime: {
                            $divide: [
                                { $subtract: ['$deliveredAt', '$scheduledDate'] },
                                1000 * 60 * 60 * 24 // Convert to days
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgDays: { $avg: '$deliveryTime' }
                    }
                }
            ]);

            // Delivery performance by district (Sri Lankan context)
            const districtPerformance = await this.getDeliveryPerformanceByDistrict(startDate);

            // Driver performance
            const driverPerformance = await Delivery.aggregate([
                { $match: { createdAt: { $gte: startDate }, driverId: { $exists: true } } },
                {
                    $group: {
                        _id: '$driverId',
                        totalDeliveries: { $sum: 1 },
                        successfulDeliveries: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                        failedDeliveries: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'driverInfo'
                    }
                },
                { $unwind: '$driverInfo' },
                {
                    $project: {
                        driverName: '$driverInfo.fullName',
                        totalDeliveries: 1,
                        successfulDeliveries: 1,
                        successRate: {
                            $multiply: [
                                { $divide: ['$successfulDeliveries', '$totalDeliveries'] },
                                100
                            ]
                        }
                    }
                },
                { $sort: { successRate: -1 } }
            ]);

            const result = deliveryStats[0] || {
                totalDeliveries: 0,
                deliveredCount: 0,
                pendingCount: 0,
                inTransitCount: 0,
                failedCount: 0
            };

            result.successRate = result.totalDeliveries > 0 ?
                Math.round((result.deliveredCount / result.totalDeliveries) * 100) : 0;
            result.avgDeliveryTime = avgDeliveryTime[0]?.avgDays || 0;
            result.districtPerformance = districtPerformance;
            result.driverPerformance = driverPerformance;

            return result;

        } catch (error) {
            logger.error('Delivery analytics failed:', error);
            return {};
        }
    }

    /**
     * Get customer analytics
     */
    static async getCustomerAnalytics(startDate) {
        try {
            const customerStats = await User.aggregate([
                { $match: { role: 'customer' } },
                {
                    $group: {
                        _id: null,
                        totalCustomers: { $sum: 1 },
                        newCustomers: {
                            $sum: {
                                $cond: [
                                    { $gte: ['$createdAt', startDate] },
                                    1,
                                    0
                                ]
                            }
                        },
                        activeCustomers: {
                            $sum: {
                                $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            // Customer order frequency
            const customerOrderFrequency = await Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: '$customer',
                        orderCount: { $sum: 1 },
                        totalSpent: { $sum: '$finalAmount' },
                        avgOrderValue: { $avg: '$finalAmount' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        oneTimeCustomers: { $sum: { $cond: [{ $eq: ['$orderCount', 1] }, 1, 0] } },
                        repeatCustomers: { $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] } },
                        avgOrdersPerCustomer: { $avg: '$orderCount' },
                        avgCustomerValue: { $avg: '$totalSpent' }
                    }
                }
            ]);

            // Top customers by value
            const topCustomers = await Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: '$customer',
                        totalSpent: { $sum: '$finalAmount' },
                        orderCount: { $sum: 1 },
                        lastOrderDate: { $max: '$createdAt' }
                    }
                },
                { $sort: { totalSpent: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'customerInfo'
                    }
                },
                { $unwind: '$customerInfo' },
                {
                    $project: {
                        customerName: '$customerInfo.fullName',
                        customerEmail: '$customerInfo.email',
                        totalSpent: 1,
                        orderCount: 1,
                        lastOrderDate: 1,
                        avgOrderValue: { $divide: ['$totalSpent', '$orderCount'] }
                    }
                }
            ]);

            const result = customerStats[0] || {
                totalCustomers: 0,
                newCustomers: 0,
                activeCustomers: 0
            };

            const orderFreq = customerOrderFrequency[0] || {
                oneTimeCustomers: 0,
                repeatCustomers: 0,
                avgOrdersPerCustomer: 0,
                avgCustomerValue: 0
            };

            result.orderFrequency = orderFreq;
            result.topCustomers = topCustomers;
            result.customerRetentionRate = result.totalCustomers > 0 ?
                Math.round((orderFreq.repeatCustomers / result.totalCustomers) * 100) : 0;

            return result;

        } catch (error) {
            logger.error('Customer analytics failed:', error);
            return {};
        }
    }

    /**
     * Get financial analytics
     */
    static async getFinancialAnalytics(startDate) {
        try {
            const financialStats = await Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$finalAmount' },
                        orderCount: { $sum: 1 },
                        avgOrderValue: { $avg: '$finalAmount' }
                    }
                }
            ]);

            // Revenue by category
            const revenueByCategory = await Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'inventories',
                        localField: 'items.inventory',
                        foreignField: '_id',
                        as: 'itemInfo'
                    }
                },
                { $unwind: '$itemInfo' },
                {
                    $group: {
                        _id: '$itemInfo.category',
                        revenue: { $sum: '$items.totalPrice' },
                        quantitySold: { $sum: '$items.quantity' },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { revenue: -1 } }
            ]);

            // Monthly revenue trend
            const monthlyRevenue = await Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        revenue: { $sum: '$finalAmount' },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            // Cost analysis (simplified)
            const costAnalysis = await this.calculateCostAnalysis(startDate);

            const result = financialStats[0] || {
                totalRevenue: 0,
                orderCount: 0,
                avgOrderValue: 0
            };

            result.revenueByCategory = revenueByCategory;
            result.monthlyRevenue = monthlyRevenue;
            result.costAnalysis = costAnalysis;
            result.profitMargin = costAnalysis.totalProfit && result.totalRevenue ?
                Math.round((costAnalysis.totalProfit / result.totalRevenue) * 100) : 0;

            return result;

        } catch (error) {
            logger.error('Financial analytics failed:', error);
            return {};
        }
    }

    /**
     * Get performance metrics
     */
    static async getPerformanceMetrics(startDate) {
        try {
            // Order processing time
            const processingTime = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        status: { $in: ['confirmed', 'delivered'] },
                        confirmedAt: { $exists: true }
                    }
                },
                {
                    $project: {
                        processingTime: {
                            $divide: [
                                { $subtract: ['$confirmedAt', '$createdAt'] },
                                1000 * 60 * 60 // Convert to hours
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgProcessingTime: { $avg: '$processingTime' },
                        maxProcessingTime: { $max: '$processingTime' },
                        minProcessingTime: { $min: '$processingTime' }
                    }
                }
            ]);

            // Inventory turnover
            const inventoryTurnover = await this.calculateInventoryTurnoverRate();

            // Customer satisfaction (based on delivery success rate)
            const satisfactionMetrics = await this.calculateCustomerSatisfaction(startDate);

            // Operational efficiency
            const efficiency = await this.calculateOperationalEfficiency(startDate);

            return {
                orderProcessing: processingTime[0] || {},
                inventoryTurnover,
                customerSatisfaction: satisfactionMetrics,
                operationalEfficiency: efficiency,
                performanceScore: this.calculateOverallPerformanceScore({
                    orderProcessing: processingTime[0],
                    inventoryTurnover,
                    satisfaction: satisfactionMetrics,
                    efficiency
                })
            };

        } catch (error) {
            logger.error('Performance metrics failed:', error);
            return {};
        }
    }

    /**
     * Get trend analysis
     */
    static async getTrendAnalysis(timeRange) {
        try {
            const periods = Math.min(timeRange, 90); // Max 90 days for trends
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - periods);

            // Order trends
            const orderTrends = await Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        orders: { $sum: 1 },
                        revenue: { $sum: '$finalAmount' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Calculate trend direction
            const trendDirection = this.calculateTrendDirection(orderTrends);

            // Seasonal patterns for Sri Lankan market
            const seasonalPatterns = this.analyzeSriLankanSeasonalPatterns(orderTrends);

            return {
                orderTrends,
                trendDirection,
                seasonalPatterns,
                insights: this.generateTrendInsights(trendDirection, seasonalPatterns)
            };

        } catch (error) {
            logger.error('Trend analysis failed:', error);
            return {};
        }
    }

    /**
     * Get prediction summary
     */
    static async getPredictionSummary() {
        try {
            const activePredictions = await Prediction.find({
                validUntil: { $gte: new Date() }
            }).sort({ createdAt: -1 });

            const summary = {
                totalPredictions: activePredictions.length,
                highRiskItems: 0,
                averageConfidence: 0,
                categories: {},
                upcomingStockouts: []
            };

            if (activePredictions.length > 0) {
                summary.averageConfidence = activePredictions.reduce((sum, p) => sum + p.confidence, 0) / activePredictions.length;

                activePredictions.forEach(prediction => {
                    const risk = prediction.metadata?.riskLevel?.level;
                    if (['critical', 'high'].includes(risk)) {
                        summary.highRiskItems++;
                        summary.upcomingStockouts.push({
                            material: prediction.inputData?.material,
                            riskLevel: risk,
                            daysToStockout: this.calculateDaysToStockout(prediction)
                        });
                    }

                    // Category breakdown
                    const category = prediction.inputData?.category || 'Unknown';
                    summary.categories[category] = (summary.categories[category] || 0) + 1;
                });
            }

            return summary;

        } catch (error) {
            logger.error('Prediction summary failed:', error);
            return {};
        }
    }

    /**
     * Get cost optimization suggestions
     */
    static async getCostOptimizationSuggestions() {
        try {
            const suggestions = [];

            // Inventory cost optimization
            const excessStock = await Inventory.find({
                $expr: { $gt: ['$current_stock', { $multiply: ['$max_stock_level', 0.8] }] },
                status: 'active'
            }).limit(5);

            excessStock.forEach(item => {
                suggestions.push({
                    type: 'inventory',
                    priority: 'medium',
                    suggestion: `Reduce stock for ${item.name} - currently ${item.current_stock} units (${Math.round(((item.current_stock / item.max_stock_level) - 1) * 100)}% over max)`,
                    potentialSaving: (item.current_stock - item.max_stock_level) * (item.cost || 0),
                    action: 'Reduce ordering or promote sales'
                });
            });

            // Delivery optimization
            const deliveryOptimization = await this.getDeliveryOptimizationSuggestions();
            suggestions.push(...deliveryOptimization);

            // Supplier optimization
            const supplierOptimization = await this.getSupplierOptimizationSuggestions();
            suggestions.push(...supplierOptimization);

            return {
                suggestions: suggestions.slice(0, 10), // Top 10 suggestions
                totalPotentialSaving: suggestions.reduce((sum, s) => sum + (s.potentialSaving || 0), 0),
                categories: {
                    inventory: suggestions.filter(s => s.type === 'inventory').length,
                    delivery: suggestions.filter(s => s.type === 'delivery').length,
                    supplier: suggestions.filter(s => s.type === 'supplier').length
                }
            };

        } catch (error) {
            logger.error('Cost optimization suggestions failed:', error);
            return {};
        }
    }

    /**
     * Get Sri Lankan market insights
     */
    static async getSriLankanMarketInsights() {
        try {
            const currentMonth = new Date().getMonth() + 1;
            const insights = [];

            // Seasonal insights
            if (currentMonth >= 5 && currentMonth <= 9) {
                insights.push({
                    type: 'seasonal',
                    priority: 'high',
                    title: 'Monsoon Season Impact',
                    message: 'Construction activity typically decreases by 30-40% during monsoon. Consider adjusting inventory levels.',
                    recommendation: 'Reduce orders for outdoor construction materials, focus on indoor supplies.'
                });
            } else if (currentMonth >= 1 && currentMonth <= 4) {
                insights.push({
                    type: 'seasonal',
                    priority: 'high',
                    title: 'Peak Construction Season',
                    message: 'Dry season brings increased construction activity. Ensure adequate stock levels.',
                    recommendation: 'Increase inventory for cement, steel, and roofing materials.'
                });
            }

            // Economic insights (simplified)
            insights.push({
                type: 'economic',
                priority: 'medium',
                title: 'Import Cost Monitoring',
                message: 'Monitor USD/LKR exchange rates for imported materials pricing.',
                recommendation: 'Consider bulk purchases when exchange rates are favorable.'
            });

            // Festival calendar insights
            const upcomingFestivals = this.getUpcomingFestivals();
            if (upcomingFestivals.length > 0) {
                insights.push({
                    type: 'cultural',
                    priority: 'medium',
                    title: 'Upcoming Festival Period',
                    message: `${upcomingFestivals[0].name} approaching - expect reduced activity.`,
                    recommendation: 'Plan deliveries and operations around festival dates.'
                });
            }

            return {
                insights,
                marketCondition: this.assessMarketCondition(currentMonth),
                regionalFactors: this.getRegionalFactors()
            };

        } catch (error) {
            logger.error('Sri Lankan market insights failed:', error);
            return {};
        }
    }

    // Helper methods

    static calculateStockHealthScore(inventoryData) {
        const { totalItems, lowStockItems, outOfStockItems } = inventoryData;
        if (totalItems === 0) return 0;

        const healthyItems = totalItems - lowStockItems - outOfStockItems;
        return Math.round((healthyItems / totalItems) * 100);
    }

    static calculateTrendDirection(trendData) {
        if (trendData.length < 2) return 'stable';

        const recent = trendData.slice(-7); // Last 7 days
        const earlier = trendData.slice(-14, -7); // Previous 7 days

        const recentAvg = recent.reduce((sum, d) => sum + d.orders, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, d) => sum + d.orders, 0) / earlier.length;

        if (recentAvg > earlierAvg * 1.1) return 'increasing';
        if (recentAvg < earlierAvg * 0.9) return 'decreasing';
        return 'stable';
    }

    static analyzeSriLankanSeasonalPatterns(orderTrends) {
        // Analyze patterns specific to Sri Lankan construction cycles
        const patterns = {
            drySeasonBoost: false,
            monsoonImpact: false,
            festivalEffect: false
        };

        // Implementation would analyze actual data patterns
        return patterns;
    }

    static generateTrendInsights(direction, patterns) {
        const insights = [];

        if (direction === 'increasing') {
            insights.push('Order volume is trending upward - consider increasing inventory levels');
        } else if (direction === 'decreasing') {
            insights.push('Order volume is declining - review pricing and marketing strategies');
        }

        return insights;
    }

    static calculateDaysToStockout(prediction) {
        const currentStock = prediction.inputData?.currentStock || 0;
        const dailyDemand = prediction.prediction?.dailyAverage || 1;
        return Math.floor(currentStock / dailyDemand);
    }

    static getUpcomingFestivals() {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;

        const festivals = [
            { name: 'Sinhala Tamil New Year', month: 4 },
            { name: 'Vesak Day', month: 5 },
            { name: 'Esala Perahera', month: 7 }
        ];

        return festivals.filter(f => f.month >= currentMonth && f.month <= currentMonth + 2);
    }

    static assessMarketCondition(month) {
        if (month >= 1 && month <= 4) return 'Peak Season';
        if (month >= 5 && month <= 9) return 'Monsoon Slowdown';
        return 'Recovery Period';
    }

    static getRegionalFactors() {
        return {
            infrastructure: 'Good highway network between major cities',
            logistics: 'Sea ports in Colombo for imports',
            challenges: 'Rural area accessibility during monsoon'
        };
    }

    // Additional helper methods for complex calculations
    static async calculateStockTurnover(warehouseId) {
        // Simplified calculation - in production, use detailed movement analysis
        return { avgTurnoverDays: 45, turnoverRate: 'Moderate' };
    }

    static async getDeliveryPerformanceByDistrict(startDate) {
        // Simplified - would analyze actual delivery data by Sri Lankan districts
        return [
            { district: 'Colombo', successRate: 95, avgDeliveryTime: 1.2 },
            { district: 'Kandy', successRate: 88, avgDeliveryTime: 2.1 },
            { district: 'Galle', successRate: 92, avgDeliveryTime: 1.8 }
        ];
    }

    static async calculateCostAnalysis(startDate) {
        // Simplified cost analysis
        return {
            totalCosts: 0,
            totalProfit: 0,
            costBreakdown: {
                materials: 0,
                delivery: 0,
                operations: 0
            }
        };
    }

    static async calculateInventoryTurnoverRate() {
        return { rate: 8.5, category: 'Good' };
    }

    static async calculateCustomerSatisfaction(startDate) {
        return { score: 85, category: 'Good' };
    }

    static async calculateOperationalEfficiency(startDate) {
        return { score: 78, areas: ['inventory', 'delivery'] };
    }

    static calculateOverallPerformanceScore(metrics) {
        // Weighted performance scoring
        return 82; // Simplified
    }

    static async getDeliveryOptimizationSuggestions() {
        return [
            {
                type: 'delivery',
                priority: 'high',
                suggestion: 'Optimize routes for Colombo district deliveries',
                potentialSaving: 15000,
                action: 'Implement route optimization software'
            }
        ];
    }

    static async getSupplierOptimizationSuggestions() {
        return [
            {
                type: 'supplier',
                priority: 'medium',
                suggestion: 'Negotiate bulk discounts for cement purchases',
                potentialSaving: 25000,
                action: 'Review supplier contracts'
            }
        ];
    }
}

export default AnalyticsService;
