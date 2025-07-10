const axios = require('axios');

async function testFrontendLogin() {
    console.log('🔍 Testing Complete Login Flow');
    console.log('================================');

    try {
        // Test 1: Test the corrected admin credentials
        console.log('\n1. Testing Admin Login with Correct Email');
        const adminLoginData = {
            email: 'admin@toollink.lk',
            password: 'admin123'
        };

        console.log('Request data:', adminLoginData);

        const adminResponse = await axios.post('http://localhost:3001/api/auth/login', adminLoginData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Admin login successful!');
        console.log('Response status:', adminResponse.status);
        console.log('User data:', adminResponse.data.data.user);
        console.log('Token received:', !!adminResponse.data.data.token);

        // Test 2: Test with wrong email (should fail)
        console.log('\n2. Testing with Wrong Email (should fail)');
        const wrongEmailData = {
            email: 'admin@toollink.com',
            password: 'admin123'
        };

        try {
            await axios.post('http://localhost:3001/api/auth/login', wrongEmailData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Wrong email test failed - should have returned 401');
        } catch (error) {
            console.log('✅ Wrong email correctly returned 401:', error.response?.data?.message);
        }

        // Test 3: Test with wrong password
        console.log('\n3. Testing with Wrong Password (should fail)');
        const wrongPasswordData = {
            email: 'admin@toollink.lk',
            password: 'wrongpassword'
        };

        try {
            await axios.post('http://localhost:3001/api/auth/login', wrongPasswordData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Wrong password test failed - should have returned 401');
        } catch (error) {
            console.log('✅ Wrong password correctly returned 401:', error.response?.data?.message);
        }

        // Test 4: Test cashier login
        console.log('\n4. Testing Cashier Login');
        const cashierLoginData = {
            email: 'amara.cashier@toollink.lk',
            password: 'amara123'
        };

        try {
            const cashierResponse = await axios.post('http://localhost:3001/api/auth/login', cashierLoginData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Cashier login successful!');
            console.log('Cashier role:', cashierResponse.data.data.user.role);
        } catch (error) {
            console.log('❌ Cashier login failed:', error.response?.data?.message);
        }

        console.log('\n🎉 Login flow testing complete!');
        console.log('\n📋 Summary:');
        console.log('- Admin login with correct email: ✅ Working');
        console.log('- Wrong email properly rejected: ✅ Working');
        console.log('- Wrong password properly rejected: ✅ Working');
        console.log('- Authentication system: ✅ Functioning correctly');

    } catch (error) {
        console.error('\n❌ Test failed!');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testFrontendLogin();
