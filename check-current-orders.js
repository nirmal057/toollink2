// Quick test to check current orders in database
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

// Test credentials
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
        } else {
            console.log('❌ Login failed:', data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Login error:', error.message);
        return false;
    }
}

async function checkOrders() {
    try {
        const response = await fetch(`${BASE_URL}/api/orders`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            console.log('📊 Current orders in database:');
            console.log(`   Total Orders: ${data.data.length}`);

            if (data.data.length > 0) {
                console.log('\n📋 Order Details:');
                data.data.forEach((order, index) => {
                    console.log(`   ${index + 1}. ID: ${order._id}`);
                    console.log(`      Number: ${order.orderNumber}`);
                    console.log(`      Status: ${order.status}`);
                    console.log(`      Customer: ${order.customer?.fullName || 'Unknown'}`);
                    console.log(`      Total: $${order.totalAmount}`);
                    console.log(`      Created: ${new Date(order.createdAt).toLocaleString()}`);
                    if (order.deletedAt) {
                        console.log(`      ⚠️  DELETED AT: ${new Date(order.deletedAt).toLocaleString()}`);
                    }
                    console.log('');
                });
            }

            return data.data;
        } else {
            console.log('❌ Failed to fetch orders:', data.error);
            return [];
        }
    } catch (error) {
        console.log('❌ Error fetching orders:', error.message);
        return [];
    }
}

async function main() {
    console.log('🔍 Checking Current Orders in Database\n');

    const loginSuccess = await login();
    if (!loginSuccess) {
        return;
    }

    await checkOrders();
}

main().catch(console.error);
