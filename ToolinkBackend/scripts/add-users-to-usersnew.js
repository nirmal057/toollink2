import mongoose from 'mongoose';
import { config } from 'dotenv';
import UserNew from '../src/models/UserNew.js';

// Load environment variables
config();

const users = [
    {
        name: "isuru nirmal",
        email: "admin@toollink.lk",
        password: "admin123",
        role: "Admin",
        status: "Active"
    },
    {
        name: "Ruwan Liyanage",
        email: "store1@toollink.lk",
        password: "store123",
        role: "Warehouse Manager",
        status: "Active"
    },
    {
        name: "Chamara Gunasekara",
        email: "store2@toollink.lk",
        password: "store123",
        role: "Warehouse Manager",
        status: "Active"
    },
    {
        name: "Samanthi Herath",
        email: "store3@toollink.lk",
        password: "store123",
        role: "Warehouse Manager",
        status: "Active"
    },
    {
        name: "Dinesh Fernando",
        email: "cashier1@toollink.lk",
        password: "cashier123",
        role: "Cashier",
        status: "Active"
    },
    {
        name: "Pavithra Jayasekara",
        email: "cashier2@toollink.lk",
        password: "cashier123",
        role: "Cashier",
        status: "Active"
    },
    {
        name: "Amal Peris",
        email: "cashier3@toollink.lk",
        password: "cashier123",
        role: "Cashier",
        status: "Active"
    },
    {
        name: "Nilusha Abeykoon",
        email: "cashier4@toollink.lk",
        password: "cashier123",
        role: "Cashier",
        status: "Active"
    },
    {
        name: "Lahiru Madushanka",
        email: "lahiru.construction@gmail.com",
        password: "customer123",
        role: "Customer",
        status: "Active"
    },
    {
        name: "Harsha Wijesuriya",
        email: "harsha.builder@yahoo.com",
        password: "customer123",
        role: "Customer",
        status: "Active"
    },
    {
        name: "Nadeesha Silva",
        email: "nadeesha.sites@outlook.com",
        password: "customer123",
        role: "Customer",
        status: "Active"
    },
    {
        name: "Roshan Kumara",
        email: "roshan.kmaterials@gmail.com",
        password: "customer123",
        role: "Customer",
        status: "Active"
    },
    {
        name: "Pradeep Dissanayake",
        email: "pradeep.dissa@gmail.com",
        password: "customer123",
        role: "Customer",
        status: "Active"
    }
];

async function addUsersToUsersNew() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/toollink');
        console.log('Connected to MongoDB');

        // Clear existing users in usersNew collection (optional)
        console.log('Clearing existing usersNew collection...');
        await UserNew.deleteMany({});
        console.log('Cleared existing usersNew users');

        // Add all users
        console.log('Adding users to usersNew collection...');
        for (const userData of users) {
            try {
                // Check if user already exists
                const existingUser = await UserNew.findOne({ email: userData.email });
                if (existingUser) {
                    console.log(`User ${userData.email} already exists in usersNew, skipping...`);
                    continue;
                }

                // Create new user (password will be hashed automatically by the pre-save hook)
                const user = new UserNew(userData);
                await user.save();
                console.log(`✅ Added user: ${userData.name} (${userData.email}) - ${userData.role}`);
            } catch (error) {
                console.error(`❌ Error adding user ${userData.email}:`, error.message);
            }
        }

        // Verify the users were added
        const totalUsers = await UserNew.countDocuments();
        console.log(`\n🎉 Successfully added users to usersNew collection!`);
        console.log(`📊 Total users in usersNew collection: ${totalUsers}`);

        // Show breakdown by role
        const adminCount = await UserNew.countDocuments({ role: 'Admin' });
        const warehouseCount = await UserNew.countDocuments({ role: 'Warehouse Manager' });
        const cashierCount = await UserNew.countDocuments({ role: 'Cashier' });
        const customerCount = await UserNew.countDocuments({ role: 'Customer' });

        console.log(`\n📈 User breakdown by role:`);
        console.log(`   👤 Admin: ${adminCount}`);
        console.log(`   🏪 Warehouse Manager: ${warehouseCount}`);
        console.log(`   💰 Cashier: ${cashierCount}`);
        console.log(`   🛒 Customer: ${customerCount}`);

        console.log(`\n✅ All users are now available in both collections:`);
        console.log(`   - Main users collection (requires auth): /api/users`);
        console.log(`   - UsersNew collection (no auth): /api/users-new`);
        console.log(`\n🚀 Visit http://localhost:5173/users-new to see all users!`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📝 Database connection closed');
    }
}

// Run the script
addUsersToUsersNew();
