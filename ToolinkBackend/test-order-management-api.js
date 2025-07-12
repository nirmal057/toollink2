import fetch from 'node-fetch';

async function testOrderManagement() {
    const baseUrl = 'http://localhost:3000/api';

    try {
        console.log('🔐 Testing authentication...');

        // 1. Login to get token
        const loginResponse = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.accessToken;
        console.log('✅ Authentication successful');

        // 2. Test fetching inventory
        console.log('\n📦 Testing inventory fetch...');
        const inventoryResponse = await fetch(`${baseUrl}/inventory?limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!inventoryResponse.ok) {
            throw new Error(`Inventory fetch failed: ${inventoryResponse.status}`);
        }

        const inventoryData = await inventoryResponse.json();
        console.log('✅ Inventory fetch successful');
        console.log(`Found ${inventoryData.data?.items?.length || 0} inventory items`);

        if (inventoryData.data?.items?.length > 0) {
            console.log('Sample inventory items:');
            inventoryData.data.items.slice(0, 3).forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.name} (${item.current_stock} ${item.unit}) - Rs. ${item.selling_price}`);
            });
        }

        // 3. Test fetching orders
        console.log('\n📋 Testing orders fetch...');
        const ordersResponse = await fetch(`${baseUrl}/orders?limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!ordersResponse.ok) {
            throw new Error(`Orders fetch failed: ${ordersResponse.status}`);
        }

        const ordersData = await ordersResponse.json();
        console.log('✅ Orders fetch successful');
        console.log(`Found ${ordersData.data?.length || 0} orders`);

        // 4. Test creating an order
        if (inventoryData.data?.items?.length > 0) {
            console.log('\n🛒 Testing order creation...');

            const firstItem = inventoryData.data.items[0];
            const orderPayload = {
                items: [{
                    inventory: firstItem._id,
                    quantity: 2,
                    unitPrice: firstItem.selling_price,
                    totalPrice: 2 * firstItem.selling_price,
                    notes: 'Test order item'
                }],
                shippingAddress: {
                    street: '123 Test Street',
                    city: 'Colombo',
                    state: 'Western Province',
                    zipCode: '10100',
                    phone: '+94771234567'
                },
                notes: 'This is a test order from order management testing'
            };

            const createOrderResponse = await fetch(`${baseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload)
            });

            const createOrderData = await createOrderResponse.json();

            if (createOrderResponse.ok) {
                console.log('✅ Order created successfully!');
                console.log(`Order ID: ${createOrderData.data?.orderNumber || createOrderData.data?._id}`);
                console.log(`Total Amount: Rs. ${createOrderData.data?.finalAmount || createOrderData.data?.totalAmount}`);
            } else {
                console.log('❌ Order creation failed:');
                console.log(`Status: ${createOrderResponse.status}`);
                console.log(`Error: ${createOrderData.error}`);
                if (createOrderData.details) {
                    console.log('Validation errors:', createOrderData.details);
                }
            }
        }

        console.log('\n🎉 Order Management API testing completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testOrderManagement();
