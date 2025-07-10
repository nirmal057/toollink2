const axios = require('axios');

async function testAdminLogin() {
    const API_BASE = 'http://localhost:3001/api';

    const credentialsToTest = [
        { email: 'test@admin.com', password: 'admin123' },
        { email: 'admin@toollink.com', password: 'password123' },
        { email: 'admin@toollink.com', password: 'admin123' },
        { email: 'admin@toollink.com', password: 'password' },
        { email: 'admin@toollink.com', password: 'admin' },
        { email: 'admin1@toollink.lk', password: 'password123' },
        { email: 'admin1@toollink.lk', password: 'admin123' },
        { email: 'admin1@toollink.lk', password: 'password' },
        { email: 'admin1@toollink.lk', password: 'admin' },
        { email: 'superadmin@toollink.lk', password: 'password123' },
        { email: 'superadmin@toollink.lk', password: 'admin123' },
        { email: 'superadmin@toollink.lk', password: 'password' },
        { email: 'superadmin@toollink.lk', password: 'admin' }
    ];

    for (const creds of credentialsToTest) {
        try {
            console.log(`Testing: ${creds.email} with ${creds.password}`);
            const response = await axios.post(`${API_BASE}/auth/login`, creds);
            console.log(`✅ SUCCESS: ${creds.email} with ${creds.password}`);
            console.log(`Token: ${response.data.data.token}`);
            return;
        } catch (error) {
            console.log(`❌ Failed: ${creds.email} with ${creds.password}`);
        }
    }

    console.log('❌ No valid credentials found');
}

testAdminLogin();
