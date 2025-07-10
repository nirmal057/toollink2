#!/usr/bin/env node

/**
 * Test Database Operations for User Management
 * This script tests if the database operations are working properly
 */

const axios = require('axios');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, 'ToolinkBackend', '.env') });

const BASE_URL = 'http://localhost:5000';

// Admin credentials
const ADMIN_CREDENTIALS = {
    email: 'admin@toollink.com',
    password: 'admin123'
};

let authToken = null;

// Connect directly to MongoDB to verify data
async function connectToMongoDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://iit21083:k1zTsck8hslcFiZm@cluster0.q0grz0.mongodb.net/toollink?retryWrites=true&w=majority&appName=Cluster0');
        console.log('✅ Connected to MongoDB directly');
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);
        return false;
    }
}

// Get MongoDB User model
function getUserModel() {
    const userSchema = new mongoose.Schema({
        username: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        fullName: { type: String, required: true },
        phone: { type: String },
        role: { type: String, enum: ['admin', 'user', 'warehouse', 'cashier', 'customer', 'driver', 'editor'], default: 'user' },
        isActive: { type: Boolean, default: true },
        isApproved: { type: Boolean, default: false },
        // Additional fields...
    }, { timestamps: true });

    return mongoose.model('User', userSchema);
}

async function testDatabaseOperations() {
    console.log('🔍 Testing Database Operations for User Management\n');

    // Step 1: Connect to MongoDB
    console.log('1️⃣ Connecting to MongoDB...');
    const mongoConnected = await connectToMongoDB();
    if (!mongoConnected) {
        console.log('❌ Cannot proceed without database connection');
        return;
    }

    const User = getUserModel();

    // Step 2: Check current users in database
    console.log('\n2️⃣ Checking current users in database...');
    try {
        const dbUsers = await User.find({}).select('-password');
        console.log(`✅ Found ${dbUsers.length} users in database`);

        dbUsers.forEach(user => {
            console.log(`   - ${user.email} (${user.role}) - Active: ${user.isActive} - Approved: ${user.isApproved}`);
        });

        if (dbUsers.length === 0) {
            console.log('⚠️  No users found in database - this might be the issue!');
        }
    } catch (error) {
        console.error('❌ Error fetching users from database:', error.message);
        return;
    }

    // Step 3: Test API login
    console.log('\n3️⃣ Testing API login...');
    try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, ADMIN_CREDENTIALS);
        authToken = loginResponse.data.accessToken;
        console.log('✅ API login successful');
    } catch (error) {
        console.error('❌ API login failed:', error.response?.data?.error || error.message);
        console.log('   This might indicate the backend is not running or database is not properly connected');
        return;
    }

    // Step 4: Test API user fetch
    console.log('\n4️⃣ Testing API user fetch...');
    try {
        const apiResponse = await axios.get(`${BASE_URL}/api/users`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const apiUsers = apiResponse.data.users || [];
        console.log(`✅ API returned ${apiUsers.length} users`);

        if (apiUsers.length === 0) {
            console.log('⚠️  API returned no users - this might be the issue!');
        }
    } catch (error) {
        console.error('❌ API user fetch failed:', error.response?.data?.error || error.message);
        return;
    }

    // Step 5: Test creating a user via API and check database
    console.log('\n5️⃣ Testing user creation via API...');
    const testUserData = {
        username: 'testuser' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'testpass123',
        fullName: 'Test User Database',
        role: 'customer'
    };

    try {
        // Create user via API
        const createResponse = await axios.post(`${BASE_URL}/api/users`, testUserData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ User created via API:', createResponse.data.success);

        // Check if user exists in database
        const createdUser = await User.findOne({ email: testUserData.email });
        if (createdUser) {
            console.log('✅ User found in database after API creation');
            console.log(`   Database user ID: ${createdUser._id}`);
            console.log(`   Database user email: ${createdUser.email}`);
        } else {
            console.log('❌ User NOT found in database after API creation - THIS IS THE PROBLEM!');
        }

        // Step 6: Test updating the user via API
        if (createdUser) {
            console.log('\n6️⃣ Testing user update via API...');
            const updateData = {
                fullName: 'Updated Test User Database',
                phone: '+94123456789'
            };

            try {
                const updateResponse = await axios.put(`${BASE_URL}/api/users/${createdUser._id}`, updateData, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });

                console.log('✅ User updated via API:', updateResponse.data.success);

                // Check if update is reflected in database
                const updatedUser = await User.findById(createdUser._id);
                if (updatedUser && updatedUser.fullName === updateData.fullName) {
                    console.log('✅ User update reflected in database');
                } else {
                    console.log('❌ User update NOT reflected in database - THIS IS THE PROBLEM!');
                }
            } catch (error) {
                console.error('❌ User update failed:', error.response?.data?.error || error.message);
            }
        }

        // Step 7: Test deleting the user via API
        if (createdUser) {
            console.log('\n7️⃣ Testing user deletion via API...');
            try {
                const deleteResponse = await axios.delete(`${BASE_URL}/api/users/${createdUser._id}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });

                console.log('✅ User deleted via API:', deleteResponse.data.success);

                // Check if deletion is reflected in database (soft delete)
                const deletedUser = await User.findById(createdUser._id);
                if (deletedUser && deletedUser.isActive === false) {
                    console.log('✅ User deletion reflected in database (soft delete)');
                } else if (!deletedUser) {
                    console.log('✅ User hard deleted from database');
                } else {
                    console.log('❌ User deletion NOT reflected in database - THIS IS THE PROBLEM!');
                }
            } catch (error) {
                console.error('❌ User deletion failed:', error.response?.data?.error || error.message);
            }
        }

    } catch (error) {
        console.error('❌ User creation failed:', error.response?.data?.error || error.message);
    }

    console.log('\n📊 Database Operations Test Complete');
    console.log('=====================================');

    // Disconnect from MongoDB
    await mongoose.disconnect();
}

// Run the test
testDatabaseOperations().catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
});
