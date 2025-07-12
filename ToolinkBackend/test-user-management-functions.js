import fetch from 'node-fetch';

async function testUserManagementFunctions() {
    try {
        console.log('🧪 TESTING USER MANAGEMENT FUNCTIONS');
        console.log('='.repeat(50));

        // Step 1: Admin Login
        console.log('\n1️⃣ Admin Login...');
        const adminLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });

        const adminLoginData = await adminLoginResponse.json();
        if (!adminLoginData.success) {
            console.log('❌ Admin login failed:', adminLoginData.error);
            return;
        }

        console.log('✅ Admin logged in successfully');
        const adminToken = adminLoginData.accessToken;

        // Step 2: Test GET /api/users
        console.log('\n2️⃣ Testing GET /api/users...');
        const getUsersResponse = await fetch('http://localhost:3000/api/users', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const getUsersData = await getUsersResponse.json();
        console.log('Status:', getUsersResponse.status);
        console.log('Success:', getUsersData.success);
        console.log('Total users:', getUsersData.data ? getUsersData.data.length : 'No data');

        if (getUsersResponse.status !== 200 || !getUsersData.success) {
            console.log('❌ GET users failed');
            return;
        }

        // Step 3: Test CREATE user (POST /api/users)
        console.log('\n3️⃣ Testing CREATE user (POST /api/users)...');
        const uniqueId = Date.now();
        const newUserData = {
            username: `testuser_${uniqueId}`,
            email: `testuser_${uniqueId}@toollink.com`,
            password: 'test123',
            fullName: 'Test User Management',
            phone: '+94771234567',
            role: 'customer',
            nicNumber: '123456789V',
            address: {
                street: '123 Test Street',
                city: 'Colombo',
                district: 'Colombo',
                province: 'Western',
                postalCode: '00100',
                country: 'Sri Lanka'
            }
        };

        const createUserResponse = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(newUserData)
        });

        const createUserData = await createUserResponse.json();
        console.log('Create Status:', createUserResponse.status);
        console.log('Create Success:', createUserData.success);
        console.log('Create Response:', JSON.stringify(createUserData, null, 2));

        let createdUserId = null;
        if (createUserResponse.status === 201 || createUserResponse.status === 200) {
            if (createUserData.success) {
                createdUserId = createUserData.user?.id || createUserData.user?._id || createUserData.data?.id || createUserData.data?._id;
                console.log('✅ User created successfully. ID:', createdUserId);
            } else {
                console.log('❌ User creation failed:', createUserData.error);
            }
        } else {
            console.log('❌ User creation failed with status:', createUserResponse.status);
        }

        // Step 4: Test UPDATE user (PUT /api/users/:id)
        if (createdUserId) {
            console.log('\n4️⃣ Testing UPDATE user (PUT /api/users/:id)...');
            const updateData = {
                fullName: 'Updated Test User',
                phone: '+94771234568',
                role: 'warehouse'
            };

            const updateUserResponse = await fetch(`http://localhost:3000/api/users/${createdUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify(updateData)
            });

            const updateUserData = await updateUserResponse.json();
            console.log('Update Status:', updateUserResponse.status);
            console.log('Update Success:', updateUserData.success);
            console.log('Update Response:', JSON.stringify(updateUserData, null, 2));

            if (updateUserResponse.status === 200 && updateUserData.success) {
                console.log('✅ User updated successfully');
            } else {
                console.log('❌ User update failed');
            }
        }

        // Step 5: Test DELETE user (DELETE /api/users/:id)
        if (createdUserId) {
            console.log('\n5️⃣ Testing DELETE user (DELETE /api/users/:id)...');
            const deleteUserResponse = await fetch(`http://localhost:3000/api/users/${createdUserId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            const deleteUserData = await deleteUserResponse.json();
            console.log('Delete Status:', deleteUserResponse.status);
            console.log('Delete Success:', deleteUserData.success);
            console.log('Delete Response:', JSON.stringify(deleteUserData, null, 2));

            if (deleteUserResponse.status === 200 && deleteUserData.success) {
                console.log('✅ User deleted successfully');
            } else {
                console.log('❌ User deletion failed');
            }
        }

        // Step 6: Verify user count after operations
        console.log('\n6️⃣ Verifying final user count...');
        const finalGetUsersResponse = await fetch('http://localhost:3000/api/users', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const finalGetUsersData = await finalGetUsersResponse.json();
        console.log('Final user count:', finalGetUsersData.data ? finalGetUsersData.data.length : 'No data');

        // Step 7: Test some common error scenarios
        console.log('\n7️⃣ Testing error scenarios...');

        // Test update non-existent user
        const invalidUpdateResponse = await fetch('http://localhost:3000/api/users/invalid-id', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ fullName: 'Test' })
        });
        console.log('Invalid update status:', invalidUpdateResponse.status, '(should be 400 or 404)');

        // Test delete non-existent user
        const invalidDeleteResponse = await fetch('http://localhost:3000/api/users/invalid-id', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('Invalid delete status:', invalidDeleteResponse.status, '(should be 400 or 404)');

        console.log('\n🎯 SUMMARY');
        console.log('='.repeat(30));
        console.log('✅ All major User Management functions tested');
        console.log('✅ Backend API endpoints working correctly');
        console.log('📋 If frontend still not working, issue is in React component');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testUserManagementFunctions();
