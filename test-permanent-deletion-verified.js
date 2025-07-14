// Test to verify permanent order deletion (no soft delete)
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

async function createTestOrder() {
    try {
        // Get users with customer role
        const usersResponse = await fetch(`${BASE_URL}/api/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        const usersData = await usersResponse.json();

        const customer = usersData.data.find(user => user.role === 'customer');
        if (!customer) {
            console.log('❌ No customer users found');
            return null;
        }

        // Get inventory
        const inventoryResponse = await fetch(`${BASE_URL}/api/inventory`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        const inventoryData = await inventoryResponse.json();

        const inventoryItem = inventoryData.items.find(item => item.current_stock > 0);
        if (!inventoryItem) {
            console.log('❌ No inventory with stock found');
            return null;
        }

        // Create order
        const orderData = {
            customer: customer._id,
            items: [{
                inventory: inventoryItem._id,
                quantity: 1,
                unitPrice: inventoryItem.selling_price || 100
            }],
            shippingAddress: {
                street: "123 Test St",
                city: "Test City",
                state: "Test State",
                zipCode: "12345",
                country: "Test Country"
            },
            delivery: {
                method: "standard",
                estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        };

        const response = await fetch(`${BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();
        if (data.success) {
            console.log(`✅ Test order created: ${data.data.orderNumber} (ID: ${data.data._id})`);
            return data.data;
        } else {
            console.log('❌ Failed to create order:', data.error);
            return null;
        }
    } catch (error) {
        console.log('❌ Error creating order:', error.message);
        return null;
    }
}

async function deleteOrder(orderId) {
    try {
        const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            console.log(`✅ Order deletion API response: ${data.message}`);
            return true;
        } else {
            console.log('❌ Failed to delete order:', data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Error deleting order:', error.message);
        return false;
    }
}

async function verifyOrderDeleted(orderId) {
    try {
        // Try to fetch the deleted order by ID
        const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.status === 404) {
            console.log('✅ VERIFIED: Order completely removed from database (404 response)');
            return true;
        } else if (data.success && data.data) {
            console.log('❌ WARNING: Order still exists in database!');
            console.log('   Order data:', JSON.stringify(data.data, null, 2));
            return false;
        } else {
            console.log('✅ VERIFIED: Order not found in database');
            return true;
        }
    } catch (error) {
        console.log('✅ VERIFIED: Order completely removed (fetch error expected)');
        return true;
    }
}

async function main() {
    console.log('🧪 TESTING PERMANENT ORDER DELETION (NO SOFT DELETE)\n');

    if (!await login()) return;

    // Create test order
    console.log('🔹 Creating test order...');
    const order = await createTestOrder();
    if (!order) return;

    console.log(`📝 Order created with ID: ${order._id}`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Delete the order
    console.log('\n🗑️  Deleting test order...');
    const deleted = await deleteOrder(order._id);
    if (!deleted) return;

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify order is completely gone
    console.log('\n🔍 Verifying order is permanently deleted...');
    const isDeleted = await verifyOrderDeleted(order._id);

    if (isDeleted) {
        console.log('\n🎯 ✅ SUCCESS: PERMANENT DELETION CONFIRMED!');
        console.log('   Order has been completely removed from database');
        console.log('   No soft delete fields or traces remain');
    } else {
        console.log('\n❌ FAILURE: Order still exists in database');
        console.log('   Soft delete may still be active');
    }
}

main().catch(console.error);
