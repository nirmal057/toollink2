import mongoose from 'mongoose';
import { config } from 'dotenv';
import User from './src/models/User.js';

// Load environment variables
config();

const users = [
    {
        name: "isuru nirmal",
        email: "admin@toollink.lk",
        password: "admin123",
        role: "Admin",
        status: "Active",
        lastLogin: new Date("2025-07-10 09:30 AM")
    },
    {
        name: "Ruwan Liyanage",
        email: "store1@toollink.lk",
        password: "store1",
        role: "Warehouse Manager",
        status: "Active",
        lastLogin: new Date("2025-07-09 04:15 PM")
    },
    {
        name: "Chamara Gunasekara",
        email: "store2@toollink.lk",
        password: "store2",
        role: "Warehouse Manager",
        status: "Active",
        lastLogin: new Date("2025-07-08 11:42 AM")
    },
    {
        name: "Samanthi Herath",
        email: "store3@toollink.lk",
        password: "store3",
        role: "Warehouse Manager",
        status: "Active",
        lastLogin: new Date("2025-07-08 11:42 AM")
    },
    {
        name: "Dinesh Fernando",
        email: "cashier1@toollink.lk",
        password: "cashier1",
        role: "Cashier",
        status: "Active",
        lastLogin: new Date("2025-07-11 08:10 AM")
    },
    {
        name: "Pavithra Jayasekara",
        email: "cashier2@toollink.lk",
        password: "cashier2",
        role: "Cashier",
        status: "Active",
        lastLogin: new Date("2025-07-10 02:25 PM")
    },
    {
        name: "Amal Peris",
        email: "cashier3@toollink.lk",
        password: "cashier3",
        role: "Cashier",
        status: "Active",
        lastLogin: new Date("2025-07-09 06:55 PM")
    },
    {
        name: "Nilusha Abeykoon",
        email: "cashier4@toollink.lk",
        password: "cashier4",
        role: "Cashier",
        status: "Active",
        lastLogin: new Date("2025-07-07 09:05 AM")
    },
    {
        name: "Lahiru Madushanka",
        email: "lahiru.construction@gmail.com",
        password: "lahru123",
        role: "Customer",
        status: "Active",
        lastLogin: new Date("2025-07-10 10:11 AM")
    },
    {
        name: "Harsha Wijesuriya",
        email: "harsha.builder@yahoo.com",
        password: "harsha123",
        role: "Customer",
        status: "Active",
        lastLogin: new Date("2025-07-10 10:11 AM")
    },
    {
        name: "Nadeesha Silva",
        email: "nadeesha.sites@outlook.com",
        password: "nadeesha123",
        role: "Customer",
        status: "Active",
        lastLogin: new Date("2025-07-09 01:44 PM")
    },
    {
        name: "Roshan Kumara",
        email: "roshan.kmaterials@gmail.com",
        password: "roshan123",
        role: "Customer",
        status: "Active",
        lastLogin: new Date("2025-07-08 07:33 AM")
    },
    {
        name: "Pradeep Dissanayake",
        email: "pradeep.dissa@gmail.com",
        password: "pradeep123",
        role: "Customer",
        status: "Active",
        lastLogin: new Date("2025-07-08 07:33 AM")
    }
];

async function importUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully');

        // Clear existing users
        console.log('Clearing existing users...');
        await User.deleteMany({});
        console.log('Existing users cleared');

        // Import new users
        console.log('Importing new users...');
        const result = await User.insertMany(users);

        console.log(`Successfully imported ${result.length} users`);

        // Display summary
        const summary = {};
        result.forEach(user => {
            summary[user.role] = (summary[user.role] || 0) + 1;
        });

        console.log('\nUser distribution:');
        Object.entries(summary).forEach(([role, count]) => {
            console.log(`${role}: ${count} users`);
        });

        // Display all imported users
        console.log('\nImported users:');
        result.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.email}`);
        });

    } catch (error) {
        console.error('Error importing users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDatabase connection closed');
    }
}

importUsers();
