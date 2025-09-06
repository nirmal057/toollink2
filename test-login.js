// Test login functionality
async function testLogin() {
    try {
        console.log('Testing login...');
        
        const response = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
        if (data.success) {
            console.log('✅ Login successful!');
            console.log('Access Token:', data.accessToken);
            
            // Test accessing protected route
            const userResponse = await fetch('http://localhost:5001/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${data.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const userData = await userResponse.json();
            console.log('User data:', userData);
        } else {
            console.log('❌ Login failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Error testing login:', error);
    }
}

testLogin();
