import mongoose from 'mongoose';

// Enhanced User Schema with Sri Lankan specifics
const enhancedUserSchema = new mongoose.Schema({
    // Existing fields (preserved)
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['customer', 'admin', 'driver', 'warehouse_manager', 'quality_control', 'analyst', 'customer_service'],
        default: 'customer'
    },
    phone: { type: String },
    address: { type: String },

    // Enhanced fields for Sri Lankan market
    profile: {
        preferredLanguage: {
            type: String,
            enum: ['en', 'si', 'ta'], // English, Sinhala, Tamil
            default: 'en'
        },
        phoneNumbers: [{
            number: String,
            type: { type: String, enum: ['mobile', 'landline', 'whatsapp'] },
            carrier: { type: String, enum: ['Dialog', 'Mobitel', 'Hutch', 'Airtel'] },
            verified: { type: Boolean, default: false },
            primary: { type: Boolean, default: false }
        }],
        location: {
            district: String, // Sri Lankan districts
            province: String, // Sri Lankan provinces
            city: String,
            postalCode: String,
            coordinates: {
                latitude: Number,
                longitude: Number
            }
        },
        businessInfo: {
            type: { type: String, enum: ['individual', 'company', 'contractor', 'dealer'] },
            registrationNumber: String,
            vatNumber: String,
            businessCategory: String
        }
    },

    // Notification preferences
    notificationPreferences: {
        channels: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            whatsapp: { type: Boolean, default: false },
            inApp: { type: Boolean, default: true }
        },
        categories: {
            orderUpdates: { type: Boolean, default: true },
            deliveryNotifications: { type: Boolean, default: true },
            stockAlerts: { type: Boolean, default: false },
            promotions: { type: Boolean, default: false },
            qualityIssues: { type: Boolean, default: true }
        },
        frequency: {
            immediate: { type: Boolean, default: true },
            daily: { type: Boolean, default: false },
            weekly: { type: Boolean, default: false }
        },
        quietHours: {
            enabled: { type: Boolean, default: false },
            start: String, // HH:MM format
            end: String    // HH:MM format
        }
    },

    // Performance metrics for staff
    performanceMetrics: {
        deliveryRating: { type: Number, default: 0 },
        customerSatisfaction: { type: Number, default: 0 },
        qualityScore: { type: Number, default: 0 },
        completedTasks: { type: Number, default: 0 },
        averageResponseTime: { type: Number, default: 0 } // in minutes
    },

    // Activity tracking
    lastActivity: {
        loginDate: Date,
        ipAddress: String,
        userAgent: String,
        location: String
    },

    // Enhanced timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastPasswordChange: Date,
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false }
});

