// Test script to verify the add inventory item functionality
async function testAddInventoryItem() {
  try {
    console.log('🧪 Testing Add Inventory Item Functionality...\n');

    // First, let's get an authentication token
    console.log('1. Attempting to login...');
    
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@toolink.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();

    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.error);
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful');

    // Now test creating a new inventory item
    console.log('\n2. Testing inventory item creation...');
    
    const testItem = {
      name: 'Test Hardware Item',
      category: 'Tools & Equipment',
      description: 'This is a test item created via API',
      sku: 'TEST-' + Date.now(),
      pricing: {
        costPrice: 10.50,
        sellingPrice: 15.00,
        currency: 'LKR'
      },
      stock: {
        currentQuantity: 100,
        minimumQuantity: 10,
        unit: 'pieces'
      },
      location: {
        warehouse: 'Main Shop',
        zone: 'A1'
      },
      supplier: {
        name: 'Test Supplier',
        phone: '+94123456789',
        email: 'supplier@test.com'
      },
      isActive: true
    };

    const createResponse = await fetch('http://localhost:5000/api/inventory', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testItem)
    });

    const createData = await createResponse.json();

    if (createData.success) {
      console.log('✅ Inventory item created successfully!');
      console.log('📦 Item details:');
      console.log(`   - Name: ${createData.item.name}`);
      console.log(`   - SKU: ${createData.item.sku}`);
      console.log(`   - Category: ${createData.item.category}`);
      console.log(`   - Stock: ${createData.item.stock.currentQuantity} ${createData.item.stock.unit}`);
      console.log(`   - Price: ${createData.item.pricing.sellingPrice} ${createData.item.pricing.currency}`);
      console.log(`   - ID: ${createData.item._id}`);
    } else {
      console.error('❌ Failed to create inventory item:', createData.error);
    }

    // Test retrieving the inventory list to verify the item was added
    console.log('\n3. Verifying item appears in inventory list...');
    const listResponse = await fetch('http://localhost:5000/api/inventory', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const listData = await listResponse.json();

    if (listData.success) {
      const items = listData.data;
      const testItemInList = items.find(item => item.sku === testItem.sku);
      
      if (testItemInList) {
        console.log('✅ Test item found in inventory list');
        console.log(`📊 Total inventory items: ${items.length}`);
      } else {
        console.log('❌ Test item not found in inventory list');
      }
    } else {
      console.error('❌ Failed to retrieve inventory list:', listData.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAddInventoryItem();
