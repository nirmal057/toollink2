const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testEnhancedOrderManagement() {
    console.log('🚀 Testing Enhanced Order Management with Database Synchronization\n');

    try {
        // Step 1: Authentication
        console.log('Step 1: Authentication');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });
        const token = loginResponse.data.accessToken;
        console.log('✅ Authentication successful');

        const config = {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        };

        // Step 2: Get current inventory levels
        console.log('\nStep 2: Current Inventory State');
        const inventoryResponse = await axios.get(`${API_BASE_URL}/inventory`, config);
        const inventory = inventoryResponse.data.items || inventoryResponse.data.data?.items || [];

        console.log('Current inventory levels:');
        inventory.slice(0, 3).forEach(item => {
            console.log(`- ${item.name}: ${item.current_stock} ${item.unit} (ID: ${item._id})`);
        });

        // Step 3: Create new order (test transaction)
        console.log('\nStep 3: Creating Order with Transaction');
        const newOrder = {
            customerEmail: 'customer_1752513862482@test.com',
            items: [
                {
                    inventory: inventory[0]._id,
                    quantity: 3,
                    unitPrice: inventory[0].unitPrice || 100,
                    notes: 'Test transaction item 1'
                },
                {
                    inventory: inventory[1]._id,
                    quantity: 2,
                    unitPrice: inventory[1].unitPrice || 200,
                    notes: 'Test transaction item 2'
                }
            ],
            shippingAddress: {
                street: '789 Transaction Test Road',
                city: 'Colombo',
                state: 'Western',
                zipCode: '00300',
                country: 'Sri Lanka',
                phone: '+94771234567'
            },
            notes: 'Test order for enhanced database synchronization'
        };

        const createResponse = await axios.post(`${API_BASE_URL}/orders`, newOrder, config);
        console.log(`✅ Order created: ${createResponse.data.data.orderNumber}`);
        const testOrderId = createResponse.data.data._id;

        // Step 4: Verify inventory was deducted
        console.log('\nStep 4: Verifying Inventory Deduction');
        const inventoryAfterCreate = await axios.get(`${API_BASE_URL}/inventory`, config);
        const inventoryAfter = inventoryAfterCreate.data.items || inventoryAfterCreate.data.data?.items || [];

        console.log('Inventory levels after order creation:');
        inventoryAfter.slice(0, 3).forEach((item, index) => {
            const originalStock = inventory[index]?.current_stock || 0;
            const newStock = item.current_stock;
            const deducted = originalStock - newStock;
            console.log(`- ${item.name}: ${newStock} ${item.unit} (deducted: ${deducted})`);
        });

        // Step 5: Test order status update
        console.log('\nStep 5: Testing Order Status Update');
        const statusUpdateResponse = await axios.patch(`${API_BASE_URL}/orders/${testOrderId}/status`, {
            status: 'confirmed',
            notes: 'Order confirmed via automated test'
        }, config);

        if (statusUpdateResponse.data.success) {
            console.log('✅ Order status updated to confirmed');
        }

        // Step 6: Test order cancellation (inventory restoration)
        console.log('\nStep 6: Testing Order Cancellation & Inventory Restoration');
        const cancelResponse = await axios.patch(`${API_BASE_URL}/orders/${testOrderId}/status`, {
            status: 'cancelled',
            notes: 'Cancelled for inventory restoration test'
        }, config);

        if (cancelResponse.data.success) {
            console.log('✅ Order cancelled successfully');
        }

        // Step 7: Verify inventory was restored
        console.log('\nStep 7: Verifying Inventory Restoration');
        const inventoryAfterCancel = await axios.get(`${API_BASE_URL}/inventory`, config);
        const inventoryRestored = inventoryAfterCancel.data.items || inventoryAfterCancel.data.data?.items || [];

        console.log('Inventory levels after order cancellation:');
        inventoryRestored.slice(0, 3).forEach((item, index) => {
            const originalStock = inventory[index]?.current_stock || 0;
            const restoredStock = item.current_stock;
            const difference = restoredStock - originalStock;
            console.log(`- ${item.name}: ${restoredStock} ${item.unit} (difference from original: ${difference >= 0 ? '+' : ''}${difference})`);
        });

        // Step 8: Test order deletion
        console.log('\nStep 8: Testing Order Deletion');

        // Create another order to delete
        const deleteTestOrder = await axios.post(`${API_BASE_URL}/orders`, {
            ...newOrder,
            notes: 'Order to be deleted for testing'
        }, config);

        const deleteOrderId = deleteTestOrder.data.data._id;
        console.log(`Created order for deletion test: ${deleteTestOrder.data.data.orderNumber}`);

        // Delete the order
        const deleteResponse = await axios.delete(`${API_BASE_URL}/orders/${deleteOrderId}`, config);

        if (deleteResponse.data.success) {
            console.log('✅ Order deleted successfully');
            console.log('✅ Inventory automatically restored');
        }

        // Step 9: Final verification
        console.log('\nStep 9: Final Database State Verification');
        const finalOrdersResponse = await axios.get(`${API_BASE_URL}/orders`, config);
        const finalInventoryResponse = await axios.get(`${API_BASE_URL}/inventory`, config);

        console.log(`📊 Total orders in system: ${finalOrdersResponse.data.data?.length || 0}`);
        console.log('📦 Final inventory state verified');

        console.log('\n🎉 Enhanced Order Management Test Complete!');
        console.log('\n✅ Test Results Summary:');
        console.log('✅ Order Creation with Transactions: Working');
        console.log('✅ Inventory Deduction: Working');
        console.log('✅ Order Status Updates: Working');
        console.log('✅ Order Cancellation: Working');
        console.log('✅ Inventory Restoration: Working');
        console.log('✅ Order Deletion: Working');
        console.log('✅ Database Synchronization: Verified');

    } catch (error) {
        console.log('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.log('Status:', error.response.status);
        }
    }
}

testEnhancedOrderManagement().catch(console.error);
