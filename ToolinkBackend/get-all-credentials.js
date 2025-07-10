const mongoose = require('mongoose');
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

async function getAllLoginCredentials() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔗 Connected to MongoDB Atlas');
        console.log('📊 Database:', process.env.MONGODB_URI.split('@')[1].split('/')[1]);

        // Get all users from database
        const users = await User.find({}).select('username email fullName role isActive isApproved emailVerified createdAt lastLogin');

        console.log(`\n👥 Found ${users.length} users in the database:\n`);
        console.log('================================================================================');

        // Group users by role for better organization
        const usersByRole = {};

        users.forEach(user => {
            if (!usersByRole[user.role]) {
                usersByRole[user.role] = [];
            }
            usersByRole[user.role].push(user);
        });

        // Display users organized by role
        Object.keys(usersByRole).sort().forEach(role => {
            console.log(`\n🎭 ${role.toUpperCase()} USERS (${usersByRole[role].length}):`);
            console.log('─'.repeat(50));

            usersByRole[role].forEach((user, index) => {
                const statusEmoji = user.isActive ? '🟢' : '🔴';
                const approvedEmoji = user.isApproved ? '✅' : '⏳';
                const verifiedEmoji = user.emailVerified ? '📧' : '📭';

                console.log(`${index + 1}. ${user.username} (${user.fullName || 'No Name'})`);
                console.log(`   📧 Email: ${user.email}`);
                console.log(`   📊 Status: ${statusEmoji} Active | ${approvedEmoji} Approved | ${verifiedEmoji} Verified`);
                console.log(`   📅 Created: ${user.createdAt ? user.createdAt.toLocaleDateString() : 'Unknown'}`);
                console.log(`   🕐 Last Login: ${user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}`);
                console.log('');
            });
        });

        // Show working credentials with common passwords
        console.log('\n🔑 WORKING LOGIN CREDENTIALS:');
        console.log('================================================================================');

        // Known working credentials from our setup
        const knownCredentials = [
            { email: 'admin@toollink.com', password: 'admin123', role: 'admin' },
            { email: 'test@admin.com', password: 'test123', role: 'admin' },
            { email: 'admin1@toollink.lk', password: 'toollink123', role: 'admin' },
            { email: 'superadmin@toollink.lk', password: 'toollink123', role: 'admin' },
            { email: 'cashier1@toollink.lk', password: 'toollink123', role: 'cashier' },
            { email: 'warehouse1@toollink.lk', password: 'toollink123', role: 'warehouse' },
            { email: 'customer1@toollink.lk', password: 'toollink123', role: 'customer' }
        ];

        console.log('\n💡 RECOMMENDED LOGIN CREDENTIALS (Most Likely to Work):');
        console.log('─'.repeat(70));

        knownCredentials.forEach((cred, index) => {
            const userExists = users.find(u => u.email === cred.email);
            const statusIcon = userExists ? '✅' : '❓';

            console.log(`${index + 1}. ${statusIcon} ${cred.role.toUpperCase()}`);
            console.log(`   📧 Email: ${cred.email}`);
            console.log(`   🔒 Password: ${cred.password}`);
            console.log(`   📊 In Database: ${userExists ? 'Yes' : 'Unknown'}`);
            console.log('');
        });

        // Summary statistics
        console.log('\n📈 DATABASE SUMMARY:');
        console.log('─'.repeat(30));
        console.log(`👥 Total Users: ${users.length}`);
        console.log(`🟢 Active Users: ${users.filter(u => u.isActive).length}`);
        console.log(`✅ Approved Users: ${users.filter(u => u.isApproved).length}`);
        console.log(`📧 Email Verified: ${users.filter(u => u.emailVerified).length}`);

        console.log('\n📋 Users by Role:');
        Object.keys(usersByRole).sort().forEach(role => {
            console.log(`   ${role}: ${usersByRole[role].length}`);
        });

    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        if (error.message.includes('authentication failed')) {
            console.log('\n💡 Tip: Check your MongoDB connection string in .env file');
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
getAllLoginCredentials();
