import mongoose from 'mongoose';
import Prediction from '../models/Prediction.js';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import logger from '../utils/logger.js';

class PredictionService {
    /**
     * Enhanced material refill prediction system for Sri Lankan construction market
     */
    static async generateMaterialRefillPrediction(materialId, options = {}) {
        try {
            const {
                timeHorizon = 30, // days
                confidenceLevel = 0.8,
                includeWeather = true,
                includeSeasonal = true,
                includeEconomic = true
            } = options;

            // Get historical data
            const historicalData = await this.getHistoricalDemandData(materialId, 90); // 3 months

            // Get material details
            const material = await Inventory.findById(materialId);
            if (!material) {
                throw new Error('Material not found');
            }

            // Base prediction from historical patterns
            const basePrediction = this.calculateBaseDemandPrediction(historicalData, timeHorizon);

            // Apply Sri Lankan specific factors
            let adjustedPrediction = basePrediction;

            // 1. Seasonal adjustment for Sri Lankan construction patterns
            if (includeSeasonal) {
                adjustedPrediction = this.applySeasonalAdjustment(adjustedPrediction, material.category);
            }

            // 2. Weather impact (monsoon seasons)
            if (includeWeather) {
                const weatherImpact = await this.calculateWeatherImpact(timeHorizon);
                adjustedPrediction = this.applyWeatherAdjustment(adjustedPrediction, weatherImpact);
            }

            // 3. Economic factors (LKR fluctuation, import costs)
            if (includeEconomic) {
                adjustedPrediction = await this.applyEconomicFactors(adjustedPrediction, material);
            }

            // 4. Local festival and holiday impact
            adjustedPrediction = this.applyFestivalAdjustment(adjustedPrediction, timeHorizon);

            // Calculate confidence score
            const confidence = this.calculatePredictionConfidence(historicalData, adjustedPrediction);

            // Generate reorder recommendations
            const reorderRecommendation = this.generateReorderRecommendation(
                material,
                adjustedPrediction,
                confidence
            );

            const prediction = {
                materialId,
                materialName: material.name,
                category: material.category,
                predictionPeriod: timeHorizon,
                currentStock: material.current_stock,
                minimumStock: material.min_stock_level,
                predictions: {
                    baseDemand: basePrediction,
                    adjustedDemand: adjustedPrediction,
                    confidence: confidence,
                    factors: {
                        seasonal: includeSeasonal,
                        weather: includeWeather,
                        economic: includeEconomic,
                        festivals: true
                    }
                },
                recommendations: reorderRecommendation,
                riskLevel: this.calculateRiskLevel(material, adjustedPrediction),
                generatedAt: new Date(),
                validUntil: new Date(Date.now() + (timeHorizon * 24 * 60 * 60 * 1000))
            };

            // Store prediction
            await this.storePrediction(prediction);

            logger.info(`Material refill prediction generated for ${material.name}: ${adjustedPrediction.totalDemand} units over ${timeHorizon} days`);

            return prediction;

        } catch (error) {
            logger.error('Material refill prediction failed:', error);
            throw error;
        }
    }

    /**
     * Get historical demand data for analysis
     */
    static async getHistoricalDemandData(materialId, days) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Get orders containing this material
            const orders = await Order.find({
                'items.inventory': materialId,
                createdAt: { $gte: startDate },
                status: { $in: ['confirmed', 'processing', 'delivered'] }
            }).sort({ createdAt: 1 });

            const demandData = [];
            const dailyDemand = new Map();

            for (const order of orders) {
                const dateKey = order.createdAt.toISOString().split('T')[0];
                const materialItem = order.items.find(item => item.inventory.toString() === materialId);

                if (materialItem) {
                    const currentDemand = dailyDemand.get(dateKey) || 0;
                    dailyDemand.set(dateKey, currentDemand + materialItem.quantity);
                }
            }

            // Convert to array format
            for (const [date, demand] of dailyDemand) {
                demandData.push({
                    date: new Date(date),
                    demand,
                    dayOfWeek: new Date(date).getDay(),
                    month: new Date(date).getMonth() + 1
                });
            }

