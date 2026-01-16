import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import Inventory from '../src/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toollink';

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB for sample data creation');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function createSampleUsers() {
    console.log('📝 Creating sample users...');

    const sampleUsers = [
        {
            username: 'john_customer',
            email: 'john@example.com',
            fullName: 'John Smith',
            password: 'password123',
            role: 'customer',
            isActive: true,
            isApproved: true,
            emailVerified: true,
            profile: {
                phone: '+94771234567',
                address: '123 Main St, Colombo'
            }
        },
        {
            username: 'sarah_cashier',
            email: 'sarah@toollink.lk',
            fullName: 'Sarah Johnson',
            password: 'password123',
            role: 'cashier',
            isActive: true,
            isApproved: true,
            emailVerified: true,
            profile: {
                phone: '+94772345678',
                address: '456 Oak Ave, Kandy'
            }
        },
        {
            username: 'mike_warehouse',
            email: 'mike@toollink.lk',
            fullName: 'Mike Wilson',
            password: 'password123',
            role: 'warehouse',
            isActive: true,
            isApproved: true,
            emailVerified: true,
            profile: {
                phone: '+94773456789',
                address: '789 Pine Rd, Galle'
            }
        },
        {
            username: 'lisa_driver',
            email: 'lisa@toollink.lk',
            fullName: 'Lisa Brown',
            password: 'password123',
            role: 'driver',
            isActive: true,
            isApproved: true,
            emailVerified: true,
            profile: {
                phone: '+94774567890',
                address: '321 Cedar St, Jaffna'
            }
        },
        {
            username: 'david_customer',
            email: 'david@example.com',
            fullName: 'David Lee',
            password: 'password123',
            role: 'customer',
            isActive: false,
            isApproved: false,
            emailVerified: false,
            profile: {
                phone: '+94775678901',
                address: '654 Elm St, Negombo'
            }
        }
    ];

    for (const userData of sampleUsers) {
        try {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const user = new User(userData);
                await user.save();
                console.log(`✅ Created user: ${userData.fullName} (${userData.role})`);
            } else {
                console.log(`⚠️  User already exists: ${userData.email}`);
            }
        } catch (error) {
            console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
    }
}

async function createSampleInventory() {
    console.log('📦 Creating sample inventory items...');

    // Get admin user for created_by field
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
        console.log('⚠️  No admin user found, skipping inventory creation');
        return;
    }

    const sampleItems = [
        {
            name: 'Power Drill Set',
            description: 'Professional cordless power drill with bits',
            category: 'Tools',
            sku: 'PDR001',
            quantity: 25,
            current_stock: 25,
            unit: 'pieces',
            threshold: 5,
            min_stock_level: 5,
            max_stock_level: 100,
            location: 'Main Warehouse - A1',
            supplier_info: {
                name: 'ToolMaster Ltd',
                contact: 'John Supplier',
                email: 'contact@toolmaster.lk',
                phone: '+94771111111'
            },
            cost: 12000,
            selling_price: 15000,
            status: 'active',
            created_by: adminUser._id
        },
        {
            name: 'Hammer Set',
            description: 'Various types of hammers for construction',
            category: 'Tools',
            sku: 'HAM001',
            quantity: 50,
            current_stock: 50,
            unit: 'sets',
            threshold: 10,
            min_stock_level: 10,
            max_stock_level: 200,
            location: 'Main Warehouse - B2',
            supplier_info: {
                name: 'BuildCorp',
                contact: 'Sarah Builder',
                email: 'orders@buildcorp.lk',
                phone: '+94772222222'
            },
            cost: 2800,
            selling_price: 3500,
            status: 'active',
            created_by: adminUser._id
        },
        {
            name: 'Safety Helmets',
            description: 'Construction safety helmets - various colors',
            category: 'Safety',
            sku: 'SAF001',
            quantity: 100,
            current_stock: 100,
            unit: 'pieces',
            threshold: 20,
            min_stock_level: 20,
            max_stock_level: 500,
            location: 'Safety Warehouse - S1',
            supplier_info: {
                name: 'SafetyFirst Inc',
                contact: 'Mike Safety',
                email: 'safety@safetyfirst.lk',
                phone: '+94773333333'
            },
            cost: 800,
            selling_price: 1200,
            status: 'active',
            created_by: adminUser._id
        },
        {
            name: 'Measuring Tape',
            description: '10m professional measuring tape',
            category: 'Tools',
            sku: 'MEA001',
            quantity: 75,
            current_stock: 75,
            unit: 'pieces',
            threshold: 15,
            min_stock_level: 15,
            max_stock_level: 300,
            location: 'Main Warehouse - C3',
            supplier_info: {
                name: 'MeasurePro',
                contact: 'Lisa Measure',
                email: 'orders@measurepro.lk',
                phone: '+94774444444'
            },
            cost: 600,
            selling_price: 800,
            status: 'active',
            created_by: adminUser._id
        },
        {
            name: 'Work Gloves',
            description: 'Heavy duty work gloves - pack of 12',
            category: 'Safety',
            sku: 'GLO001',
            quantity: 200,
            current_stock: 200,
            unit: 'pairs',
            threshold: 30,
            min_stock_level: 30,
            max_stock_level: 1000,
            location: 'Safety Warehouse - S2',
            supplier_info: {
                name: 'SafetyFirst Inc',
                contact: 'Mike Safety',
                email: 'safety@safetyfirst.lk',
                phone: '+94773333333'
            },
            cost: 2000,
            selling_price: 2500,
            status: 'active',
            created_by: adminUser._id
        },
        {
            name: 'Angle Grinder',
            description: '115mm angle grinder with discs',
            category: 'Tools',
            sku: 'ANG001',
            quantity: 15,
            current_stock: 15,
            unit: 'pieces',
            threshold: 3,
            min_stock_level: 3,
            max_stock_level: 50,
            location: 'Main Warehouse - A2',
            supplier_info: {
                name: 'ToolMaster Ltd',
                contact: 'John Supplier',
                email: 'contact@toolmaster.lk',
                phone: '+94771111111'
            },
            cost: 7000,
            selling_price: 8500,
            status: 'active',
            created_by: adminUser._id
        },
        {
            name: 'Screwdriver Set',
            description: '20-piece screwdriver set with case',
            category: 'Tools',
            sku: 'SCR001',
            quantity: 40,
            current_stock: 40,
            unit: 'sets',
            threshold: 8,
            min_stock_level: 8,
            max_stock_level: 150,
            location: 'Main Warehouse - B3',
            supplier_info: {
                name: 'BuildCorp',
                contact: 'Sarah Builder',
                email: 'orders@buildcorp.lk',
                phone: '+94772222222'
            },
            cost: 1800,
            selling_price: 2200,
            status: 'active',
            created_by: adminUser._id
        },
        {
            name: 'LED Work Light',
            description: 'Rechargeable LED work light with stand',
            category: 'Electrical',
            sku: 'LED001',
            quantity: 30,
            current_stock: 30,
            unit: 'pieces',
            threshold: 5,
            min_stock_level: 5,
            max_stock_level: 100,
            location: 'Main Warehouse - E1',
            supplier_info: {
                name: 'BrightLights Co',
                contact: 'David Light',
                email: 'sales@brightlights.lk',
                phone: '+94775555555'
            },
            cost: 3500,
            selling_price: 4500,
            status: 'active',
            created_by: adminUser._id
        }
    ];

    for (const itemData of sampleItems) {
        try {
            const existingItem = await Inventory.findOne({ name: itemData.name });
            if (!existingItem) {
                const item = new Inventory(itemData);
                await item.save();
                console.log(`✅ Created inventory item: ${itemData.name}`);
            } else {
                console.log(`⚠️  Inventory item already exists: ${itemData.name}`);
            }
        } catch (error) {
            console.error(`❌ Error creating inventory item ${itemData.name}:`, error.message);
        }
    }
}

