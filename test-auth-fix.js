/**
 * Test Login and Registration Functions
 * Run this to verify the auth flow is working
 */

const API_BASE = 'http://localhost:5000';

async function testLogin() {
    console.log('🔍 Testing Login...');
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Login SUCCESS');
            console.log('User:', data.user.email, '|', data.user.name);
            console.log('Token received:', data.accessToken ? 'Yes' : 'No');
            return true;
        } else {
            console.log('❌ Login FAILED:', data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Login ERROR:', error.message);
        return false;
    }
}

async function testRegistration() {
    console.log('\n🔍 Testing Registration...');
    
    const timestamp = Date.now();
    const testData = {
        username: `testuser${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'TestPassword123!',
        fullName: 'Test User Registration',
        phone: '+1234567890'
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Registration SUCCESS');
            console.log('User:', data.user.email, '|', data.user.name);
            console.log('Token received:', data.accessToken ? 'Yes' : 'No');
            return true;
        } else {
            console.log('❌ Registration FAILED:', data.error);
            console.log('Response data:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ Registration ERROR:', error.message);
        return false;
    }
}

async function testAuthFunctions() {
    console.log('🚀 TESTING AUTHENTICATION FUNCTIONS\n');
    console.log('=' + '='.repeat(40));
    
    const loginResult = await testLogin();
    const registrationResult = await testRegistration();
    
    console.log('\n' + '=' + '='.repeat(40));
    console.log('📊 RESULTS:');
    console.log('Login:', loginResult ? '✅ WORKING' : '❌ FAILED');
    console.log('Registration:', registrationResult ? '✅ WORKING' : '❌ FAILED');
    
    if (loginResult && registrationResult) {
        console.log('\n🎉 ALL AUTHENTICATION FUNCTIONS WORKING!');
    } else {
        console.log('\n⚠️  Some authentication functions need fixing.');
    }
}

// Run the tests
testAuthFunctions().catch(console.error);
