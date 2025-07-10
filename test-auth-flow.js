/**
 * Test login with a newly registered user
 */

const API_BASE = 'http://localhost:5000';

async function testLogin() {
    console.log('🔐 Testing Login with the registered user...');
    
    // First register a new user
    const testUser = {
        fullName: `Test User ${Date.now()}`,
        email: `testlogin${Date.now()}@example.com`,
        password: 'password123',
        phone: '1234567890'
    };

    const registerData = {
        username: testUser.email.split('@')[0],
        fullName: testUser.fullName,
        email: testUser.email,
        password: testUser.password,
        role: 'customer',
        phone: testUser.phone,
    };

    console.log('1️⃣ Registering user:', testUser.email);
    
    try {
        // Register
        const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });

        const registerResult = await registerResponse.json();
        
        if (!registerResult.success) {
            console.error('❌ Registration failed:', registerResult.error);
            return false;
        }
        
        console.log('✅ Registration successful');
        
        // Now test login
        console.log('2️⃣ Testing login with:', testUser.email);
        
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });

        const loginResult = await loginResponse.json();
        
        if (loginResult.success) {
            console.log('✅ Login successful!');
            console.log('👤 User:', loginResult.user.name);
            console.log('🏷️  Role:', loginResult.user.role);
            console.log('🔑 Access Token:', loginResult.accessToken ? 'Present' : 'Missing');
            return true;
        } else {
            console.error('❌ Login failed:', loginResult.error);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
        return false;
    }
}

// Run the test
testLogin()
    .then(success => {
        if (success) {
            console.log('\n🎉 Complete authentication flow test passed!');
        } else {
            console.log('\n💥 Authentication flow test failed!');
        }
    })
    .catch(error => {
        console.error('💥 Test failed with error:', error);
    });
