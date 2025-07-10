const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User schema (matching your backend model)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: String,
    role: {
        type: String,
        enum: ['admin', 'user', 'warehouse', 'cashier', 'customer', 'driver', 'editor'],
        default: 'customer'
    },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    preferences: {
        notifications: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: false },
        darkMode: { type: Boolean, default: false }
    },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    refreshTokens: [String],
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

async function createTestAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('🔗 Connected to MongoDB');
        console.log('🔐 Creating test admin user...\n');

        // Check if test admin already exists
        const existingUser = await User.findOne({
            $or: [
                { email: 'test@admin.com' },
                { username: 'testadmin' }
            ]
        });

        if (existingUser) {
            console.log('⚠️  Test admin already exists - updating password...');

            // Update existing user with new password
            const hashedPassword = await bcrypt.hash('test123', 12);
            existingUser.password = hashedPassword;
            existingUser.isActive = true;
            existingUser.isApproved = true;
            existingUser.emailVerified = true;
            await existingUser.save();

            console.log('✅ Test admin password updated!');
        } else {
            // Hash password
            const hashedPassword = await bcrypt.hash('test123', 12);

            // Create new test admin
            const testAdmin = new User({
                username: 'testadmin',
                email: 'test@admin.com',
                password: hashedPassword,
                fullName: 'Test Administrator',
                phone: '+94-11-000-0000',
                role: 'admin',
                isApproved: true,
                emailVerified: true,
                isActive: true,
                address: {
                    street: 'Test Street',
                    city: 'Colombo',
                    state: 'Western',
                    zipCode: '00100',
                    country: 'Sri Lanka'
                },
                preferences: {
                    notifications: true,
                    newsletter: false,
                    darkMode: false
                }
            });

            await testAdmin.save();
            console.log('✅ Test admin created successfully!');
        }

        console.log('\n🔐 Test Admin Login Credentials:');
        console.log('   Email: test@admin.com');
        console.log('   Username: testadmin');
        console.log('   Password: test123');
        console.log('   Role: admin');

        console.log('\n💡 You can now use these simple credentials to login!');

    } catch (error) {
        console.error('❌ Error creating test admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
createTestAdmin();
