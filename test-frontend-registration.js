/**
 * Test the frontend registration service
 */

// Load the userRegistrationService (simplified version for testing)
const API_BASE = 'http://localhost:5000';

async function testFrontendRegistration() {
    console.log('🧪 Testing Frontend Registration Service...');
    
    const testUser = {
        fullName: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        phone: '1234567890'
    };

    console.log('📝 Test user data:', testUser);

    // Prepare registration data like the frontend does
    const registerData = {
        username: testUser.email.split('@')[0], // Generate username from email
        fullName: testUser.fullName,
        email: testUser.email,
        password: testUser.password,
        role: 'customer',
        phone: testUser.phone,
    };

    console.log('📤 Sending to backend:', registerData);

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Frontend Registration successful!');
            console.log('👤 User created:', data.user.email);
            console.log('🏷️  Role:', data.user.role);
            return true;
        } else {
            console.error('❌ Frontend Registration failed:', data.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Registration error:', error.message);
        return false;
    }
}

// Run the test
testFrontendRegistration()
    .then(success => {
        if (success) {
            console.log('\n🎉 Frontend registration test passed!');
        } else {
            console.log('\n💥 Frontend registration test failed!');
        }
    })
    .catch(error => {
        console.error('💥 Test failed with error:', error);
    });
