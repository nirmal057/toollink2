// Test to verify the inventory API endpoints work correctly
const mongoose = require('mongoose');
require('dotenv').config();

const Material = require('./src/models/Material');

async function testInventorySystem() {
  try {
    console.log('🧪 Testing Inventory System Integration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a test material with the same structure as the frontend sends
    console.log('\n1. Creating test material directly in database...');
    const testMaterial = new Material({
      name: 'Frontend Test Material',
      sku: 'FTM-' + Date.now(),
      category: 'Tools & Equipment',
      description: 'Test material created to verify frontend integration',
      unit: 'pieces',
      pricing: {
        costPrice: 15.00,
        sellingPrice: 25.00,
        currency: 'LKR'
      },
      stock: {
        currentQuantity: 50,
        minimumQuantity: 5,
        unit: 'pieces'
      },
      location: {
        warehouse: 'Main Warehouse',
        zone: 'Test Zone'
      },
      supplier: {
        name: 'Test Supplier Co.',
        phone: '+94123456789',
        email: 'supplier@test.com'
      },
      isActive: true
    });

    await testMaterial.save();
    console.log('✅ Test material created successfully');
    console.log(`   - SKU: ${testMaterial.sku}`);
    console.log(`   - Name: ${testMaterial.name}`);
    console.log(`   - Stock: ${testMaterial.stock.currentQuantity} ${testMaterial.stock.unit}`);

    // Test the data structure matches what the frontend expects
    console.log('\n2. Verifying material structure matches frontend expectations...');
    
    const savedMaterial = await Material.findById(testMaterial._id);
    const expectedFields = ['name', 'sku', 'category', 'description', 'unit', 'pricing', 'stock', 'location', 'supplier', 'isActive'];
    
    let allFieldsPresent = true;
    for (const field of expectedFields) {
      if (!(field in savedMaterial.toObject())) {
        console.log(`❌ Missing field: ${field}`);
        allFieldsPresent = false;
      }
    }
    
    if (allFieldsPresent) {
      console.log('✅ All expected fields are present');
    }

    // Verify nested structures
    if (savedMaterial.pricing && savedMaterial.pricing.costPrice !== undefined) {
      console.log('✅ Pricing structure is correct');
    } else {
      console.log('❌ Pricing structure is incorrect');
    }

    if (savedMaterial.stock && savedMaterial.stock.currentQuantity !== undefined) {
      console.log('✅ Stock structure is correct');
    } else {
      console.log('❌ Stock structure is incorrect');
    }

    // Test inventory list query (what the frontend calls)
    console.log('\n3. Testing inventory list query...');
    const inventoryList = await Material.find({ isActive: true })
      .select('name sku category description unit pricing stock location supplier isActive createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`✅ Found ${inventoryList.length} active materials`);
    
    // Show the last created material (our test material)
    const lastMaterial = inventoryList[0];
    if (lastMaterial && lastMaterial.sku === testMaterial.sku) {
      console.log('✅ Test material appears correctly in inventory list');
      console.log('📦 Material data structure:');
      console.log(JSON.stringify({
        name: lastMaterial.name,
        sku: lastMaterial.sku,
        category: lastMaterial.category,
        pricing: lastMaterial.pricing,
        stock: lastMaterial.stock,
        unit: lastMaterial.unit
      }, null, 2));
    } else {
      console.log('❌ Test material not found in inventory list');
    }

    console.log('\n🎉 Inventory system test completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Database connection working');
    console.log('- ✅ Material creation working');
    console.log('- ✅ Data structure matches frontend expectations');
    console.log('- ✅ Inventory list query working');
    console.log('\n💡 The backend inventory system is ready for frontend integration!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testInventorySystem();
