const mongoose = require('mongoose');
require('dotenv').config();

const testAtlasConnection = async () => {
  console.log('🧪 Testing MongoDB Atlas Connection...');
  console.log('=' .repeat(50));
  
  const connectionString = process.env.MONGODB_URI;
  
  if (!connectionString) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  // Mask password in connection string for logging
  const maskedConnectionString = connectionString.replace(/:([^:@]+)@/, ':****@');
  console.log('🔗 Connection String:', maskedConnectionString);
  console.log('📊 Database Name:', process.env.DB_NAME || 'toollink');
  
  try {
    console.log('\n🔄 Attempting to connect...');
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });

    console.log('✅ MongoDB Atlas Connection Successful!');
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
    console.log(`🔌 Ready State: ${conn.connection.readyState}`);
    
    // Test database operations
    console.log('\n🧪 Testing Database Operations...');
    
    // Ping the database
    await mongoose.connection.db.admin().ping();
    console.log('✅ Database ping successful');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Collections found: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('   Collections:');
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    // Test creating a simple document
    const TestSchema = new mongoose.Schema({
      name: String,
      timestamp: { type: Date, default: Date.now },
      test: Boolean
    });
    
    const TestModel = mongoose.model('ConnectionTest', TestSchema);
    
    const testDoc = new TestModel({
      name: 'Connection Test',
      test: true
    });
    
    await testDoc.save();
    console.log('✅ Test document created successfully');
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Test document cleaned up');
    
    console.log('\n🎉 All MongoDB Atlas tests passed!');
    
  } catch (error) {
    console.error('\n❌ MongoDB Atlas Connection Failed:');
    console.error('Error:', error.message);
    
    // Provide specific error guidance
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Check your username and password');
      console.error('2. Verify your MongoDB Atlas user has the correct permissions');
      console.error('3. Make sure your user is added to the database');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Check your internet connection');
      console.error('2. Verify your connection string is correct');
      console.error('3. Check if your IP address is whitelisted in MongoDB Atlas');
      console.error('4. Verify your cluster is running');
    } else if (error.message.includes('MongooseServerSelectionError')) {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Check if your MongoDB Atlas cluster is paused');
      console.error('2. Verify network access settings (IP whitelist)');
      console.error('3. Check your connection string format');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
};

// Run the test
testAtlasConnection().catch(console.error);
