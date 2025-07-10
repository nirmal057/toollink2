const axios = require('axios');

async function createCashierUser() {
    console.log('👨‍💼 CREATING CASHIER USER');
    console.log('========================\n');

    try {
        // Register cashier user
        console.log('1. Registering cashier user...');
        const cashierData = {
            username: 'cashier',
            email: 'cashier@toollink.com',
            password: 'cashier123',
            fullName: 'Cashier User',
            phone: '+94-77-123-4567',
            role: 'cashier'
        };

        const registerResponse = await axios.post('http://localhost:5000/api/auth/register', cashierData);

        if (registerResponse.data.success) {
            console.log('✅ Cashier user registered successfully');
            console.log(`👤 Cashier: ${registerResponse.data.user.fullName}`);
            console.log(`📧 Email: ${registerResponse.data.user.email}`);
            console.log(`🔑 Role: ${registerResponse.data.user.role}`);
            console.log(`🔓 Approved: ${registerResponse.data.user.isApproved}`);
            console.log(`🔄 Requires Approval: ${registerResponse.data.requiresApproval}`);
            
            // Test login
            console.log('\n2. Testing cashier login...');
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: cashierData.email,
                password: cashierData.password
            });

            if (loginResponse.data.success) {
                console.log('✅ Cashier can login successfully');
            } else {
                console.log('❌ Cashier login failed:', loginResponse.data.error);
            }
        } else {
            console.log('❌ Cashier registration failed:', registerResponse.data.error);
        }

    } catch (error) {
        if (error.response) {
            console.log('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.log('❌ Network Error:', error.message);
        }
    }
}

createCashierUser();
