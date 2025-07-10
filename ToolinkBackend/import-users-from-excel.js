const XLSX = require('xlsx');
const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configuration
const EXCEL_FILE_PATH = path.join(__dirname, '..', 'users.xlsx');
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'toollink';

// Function to map roles to the valid enum values
function mapRole(role) {
    if (!role) return 'user';

    const roleStr = role.toLowerCase();

    if (roleStr.includes('admin')) return 'admin';
    if (roleStr.includes('manager')) return 'manager';
    if (roleStr.includes('cashier')) return 'cashier';
    if (roleStr.includes('customer')) return 'customer';

    return 'user';
}

// MongoDB User Schema - simplified version matching the User model in the application
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'manager', 'cashier', 'customer', 'user'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended', 'rejected'],
        default: 'active'
    },
    phoneNumber: String,
    address: String,
    company: String,
    profileImage: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Read the Excel file
async function readExcelFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            process.exit(1);
        }

        console.log(`Reading Excel file: ${filePath}`);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Direct conversion to objects with headers
        const users = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Successfully read ${users.length} users from Excel file`);
        if (users.length > 0) {
            console.log('Excel headers:', Object.keys(users[0]).join(', '));
        }

        return users;
    } catch (error) {
        console.error('Error reading Excel file:', error);
        process.exit(1);
    }
}

// Transform data from Excel format to MongoDB format
async function transformUserData(excelUsers) {
    const transformedUsers = [];

    for (const user of excelUsers) {
        // Hash password - use default password 'toollink123'
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('toollink123', salt);

        // Extract first and last name from the 'Name' field
        const nameParts = user['Name'] ? user['Name'].split(' ') : ['Default', 'User'];
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const transformedUser = {
            username: user['Email'] ? user['Email'].split('@')[0] : `user_${Math.floor(Math.random() * 10000)}`,
            email: user['Email'] || `user${Math.floor(Math.random() * 10000)}@toollink.lk`,
            password: password,
            firstName: firstName,
            lastName: lastName,
            role: mapRole(user['Role'] || 'user'),
            status: 'active',
            phoneNumber: user['Contact Number'] ? user['Contact Number'].toString() : '',
            address: user['Address'] || '',
            company: '',
            profileImage: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        transformedUsers.push(transformedUser);
    }

    return transformedUsers;
}

// Import users to MongoDB
async function importUsersToDB(users) {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            dbName: DB_NAME
        });
        console.log('Connected to MongoDB successfully');

        // Get the User model
        const User = mongoose.model('User', UserSchema);

        console.log(`Importing ${users.length} users to MongoDB...`);

        // Track results
        const results = {
            total: users.length,
            success: 0,
            failed: 0,
            errors: []
        };

        // Import users one by one to handle duplicates gracefully
        for (const user of users) {
            try {
                // Check if user with same email or username already exists
                const existingUser = await User.findOne({
                    $or: [
                        { email: user.email },
                        { username: user.username }
                    ]
                });

                if (existingUser) {
                    console.log(`User already exists: ${user.email} (${user.username}). Updating...`);

                    // Update existing user
                    await User.updateOne(
                        { _id: existingUser._id },
                        { $set: { ...user, updatedAt: new Date() } }
                    );

                    results.success++;
                } else {
                    // Create new user
                    await User.create(user);
                    results.success++;
                }
            } catch (error) {
                console.error(`Error importing user ${user.email}:`, error.message);
                results.failed++;
                results.errors.push({
                    user: user.email || user.username,
                    error: error.message
                });
            }
        }

        console.log('Import completed with results:', results);
        console.log(`Successfully imported/updated ${results.success} users`);

        if (results.failed > 0) {
            console.log(`Failed to import ${results.failed} users`);
            console.log('Errors:', JSON.stringify(results.errors, null, 2));
        }

        // Save results to file
        fs.writeFileSync(
            path.join(__dirname, 'user-import-results.json'),
            JSON.stringify(results, null, 2)
        );

        return results;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    } finally {
        // Close the MongoDB connection
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Main function to run the import
async function main() {
    try {
        // 1. Read Excel file
        const excelUsers = await readExcelFile(EXCEL_FILE_PATH);

        // 2. Transform data
        const transformedUsers = await transformUserData(excelUsers);

        // 3. Import to MongoDB
        await importUsersToDB(transformedUsers);

    } catch (error) {
        console.error('An error occurred during the import process:', error);
        process.exit(1);
    }
}

// Run the import process
main();
