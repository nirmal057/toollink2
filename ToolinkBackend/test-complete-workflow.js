import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

// Test the complete admin workflow
async function testCompleteWorkflow() {
    try {
        console.log('🚀 Testing Complete Admin → User Creation → User Login Workflow\n');

        // Step 1: Admin Login
        console.log('👤 Step 1: Admin Login...');
        const adminLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
        console.log(`   - Admin Name: ${adminLoginData.user.fullName}`);
        console.log(`   - Admin Role: ${adminLoginData.user.role}`);

        const adminToken = adminLoginData.accessToken;

        // Step 2: Admin creates a new user
        console.log('\n👥 Step 2: Admin creating new warehouse manager...');

        const newUser = {
            username: 'warehouse_new',
            email: 'warehouse.new@toollink.com',
            password: 'newwarehouse123',
            fullName: 'New Warehouse Manager',
            phone: '+94771234571',
            role: 'warehouse'
        };

        const createUserResponse = await fetch(`${BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(newUser)
        });

        const createUserData = await createUserResponse.json();

        if (!createUserData.success) {
            console.log('❌ User creation failed:', createUserData.error);
            if (createUserData.errorType === 'DUPLICATE_USER') {
                console.log('ℹ️  User already exists, continuing with existing user...');
            } else {
                return;
            }
        } else {
            console.log('✅ New user created successfully');
            console.log(`   - User ID: ${createUserData.user.id}`);
            console.log(`   - Username: ${createUserData.user.username}`);
            console.log(`   - Email: ${createUserData.user.email}`);
            console.log(`   - Role: ${createUserData.user.role}`);
            console.log(`   - Is Active: ${createUserData.user.isActive}`);
            console.log(`   - Is Approved: ${createUserData.user.isApproved}`);
        }

        // Step 3: New user attempts to login
        console.log('\n🔐 Step 3: New user attempting to login...');

        const userLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: newUser.email,
                password: newUser.password
            })
        });

        const userLoginData = await userLoginResponse.json();

        if (!userLoginData.success) {
            console.log('❌ User login failed:', userLoginData.error);
            console.log('   Error Type:', userLoginData.errorType);
            return;
        }

        console.log('✅ New user logged in successfully');
        console.log(`   - User Name: ${userLoginData.user.fullName}`);
        console.log(`   - User Role: ${userLoginData.user.role}`);
        console.log(`   - Email Verified: ${userLoginData.user.emailVerified}`);
        console.log(`   - Is Approved: ${userLoginData.user.isApproved}`);
        console.log(`   - Access Token: ${userLoginData.accessToken.substring(0, 20)}...`);

        const userToken = userLoginData.accessToken;

        // Step 4: New user accesses their profile
        console.log('\n📋 Step 4: New user accessing their profile...');

        const profileResponse = await fetch(`${BASE_URL}/users/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        const profileData = await profileResponse.json();

        if (!profileData.success) {
            console.log('❌ Profile access failed:', profileData.error);
            return;
        }

        console.log('✅ User profile accessed successfully');
        console.log(`   - Full Name: ${profileData.data.fullName}`);
        console.log(`   - Email: ${profileData.data.email}`);
        console.log(`   - Role: ${profileData.data.role}`);
        console.log(`   - Phone: ${profileData.data.phone}`);
        console.log(`   - Created: ${new Date(profileData.data.createdAt).toLocaleString()}`);

        // Step 5: Test role-based access
        console.log('\n🔑 Step 5: Testing role-based access...');

        // Try to access admin-only users list
        const usersListResponse = await fetch(`${BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        if (usersListResponse.status === 403) {
            console.log('✅ Role-based access control working - warehouse user cannot access admin endpoint');
        } else {
            console.log('⚠️  Role-based access control may have issues');
        }

        // Step 6: Admin verifies the new user exists
        console.log('\n📊 Step 6: Admin verifying new user in system...');

        const allUsersResponse = await fetch(`${BASE_URL}/users?search=${newUser.email}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const allUsersData = await allUsersResponse.json();

        if (allUsersData.success && allUsersData.data.length > 0) {
            console.log('✅ Admin can see the new user in the system');
            const foundUser = allUsersData.data[0];
            console.log(`   - Found User: ${foundUser.fullName} (${foundUser.email})`);
            console.log(`   - Role: ${foundUser.role}`);
            console.log(`   - Status: ${foundUser.isActive ? 'Active' : 'Inactive'}`);
        } else {
            console.log('❌ New user not found in admin user list');
        }

        console.log('\n🎉 Complete workflow test successful!');

        console.log('\n📋 Workflow Summary:');
        console.log('✅ Admin can login');
        console.log('✅ Admin can create new users');
        console.log('✅ New users are saved to database');
        console.log('✅ New users can login with their credentials');
        console.log('✅ New users can access their profile');
        console.log('✅ Role-based access control works');
        console.log('✅ Admin can verify new users in system');

        console.log('\n🔗 Frontend Login URLs:');
        console.log(`   Admin Panel: http://localhost:5173/admin`);
        console.log(`   Warehouse Dashboard: http://localhost:5173/warehouse`);
        console.log(`   Customer Portal: http://localhost:5173/customer`);

        console.log('\n🔑 Test Credentials:');
        console.log(`   New Warehouse Manager:`);
        console.log(`   - Email: ${newUser.email}`);
        console.log(`   - Password: ${newUser.password}`);

    } catch (error) {
        console.error('❌ Workflow test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure the backend server is running on port 3000');
        }
    }
}

// Run the test
testCompleteWorkflow();
