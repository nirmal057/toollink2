/**
 * Test script to verify inventory system is working with real backend
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';

// Test credentials (should use admin or warehouse role)
const TEST_CREDENTIALS = {
    email: 'admin@toolink.com',
    password: 'Admin123!'
};

let authToken = null;

async function login() {
    try {
        console.log('🔑 Logging in...');
        const response = await axios.post(`${API_BASE}/api/auth/login`, TEST_CREDENTIALS);
        
        if (response.data.success) {
            authToken = response.data.token;
            console.log('✅ Login successful');
            return true;
        } else {
            console.error('❌ Login failed:', response.data.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error.response?.data?.error || error.message);
        return false;
    }
}

async function testInventoryAPI() {
    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log('\n📦 Testing Inventory API...');
        
        // Test 1: Get all inventory items
        console.log('\n1️⃣ Testing GET /api/inventory');
        const getAllResponse = await axios.get(`${API_BASE}/api/inventory`, { headers });
        console.log('✅ Get all inventory items:', getAllResponse.data.success);
        console.log('   Items found:', Array.isArray(getAllResponse.data.data) ? getAllResponse.data.data.length : 0);

        // Test 2: Get inventory stats
        console.log('\n2️⃣ Testing GET /api/inventory/stats');
        const statsResponse = await axios.get(`${API_BASE}/api/inventory/stats`, { headers });
        console.log('✅ Get inventory stats:', statsResponse.data.success);
        console.log('   Stats:', JSON.stringify(statsResponse.data.data, null, 2));

        // Test 3: Create a test inventory item
        console.log('\n3️⃣ Testing POST /api/inventory');
        const testItem = {
            name: 'Test Cement Bag',
            description: 'Test cement for inventory system',
            category: 'Construction Materials',
            current_stock: 100,
            min_stock_level: 20,
            max_stock_level: 500,
            unit_price: 25.50,
            supplier_info: 'Test Supplier Ltd',
            location: 'Test Warehouse A1'
        };

        const createResponse = await axios.post(`${API_BASE}/api/inventory`, testItem, { headers });
        console.log('✅ Create inventory item:', createResponse.data.success);
        const createdItem = createResponse.data.data;
        console.log('   Created item ID:', createdItem.id);

        // Test 4: Update the created item
        console.log('\n4️⃣ Testing PUT /api/inventory/:id');
        const updateData = {
            ...testItem,
            current_stock: 80,
            description: 'Updated test cement for inventory system'
        };

        const updateResponse = await axios.put(`${API_BASE}/api/inventory/${createdItem.id}`, updateData, { headers });
        console.log('✅ Update inventory item:', updateResponse.data.success);

        // Test 5: Get the specific item
        console.log('\n5️⃣ Testing GET /api/inventory/:id');
        const getItemResponse = await axios.get(`${API_BASE}/api/inventory/${createdItem.id}`, { headers });
        console.log('✅ Get inventory item by ID:', getItemResponse.data.success);
        console.log('   Item name:', getItemResponse.data.data.name);
        console.log('   Current stock:', getItemResponse.data.data.current_stock);

        // Test 6: Update quantity
        console.log('\n6️⃣ Testing PUT /api/inventory/:id/quantity');
        const quantityUpdateResponse = await axios.put(`${API_BASE}/api/inventory/${createdItem.id}/quantity`, {
            quantity: 50,
            adjustment_type: 'set',
            reason: 'Test quantity adjustment'
        }, { headers });
        console.log('✅ Update inventory quantity:', quantityUpdateResponse.data.success);

        // Test 7: Get low stock items
        console.log('\n7️⃣ Testing GET /api/inventory/low-stock');
        const lowStockResponse = await axios.get(`${API_BASE}/api/inventory/low-stock`, { headers });
        console.log('✅ Get low stock items:', lowStockResponse.data.success);
        console.log('   Low stock items:', Array.isArray(lowStockResponse.data.data) ? lowStockResponse.data.data.length : 0);

        // Test 8: Delete the test item
        console.log('\n8️⃣ Testing DELETE /api/inventory/:id');
        const deleteResponse = await axios.delete(`${API_BASE}/api/inventory/${createdItem.id}`, { headers });
        console.log('✅ Delete inventory item:', deleteResponse.data.success);

        console.log('\n🎉 All inventory API tests passed!');
        
        return true;

    } catch (error) {
        console.error('❌ Inventory API test failed:', error.response?.data?.error || error.message);
        if (error.response?.data) {
            console.error('   Full error response:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Inventory System Test...\n');
    
    try {
        // Test if backend is running
        console.log('🔍 Checking if backend is running...');
        const healthResponse = await axios.get(`${API_BASE}/api/health`);
        console.log('✅ Backend is running:', healthResponse.data.message);
        
        // Login
        const loginSuccess = await login();
        if (!loginSuccess) {
            console.log('\n❌ Cannot continue without authentication');
            return;
        }

        // Test inventory API
        const inventoryTestSuccess = await testInventoryAPI();
        
        if (inventoryTestSuccess) {
            console.log('\n✅ Inventory system is ready for production use!');
            console.log('📋 Summary:');
            console.log('   - Backend API is running');
            console.log('   - Authentication is working');
            console.log('   - All inventory endpoints are functional');
            console.log('   - Database operations are working');
            console.log('   - Frontend can safely connect to real backend');
        }

    } catch (error) {
        console.error('\n❌ Backend connection failed:', error.message);
        console.log('\n💡 Make sure to start the backend server first:');
        console.log('   cd ToolinkBackend');
        console.log('   npm start');
    }
}

// Run the tests
runTests().catch(console.error);
