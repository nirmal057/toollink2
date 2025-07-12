import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

// Import existing models
import User from './src/models/User.js';
import Inventory from './src/models/Inventory.js';
import Order from './src/models/Order.js';

// Additional schemas for collections not yet defined as models

// Notifications Schema
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for system-wide notifications
    },
    type: {
        type: String,
        enum: ['system', 'inventory', 'order', 'delivery', 'payment', 'user', 'security'],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    metadata: mongoose.Schema.Types.Mixed, // Additional data related to notification
    expiresAt: Date
}, {
    timestamps: true
});

// Activity Log Schema
const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login', 'logout', 'password_change', 'profile_update',
            'order_created', 'order_updated', 'order_cancelled',
            'inventory_added', 'inventory_updated', 'inventory_deleted',
            'user_created', 'user_updated', 'user_deleted',
            'system_access', 'data_export', 'settings_changed',
            'payment_processed', 'delivery_scheduled'
        ]
    },
    details: {
        entityType: String, // 'order', 'inventory', 'user', etc.
        entityId: String,   // ID of the affected entity
        changes: mongoose.Schema.Types.Mixed, // What was changed
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        ip: String,
        userAgent: String,
        sessionId: String
    },
    result: {
        type: String,
        enum: ['success', 'failure', 'partial'],
        default: 'success'
    },
    errorMessage: String
}, {
    timestamps: true
});

// Delivery Schema
const deliverySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_transit', 'delivered', 'failed', 'cancelled'],
        default: 'scheduled'
    },
    scheduledDate: Date,
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    trackingNumber: {
        type: String,
        unique: true
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    deliveryNotes: String,
    proofOfDelivery: {
        signature: String, // Base64 encoded signature
        photo: String,     // Photo URL
        receivedBy: String
    },
    attempts: [{
        attemptDate: Date,
        status: String,
        notes: String
    }]
}, {
    timestamps: true
});

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    type: {
        type: String,
        enum: ['product', 'service', 'delivery', 'general', 'complaint', 'suggestion'],
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    subject: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 2000
    },
    status: {
        type: String,
        enum: ['pending', 'in_review', 'resolved', 'closed'],
        default: 'pending'
    },
    response: {
        message: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    category: String,
    attachments: [String] // File URLs
}, {
    timestamps: true
});

// Reports Schema (for storing generated reports)
const reportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['inventory', 'sales', 'orders', 'users', 'financial', 'delivery', 'custom'],
        required: true
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parameters: mongoose.Schema.Types.Mixed, // Report filters and parameters
    data: mongoose.Schema.Types.Mixed,       // Report results
    format: {
        type: String,
        enum: ['json', 'pdf', 'excel', 'csv'],
        default: 'json'
    },
    fileUrl: String, // If report is saved as file
    status: {
        type: String,
        enum: ['generating', 'completed', 'failed'],
        default: 'generating'
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
}, {
    timestamps: true
});

// Predictions Schema (for ML predictions and analytics)
const predictionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['demand_forecast', 'stock_prediction', 'sales_trend', 'customer_behavior'],
        required: true
    },
    entityId: String, // ID of the entity being predicted (product, user, etc.)
    inputData: mongoose.Schema.Types.Mixed,
    prediction: mongoose.Schema.Types.Mixed,
    confidence: {
        type: Number,
        min: 0,
        max: 1
    },
    algorithm: String,
    version: String,
    validUntil: Date,
    accuracy: Number, // Actual vs predicted accuracy (if available)
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

// Create models
const Notification = mongoose.model('Notification', notificationSchema);
const Activity = mongoose.model('Activity', activitySchema);
const Delivery = mongoose.model('Delivery', deliverySchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);
const Report = mongoose.model('Report', reportSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);

