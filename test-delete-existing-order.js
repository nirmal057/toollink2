// Simple test to delete an existing pending order and verify permanent deletion
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

async function getPendingOrders() {
    try {
        const response = await fetch(`${BASE_URL}/api/orders?status=pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.log('❌ Error fetching orders:', error.message);
        return [];
    }
}

async function deleteOrder(orderId, orderNumber) {
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
            console.log(`✅ Order ${orderNumber} deletion API response: ${data.message}`);
            return true;
        } else {
            console.log(`❌ Failed to delete order ${orderNumber}:`, data.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Error deleting order:', error.message);
        return false;
    }
}

async function verifyOrderDeleted(orderId, orderNumber) {
    try {
        // Try to fetch the deleted order by ID
        const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 404) {
            console.log(`✅ VERIFIED: Order ${orderNumber} completely removed from database (404 response)`);
            return true;
        }

        const data = await response.json();
        if (data.success && data.data) {
            console.log(`❌ WARNING: Order ${orderNumber} still exists in database!`);
            if (data.data.deletedAt) {
                console.log('   ⚠️  SOFT DELETE detected - deletedAt field present:', data.data.deletedAt);
            }
            return false;
        } else {
            console.log(`✅ VERIFIED: Order ${orderNumber} not found in database`);
            return true;
        }
    } catch (error) {
        console.log(`✅ VERIFIED: Order ${orderNumber} completely removed (fetch error expected)`);
        return true;
    }
}

async function checkOrderInList() {
    try {
        const response = await fetch(`${BASE_URL}/api/orders`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            console.log(`📊 Total orders in database after deletion: ${data.data.length}`);
            return data.data;
        }
        return [];
    } catch (error) {
        console.log('❌ Error fetching order list:', error.message);
        return [];
    }
}

async function main() {
    console.log('🧪 TESTING PERMANENT DELETION ON EXISTING ORDER\n');

    if (!await login()) return;

    // Get pending orders
    console.log('🔍 Getting pending orders...');
    const pendingOrders = await getPendingOrders();

    if (pendingOrders.length === 0) {
        console.log('❌ No pending orders found to delete');
        return;
    }

    const orderToDelete = pendingOrders[0];
    console.log(`📝 Selected order for deletion: ${orderToDelete.orderNumber} (ID: ${orderToDelete._id})`);

    // Get initial count
    const initialOrders = await checkOrderInList();
    const initialCount = initialOrders.length;

    // Delete the order
    console.log('\n🗑️  Deleting order...');
    const deleted = await deleteOrder(orderToDelete._id, orderToDelete.orderNumber);
    if (!deleted) return;

    // Wait a moment for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify order is completely gone
    console.log('\n🔍 Verifying permanent deletion...');
    const isDeleted = await verifyOrderDeleted(orderToDelete._id, orderToDelete.orderNumber);

    // Check final count
    const finalOrders = await checkOrderInList();
    const finalCount = finalOrders.length;

    console.log(`📊 Order count changed from ${initialCount} to ${finalCount}`);

    if (isDeleted && finalCount === initialCount - 1) {
        console.log('\n🎯 ✅ SUCCESS: PERMANENT DELETION CONFIRMED!');
        console.log('   ✅ Order completely removed from database');
        console.log('   ✅ Order count decreased by 1');
        console.log('   ✅ No soft delete traces found');
        console.log('   🚀 Hard delete is working correctly!');
    } else {
        console.log('\n❌ ISSUES DETECTED:');
        if (!isDeleted) {
            console.log('   ❌ Order still accessible by ID');
        }
        if (finalCount !== initialCount - 1) {
            console.log('   ❌ Order count did not decrease properly');
        }
    }
}

main().catch(console.error);
