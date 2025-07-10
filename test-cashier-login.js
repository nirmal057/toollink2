// Quick test to check cashier login
const BASE_URL = 'http://localhost:5000/api';

async function testCashierLogin() {
    console.log('🧪 Testing Cashier Login...\n');

    try {
        // Test cashier login
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'cashier@toollink.com',
                password: 'cashier123'
            }),
        });

        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (response.ok && data.success) {
            console.log('\n✅ Cashier login SUCCESS!');
            console.log('User:', data.user.name, `(${data.user.role})`);
            console.log('Token:', data.accessToken?.substring(0, 20) + '...');
        } else {
            console.log('\n❌ Cashier login FAILED');
            console.log('Error:', data.error);
        }

        // Also test if user exists in database
        console.log('\n🔍 Checking if cashier user exists...');
        const checkResponse = await fetch(`${BASE_URL}/auth/check-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'cashier@toollink.com'
            }),
        });

        if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            console.log('Email exists:', checkData.exists);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure the backend server is running on http://localhost:5000');
    }
}

testCashierLogin();
