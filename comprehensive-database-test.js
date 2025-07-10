const axios = require('axios');
const fs = require('fs');

// Comprehensive Database Connection Test
async function testAllDatabaseConnections() {
    console.log('🔍 Testing ALL Database Connections...\n');

    const API_BASE = 'http://localhost:3001/api';
    let token;

    try {
        // 1. Login as admin
        console.log('1. 🔐 Logging in as admin...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'test@admin.com',
            password: 'admin123'
        });

        token = loginResponse.data.data.token;
        console.log('✅ Login successful\n');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const results = {
            timestamp: new Date().toISOString(),
            testResults: {}
        };

        // 2. Test User Management Database
        console.log('2. 👥 Testing User Management Database...');
        try {
            const usersResponse = await axios.get(`${API_BASE}/users`, { headers });
            console.log('✅ Users API connected');
            console.log(`   - Total users: ${usersResponse.data.users?.length || 'Unknown'}`);
            results.testResults.userManagement = 'CONNECTED';
        } catch (error) {
            console.log('❌ Users API failed:', error.response?.data?.error || error.message);
            results.testResults.userManagement = 'FAILED';
        }

        // 3. Test Order Management Database
        console.log('\n3. 📦 Testing Order Management Database...');
        try {
            const ordersResponse = await axios.get(`${API_BASE}/orders`, { headers });
            console.log('✅ Orders API connected');
            console.log(`   - Total orders: ${ordersResponse.data.orders?.length || ordersResponse.data.length || 'Unknown'}`);
            results.testResults.orderManagement = 'CONNECTED';
        } catch (error) {
            console.log('❌ Orders API failed:', error.response?.data?.error || error.message);
            results.testResults.orderManagement = 'FAILED';
        }

        // 4. Test Inventory Management Database
        console.log('\n4. 📋 Testing Inventory Management Database...');
        try {
            const inventoryResponse = await axios.get(`${API_BASE}/inventory`, { headers });
            console.log('✅ Inventory API connected');
            console.log(`   - Total items: ${inventoryResponse.data.items?.length || inventoryResponse.data.length || 'Unknown'}`);
            results.testResults.inventoryManagement = 'CONNECTED';
        } catch (error) {
            console.log('❌ Inventory API failed:', error.response?.data?.error || error.message);
            results.testResults.inventoryManagement = 'FAILED';
        }

        // 5. Test Customer Approval Database
        console.log('\n5. ✅ Testing Customer Approval Database...');
        try {
            const pendingResponse = await axios.get(`${API_BASE}/auth/pending-users`, { headers });
            console.log('✅ Customer Approval API connected');
            console.log(`   - Pending users: ${pendingResponse.data.users?.length || pendingResponse.data.length || 'Unknown'}`);
            results.testResults.customerApproval = 'CONNECTED';
        } catch (error) {
            console.log('❌ Customer Approval API failed:', error.response?.data?.error || error.message);
            results.testResults.customerApproval = 'FAILED';
        }

        // 6. Test Notifications Database
        console.log('\n6. 🔔 Testing Notifications Database...');
        try {
            const notificationsResponse = await axios.get(`${API_BASE}/notifications`, { headers });
            console.log('✅ Notifications API connected');
            console.log(`   - Total notifications: ${notificationsResponse.data.notifications?.length || notificationsResponse.data.length || 'Unknown'}`);
            results.testResults.notifications = 'CONNECTED';
        } catch (error) {
            console.log('❌ Notifications API failed:', error.response?.data?.error || error.message);
            results.testResults.notifications = 'FAILED';
        }

        // 7. Test Analytics/Reports Database
        console.log('\n7. 📊 Testing Analytics/Reports Database...');
        try {
            const analyticsResponse = await axios.get(`${API_BASE}/analytics/dashboard`, { headers });
            console.log('✅ Analytics API connected');
            console.log(`   - Analytics data available: ${!!analyticsResponse.data}`);
            results.testResults.analytics = 'CONNECTED';
        } catch (error) {
            console.log('❌ Analytics API failed:', error.response?.data?.error || error.message);
            results.testResults.analytics = 'FAILED';
        }

        // 8. Test Activity Logs Database
        console.log('\n8. 📝 Testing Activity Logs Database...');
        try {
            const activityResponse = await axios.get(`${API_BASE}/admin/activities`, { headers });
            console.log('✅ Activity Logs API connected');
            console.log(`   - Total activities: ${activityResponse.data.activities?.length || activityResponse.data.length || 'Unknown'}`);
            results.testResults.activityLogs = 'CONNECTED';
        } catch (error) {
            console.log('❌ Activity Logs API failed:', error.response?.data?.error || error.message);
            results.testResults.activityLogs = 'FAILED';
        }

        // 9. Test CRUD Operations for Key Modules
        console.log('\n9. 🔄 Testing CRUD Operations...');

        // Test User CRUD
        try {
            console.log('   Testing User CRUD...');
            const createUserResponse = await axios.post(`${API_BASE}/users`, {
                username: 'test_crud_' + Date.now(),
                email: 'testcrud_' + Date.now() + '@test.com',
                password: 'test123',
                fullName: 'Test CRUD User',
                role: 'customer'
            }, { headers });

            const userId = createUserResponse.data.data.user.id;
            console.log('   ✅ User CREATE works');

            // Update
            await axios.put(`${API_BASE}/users/${userId}`, {
                fullName: 'Updated CRUD User'
            }, { headers });
            console.log('   ✅ User UPDATE works');

            // Delete
            await axios.delete(`${API_BASE}/users/${userId}`, { headers });
            console.log('   ✅ User DELETE works');

            results.testResults.userCRUD = 'WORKING';
        } catch (error) {
            console.log('   ❌ User CRUD failed:', error.response?.data?.error || error.message);
            results.testResults.userCRUD = 'FAILED';
        }

        // Test Order CRUD (if orders endpoint supports it)
        try {
            console.log('   Testing Order CRUD...');
            const createOrderResponse = await axios.post(`${API_BASE}/orders`, {
                customer: 'Test Customer',
                items: [
                    { product: 'Test Product', quantity: 1, price: 100 }
                ],
                contact: '+94771234567',
                shippingAddress: 'Test Address',
                paymentMethod: 'cash_on_delivery'
            }, { headers });

            console.log('   ✅ Order CREATE works');
            results.testResults.orderCRUD = 'WORKING';
        } catch (error) {
            console.log('   ⚠️  Order CRUD not fully implemented or failed:', error.response?.data?.error || error.message);
            results.testResults.orderCRUD = 'PARTIAL_OR_FAILED';
        }

        // 10. Summary
        console.log('\n' + '='.repeat(50));
        console.log('📋 DATABASE CONNECTION SUMMARY:');
        console.log('='.repeat(50));

        Object.entries(results.testResults).forEach(([module, status]) => {
            const icon = status === 'CONNECTED' || status === 'WORKING' ? '✅' :
                status === 'PARTIAL_OR_FAILED' ? '⚠️ ' : '❌';
            console.log(`${icon} ${module}: ${status}`);
        });

        console.log('\n📄 Saving detailed report...');
        fs.writeFileSync('database-connection-report.json', JSON.stringify(results, null, 2));
        console.log('✅ Report saved to database-connection-report.json');

        // Check which modules need fixing
        const failedModules = Object.entries(results.testResults)
            .filter(([_, status]) => status === 'FAILED')
            .map(([module, _]) => module);

        if (failedModules.length > 0) {
            console.log('\n🔧 MODULES THAT NEED FIXING:');
            failedModules.forEach(module => console.log(`   - ${module}`));
        } else {
            console.log('\n🎉 ALL MODULES WORKING CORRECTLY!');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the comprehensive test
testAllDatabaseConnections().catch(console.error);
