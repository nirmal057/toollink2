const mongoose = require('mongoose');
require('dotenv').config();

async function checkMongoDBInventory() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Use the same connection string as the backend
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the inventory collection directly
    const db = mongoose.connection.db;
    const inventoryCollection = db.collection('inventories');
    
    console.log('📦 Checking inventory items...');
    
    // Count total items
    const count = await inventoryCollection.countDocuments();
    console.log(`📊 Total items in database: ${count}`);
    
    if (count > 0) {
      console.log('\n📋 Sample items:');
      const items = await inventoryCollection.find({}).limit(5).toArray();
      
      items.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.name}`);
        console.log(`   Category: ${item.category}`);
        console.log(`   Stock: ${item.stock?.currentQuantity} ${item.stock?.unit}`);
        console.log(`   Price: LKR ${item.pricing?.sellingPrice}`);
        console.log(`   Supplier: ${item.supplier?.name}`);
        console.log(`   SKU: ${item.sku}`);
        console.log(`   isActive: ${item.isActive}`);
        console.log(`   ID: ${item._id}`);
      });
    } else {
      console.log('❌ No inventory items found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkMongoDBInventory();