async function createSampleOrders() {
    console.log('🛒 Creating sample orders...');

    // Get sample customers
    const customers = await User.find({ role: 'customer' }).limit(3);
    if (customers.length === 0) {
        console.log('⚠️  No customers found, skipping order creation');
        return;
    }

    // Get sample inventory items
    const inventoryItems = await Inventory.find().limit(5);
    if (inventoryItems.length === 0) {
        console.log('⚠️  No inventory items found, skipping order creation');
        return;
    }

    const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const paymentMethods = ['cash', 'card', 'bank_transfer'];
    const sampleOrders = [];

    // Create 10 sample orders
    for (let i = 0; i < 10; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        // Create random order items
        const orderItems = [];
        const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order

        for (let j = 0; j < numItems; j++) {
            const item = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
            const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 quantity
            const unitPrice = item.selling_price || 1000;
            const totalPrice = unitPrice * quantity;

            orderItems.push({
                inventory: item._id,
                quantity: quantity,
                unitPrice: unitPrice,
                totalPrice: totalPrice
            });
        }

        const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const tax = Math.round(totalAmount * 0.1); // 10% tax
        const finalAmount = totalAmount + tax;

        const order = {
            orderNumber: `ORD-${Date.now()}-${i}`,
            customer: customer._id,
            items: orderItems,
            totalAmount: totalAmount,
            tax: tax,
            finalAmount: finalAmount,
            status: status,
            paymentMethod: paymentMethod,
            shippingAddress: {
                street: customer.profile?.address || '123 Default St',
                city: 'Colombo',
                state: 'Western Province',
                zipCode: '10001',
                country: 'Sri Lanka',
                phone: customer.profile?.phone || '+94771234567'
            },
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date within last 30 days
        };

        sampleOrders.push(order);
    }

    for (const orderData of sampleOrders) {
        try {
            const existingOrder = await Order.findOne({ orderNumber: orderData.orderNumber });
            if (!existingOrder) {
                const order = new Order(orderData);
                await order.save();
                console.log(`✅ Created order: ${orderData.orderNumber} (${orderData.status})`);
            } else {
                console.log(`⚠️  Order already exists: ${orderData.orderNumber}`);
            }
        } catch (error) {
            console.error(`❌ Error creating order ${orderData.orderNumber}:`, error.message);
        }
    }
}

async function main() {
    console.log('🚀 Starting sample data population...');

    await connectDB();

    await createSampleUsers();
    await createSampleInventory();
    await createSampleOrders();

    console.log('✅ Sample data population completed!');
    console.log('\n📊 Database now contains:');

    const userCount = await User.countDocuments();
    const inventoryCount = await Inventory.countDocuments();
    const orderCount = await Order.countDocuments();

    console.log(`   Users: ${userCount}`);
    console.log(`   Inventory Items: ${inventoryCount}`);
    console.log(`   Orders: ${orderCount}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
}

main().catch(console.error);
