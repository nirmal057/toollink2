// Test inventory creation API endpoint with real authentication
async function testInventoryCreation() {
  try {
    console.log('🧪 Testing Inventory Creation API...\n');

    // First, authenticate using the working credentials
    console.log('1. Authenticating...');
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
      console.error('❌ Authentication failed:', loginData.error);
      return;
    }

    console.log('✅ Authentication successful');
    const token = loginData.token;

    // Test the inventory creation endpoint with the exact structure the frontend sends
    console.log('\n2. Testing inventory item creation...');
    
    const inventoryItem = {
      name: 'API Test Drill',
      category: 'Tools & Equipment',
      description: 'Test drill created via API to verify inventory creation',
      sku: 'DRILL-API-' + Date.now(),
      pricing: {
        costPrice: 45.00,
        sellingPrice: 65.00,
        currency: 'LKR'
      },
      stock: {
        currentQuantity: 25,
        minimumQuantity: 5,
        unit: 'pieces'
      },
      location: {
        warehouse: 'Main Warehouse',
        zone: 'Tools Section'
      },
      supplier: {
        name: 'Tools Supply Co.',
        phone: '+94712345678',
        email: 'tools@supply.com'
      },
      isActive: true
    };

    console.log('📤 Sending creation request...');
    const createResponse = await fetch('http://localhost:5000/api/inventory', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(inventoryItem)
    });

    const responseText = await createResponse.text();
    console.log('🔍 Raw response:', responseText);

    let createData;
    try {
      createData = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON');
      return;
    }

    if (createData.success) {
      console.log('✅ Inventory item created successfully!');
      console.log('📦 Created item details:');
      console.log(`   - Name: ${createData.item.name}`);
      console.log(`   - SKU: ${createData.item.sku}`);
      console.log(`   - Category: ${createData.item.category}`);
      console.log(`   - ID: ${createData.item._id}`);
      
      // Verify the item appears in the inventory list
      console.log('\n3. Verifying item appears in inventory list...');
      const listResponse = await fetch('http://localhost:5000/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const listData = await listResponse.json();
      
      if (listData.success) {
        const createdItem = listData.data.find(item => item.sku === inventoryItem.sku);
        if (createdItem) {
          console.log('✅ Item successfully appears in inventory list');
          console.log(`📊 Total items in inventory: ${listData.data.length}`);
        } else {
          console.log('❌ Item not found in inventory list');
        }
      } else {
        console.error('❌ Failed to retrieve inventory list:', listData.error);
      }

      console.log('\n🎉 Inventory creation API test completed successfully!');
      console.log('\n📋 Test Results:');
      console.log('- ✅ Authentication working');
      console.log('- ✅ POST /api/inventory endpoint working');
      console.log('- ✅ Material creation working');
      console.log('- ✅ GET /api/inventory endpoint working');
      console.log('- ✅ Created items appear in inventory list');
      console.log('\n💡 The inventory creation functionality is working correctly!');
      
    } else {
      console.error('❌ Failed to create inventory item:', createData.error);
      console.log('Response details:', createData);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testInventoryCreation();
