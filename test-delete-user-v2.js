const axios = require('axios');

async function testDeleteUser() {
    try {
        console.log('Testing delete user operation...');

        // Try different admin credentials
        let token;

        const possibleCredentials = [
            { email: 'admin@toolink.com', password: 'admin123' },
            { email: 'admin@toolink.com', password: 'admin' },
            { email: 'admin', password: 'admin123' },
            { email: 'admin', password: 'admin' }
        ];

        for (const creds of possibleCredentials) {
            try {
                console.log(`Trying login with: ${creds.email} / ${creds.password}`);
                const loginResponse = await axios.post('http://localhost:3000/api/auth/login', creds);
                token = loginResponse.data.token;
                console.log('✅ Login successful with:', creds.email);
                break;
            } catch (error) {
                console.log(`❌ Login failed with ${creds.email}:`, error.response?.data?.error);
            }
        }

        if (!token) {
            console.log('❌ Could not login with any credentials');
            return;
        }

        // Get users list
        const usersResponse = await axios.get('http://localhost:3000/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const users = usersResponse.data.users || usersResponse.data;
        console.log(`✅ Found ${users.length} users`);
        console.log('Users list:', users.map(u => ({ id: u.id || u._id, email: u.email, role: u.role })));

        // Find a non-admin user to delete (or create one for testing)
        let testUser = users.find(user => user.role !== 'admin' && user.email !== 'admin@toolink.com');

        if (!testUser) {
            console.log('Creating a test user first...');

            const createResponse = await axios.post('http://localhost:3000/api/users', {
                username: 'testuser_' + Date.now(),
                email: 'test_' + Date.now() + '@example.com',
                password: 'test123',
                fullName: 'Test User',
                role: 'customer'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Test user created:', createResponse.data);
            testUser = createResponse.data.user || createResponse.data;
        }

        // Now try to delete it
        const userId = testUser.id || testUser._id;
        console.log('Attempting to delete user with ID:', userId);
        console.log('User details:', { email: testUser.email, role: testUser.role });

        const deleteResponse = await axios.delete(`http://localhost:3000/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Delete successful:', deleteResponse.data);

    } catch (error) {
        console.error('❌ Error during delete test:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data);
        console.error('Full error:', error.message);

        if (error.response?.data) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }

        // Also log the error stack for debugging
        if (error.response?.status === 500) {
            console.error('Server error - check backend logs');
        }
    }
}

testDeleteUser();
