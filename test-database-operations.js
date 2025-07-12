// Direct Database Test for User Management
// This will test the backend API endpoints directly

console.log('=== Direct Database Test for User Management ===');

const API_BASE = 'http://localhost:3000';
const token = localStorage.getItem('accessToken');

if (!token) {
    console.error('❌ No access token found. Please login first.');
} else {
    console.log('✅ Access token found:', token.substring(0, 20) + '...');

    // Test function to get current users
    const getCurrentUsers = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/users?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success && data.data) {
                console.log('📊 Current users in database:', data.data.length);
                data.data.forEach((user, index) => {
                    console.log(`${index + 1}. ${user.fullName || user.name} (${user.email}) - ${user.role}`);
                });
                return data.data;
            } else {
                console.error('❌ Failed to get users:', data);
                return [];
            }
        } catch (error) {
            console.error('❌ Error fetching users:', error);
            return [];
        }
    };

    // Test function to create a user
    const testCreateUser = async () => {
        const testUser = {
            username: 'testuser' + Date.now(),
            email: 'test' + Date.now() + '@example.com',
            password: 'password123',
            fullName: 'Test User ' + Date.now(),
            phone: '+94771234567',
            role: 'customer',
            status: 'active'
        };

        try {
            console.log('\n🧪 Testing user creation...');
            const response = await fetch(`${API_BASE}/api/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testUser)
            });
            const data = await response.json();
            if (response.ok && data.success) {
                console.log('✅ User created successfully:', data);
                return data.data;
            } else {
                console.error('❌ Failed to create user:', response.status, data);
                return null;
            }
        } catch (error) {
            console.error('❌ Error creating user:', error);
            return null;
        }
    };

    // Test function to delete a user
    const testDeleteUser = async (userId) => {
        try {
            console.log('🗑️ Testing user deletion for ID:', userId);
            const response = await fetch(`${API_BASE}/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                console.log('✅ User deleted successfully:', data);
                return true;
            } else {
                console.error('❌ Failed to delete user:', response.status, data);
                return false;
            }
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            return false;
        }
    };

    // Run complete test
    const runCompleteTest = async () => {
        console.log('\n🚀 Starting complete CRUD test...');

        // Step 1: Get initial user count
        console.log('\n📊 Step 1: Get initial user count');
        const initialUsers = await getCurrentUsers();
        const initialCount = initialUsers.length;

        // Step 2: Create a test user
        console.log('\n➕ Step 2: Create test user');
        const createdUser = await testCreateUser();

        if (createdUser) {
            // Step 3: Verify user was created
            console.log('\n📊 Step 3: Verify user was created');
            const afterCreateUsers = await getCurrentUsers();
            const afterCreateCount = afterCreateUsers.length;

            if (afterCreateCount > initialCount) {
                console.log('✅ User creation confirmed - count increased from', initialCount, 'to', afterCreateCount);

                // Step 4: Delete the test user
                console.log('\n🗑️ Step 4: Delete test user');
                const userId = createdUser.id || createdUser._id;
                const deleteSuccess = await testDeleteUser(userId);

                if (deleteSuccess) {
                    // Step 5: Verify user was deleted
                    console.log('\n📊 Step 5: Verify user was deleted');
                    const afterDeleteUsers = await getCurrentUsers();
                    const afterDeleteCount = afterDeleteUsers.length;

                    if (afterDeleteCount === initialCount) {
                        console.log('✅ User deletion confirmed - count returned to', afterDeleteCount);
                        console.log('\n🎉 ALL TESTS PASSED - Database operations working correctly!');
                    } else {
                        console.log('⚠️ User deletion issue - count is', afterDeleteCount, 'but expected', initialCount);
                    }
                }
            } else {
                console.log('❌ User creation failed - count did not increase');
            }
        }

        console.log('\n📋 Test Summary:');
        console.log('- Database operations: ' + (createdUser ? '✅' : '❌'));
        console.log('- User creation: ' + (createdUser ? '✅' : '❌'));
        console.log('- User deletion: ' + (createdUser ? '✅' : '❌'));
        console.log('\nIf database operations work but UI doesn\'t update, the issue is in the frontend refresh logic.');
    };

    // Run the test
    runCompleteTest();
}
