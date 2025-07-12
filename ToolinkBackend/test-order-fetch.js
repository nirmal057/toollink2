import fetch from 'node-fetch';

async function testOrderFetch() {
    console.log('🔄 Testing Order Fetch API...\n');

    try {
        // Step 1: Login as admin
        console.log('👤 Step 1: Admin Login...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();

        if (!loginData.success) {
            throw new Error('Admin login failed: ' + loginData.message);
        }

        console.log('✅ Admin logged in successfully');
        const token = loginData.token;

        // Step 2: Fetch orders
        console.log('\n📋 Step 2: Fetching all orders...');
        const ordersResponse = await fetch('http://localhost:3000/api/orders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        const ordersData = await ordersResponse.json();

        if (!ordersData.success) {
            throw new Error('Orders fetch failed: ' + ordersData.message);
        }

        console.log('✅ Orders fetched successfully');
        console.log(`📊 Total orders found: ${ordersData.data.length}`);

        // Display order details
        if (ordersData.data.length > 0) {
            console.log('\n📋 Order Details:');
            ordersData.data.forEach((order, index) => {
                console.log(`\nOrder ${index + 1}:`);
                console.log(`   - Order Number: ${order.orderNumber}`);
                console.log(`   - Status: ${order.status}`);
                console.log(`   - Customer: ${order.customer?.fullName || 'Unknown'}`);
                console.log(`   - Items: ${order.items?.length || 0} items`);
                console.log(`   - Total Amount: Rs. ${order.totalAmount || 0}`);
                console.log(`   - Created: ${new Date(order.createdAt).toLocaleString()}`);

                if (order.items && order.items.length > 0) {
                    console.log('   - Order Items:');
                    order.items.forEach((item, idx) => {
                        console.log(`     ${idx + 1}. ${item.inventoryItem?.itemName || 'Unknown Item'} - Qty: ${item.quantity}`);
                    });
                }
            });
        } else {
            console.log('⚠️ No orders found in database');
        }

        // Step 3: Test inventory fetch (for order creation)
        console.log('\n🏪 Step 3: Fetching inventory for order creation...');
        const inventoryResponse = await fetch('http://localhost:3000/api/inventory', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        const inventoryData = await inventoryResponse.json();

        if (!inventoryData.success) {
            throw new Error('Inventory fetch failed: ' + inventoryData.message);
        }

        console.log('✅ Inventory fetched successfully');
        console.log(`📦 Total inventory items: ${inventoryData.data.length}`);

        console.log('\n🎉 All API endpoints working correctly!');
        console.log('\n🌐 Frontend URLs to test:');
        console.log('   Admin Panel: http://localhost:5173/admin');
        console.log('   Order Management: http://localhost:5173/admin (click on Orders)');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testOrderFetch();
