// Debug script to test frontend API calls
console.log('Testing frontend API integration...');

// Check if we have stored tokens
const accessToken = localStorage.getItem('accessToken');
const user = localStorage.getItem('user');

console.log('Stored accessToken:', accessToken);
console.log('Stored user:', user);

if (!accessToken) {
    console.log('No access token found. Attempting login...');

    // Try to login
    fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: 'admin@toollink.com',
            password: 'admin123'
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Login successful!');
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                testApiCalls(data.accessToken);
            } else {
                console.error('Login failed:', data);
            }
        })
        .catch(error => {
            console.error('Login error:', error);
        });
} else {
    console.log('Using existing token to test API calls...');
    testApiCalls(accessToken);
}

function testApiCalls(token) {
    console.log('Testing API endpoints with token:', token.substring(0, 20) + '...');

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Test all endpoints that the IntegratedDataService uses
    Promise.all([
        fetch('http://localhost:5001/api/users', { headers }),
        fetch('http://localhost:5001/api/inventory', { headers }),
        fetch('http://localhost:5001/api/orders', { headers }),
        fetch('http://localhost:5001/api/delivery', { headers })
    ])
        .then(async responses => {
            console.log('API Response status codes:');
            console.log('Users:', responses[0].status);
            console.log('Inventory:', responses[1].status);
            console.log('Orders:', responses[2].status);
            console.log('Delivery:', responses[3].status);

            // Parse successful responses
            const results = await Promise.all(
                responses.map(async (response, index) => {
                    if (response.ok) {
                        const data = await response.json();
                        const endpoints = ['users', 'inventory', 'orders', 'delivery'];
                        console.log(`${endpoints[index]} data:`, {
                            success: data.success,
                            dataLength: Array.isArray(data.data) ? data.data.length : 'Not an array',
                            structure: Object.keys(data)
                        });
                        return data;
                    } else {
                        const error = await response.text();
                        console.error(`${['users', 'inventory', 'orders', 'delivery'][index]} error:`, error);
                        return null;
                    }
                })
            );

            console.log('All API tests completed!');
        })
        .catch(error => {
            console.error('API test error:', error);
        });
}
