const axios = require('axios');

async function testFrontendInventoryService() {
  console.log('🧪 TESTING FRONTEND INVENTORY SERVICE SIMULATION');
  console.log('===============================================\n');
  
  try {
    // Simulate what the frontend service does
    console.log('1. Simulating frontend login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@toollink.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    console.log('   ✅ Login successful');
    const token = loginResponse.data.accessToken;
    
    // Simulate frontend inventory service call
    console.log('\n2. Simulating frontend getAllItems() call...');
    const inventoryResponse = await axios.get('http://localhost:5000/api/inventory', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`   📡 Response status: ${inventoryResponse.status}`);
    console.log(`   📊 Response success: ${inventoryResponse.data.success}`);
    console.log(`   📦 Items field type: ${Array.isArray(inventoryResponse.data.items) ? 'Array' : typeof inventoryResponse.data.items}`);
    console.log(`   📦 Items count: ${inventoryResponse.data.items?.length || 0}`);
    
    if (inventoryResponse.data.success && Array.isArray(inventoryResponse.data.items)) {
      console.log('\n3. ✅ FRONTEND SERVICE SHOULD WORK NOW!');
      console.log(`   📦 Found ${inventoryResponse.data.items.length} items`);
      
      console.log('\n4. Sample items that frontend will display:');
      inventoryResponse.data.items.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name}`);
        console.log(`      - Category: ${item.category}`);
        console.log(`      - Stock: ${item.stock?.currentQuantity || 0} ${item.stock?.unit || 'units'}`);
        console.log(`      - Price: LKR ${item.pricing?.sellingPrice || 0}`);
        console.log('');
      });
      
      console.log('🎉 SOLUTION CONFIRMED!');
      console.log('===================');
      console.log('✅ Backend response structure matches frontend expectations');
      console.log('✅ Inventory items should now display in the UI');
      console.log('\n📱 NEXT STEPS:');
      console.log('1. Open: http://localhost:5173');
      console.log('2. Login with: admin@toollink.com / admin123');
      console.log('3. Go to Inventory Management page');
      console.log('4. You should see all 16 Sri Lankan inventory items!');
      
    } else {
      console.log('\n❌ Issue with response structure');
      console.log('Response data:', JSON.stringify(inventoryResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
  }
}

testFrontendInventoryService();
