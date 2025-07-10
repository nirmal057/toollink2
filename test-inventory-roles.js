const axios = require('axios');

async function checkInventoryForAllRoles() {
  try {
    console.log('🔍 CHECKING INVENTORY ACCESS FOR ALL USER ROLES');
    console.log('==============================================\n');
    
    // Test Admin access
    console.log('👑 Testing ADMIN Portal Access:');
    try {
      const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@toollink.com',
        password: 'admin123'
      });
      
      if (adminLogin.data.success) {
        console.log('   ✅ Admin login successful');
        const adminInventory = await axios.get('http://localhost:5000/api/inventory', {
          headers: { 'Authorization': `Bearer ${adminLogin.data.accessToken}` }
        });
        console.log(`   ✅ Admin can access ${adminInventory.data.items?.length || 0} inventory items`);
        
        if (adminInventory.data.items?.length > 0) {
          console.log(`   📦 Sample items: ${adminInventory.data.items.slice(0, 3).map(i => i.name).join(', ')}`);
        }
      }
    } catch (error) {
      console.log('   ❌ Admin access failed:', error.response?.data?.error || error.message);
    }
    
    // Test Warehouse access
    console.log('\n📦 Testing WAREHOUSE Portal Access:');
    try {
      const warehouseLogin = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'warehouse1@toollink.com', 
        password: 'warehouse123'
      });
      
      if (warehouseLogin.data.success) {
        console.log('   ✅ Warehouse login successful');
        const warehouseInventory = await axios.get('http://localhost:5000/api/inventory', {
          headers: { 'Authorization': `Bearer ${warehouseLogin.data.accessToken}` }
        });
        console.log(`   ✅ Warehouse can access ${warehouseInventory.data.items?.length || 0} inventory items`);
        
        if (warehouseInventory.data.items?.length > 0) {
          console.log(`   📦 Sample items: ${warehouseInventory.data.items.slice(0, 3).map(i => i.name).join(', ')}`);
        }
      }
    } catch (error) {
      console.log('   ❌ Warehouse access failed:', error.response?.data?.error || error.message);
    }
    
    // Check if warehouse user exists
    console.log('\n🔍 Checking available users in system:');
    try {
      const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@toollink.com',
        password: 'admin123'
      });
      
      if (adminLogin.data.success) {
        // Try to get users endpoint if it exists
        try {
          const users = await axios.get('http://localhost:5000/api/users', {
            headers: { 'Authorization': `Bearer ${adminLogin.data.accessToken}` }
          });
          console.log('   Available users:');
          users.data.users?.forEach(user => {
            console.log(`   - ${user.email} (${user.role})`);
          });
        } catch (error) {
          console.log('   ⚠️  Cannot fetch users list - endpoint may not exist');
        }
      }
    } catch (error) {
      console.log('   ❌ Cannot check users');
    }
    
  } catch (error) {
    console.error('Overall test failed:', error.message);
  }
}

checkInventoryForAllRoles();
