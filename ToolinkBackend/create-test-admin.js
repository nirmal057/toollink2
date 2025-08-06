import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './src/models/User.js';

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://nirmal:12345@cluster0.wki7qo4.mongodb.net/toollink', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

const createTestAdmin = async () => {
    try {
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@toollink.com' });
        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            console.log('   Email: admin@toollink.com');
            console.log('   Role:', existingAdmin.role);
            console.log('   Active:', existingAdmin.isActive);
            return;
        }

        // Create new admin
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const adminUser = new User({
            username: 'admin',
            email: 'admin@toollink.com',
            password: hashedPassword,
            fullName: 'System Administrator',
            role: 'admin',
            isActive: true,
            isVerified: true,
            emailNotifications: true
        });

        await adminUser.save();
        console.log('✅ Test admin user created successfully!');
        console.log('   Email: admin@toollink.com');
        console.log('   Password: admin123');
        console.log('   Role: admin');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        mongoose.connection.close();
    }
};

createTestAdmin();
