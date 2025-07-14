// Test Create, Delete, and Verify Order Removal
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
        }
        return false;
    } catch (error) {
        console.log('❌ Login error:', error.message);
        return false;
    }
}

async function getOrderCount() {
    try {
        const response = await fetch(`${BASE_URL}/api/orders`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return data.success ? data.data.length : 0;
    } catch (error) {
        console.log('❌ Error getting order count:', error.message);
        return 0;
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

        if (!usersData.success || usersData.data.length === 0) {
            console.log('❌ No users found');
            return null;
        }

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

        if (!inventoryData.success || !inventoryData.items || inventoryData.items.length === 0) {
            console.log('❌ No inventory found');
            return null;
        }

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
            console.log(`✅ Order deleted: ${data.message}`);
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

async function main() {
    console.log('🧪 TESTING CREATE → DELETE → VERIFY REMOVAL\n');

    if (!await login()) return;

    // Check initial count
    const initialCount = await getOrderCount();
    console.log(`📊 Initial order count: ${initialCount}`);

    // Create test order
    console.log('\n🔹 Creating test order...');
    const order = await createTestOrder();
    if (!order) return;

    // Check count after creation
    const afterCreateCount = await getOrderCount();
    console.log(`📊 Order count after creation: ${afterCreateCount}`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Delete the order
    console.log('\n🗑️  Deleting test order...');
    const deleted = await deleteOrder(order._id);
    if (!deleted) return;

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check final count
    const finalCount = await getOrderCount();
    console.log(`📊 Final order count: ${finalCount}`);

    // Verify removal
    if (finalCount === initialCount) {
        console.log('\n🎯 ✅ SUCCESS: Order was permanently deleted!');
        console.log('   The order count returned to the initial value.');
    } else {
        console.log('\n❌ ISSUE: Order count did not return to initial value.');
        console.log(`   Expected: ${initialCount}, Got: ${finalCount}`);
    }
}

main().catch(console.error);
