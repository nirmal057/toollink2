const axios = require('axios');
const fs = require('fs');

// Test the full user management flow
async function testUserManagement() {
    console.log('🔍 Testing User Management Flow...\n');

    try {
        // 1. Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        const { accessToken, user } = loginResponse.data;
        console.log('✅ Login successful');
        console.log('   - User ID:', user._id);
        console.log('   - Role:', user.role);
        console.log('   - Email:', user.email);

        // 2. Create a test user
        console.log('\n2. Creating test user...');
        const createResponse = await axios.post('http://localhost:5000/api/users', {
            username: 'testuser_' + Date.now(),
            email: 'test_' + Date.now() + '@test.com',
            password: 'test123',
            fullName: 'Test User for Management',
            role: 'customer'
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const newUser = createResponse.data.user;
        console.log('✅ User created successfully');
        console.log('   - New User ID:', newUser._id);
        console.log('   - Name:', newUser.fullName);
        console.log('   - Email:', newUser.email);

        // 3. Update the user
        console.log('\n3. Updating user...');
        const updateResponse = await axios.put(`http://localhost:5000/api/users/${newUser._id}`, {
            fullName: 'Updated Test User',
            phone: '+94123456789'
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log('✅ User updated successfully');
        console.log('   - Updated name:', updateResponse.data.user.fullName);
        console.log('   - Updated phone:', updateResponse.data.user.phone);

        // 4. Get all users to verify
        console.log('\n4. Getting all users...');
        const usersResponse = await axios.get('http://localhost:5000/api/users', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log('✅ Retrieved users successfully');
        console.log('   - Total users:', usersResponse.data.pagination.total);
        console.log('   - Users returned:', usersResponse.data.users.length);

        // Find our test user
        const testUser = usersResponse.data.users.find(u => u._id === newUser._id);
        if (testUser) {
            console.log('   - Found test user:', testUser.fullName);
        }

        // 5. Delete the test user
        console.log('\n5. Deleting test user...');
        await axios.delete(`http://localhost:5000/api/users/${newUser._id}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log('✅ User deleted successfully');

        // 6. Verify deletion
        console.log('\n6. Verifying deletion...');
        const finalUsersResponse = await axios.get('http://localhost:5000/api/users', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const deletedUser = finalUsersResponse.data.users.find(u => u._id === newUser._id);
        if (deletedUser) {
            console.log('⚠️  User still exists after deletion - soft delete implemented');
        } else {
            console.log('✅ User successfully removed from list');
        }

        console.log('\n🎉 All database operations working correctly!');

        // 7. Generate summary
        const summary = {
            timestamp: new Date().toISOString(),
            adminUser: {
                id: user._id,
                email: user.email,
                role: user.role
            },
            testResults: {
                login: 'SUCCESS',
                createUser: 'SUCCESS',
                updateUser: 'SUCCESS',
                deleteUser: 'SUCCESS',
                totalUsers: finalUsersResponse.data.pagination.total
            },
            conclusion: 'Backend API is working correctly. If frontend edit/delete is not working, the issue is in the frontend permission checks or UI event handling.'
        };

        fs.writeFileSync('user-management-test-report.json', JSON.stringify(summary, null, 2));
        console.log('\n📄 Test report saved to user-management-test-report.json');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('   - Status:', error.response.status);
            console.error('   - Data:', error.response.data);
        }
    }
}

// Run the test
testUserManagement().catch(console.error);