// Database initialization function
async function initializeDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB successfully!');

        // Clear existing data (optional - remove this in production)
        console.log('🧹 Clearing existing collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
            await mongoose.connection.db.dropCollection(collection.name);
            console.log(`   ❌ Dropped collection: ${collection.name}`);
        }

        // Create collections with indexes
        console.log('🏗️  Creating collections and indexes...');

        // Users collection with indexes
        await User.createIndexes();
        console.log('   ✅ Users collection created');

        // Inventory collection with indexes
        await Inventory.createIndexes();
        console.log('   ✅ Inventory collection created');

        // Orders collection with indexes
        await Order.createIndexes();
        console.log('   ✅ Orders collection created');

        // Notifications collection with indexes
        await Notification.createIndexes();
        await Notification.collection.createIndex({ userId: 1, read: 1 });
        await Notification.collection.createIndex({ type: 1, priority: 1 });
        await Notification.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        console.log('   ✅ Notifications collection created');

        // Activity collection with indexes
        await Activity.createIndexes();
        await Activity.collection.createIndex({ userId: 1, action: 1 });
        await Activity.collection.createIndex({ createdAt: -1 });
        console.log('   ✅ Activity collection created');

        // Delivery collection with indexes
        await Delivery.createIndexes();
        await Delivery.collection.createIndex({ orderId: 1 });
        await Delivery.collection.createIndex({ driverId: 1, status: 1 });
        await Delivery.collection.createIndex({ trackingNumber: 1 });
        console.log('   ✅ Delivery collection created');

        // Feedback collection with indexes
        await Feedback.createIndexes();
        await Feedback.collection.createIndex({ userId: 1, type: 1 });
        await Feedback.collection.createIndex({ status: 1, priority: 1 });
        console.log('   ✅ Feedback collection created');

        // Reports collection with indexes
        await Report.createIndexes();
        await Report.collection.createIndex({ generatedBy: 1, type: 1 });
        await Report.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        console.log('   ✅ Reports collection created');

        // Predictions collection with indexes
        await Prediction.createIndexes();
        await Prediction.collection.createIndex({ type: 1, entityId: 1 });
        await Prediction.collection.createIndex({ validUntil: 1 });
        console.log('   ✅ Predictions collection created');

        // Insert sample data
        console.log('📝 Inserting sample data...');

        // Create default admin user
        const adminPassword = await bcrypt.hash('admin123', 12);
        const adminUser = await User.create({
            username: 'admin',
            email: 'admin@toollink.com',
            password: adminPassword,
            fullName: 'System Administrator',
            phone: '+94771234567',
            role: 'admin',
            isActive: true,
            isVerified: true,
            profile: {
                bio: 'System Administrator',
                avatar: '',
                preferences: {
                    notifications: {
                        email: true,
                        push: true,
                        sms: false
                    },
                    theme: 'light',
                    language: 'en'
                }
            }
        });
        console.log('   ✅ Admin user created');

        // Create sample warehouse user
        const warehousePassword = await bcrypt.hash('warehouse123', 12);
        const warehouseUser = await User.create({
            username: 'warehouse',
            email: 'warehouse@toollink.com',
            password: warehousePassword,
            fullName: 'Warehouse Manager',
            phone: '+94771234568',
            role: 'warehouse',
            isActive: true,
            isVerified: true
        });
        console.log('   ✅ Warehouse user created');

        // Create sample customer
        const customerPassword = await bcrypt.hash('customer123', 12);
        const customerUser = await User.create({
            username: 'customer1',
            email: 'customer@example.com',
            password: customerPassword,
            fullName: 'John Doe',
            phone: '+94771234569',
            role: 'customer',
            isActive: true,
            isVerified: true
        });
        console.log('   ✅ Sample customer created');

        // Create sample inventory items
        const inventoryItems = [
            {
                name: 'Professional Drill Set',
                description: 'High-quality drill set with multiple bits',
                category: 'Tools',
                sku: 'DRILL001',
                quantity: 50,
                current_stock: 50,
                unit: 'pieces',
                threshold: 10,
                min_stock_level: 10,
                max_stock_level: 100,
                location: 'A1-01',
                supplier_info: {
                    name: 'Tool Supplier Ltd',
                    contact: 'John Smith',
                    email: 'supplier@tools.com',
                    phone: '+94711234567'
                },
                cost: 2500,
                selling_price: 3500,
                status: 'active'
            },
            {
                name: 'Safety Helmet',
                description: 'Industrial safety helmet with adjustable strap',
                category: 'Safety',
                sku: 'SAFE001',
                quantity: 30,
                current_stock: 30,
                unit: 'pieces',
                threshold: 5,
                min_stock_level: 5,
                max_stock_level: 50,
                location: 'B2-01',
                cost: 800,
                selling_price: 1200,
                status: 'active'
            },
            {
                name: 'PVC Pipe 2 inch',
                description: '2 inch diameter PVC pipe for plumbing',
                category: 'Plumbing',
                sku: 'PIPE001',
                quantity: 100,
                current_stock: 100,
                unit: 'meters',
                threshold: 20,
                min_stock_level: 20,
                max_stock_level: 200,
                location: 'C1-01',
                cost: 150,
                selling_price: 220,
                status: 'active'
            }
        ];

        const createdInventory = await Inventory.insertMany(inventoryItems);
        console.log('   ✅ Sample inventory items created');

        // Create sample order
        const sampleOrder = await Order.create({
            orderNumber: 'ORD-001',
            customer: customerUser._id,
            items: [
                {
                    inventory: createdInventory[0]._id,
                    quantity: 2,
                    unitPrice: 3500,
                    totalPrice: 7000
                },
                {
                    inventory: createdInventory[1]._id,
                    quantity: 1,
                    unitPrice: 1200,
                    totalPrice: 1200
                }
            ],
            status: 'pending',
            priority: 'medium',
            totalAmount: 8200,
            discount: 0,
            tax: 1230,
            finalAmount: 9430,
            paymentStatus: 'pending',
            paymentMethod: 'cash',
            shippingAddress: {
                street: '123 Main Street',
                city: 'Colombo',
                state: 'Western',
                zipCode: '10100',
                country: 'Sri Lanka',
                phone: '+94771234569'
            }
        });
        console.log('   ✅ Sample order created');

        // Create sample notifications
        const notifications = [
            {
                type: 'system',
                title: 'Welcome to ToolLink',
                message: 'Welcome to the ToolLink inventory management system!',
                priority: 'medium'
            },
            {
                userId: adminUser._id,
                type: 'inventory',
                title: 'Low Stock Alert',
                message: 'Safety Helmet stock is running low (5 remaining)',
                priority: 'high'
            },
            {
                userId: customerUser._id,
                type: 'order',
                title: 'Order Confirmation',
                message: `Your order ${sampleOrder.orderNumber} has been received`,
                priority: 'medium'
            }
        ];

        await Notification.insertMany(notifications);
        console.log('   ✅ Sample notifications created');

        // Create sample activity logs
        const activities = [
            {
                userId: adminUser._id,
                action: 'login',
                details: {
                    ip: '192.168.1.100',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            },
            {
                userId: customerUser._id,
                action: 'order_created',
                details: {
                    entityType: 'order',
                    entityId: sampleOrder._id.toString(),
                    orderId: sampleOrder.orderNumber,
                    amount: sampleOrder.finalAmount
                }
            }
        ];

        await Activity.insertMany(activities);
        console.log('   ✅ Sample activity logs created');

        console.log('🎉 Database initialization completed successfully!');
        console.log('\n📊 Created Collections:');
        console.log('   • Users (with admin, warehouse, customer accounts)');
        console.log('   • Inventory (with sample tools and materials)');
        console.log('   • Orders (with sample order)');
        console.log('   • Notifications (system and user notifications)');
        console.log('   • Activities (user action logs)');
        console.log('   • Deliveries (delivery tracking)');
        console.log('   • Feedback (customer feedback system)');
        console.log('   • Reports (generated reports storage)');
        console.log('   • Predictions (ML predictions and analytics)');

        console.log('\n🔑 Default Login Credentials:');
        console.log('   Admin: admin@toollink.com / admin123');
        console.log('   Warehouse: warehouse@toollink.com / warehouse123');
        console.log('   Customer: customer@example.com / customer123');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run initialization
if (import.meta.url === `file://${process.argv[1]}`) {
    initializeDatabase()
        .then(() => {
            console.log('✅ Initialization script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Initialization script failed:', error);
            process.exit(1);
        });
}

export default initializeDatabase;
