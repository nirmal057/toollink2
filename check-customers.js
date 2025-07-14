// Check customers via API
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

const adminUser = {
    email: 'admin@toollink.com',
    password: 'admin123'
};

async function login() {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminUser)
        });

        const data = await response.json();
        if (data.success) {
            authToken = data.accessToken;
            console.log('✅ Login successful');
            return true;
        }
        return false;
    } catch (error) {
        console.log('❌ Login error:', error.message);
        return false;
    }
}

async function checkCustomers() {
    try {
        const response = await fetch(`${BASE_URL}/api/customers`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('📊 Customers API Response:');
        console.log('   Success:', data.success);
        if (data.success) {
            console.log('   Total Customers:', data.data ? data.data.length : 0);
            if (data.data && data.data.length > 0) {
                data.data.forEach((customer, index) => {
                    console.log(`   ${index + 1}. ${customer.fullName} (${customer.email})`);
                });
            }
        } else {
            console.log('   Error:', data.error);
        }
        return data;
    } catch (error) {
        console.log('❌ Error fetching customers:', error.message);
        return null;
    }
}

async function checkUsers() {
    try {
        const response = await fetch(`${BASE_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('\n📊 Users API Response:');
        console.log('   Success:', data.success);
        if (data.success) {
            console.log('   Total Users:', data.data ? data.data.length : 0);
            if (data.data && data.data.length > 0) {
                data.data.forEach((user, index) => {
                    console.log(`   ${index + 1}. ${user.fullName} (${user.email}) - Role: ${user.role}`);
                });
            }
        } else {
            console.log('   Error:', data.error);
        }
        return data;
    } catch (error) {
        console.log('❌ Error fetching users:', error.message);
        return null;
    }
}

async function main() {
    console.log('🔍 Checking Customers and Users\n');

    if (!await login()) return;

    await checkCustomers();
    await checkUsers();
}

main().catch(console.error);
