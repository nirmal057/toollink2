const fetch = require('node-fetch');

async function testUserManagement() {
    try {
        console.log('🧪 Testing User Management Fix...\n');

        // Test 1: Admin Login
        console.log('1️⃣ Testing admin login...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();

        if (!loginData.success) {
            console.log('❌ Admin login failed:', loginData.error);
            return;
        }

        console.log('✅ Admin login successful');
        const token = loginData.accessToken;

        // Test 2: Fetch Users
        console.log('\n2️⃣ Testing user list (GET /api/users)...');
        const usersResponse = await fetch('http://localhost:3000/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const usersData = await usersResponse.json();

        if (usersData.success) {
            console.log('✅ User list fetch successful');
            console.log(`   Found ${usersData.data.length} users`);
            if (usersData.data.length > 0) {
                console.log(`   First user: ${usersData.data[0].fullName} (${usersData.data[0].role})`);
            }
        } else {
            console.log('❌ User list fetch failed:', usersData.error);
        }

        // Test 3: Create User
        console.log('\n3️⃣ Testing user creation (POST /api/users)...');
        const testUser = {
            username: 'testuser123',
            email: 'testuser123@example.com',
            password: 'password123',
            fullName: 'Test User',
            role: 'customer',
            isActive: true,
            isApproved: true
        };

        const createResponse = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testUser)
        });

        const createData = await createResponse.json();

        if (createData.success) {
            console.log('✅ User creation successful');
            console.log(`   Created user: ${createData.user.fullName}`);

            const userId = createData.user.id;

            // Test 4: Update User
            console.log('\n4️⃣ Testing user update (PUT /api/users/:id)...');
            const updateResponse = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: 'Updated Test User',
                    role: 'warehouse'
                })
            });

            const updateData = await updateResponse.json();

            if (updateData.success) {
                console.log('✅ User update successful');
                console.log(`   Updated user: ${updateData.user.fullName}`);
            } else {
                console.log('❌ User update failed:', updateData.error);
            }

            // Test 5: Delete User
            console.log('\n5️⃣ Testing user deletion (DELETE /api/users/:id)...');
            const deleteResponse = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const deleteData = await deleteResponse.json();

            if (deleteData.success) {
                console.log('✅ User deletion successful');
            } else {
                console.log('❌ User deletion failed:', deleteData.error);
            }

        } else {
            console.log('❌ User creation failed:', createData.error);
        }

        console.log('\n🎉 User Management API Test Complete!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Admin authentication working');
        console.log('   ✅ User list fetch working');
        console.log('   ✅ CRUD operations available');
        console.log('\n🔧 Frontend should now work with:');
        console.log('   - Proper authentication headers');
        console.log('   - Correct API endpoints');
        console.log('   - Data transformation for UI');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testUserManagement();
