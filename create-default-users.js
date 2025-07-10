// Create default users including cashier
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { database } = require('./ToolinkBackend/src/config/database');

const defaultUsers = [
    {
        username: 'admin',
        email: 'admin@toollink.com',
        password: 'admin123',
        fullName: 'Admin User',
        phone: '1234567890',
        role: 'admin'
    },
    {
        username: 'cashier',
        email: 'cashier@toollink.com',
        password: 'cashier123',
        fullName: 'Cashier User',
        phone: '1234567891',
        role: 'cashier'
    },
    {
        username: 'warehouse',
        email: 'warehouse@toollink.com',
        password: 'warehouse123',
        fullName: 'Warehouse Manager',
        phone: '1234567892',
        role: 'warehouse'
    },
    {
        username: 'user',
        email: 'user@toollink.com',
        password: 'user123',
        fullName: 'Regular User',
        phone: '1234567893',
        role: 'customer'
    }
];

async function createDefaultUsers() {
    try {
        console.log('🔄 Creating default users...\n');

        for (const userData of defaultUsers) {
            // Check if user already exists
            const existingUser = await database.query(
                'SELECT id FROM users WHERE email = ?',
                [userData.email]
            );

            if (existingUser && (Array.isArray(existingUser) ? existingUser.length > 0 : existingUser)) {
                console.log(`⚠️  User ${userData.email} already exists, skipping...`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            
            // Set status based on role
            const status = userData.role === 'customer' ? 'pending' : 'active';

            // Insert user
            const result = await database.execute(
                'INSERT INTO users (username, email, password_hash, full_name, phone, role, email_verified, status) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
                [userData.username, userData.email, hashedPassword, userData.fullName, userData.phone, userData.role, status]
            );

            console.log(`✅ Created user: ${userData.fullName} (${userData.email}) - Role: ${userData.role}`);
        }

        console.log('\n🎉 All default users created successfully!');
        console.log('\n📝 Demo Credentials:');
        defaultUsers.forEach(user => {
            console.log(`   ${user.role}: ${user.email} / ${user.password}`);
        });

    } catch (error) {
        console.error('❌ Error creating default users:', error.message);
    }
}

createDefaultUsers();
