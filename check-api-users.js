const axios = require('axios');

async function checkUsers() {
    console.log('🔍 CHECKING USERS VIA API');
    console.log('========================\n');

    try {
        // Try to login as admin first
        console.log('1. Testing admin login...');
        try {
            const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'admin@toollink.com',
                password: 'admin123'
            });

            if (adminResponse.data.success) {
                console.log('✅ Admin user exists and can login');
                console.log(`👤 Admin: ${adminResponse.data.user.fullName}`);
                console.log(`📧 Email: ${adminResponse.data.user.email}`);
                console.log(`🔑 Role: ${adminResponse.data.user.role}`);
                console.log(`🔓 Approved: ${adminResponse.data.user.isApproved}`);

                // Get pending users
                console.log('\n3. Checking pending users...');
                const token = adminResponse.data.accessToken;
                const pendingResponse = await axios.get('http://localhost:5000/api/auth/pending-users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (pendingResponse.data.success) {
                    console.log(`✅ Found ${pendingResponse.data.users.length} pending users`);
                    pendingResponse.data.users.forEach(user => {
                        console.log(`   - ${user.fullName} (${user.email}) - ${user.role} - Created: ${user.createdAt}`);
                    });
                } else {
                    console.log('❌ Failed to get pending users');
                }
            } else {
                console.log('❌ Admin login failed');
            }
        } catch (adminError) {
            console.log('❌ Admin login error:', adminError.response?.data?.error || adminError.message);
        }

        // Try to login as cashier
        console.log('\n2. Testing cashier login...');
        try {
            const cashierResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'cashier@toollink.com',
                password: 'cashier123'
            });

            if (cashierResponse.data.success) {
                console.log('✅ Cashier user exists and can login');
                console.log(`👤 Cashier: ${cashierResponse.data.user.fullName}`);
                console.log(`📧 Email: ${cashierResponse.data.user.email}`);
                console.log(`🔑 Role: ${cashierResponse.data.user.role}`);
                console.log(`🔓 Approved: ${cashierResponse.data.user.isApproved}`);
            } else {
                console.log('❌ Cashier login failed');
            }
        } catch (cashierError) {
            console.log('❌ Cashier login error:', cashierError.response?.data?.error || cashierError.message);
        }

    } catch (error) {
        console.log('❌ General Error:', error.message);
    }
}

checkUsers();
