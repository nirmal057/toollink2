import fetch from 'node-fetch';

async function testUserAPIs() {
    try {
        console.log('🔍 Testing User Management API Issues...\n');

        // Step 1: Admin Login to get a fresh token
        console.log('👤 Step 1: Getting fresh admin token...');
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

        // Step 2: Test the main users endpoint that admin panel uses
        console.log('\n📋 Step 2: Testing GET /api/users (Admin Panel endpoint)...');
        const usersResponse = await fetch('http://localhost:3000/api/users', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        console.log('Response status:', usersResponse.status);
        const usersData = await usersResponse.json();
        console.log('Response data:', JSON.stringify(usersData, null, 2));

        // Step 3: Verify old endpoint is removed (should return 404)
        console.log('\n📋 Step 3: Verifying old /api/users-new endpoint is removed...');
        const usersNewResponse = await fetch('http://localhost:3000/api/users-new', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        console.log('Response status:', usersNewResponse.status);
        if (usersNewResponse.status === 404) {
            console.log('✅ Old endpoint properly removed - returns 404');
        } else {
            console.log('⚠️  Old endpoint still accessible - needs cleanup');
            const usersNewData = await usersNewResponse.json();
            console.log('Response data:', JSON.stringify(usersNewData, null, 2));
        }

        // Step 4: Check what users are actually in the database
        console.log('\n🗄️  Step 4: Checking database directly...');

        // Step 5: Test creating a user with the same endpoint frontend uses
        console.log('\n➕ Step 5: Testing user creation with frontend endpoint...');
        const createUserResponse = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                username: 'test_user_debug',
                email: 'test.debug@toollink.com',
                password: 'test123',
                fullName: 'Test Debug User',
                phone: '+94771234580',
                role: 'customer'
            })
        });

        console.log('Create user response status:', createUserResponse.status);
        const createUserData = await createUserResponse.json();
        console.log('Create user response:', JSON.stringify(createUserData, null, 2));

        // Step 6: Test if the new user can login
        console.log('\n🔐 Step 6: Testing if new user can login...');
        const newUserLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test.debug@toollink.com',
                password: 'test123'
            })
        });

        console.log('New user login status:', newUserLoginResponse.status);
        const newUserLoginData = await newUserLoginResponse.json();
        console.log('New user login response:', JSON.stringify(newUserLoginData, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testUserAPIs();
