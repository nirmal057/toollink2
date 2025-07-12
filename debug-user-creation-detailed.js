const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Testing User Creation Process - Step by Step');
console.log('='.repeat(60));

async function testUserCreationFlow() {
    try {
        // Step 1: Authenticate as admin
        console.log('\n1️⃣ Authenticating as admin...');
        const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        const token = authResponse.data.accessToken;
        console.log(`✅ Admin authenticated successfully`);

        const authenticatedAxios = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Step 2: Get current user count
        console.log('\n2️⃣ Getting current user count...');
        const usersResponse = await authenticatedAxios.get('/api/users');
        const currentUsers = usersResponse.data.data || usersResponse.data || [];
        console.log(`✅ Current user count: ${currentUsers.length}`);

        // Step 3: Create a new user with realistic data
        console.log('\n3️⃣ Creating a new user...');
        const newUserData = {
            username: `testuser_${Date.now()}`,
            email: `testuser_${Date.now()}@toollink.com`,
            password: 'TestPassword123!',
            fullName: 'Test User Creation',
            phone: '+94771234567',
            role: 'customer',
            nicNumber: '199512345678',
            address: {
                street: '123 Test Street',
                city: 'Colombo',
                district: 'Colombo',
                province: 'Western',
                postalCode: '00100'
            }
        };

        console.log('📋 User data to create:', JSON.stringify(newUserData, null, 2));

        const createResponse = await authenticatedAxios.post('/api/users', newUserData);
        console.log(`✅ User creation response status: ${createResponse.status}`);
        console.log(`📄 Response data:`, JSON.stringify(createResponse.data, null, 2));

        const createdUser = createResponse.data.data || createResponse.data;

        // Step 4: Verify user was created
        console.log('\n4️⃣ Verifying user was created...');
        const updatedUsersResponse = await authenticatedAxios.get('/api/users');
        const updatedUsers = updatedUsersResponse.data.data || updatedUsersResponse.data || [];
        console.log(`✅ Updated user count: ${updatedUsers.length}`);

        if (updatedUsers.length > currentUsers.length) {
            console.log(`🎉 SUCCESS! User count increased from ${currentUsers.length} to ${updatedUsers.length}`);

            // Find the newly created user
            const newUser = updatedUsers.find(user =>
                user.username === newUserData.username ||
                user.email === newUserData.email
            );

            if (newUser) {
                console.log(`👤 New user found:`, {
                    id: newUser._id || newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    fullName: newUser.fullName,
                    role: newUser.role
                });
            }
        } else {
            console.log(`❌ PROBLEM: User count did not increase!`);
        }

        // Step 5: Test user login
        console.log('\n5️⃣ Testing if new user can login...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: newUserData.email,
                password: newUserData.password
            });

            if (loginResponse.data.success) {
                console.log(`✅ New user can login successfully!`);
                console.log(`👤 Login response:`, {
                    user: loginResponse.data.user.username,
                    role: loginResponse.data.user.role,
                    tokenReceived: !!loginResponse.data.accessToken
                });
            }
        } catch (loginError) {
            console.log(`❌ New user cannot login:`, loginError.response?.data || loginError.message);
        }

        // Step 6: Test notification endpoint (the previous issue)
        console.log('\n6️⃣ Testing notification endpoint...');
        try {
            const notificationResponse = await authenticatedAxios.get('/api/notifications/unread-count');
            console.log(`✅ Notification endpoint working:`, notificationResponse.data);
        } catch (notificationError) {
            console.log(`❌ Notification endpoint failed:`, notificationError.response?.data || notificationError.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🏁 USER CREATION TEST COMPLETED');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Test failed at step:', error.config?.url || 'unknown');
        console.error('Error details:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

testUserCreationFlow();