            return demandData;

        } catch (error) {
            logger.error('Historical demand data retrieval failed:', error);
            return [];
        }
    }

    /**
     * Calculate base demand prediction using moving averages and trends
     */
    static calculateBaseDemandPrediction(historicalData, timeHorizon) {
        if (historicalData.length === 0) {
            return {
                totalDemand: 0,
                dailyAverage: 0,
                trend: 'stable',
                confidence: 0.3
            };
        }

        // Calculate moving averages
        const recentPeriod = Math.min(14, historicalData.length); // Last 14 days
        const recentData = historicalData.slice(-recentPeriod);
        const recentAverage = recentData.reduce((sum, data) => sum + data.demand, 0) / recentData.length;

        // Calculate overall average
        const overallAverage = historicalData.reduce((sum, data) => sum + data.demand, 0) / historicalData.length;

        // Determine trend
        let trend = 'stable';
        if (recentAverage > overallAverage * 1.1) {
            trend = 'increasing';
        } else if (recentAverage < overallAverage * 0.9) {
            trend = 'decreasing';
        }

        // Apply trend factor for prediction
        let trendFactor = 1.0;
        if (trend === 'increasing') {
            trendFactor = 1.1;
        } else if (trend === 'decreasing') {
            trendFactor = 0.9;
        }

        const dailyPrediction = recentAverage * trendFactor;
        const totalDemand = dailyPrediction * timeHorizon;

        return {
            totalDemand: Math.ceil(totalDemand),
            dailyAverage: Math.ceil(dailyPrediction),
            trend,
            confidence: Math.min(0.9, historicalData.length / 30) // Higher confidence with more data
        };
    }

    /**
     * Apply seasonal adjustments for Sri Lankan construction patterns
     */
    static applySeasonalAdjustment(basePrediction, category) {
        const currentMonth = new Date().getMonth() + 1;

        // Sri Lankan construction seasonal patterns
        const seasonalFactors = {
            cement: {
                // Dry season construction boom
                1: 1.2, 2: 1.3, 3: 1.4, 4: 1.3,  // Jan-Apr: Peak construction
                5: 0.7, 6: 0.6, 7: 0.8, 8: 0.9,   // May-Aug: Monsoon slowdown
                9: 1.1, 10: 0.9, 11: 0.8, 12: 1.2 // Sep-Dec: Recovery and year-end rush
            },
            steel: {
                1: 1.1, 2: 1.2, 3: 1.3, 4: 1.2,
                5: 0.8, 6: 0.7, 7: 0.9, 8: 1.0,
                9: 1.1, 10: 1.0, 11: 0.9, 12: 1.3
            },
            roofing: {
                // Pre-monsoon preparation
                1: 1.0, 2: 1.1, 3: 1.4, 4: 1.5,  // Pre-monsoon peak
                5: 0.5, 6: 0.4, 7: 0.6, 8: 0.7,   // Monsoon minimum
                9: 1.2, 10: 0.8, 11: 0.7, 12: 1.1
            },
            tiles: {
                1: 1.0, 2: 1.1, 3: 1.3, 4: 1.4,
                5: 0.6, 6: 0.5, 7: 0.7, 8: 0.8,
                9: 1.1, 10: 0.9, 11: 0.8, 12: 1.0
            },
            paint: {
                1: 1.1, 2: 1.2, 3: 1.3, 4: 1.2,
                5: 0.8, 6: 0.7, 7: 0.8, 8: 0.9,
                9: 1.0, 10: 1.1, 11: 1.0, 12: 1.2
            },
            default: {
                1: 1.0, 2: 1.1, 3: 1.2, 4: 1.1,
                5: 0.8, 6: 0.7, 7: 0.8, 8: 0.9,
                9: 1.0, 10: 0.9, 11: 0.9, 12: 1.1
            }
        };

        const categoryKey = Object.keys(seasonalFactors).find(key =>
            category.toLowerCase().includes(key)
        ) || 'default';

        const seasonalFactor = seasonalFactors[categoryKey][currentMonth];

        return {
            ...basePrediction,
            totalDemand: Math.ceil(basePrediction.totalDemand * seasonalFactor),
            dailyAverage: Math.ceil(basePrediction.dailyAverage * seasonalFactor),
            seasonalFactor,
            seasonalNote: this.getSeasonalNote(currentMonth)
        };
    }

    /**
     * Get seasonal note for current period
     */
    static getSeasonalNote(month) {
        if (month >= 1 && month <= 4) {
            return 'Dry season - Peak construction activity';
        } else if (month >= 5 && month <= 9) {
            return 'Southwest monsoon - Reduced construction activity';
        } else if (month >= 10 && month <= 12) {
            return 'Northeast monsoon - Moderate activity with year-end rush';
        }
        return 'Normal construction season';
    }

    /**
     * Calculate weather impact on construction demand
     */
    static async calculateWeatherImpact(timeHorizon) {
        try {
            // Get weather forecast (simplified - in real implementation, integrate with weather API)
            const currentMonth = new Date().getMonth() + 1;

            // Sri Lankan monsoon patterns
            const weatherImpact = {
                factor: 1.0,
                description: 'Normal weather conditions'
            };

            // Southwest Monsoon (May-September)
            if (month >= 5 && month <= 9) {
                weatherImpact.factor = 0.7;
                weatherImpact.description = 'Southwest monsoon period - expect 30% reduction in construction activity';
            }
            // Northeast Monsoon (October-January)
            else if (month >= 10 || month <= 1) {
                weatherImpact.factor = 0.85;
                weatherImpact.description = 'Northeast monsoon period - expect 15% reduction in construction activity';
            }
            // Inter-monsoon periods (February-April)
            else {
                weatherImpact.factor = 1.1;
                weatherImpact.description = 'Dry season - optimal construction conditions';
            }

            return weatherImpact;

        } catch (error) {
            logger.error('Weather impact calculation failed:', error);
            return { factor: 1.0, description: 'Weather data unavailable' };
        }
    }

    /**
     * Apply weather adjustment to prediction
     */
    static applyWeatherAdjustment(prediction, weatherImpact) {
        return {
            ...prediction,
            totalDemand: Math.ceil(prediction.totalDemand * weatherImpact.factor),
            dailyAverage: Math.ceil(prediction.dailyAverage * weatherImpact.factor),
            weatherFactor: weatherImpact.factor,
            weatherNote: weatherImpact.description
        };
    }

    /**
     * Apply economic factors (LKR fluctuation, import costs)
     */
    static async applyEconomicFactors(prediction, material) {
        try {
            // Simplified economic factor calculation
            // In real implementation, integrate with Central Bank API for exchange rates

            let economicFactor = 1.0;
            let economicNote = 'Stable economic conditions';

            // Check if material is import-dependent
            const importDependentCategories = ['steel', 'cement', 'tiles', 'paint'];
            const isImportDependent = importDependentCategories.some(cat =>
                material.category.toLowerCase().includes(cat)
            );

            if (isImportDependent) {
                // Simulate LKR fluctuation impact (in real implementation, get from API)
                const currentUSDRate = 320; // Simulated current rate
                const historicalAverage = 300;

                if (currentUSDRate > historicalAverage * 1.1) {
                    economicFactor = 0.8; // Reduce demand due to higher costs
                    economicNote = 'High USD rate reducing demand for imported materials';
                } else if (currentUSDRate < historicalAverage * 0.9) {
                    economicFactor = 1.2; // Increase demand due to lower costs
                    economicNote = 'Favorable USD rate increasing demand for imported materials';
                }
            }

            return {
                ...prediction,
                totalDemand: Math.ceil(prediction.totalDemand * economicFactor),
                dailyAverage: Math.ceil(prediction.dailyAverage * economicFactor),
                economicFactor,
                economicNote
            };

        } catch (error) {
            logger.error('Economic factors calculation failed:', error);
            return prediction;
        }
    }

    /**
     * Apply Sri Lankan festival and holiday adjustments
     */
    static applyFestivalAdjustment(prediction, timeHorizon) {
        const currentDate = new Date();
        const endDate = new Date(currentDate.getTime() + (timeHorizon * 24 * 60 * 60 * 1000));

        // Sri Lankan major festivals and their impact on construction
        const festivals = [
            { name: 'Sinhala Tamil New Year', dates: ['2024-04-13', '2024-04-14'], impact: 0.3 },
            { name: 'Vesak Day', dates: ['2024-05-24'], impact: 0.5 },
            { name: 'Esala Perahera Period', dates: ['2024-07-15', '2024-08-15'], impact: 0.8 },
            { name: 'Christmas Season', dates: ['2024-12-20', '2024-12-31'], impact: 0.6 },
            { name: 'Diwali', dates: ['2024-11-01'], impact: 0.7 }
        ];

        let festivalImpact = 1.0;
        let festivalNote = 'No major festivals in prediction period';

        for (const festival of festivals) {
            for (const dateStr of festival.dates) {
                const festivalDate = new Date(dateStr);
                if (festivalDate >= currentDate && festivalDate <= endDate) {
                    festivalImpact *= festival.impact;
                    festivalNote = `${festival.name} period - reduced construction activity expected`;
                    break;
                }
            }
        }

        return {
            ...prediction,
            totalDemand: Math.ceil(prediction.totalDemand * festivalImpact),
            dailyAverage: Math.ceil(prediction.dailyAverage * festivalImpact),
            festivalFactor: festivalImpact,
            festivalNote
        };
    }

    /**
     * Calculate prediction confidence based on data quality
     */
    static calculatePredictionConfidence(historicalData, prediction) {
        let confidence = 0.5; // Base confidence

        // Data quantity factor
        const dataPoints = historicalData.length;
        const dataQualityFactor = Math.min(dataPoints / 30, 1.0); // Max confidence at 30+ data points
        confidence += dataQualityFactor * 0.3;

        // Data consistency factor
        if (dataPoints > 0) {
            const demands = historicalData.map(d => d.demand);
            const average = demands.reduce((a, b) => a + b, 0) / demands.length;
            const variance = demands.reduce((sum, demand) => sum + Math.pow(demand - average, 2), 0) / demands.length;
            const standardDeviation = Math.sqrt(variance);
            const coefficientOfVariation = standardDeviation / average;

            // Lower variation = higher confidence
            const consistencyFactor = Math.max(0, 1 - coefficientOfVariation);
            confidence += consistencyFactor * 0.2;
        }

        return Math.min(0.95, Math.max(0.1, confidence)); // Clamp between 0.1 and 0.95
    }

    /**
     * Generate reorder recommendation
     */
    static generateReorderRecommendation(material, prediction, confidence) {
        const currentStock = material.current_stock;
        const predictedDemand = prediction.totalDemand;
        const minimumStock = material.min_stock_level;

        // Calculate reorder point
        const leadTime = 7; // Days - typical for Sri Lanka
        const safetyStock = Math.ceil(prediction.dailyAverage * 3); // 3 days safety
        const reorderPoint = (prediction.dailyAverage * leadTime) + safetyStock;

        // Calculate economic order quantity
        const monthlyDemand = prediction.dailyAverage * 30;
        const orderingCost = 5000; // LKR - simplified
        const holdingCostRate = 0.2; // 20% annual
        const unitCost = material.cost || 100;

        const eoq = Math.ceil(Math.sqrt((2 * monthlyDemand * orderingCost) / (unitCost * holdingCostRate / 12)));

        // Generate recommendation
        const recommendation = {
            currentStock,
            predictedDemand,
            reorderPoint,
            suggestedOrderQuantity: eoq,
            urgency: 'normal',
            reasoning: [],
            estimatedCost: eoq * unitCost,
            confidence
        };

        // Determine urgency
        if (currentStock <= reorderPoint) {
            recommendation.urgency = 'high';
            recommendation.reasoning.push('Current stock below reorder point');
        } else if (currentStock <= (reorderPoint * 1.5)) {
            recommendation.urgency = 'medium';
            recommendation.reasoning.push('Approaching reorder point');
        }

        // Add additional reasoning
        if (prediction.trend === 'increasing') {
            recommendation.reasoning.push('Demand trend is increasing');
            recommendation.suggestedOrderQuantity = Math.ceil(eoq * 1.2);
        }

        if (prediction.seasonalFactor > 1.1) {
            recommendation.reasoning.push('Peak seasonal demand period');
        }

        if (confidence < 0.6) {
            recommendation.reasoning.push('Low confidence - consider smaller orders');
            recommendation.suggestedOrderQuantity = Math.ceil(eoq * 0.8);
        }

        return recommendation;
    }

    /**
     * Calculate risk level for stockout
     */
    static calculateRiskLevel(material, prediction) {
        const currentStock = material.current_stock;
        const predictedDemand = prediction.totalDemand;
        const stockoutRisk = predictedDemand / Math.max(currentStock, 1);

        if (stockoutRisk > 2) {
            return { level: 'critical', score: Math.min(stockoutRisk, 10) };
        } else if (stockoutRisk > 1.5) {
            return { level: 'high', score: stockoutRisk };
        } else if (stockoutRisk > 1) {
            return { level: 'medium', score: stockoutRisk };
        } else {
            return { level: 'low', score: stockoutRisk };
        }
    }

    /**
     * Store prediction in database
     */
    static async storePrediction(prediction) {
        try {
            const predictionDoc = new Prediction({
                type: 'demand_forecast',
                entityId: prediction.materialId,
                inputData: {
                    material: prediction.materialName,
                    category: prediction.category,
                    currentStock: prediction.currentStock,
                    timeHorizon: prediction.predictionPeriod
                },
                prediction: prediction.predictions,
                confidence: prediction.predictions.confidence,
                algorithm: 'sri_lanka_construction_model',
                version: '1.0',
                validUntil: prediction.validUntil,
                metadata: {
                    recommendations: prediction.recommendations,
                    riskLevel: prediction.riskLevel,
                    factors: prediction.predictions.factors
                }
            });

            await predictionDoc.save();
            logger.info(`Prediction stored for material ${prediction.materialName}`);

        } catch (error) {
            logger.error('Failed to store prediction:', error);
        }
    }

    /**
     * Update demand prediction based on new order data
     */
    static async updateDemandPrediction(orderItems) {
        try {
            for (const item of orderItems) {
                // Get existing prediction
                const existingPrediction = await Prediction.findOne({
                    type: 'demand_forecast',
                    entityId: item.inventory,
                    validUntil: { $gte: new Date() }
                }).sort({ createdAt: -1 });

                if (existingPrediction) {
                    // Update accuracy based on actual demand
                    const actualDemand = item.quantity;
                    const predictedDemand = existingPrediction.prediction.dailyAverage;
                    const accuracy = 1 - Math.abs(actualDemand - predictedDemand) / Math.max(predictedDemand, 1);

                    existingPrediction.accuracy = accuracy;
                    await existingPrediction.save();
                }
            }

        } catch (error) {
            logger.error('Failed to update demand prediction:', error);
        }
    }

    /**
     * Update stock prediction based on inventory changes
     */
    static async updateStockPrediction(inventory) {
        try {
            // Generate new prediction with current stock levels
            await this.generateMaterialRefillPrediction(inventory._id, {
                timeHorizon: 14, // 2 weeks for stock predictions
                includeWeather: true,
                includeSeasonal: true
            });

        } catch (error) {
            logger.error('Failed to update stock prediction:', error);
        }
    }

    /**
     * Get aggregated predictions for dashboard
     */
    static async getDashboardPredictions(options = {}) {
        try {
            const { category, timeHorizon = 30, riskLevel } = options;

            const filter = {
                type: 'demand_forecast',
                validUntil: { $gte: new Date() }
            };

            if (riskLevel) {
                filter['metadata.riskLevel.level'] = riskLevel;
            }

            const predictions = await Prediction.find(filter)
                .sort({ createdAt: -1 })
                .limit(20);

            const summary = {
                totalPredictions: predictions.length,
                averageConfidence: 0,
                riskDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
                topRiskItems: [],
                seasonalInsights: this.getSeasonalInsights()
            };

            if (predictions.length > 0) {
                summary.averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

                predictions.forEach(p => {
                    const risk = p.metadata?.riskLevel?.level || 'low';
                    summary.riskDistribution[risk]++;

                    if (['critical', 'high'].includes(risk)) {
                        summary.topRiskItems.push({
                            materialId: p.entityId,
                            material: p.inputData?.material,
                            riskLevel: risk,
                            confidence: p.confidence
                        });
                    }
                });
            }

            return summary;

        } catch (error) {
            logger.error('Dashboard predictions failed:', error);
            throw error;
        }
    }

    /**
     * Get seasonal insights for Sri Lankan market
     */
    static getSeasonalInsights() {
        const currentMonth = new Date().getMonth() + 1;

        const insights = {
            currentSeason: this.getSeasonalNote(currentMonth),
            recommendations: [],
            upcomingEvents: []
        };

        // Current season recommendations
        if (currentMonth >= 1 && currentMonth <= 4) {
            insights.recommendations.push('Peak construction season - ensure adequate cement and steel stock');
            insights.recommendations.push('Plan for increased demand in roofing materials before monsoon');
        } else if (currentMonth >= 5 && currentMonth <= 9) {
            insights.recommendations.push('Monsoon season - reduce inventory levels for weather-sensitive items');
            insights.recommendations.push('Focus on indoor construction materials');
        } else {
            insights.recommendations.push('Post-monsoon recovery - prepare for year-end construction rush');
            insights.recommendations.push('Stock up for upcoming dry season demand');
        }

        // Upcoming events
        const upcomingFestivals = [
            { name: 'Sinhala Tamil New Year', month: 4, impact: 'Major construction halt' },
            { name: 'Vesak Day', month: 5, impact: 'Reduced activity' },
            { name: 'Esala Perahera', month: 7, impact: 'Regional impact in Kandy' }
        ];

        const nextMonth = (currentMonth % 12) + 1;
        const upcomingEvent = upcomingFestivals.find(f => f.month === nextMonth);
        if (upcomingEvent) {
            insights.upcomingEvents.push(upcomingEvent);
        }

        return insights;
    }
}

export default PredictionService;
