const axios = require('axios');

async function simpleInventoryTest() {
  console.log('🔍 SIMPLE INVENTORY API TEST');
  console.log('===========================\n');
  
  try {
    // Test 1: Check if backend is running
    console.log('1. Testing backend health...');
    const healthCheck = await axios.get('http://localhost:5000/api/health');
    console.log('   ✅ Backend is running');
    console.log(`   📊 Status: ${healthCheck.data.status}`);
    console.log(`   💾 Database: ${healthCheck.data.database}`);
    
    // Test 2: Try admin login
    console.log('\n2. Testing admin login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@toollink.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('   ✅ Admin login successful');
      const token = loginResponse.data.accessToken;
      
      // Test 3: Get inventory
      console.log('\n3. Testing inventory API...');
      const inventoryResponse = await axios.get('http://localhost:5000/api/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (inventoryResponse.data.success) {
        const items = inventoryResponse.data.items;
        console.log(`   ✅ Inventory API working - ${items.length} items found`);
        
        if (items.length > 0) {
          console.log('\n4. Sample inventory items:');
          items.slice(0, 5).forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.name}`);
            console.log(`      Category: ${item.category}`);
            console.log(`      Stock: ${item.stock?.currentQuantity || 0} ${item.stock?.unit || 'units'}`);
            console.log(`      Price: LKR ${item.pricing?.sellingPrice || 0}`);
            console.log('');
          });
          
          console.log('✅ BACKEND IS WORKING CORRECTLY');
          console.log('❓ Issue might be in frontend-backend communication');
          console.log('\n📝 Next steps:');
          console.log('1. Open: http://localhost:5173');
          console.log('2. Open Developer Tools (F12)');
          console.log('3. Check Console and Network tabs for errors');
          console.log('4. Login as: admin@toollink.com / admin123');
          console.log('5. Go to Inventory Management page');
          
        } else {
          console.log('   ❌ No inventory items found in database');
        }
      } else {
        console.log(`   ❌ Inventory API failed: ${inventoryResponse.data.error}`);
      }
    } else {
      console.log(`   ❌ Login failed: ${loginResponse.data.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend is not running or not accessible');
      console.log('   Check if backend server is running on port 5000');
    } else if (error.response?.status === 429) {
      console.log('\n⏳ Rate limit hit - wait a few minutes and try again');
    } else {
      console.log(`\n🔍 Error details: ${error.response?.data?.error || error.message}`);
    }
  }
}

simpleInventoryTest();
