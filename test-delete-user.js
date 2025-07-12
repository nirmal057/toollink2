const axios = require('axios');

async function testDeleteUser() {
    try {
        console.log('Testing delete user operation...');

        // First, let's get the list of users to find a user to delete
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@toolink.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Admin login successful');

        // Get users list
        const usersResponse = await axios.get('http://localhost:3000/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const users = usersResponse.data.users || usersResponse.data;
        console.log(`✅ Found ${users.length} users`);

        // Find a non-admin user to delete (or create one for testing)
        const testUser = users.find(user => user.role !== 'admin' && user.email !== 'admin@toolink.com');

        if (!testUser) {
            console.log('Creating a test user first...');

            const createResponse = await axios.post('http://localhost:3000/api/users', {
                username: 'testuser',
                email: 'test@example.com',
                password: 'test123',
                fullName: 'Test User',
                role: 'customer'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Test user created:', createResponse.data);

            // Now try to delete it
            const userId = createResponse.data.user?.id || createResponse.data.user?._id || createResponse.data.id || createResponse.data._id;
            console.log('Attempting to delete user with ID:', userId);

            const deleteResponse = await axios.delete(`http://localhost:3000/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Delete successful:', deleteResponse.data);
        } else {
            console.log('Found test user to delete:', testUser.email);
            const userId = testUser.id || testUser._id;
            console.log('Attempting to delete user with ID:', userId);

            const deleteResponse = await axios.delete(`http://localhost:3000/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Delete successful:', deleteResponse.data);
        }

    } catch (error) {
        console.error('❌ Error during delete test:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data);
        console.error('Full error:', error.message);

        if (error.response?.data) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testDeleteUser();
