import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

// Simple schemas for inserting data
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    fullName: String,
    phone: String,
    role: String,
    isActive: Boolean,
    isVerified: Boolean
}, { timestamps: true });

const inventorySchema = new mongoose.Schema({
    name: String,
    description: String,
    category: String,
    sku: String,
    quantity: Number,
    current_stock: Number,
    unit: String,
    threshold: Number,
    min_stock_level: Number,
    max_stock_level: Number,
    location: String,
    cost: Number,
    selling_price: Number,
    status: String
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    type: String,
    title: String,
    message: String,
    priority: String,
    read: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const Notification = mongoose.model('Notification', notificationSchema);

async function addSampleData() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');

        // Check if admin user already exists
        const adminExists = await User.findOne({ email: 'admin@toollink.com' });

        if (!adminExists) {
            console.log('👤 Creating admin user...');
            const adminPassword = await bcrypt.hash('admin123', 12);
            const admin = await User.create({
                username: 'admin',
                email: 'admin@toollink.com',
                password: adminPassword,
                fullName: 'System Administrator',
                phone: '+94771234567',
                role: 'admin',
                isActive: true,
                isVerified: true
            });
            console.log('   ✅ Admin user created');
        } else {
            console.log('   ℹ️  Admin user already exists');
        }

        // Check if sample users exist
        const userCount = await User.countDocuments();
        if (userCount < 3) {
            console.log('👥 Creating sample users...');

            const warehousePassword = await bcrypt.hash('warehouse123', 12);
            await User.create({
                username: 'warehouse',
                email: 'warehouse@toollink.com',
                password: warehousePassword,
                fullName: 'Warehouse Manager',
                phone: '+94771234568',
                role: 'warehouse',
                isActive: true,
                isVerified: true
            });

            const customerPassword = await bcrypt.hash('customer123', 12);
            await User.create({
                username: 'customer1',
                email: 'customer@example.com',
                password: customerPassword,
                fullName: 'John Doe',
                phone: '+94771234569',
                role: 'customer',
                isActive: true,
                isVerified: true
            });

            console.log('   ✅ Sample users created');
        } else {
            console.log('   ℹ️  Sample users already exist');
        }

        // Check if inventory items exist
        const inventoryCount = await Inventory.countDocuments();
        if (inventoryCount === 0) {
            console.log('📦 Creating sample inventory items...');

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
                },
                {
                    name: 'Screwdriver Set',
                    description: 'Complete screwdriver set with various sizes',
                    category: 'Tools',
                    sku: 'SCREW001',
                    quantity: 25,
                    current_stock: 25,
                    unit: 'sets',
                    threshold: 5,
                    min_stock_level: 5,
                    max_stock_level: 50,
                    location: 'A1-02',
                    cost: 800,
                    selling_price: 1200,
                    status: 'active'
                },
                {
                    name: 'Extension Cable 10m',
                    description: '10 meter extension cable for electrical work',
                    category: 'Electrical',
                    sku: 'CABLE001',
                    quantity: 15,
                    current_stock: 15,
                    unit: 'pieces',
                    threshold: 3,
                    min_stock_level: 3,
                    max_stock_level: 30,
                    location: 'D1-01',
                    cost: 500,
                    selling_price: 750,
                    status: 'active'
                }
            ];

            await Inventory.insertMany(inventoryItems);
            console.log('   ✅ Sample inventory items created');
        } else {
            console.log('   ℹ️  Inventory items already exist');
        }

        // Add some notifications
        const notificationCount = await Notification.countDocuments();
        if (notificationCount === 0) {
            console.log('🔔 Creating sample notifications...');

            const notifications = [
                {
                    type: 'system',
                    title: 'Welcome to ToolLink',
                    message: 'Welcome to the ToolLink inventory management system! Your database has been successfully initialized.',
                    priority: 'medium',
                    read: false
                },
                {
                    type: 'inventory',
                    title: 'System Ready',
                    message: 'All collections have been created and sample data has been added.',
                    priority: 'medium',
                    read: false
                }
            ];

            await Notification.insertMany(notifications);
            console.log('   ✅ Sample notifications created');
        } else {
            console.log('   ℹ️  Notifications already exist');
        }

        // Final status
        console.log('\n📊 Final Database Status:');
        const users = await User.countDocuments();
        const inventory = await Inventory.countDocuments();
        const notifications = await Notification.countDocuments();

        console.log(`   • Users: ${users} documents`);
        console.log(`   • Inventory: ${inventory} documents`);
        console.log(`   • Notifications: ${notifications} documents`);

        console.log('\n🎉 Sample data setup completed!');
        console.log('\n🔑 Login Credentials:');
        console.log('   • Admin: admin@toollink.com / admin123');
        console.log('   • Warehouse: warehouse@toollink.com / warehouse123');
        console.log('   • Customer: customer@example.com / customer123');

    } catch (error) {
        console.error('❌ Sample data setup failed:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the setup
addSampleData()
    .then(() => {
        console.log('✅ Sample data setup completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Sample data setup failed:', error.message);
        process.exit(1);
    });
