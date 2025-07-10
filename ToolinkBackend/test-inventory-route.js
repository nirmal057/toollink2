const express = require('express');
const mongoose = require('mongoose');
const Inventory = require('./src/models/Inventory');
require('dotenv').config();

async function testInventoryRoute() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('📦 Testing inventory query...');
    
    // Test the exact query used in the route
    const query = { isActive: true };
    console.log('Query:', query);
    
    const items = await Inventory.find(query).limit(5);
    console.log(`Found ${items.length} items with isActive: true`);
    
    // Test without isActive filter
    const allItems = await Inventory.find({}).limit(5);
    console.log(`Found ${allItems.length} items without filter`);
    
    if (items.length > 0) {
      console.log('\n✅ Sample item with isActive filter:');
      const item = items[0];
      console.log(JSON.stringify({
        id: item._id,
        name: item.name,
        category: item.category,
        isActive: item.isActive,
        stock: item.stock,
        pricing: item.pricing
      }, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testInventoryRoute();
