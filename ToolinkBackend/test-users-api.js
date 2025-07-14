import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'dev-jwt-secret-key-2024-toollink';

async function testUsersAPI() {
    try {
        // Create a test token for admin user
        const token = jwt.sign(
            { userId: '68720ac9f2e38e6726e3539c', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('Generated token for admin user');

        // Make request to users API
        const response = await fetch('http://localhost:3000/api/users?limit=1000', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        console.log('API Response Status:', response.status);
        console.log('API Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error testing API:', error);
    }
}

testUsersAPI();