// Enhanced Inventory Schema
const enhancedInventorySchema = new mongoose.Schema({
    // Existing fields (preserved)
    name: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    sku: { type: String, unique: true, required: true },

    // Enhanced inventory management
    stock: {
        warehouses: [{
            warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
            warehouseName: String,
            currentStock: { type: Number, required: true },
            reservedStock: { type: Number, default: 0 },
            availableStock: { type: Number }, // Calculated field
            reorderLevel: { type: Number, default: 10 },
            maxStock: { type: Number, default: 1000 },
            location: {
                zone: String,
                aisle: String,
                shelf: String
            },
            lastStockUpdate: { type: Date, default: Date.now },
            stockMovements: [{
                date: { type: Date, default: Date.now },
                type: { type: String, enum: ['in', 'out', 'adjustment', 'transfer'] },
                quantity: Number,
                reason: String,
                reference: String, // Order ID, Transfer ID, etc.
                updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
            }]
        }],
        totalStock: { type: Number, default: 0 },
        totalReserved: { type: Number, default: 0 },
        totalAvailable: { type: Number, default: 0 }
    },

    // Sri Lankan specific pricing
    pricing: {
        basePriceUSD: Number,
        basePriceLKR: { type: Number, required: true },
        exchangeRate: Number,
        lastPriceUpdate: Date,
        seasonalMultipliers: {
            monsoon: { type: Number, default: 1.0 },
            dryPeriod: { type: Number, default: 1.0 },
            festivalSeason: { type: Number, default: 1.1 }
        },
        regionPricing: [{
            region: String,
            multiplier: { type: Number, default: 1.0 },
            transportCost: Number
        }],
        bulkDiscounts: [{
            minQuantity: Number,
            discount: Number // percentage
        }]
    },

    // Quality control information
    quality: {
        currentGrade: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
        lastInspection: Date,
        inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        defectRate: { type: Number, default: 0 }, // percentage
        customerComplaints: { type: Number, default: 0 },
        qualityScore: { type: Number, default: 100 } // 0-100
    },

    // Quality records for tracking
    qualityRecords: [{
        inspectionId: String,
        date: { type: Date, default: Date.now },
        inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        grade: String,
        photos: [String], // URLs to photos
        notes: String,
        defects: [String],
        approved: { type: Boolean, default: false }
    }],

    // Certificate tracking
    qualityCertificates: [{
        certificateId: String,
        type: String, // SLS, ISO, CE, etc.
        number: String,
        issuedBy: String,
        issuedDate: Date,
        expiryDate: Date,
        documentUrl: String,
        verified: { type: Boolean, default: false }
    }],

    // Supplier information
    supplier: {
        name: String,
        contact: String,
        qualityRating: { type: Number, default: 0 }, // 0-5
        reliabilityScore: { type: Number, default: 0 }, // 0-100
        lastDelivery: Date,
        leadTime: Number, // days
        minimumOrder: Number
    },

    // Seasonal and demand patterns
    demandPatterns: {
        seasonalDemand: [{
            month: Number,
            averageDemand: Number,
            peakDemand: Number
        }],
        festivalImpact: [{
            festival: String,
            demandMultiplier: Number,
            startDate: Date,
            endDate: Date
        }],
        weatherImpact: {
            monsoonDemand: Number,
            drySeasonDemand: Number
        }
    },

    // Unit conversion system
    unitConversions: [{
        fromUnit: String,
        toUnit: String,
        conversionFactor: Number
    }],

    // Material specifications
    specifications: {
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            weight: Number,
            unit: String
        },
        technicalSpecs: mongoose.Schema.Types.Mixed,
        storageRequirements: {
            temperature: String,
            humidity: String,
            specialConditions: [String]
        },
        shelfLife: Number, // days
        hazardous: { type: Boolean, default: false }
    },

    // Analytics data
    analytics: {
        totalOrders: { type: Number, default: 0 },
        totalSold: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        averageOrderQuantity: { type: Number, default: 0 },
        popularityScore: { type: Number, default: 0 },
        seasonalityIndex: { type: Number, default: 1.0 }
    },

    // Status and metadata
    status: {
        type: String,
        enum: ['active', 'inactive', 'discontinued', 'out_of_stock'],
        default: 'active'
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    tags: [String],

    // Enhanced timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastStockCheck: Date,
    lastSale: Date
});

// Enhanced Order Schema
const enhancedOrderSchema = new mongoose.Schema({
    // Existing fields (preserved)
    orderNumber: { type: String, unique: true, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
        quantity: Number,
        unit: String,
        unitPrice: Number,
        totalPrice: Number
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },

    // Enhanced order processing
    processing: {
        warehouseSplits: [{
            warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
            warehouseName: String,
            items: [{
                materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
                quantity: Number,
                availableQuantity: Number,
                status: { type: String, enum: ['pending', 'allocated', 'picked', 'shipped'] }
            }],
            subTotal: Number,
            estimatedPickingTime: Date,
            actualPickingTime: Date,
            assignedPicker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }],
        inventoryValidation: {
            validated: { type: Boolean, default: false },
            validatedAt: Date,
            validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            issues: [String],
            substitutions: [{
                originalItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
                substituteItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
                reason: String,
                customerApproved: { type: Boolean, default: false }
            }]
        },
        qualityCheck: {
            required: { type: Boolean, default: false },
            completed: { type: Boolean, default: false },
            checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            checkedAt: Date,
            notes: String,
            photos: [String]
        }
    },

    // Smart delivery scheduling
    delivery: {
        type: { type: String, enum: ['standard', 'express', 'scheduled'], default: 'standard' },
        address: {
            street: String,
            city: String,
            district: String,
            province: String,
            postalCode: String,
            coordinates: {
                latitude: Number,
                longitude: Number
            },
            landmarks: String
        },
        scheduledDate: Date,
        deliveryWindow: {
            start: String, // HH:MM
            end: String    // HH:MM
        },
        estimatedDelivery: Date,
        actualDelivery: Date,
        deliveryInstructions: String,
        deliveryContact: {
            name: String,
            phone: String,
            alternatePhone: String
        },
        route: {
            distance: Number, // km
            estimatedTime: Number, // minutes
            traffic: String,
            weatherConditions: String
        }
    },

    // Market condition adjustments
    marketAdjustments: {
        originalTotal: Number,
        priceAdjustments: [{
            itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
            reason: String, // 'seasonal', 'currency', 'demand', 'supply'
            originalPrice: Number,
            adjustedPrice: Number,
            adjustmentPercentage: Number,
            appliedAt: Date
        }],
        finalTotal: Number,
        totalSavings: Number,
        customerNotified: { type: Boolean, default: false }
    },

    // Payment and financial
    payment: {
        method: { type: String, enum: ['cash', 'card', 'bank_transfer', 'credit'] },
        status: { type: String, enum: ['pending', 'paid', 'partial', 'failed'], default: 'pending' },
        currency: { type: String, default: 'LKR' },
        exchangeRate: Number,
        amountUSD: Number,
        paidAmount: { type: Number, default: 0 },
        remainingAmount: Number,
        paymentDate: Date,
        transactionId: String,
        paymentTerms: {
            creditDays: Number,
            lateFeePercentage: Number,
            discountPercentage: Number
        }
    },

    // Customer experience
    customerExperience: {
        orderSource: { type: String, enum: ['web', 'mobile', 'phone', 'email', 'whatsapp'] },
        language: { type: String, enum: ['en', 'si', 'ta'], default: 'en' },
        specialRequests: String,
        urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        customerNotes: String,
        internalNotes: String
    },

    // Feedback and quality
    feedback: {
        customerRating: Number, // 1-5
        deliveryRating: Number, // 1-5
        qualityRating: Number,  // 1-5
        serviceRating: Number,  // 1-5
        comments: String,
        feedbackDate: Date,
        wouldRecommend: Boolean,
        issues: [String],
        resolved: { type: Boolean, default: false }
    },

    // Order tracking and timeline
    timeline: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        description: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        location: String,
        automated: { type: Boolean, default: false }
    }],

    // Analytics and insights
    analytics: {
        processingTime: Number, // minutes from order to shipment
        deliveryTime: Number,   // minutes from shipment to delivery
        customerAcquisition: String, // how customer found us
        orderValue: Number,
        profitMargin: Number,
        seasonalCategory: String,
        weatherAtOrder: String,
        festivalPeriod: String
    },

    // Enhanced timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,

    // Cancellation details
    cancellation: {
        reason: String,
        cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        refundAmount: Number,
        refundStatus: { type: String, enum: ['pending', 'processed', 'failed'] },
        customerNotified: { type: Boolean, default: false }
    }
});

