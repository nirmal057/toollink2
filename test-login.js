const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing admin login...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        console.log('✅ Admin login successful:', response.data.success);
        console.log('Access token:', response.data.accessToken ? 'Present' : 'Missing');
        console.log('User role:', response.data.user?.role);
        
        // Test accessing a protected endpoint
        if (response.data.accessToken) {
            const protectedResponse = await axios.get('http://localhost:5000/api/users', {
                headers: {
                    Authorization: `Bearer ${response.data.accessToken}`
                }
            });
            console.log('✅ Protected endpoint access successful');
        }
    } catch (error) {
        console.log('❌ Admin login failed:', error.response?.data?.error || error.message);
        console.log('Status code:', error.response?.status);
    }
}

testLogin();
