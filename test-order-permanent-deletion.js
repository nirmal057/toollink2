// Test Order Permanent Deletion
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testOrderId = '';

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

async function getInventory() {
    try {
        const response = await fetch(`${BASE_URL}/api/inventory`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success && (data.data || data.items)) {
            const inventory = data.items || data.data.items || data.data;
            return inventory;
        } else {
            console.log('❌ Failed to get inventory:', data.error);
            return [];
        }
    } catch (error) {
        console.log('❌ Get inventory error:', error.message);
        return [];
    }
}

async function createTestOrder(inventory) {
    if (inventory.length === 0) {
        console.log('❌ No inventory available for testing');
        return false;
    }

    const firstItem = inventory[0];
    const orderQuantity = 2; // Small order for testing

    const orderData = {
        items: [
            {
                inventory: firstItem._id,
                quantity: orderQuantity,
                unitPrice: firstItem.selling_price || firstItem.cost || 100
            }
        ],
        shippingAddress: {
            street: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'Test Country'
        },
        delivery: {
            type: 'standard',
            expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        notes: 'Test order for permanent deletion verification'
    };

    try {
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
            testOrderId = data.data._id;
            console.log('✅ Test order created:');
            console.log(`   Order ID: ${testOrderId}`);
            console.log(`   Order Number: ${data.data.orderNumber}`);
            console.log(`   Status: ${data.data.status}`);
            return true;
        } else {
            console.log('❌ Order creation failed:', data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Create order error:', error.message);
        return false;
    }
}

async function verifyOrderExists() {
    try {
        const response = await fetch(`${BASE_URL}/api/orders/${testOrderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            const data = await response.json();
            if (data.success) {
                console.log('✅ Order exists in database before deletion');
                return true;
            }
        }

        console.log('❌ Order not found before deletion');
        return false;
    } catch (error) {
        console.log('❌ Error checking order existence:', error.message);
        return false;
    }
}

async function deleteOrder() {
    try {
        const response = await fetch(`${BASE_URL}/api/orders/${testOrderId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            console.log('✅ Order deletion API call successful:');
            console.log(`   Message: ${data.message}`);
            console.log(`   Deleted At: ${data.data.deletedAt}`);
            return true;
        } else {
            console.log('❌ Order deletion failed:', data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Delete order error:', error.message);
        return false;
    }
}

async function verifyOrderDeleted() {
    try {
        const response = await fetch(`${BASE_URL}/api/orders/${testOrderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 404) {
            console.log('✅ Order confirmed PERMANENTLY DELETED from database');
            return true;
        } else if (response.status === 200) {
            const data = await response.json();
            if (data.success && data.data) {
                console.log('❌ Order still exists in database after deletion');
                console.log('   Order data:', JSON.stringify(data.data, null, 2));
                return false;
            }
        }

        console.log('❌ Unexpected response when checking deleted order');
        return false;
    } catch (error) {
        console.log('❌ Error verifying order deletion:', error.message);
        return false;
    }
}

async function getAllOrders() {
    try {
        const response = await fetch(`${BASE_URL}/api/orders?limit=50`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            console.log('📊 Current orders in database:');
            console.log(`   Total Orders: ${data.pagination.total}`);

            // Check if our test order is in the list
            const deletedOrderFound = data.data.find(order => order._id === testOrderId);
            if (deletedOrderFound) {
                console.log('❌ DELETED ORDER STILL FOUND IN LIST!');
                console.log('   Found order:', deletedOrderFound);
                return false;
            } else {
                console.log('✅ Deleted order NOT found in orders list - permanent deletion confirmed');
                return true;
            }
        } else {
            console.log('❌ Failed to get orders:', data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Get orders error:', error.message);
        return false;
    }
}

async function runDeletionTest() {
    console.log('🗑️  Testing PERMANENT Order Deletion\n');

    console.log('1. Testing authentication...');
    if (!await login()) return;
    console.log();

    console.log('2. Getting inventory for test order...');
    const inventory = await getInventory();
    if (inventory.length === 0) return;
    console.log();

    console.log('3. Creating test order...');
    if (!await createTestOrder(inventory)) return;
    console.log();

    console.log('4. Verifying order exists before deletion...');
    if (!await verifyOrderExists()) return;
    console.log();

    console.log('5. Deleting order...');
    if (!await deleteOrder()) return;
    console.log();

    console.log('6. Verifying order is permanently deleted...');
    await verifyOrderDeleted();
    console.log();

    console.log('7. Checking orders list to confirm deletion...');
    await getAllOrders();
    console.log();

    console.log('🎯 PERMANENT DELETION TEST COMPLETED!');
}

// Run the test
runDeletionTest().catch(error => {
    console.error('❌ Test execution failed:', error);
});