// New Warehouse Schema
const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, unique: true, required: true },
    location: {
        address: String,
        city: String,
        district: String,
        province: String,
        postalCode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    capacity: {
        total: Number, // square meters
        used: Number,
        available: Number
    },
    facilities: {
        temperature_controlled: { type: Boolean, default: false },
        humidity_controlled: { type: Boolean, default: false },
        security_level: { type: String, enum: ['basic', 'medium', 'high'] },
        loading_docks: Number,
        storage_levels: Number
    },
    operatingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    staff: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: String,
        shiftPattern: String
    }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// New Prediction Schema
const predictionSchema = new mongoose.Schema({
    predictionId: { type: String, unique: true, required: true },
    type: {
        type: String,
        enum: ['material_refill', 'demand_forecast', 'seasonal_analysis', 'price_prediction'],
        required: true
    },
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },

    input: {
        historicalData: mongoose.Schema.Types.Mixed,
        seasonalFactors: mongoose.Schema.Types.Mixed,
        economicFactors: mongoose.Schema.Types.Mixed,
        weatherData: mongoose.Schema.Types.Mixed,
        festivalCalendar: mongoose.Schema.Types.Mixed
    },

    prediction: {
        value: mongoose.Schema.Types.Mixed, // Could be number, array, object
        confidence: Number, // 0-100
        timeframe: {
            start: Date,
            end: Date
        },
        factors: [{
            name: String,
            impact: Number, // percentage impact
            description: String
        }]
    },

    accuracy: {
        actual: mongoose.Schema.Types.Mixed,
        predicted: mongoose.Schema.Types.Mixed,
        accuracyScore: Number, // 0-100
        measuredAt: Date
    },

    metadata: {
        algorithm: String,
        version: String,
        generatedBy: String,
        executionTime: Number, // milliseconds
        dataQuality: Number // 0-100
    },

    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'validated'],
        default: 'pending'
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    validatedAt: Date
});

// Create and export models
const EnhancedUser = mongoose.model('EnhancedUser', enhancedUserSchema);
const EnhancedInventory = mongoose.model('EnhancedInventory', enhancedInventorySchema);
const EnhancedOrder = mongoose.model('EnhancedOrder', enhancedOrderSchema);
const Warehouse = mongoose.model('Warehouse', warehouseSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);

export {
    EnhancedUser,
    EnhancedInventory,
    EnhancedOrder,
    Warehouse,
    Prediction
};
