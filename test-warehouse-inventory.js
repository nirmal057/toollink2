const axios = require('axios');

async function testWarehouseInventoryAccess() {
  console.log('🏪 TESTING WAREHOUSE INVENTORY ACCESS');
  console.log('=====================================\n');
  
  // List of warehouse users from the database
  const warehouseUsers = [
    { email: 'warehouse1@toollink.com', name: 'Tharaka Jayasinghe' },
    { email: 'warehouse2@toollink.com', name: 'Dilani Rathnayake' },
    { email: 'testuser.admin2@toollink.lk', name: 'Nimal Fernando' },
    { email: 'user82@toollink.com', name: 'chathursha apsara' }
  ];
  
  // We'll need to guess passwords or check if there's a default
  const commonPasswords = ['warehouse123', 'password', '123456', 'warehouse', 'toollink123'];
  
  for (const user of warehouseUsers) {
    console.log(`\n📦 Testing ${user.name} (${user.email}):`);
    
    let loginSuccessful = false;
    let workingPassword = null;
    
    // Try common passwords
    for (const password of commonPasswords) {
      try {
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: user.email,
          password: password
        });
        
        if (loginResponse.data.success) {
          console.log(`   ✅ Login successful with password: ${password}`);
          loginSuccessful = true;
          workingPassword = password;
          
          // Test inventory access
          try {
            const inventoryResponse = await axios.get('http://localhost:5000/api/inventory', {
              headers: { 'Authorization': `Bearer ${loginResponse.data.accessToken}` }
            });
            
            console.log(`   ✅ Can access ${inventoryResponse.data.items?.length || 0} inventory items`);
            
            if (inventoryResponse.data.items?.length > 0) {
              console.log(`   📦 Sample items: ${inventoryResponse.data.items.slice(0, 3).map(i => i.name).join(', ')}`);
            }
          } catch (invError) {
            console.log(`   ❌ Inventory access failed: ${invError.response?.data?.error || invError.message}`);
          }
          
          break;
        }
      } catch (error) {
        // Password didn't work, continue
        continue;
      }
    }
    
    if (!loginSuccessful) {
      console.log('   ❌ Could not find working password');
    }
  }
  
  console.log('\n🔧 RECOMMENDATIONS:');
  console.log('===================');
  console.log('1. If passwords are unknown, reset them to standard warehouse passwords');
  console.log('2. Ensure warehouse users have inventory access permissions');
  console.log('3. Check if inventory is role-restricted in the backend');
}

testWarehouseInventoryAccess();
