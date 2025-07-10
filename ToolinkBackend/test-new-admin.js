const axios = require('axios');

async function testNewAdmin() {
    try {
        console.log('🧪 Testing New Test Admin...');

        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@admin.com',
            password: 'test123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ New admin login successful!');
        console.log('📊 Status:', response.status);
        console.log('📋 User:', response.data.user.fullName);
        console.log('🎭 Role:', response.data.user.role);
        console.log('📧 Email:', response.data.user.email);

    } catch (error) {
        console.error('❌ New admin login failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testNewAdmin();
