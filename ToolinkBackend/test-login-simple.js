const axios = require('axios');

async function testLogin() {
    try {
        console.log('🧪 Testing Login API...');

        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@toollink.com',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Login successful!');
        console.log('📊 Status:', response.status);
        console.log('📋 Response:', response.data);

    } catch (error) {
        console.error('❌ Login failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLogin();
