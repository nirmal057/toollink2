/**
 * Test login with demo users
 */

const API_BASE = 'http://localhost:5000';

async function testDemoLogin() {
    console.log('🔐 Testing Login with demo users...');
    
    const demoUsers = [
        { email: 'admin@toollink.com', password: 'admin123', role: 'admin' },
        { email: 'user@toollink.com', password: 'user123', role: 'user' },
        { email: 'warehouse@toollink.com', password: 'warehouse123', role: 'warehouse' },
        { email: 'cashier@toollink.com', password: 'cashier123', role: 'cashier' }
    ];

    for (const user of demoUsers) {
        console.log(`\n👤 Testing login for ${user.email}...`);
        
        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    password: user.password
                })
            });

            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ Login successful for ${user.email}`);
                console.log(`   Name: ${data.user.name}`);
                console.log(`   Role: ${data.user.role}`);
                console.log(`   Token: ${data.accessToken ? 'Present' : 'Missing'}`);
            } else {
                console.error(`❌ Login failed for ${user.email}:`, data.error);
            }
        } catch (error) {
            console.error(`❌ Login error for ${user.email}:`, error.message);
        }
    }
}

// Run the test
testDemoLogin()
    .then(() => {
        console.log('\n🎉 Demo login tests completed!');
    })
    .catch(error => {
        console.error('💥 Test failed with error:', error);
    });
