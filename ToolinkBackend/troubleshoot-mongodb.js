const mongoose = require('mongoose');
require('dotenv').config();

const troubleshootConnection = async () => {
  console.log('🔧 MongoDB Atlas Connection Troubleshooter');
  console.log('=' .repeat(50));
  
  const originalUri = process.env.MONGODB_URI;
  const password = '4bl7HdiWlc2fvWeK';
  const username = 'iit21057';
  const cluster = 'cluster0.ynpjyrl.mongodb.net';
  const dbName = 'toollink';
  
  console.log('📋 Connection Details:');
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log(`Cluster: ${cluster}`);
  console.log(`Database: ${dbName}`);
  
  // Test different connection string formats
  const testUris = [
    // Original
    originalUri,
    
    // Without specifying database in connection string
    `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority&appName=Cluster0`,
    
    // URL encoded password (if password contains special characters)
    `mongodb+srv://${username}:${encodeURIComponent(password)}@${cluster}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`,
    
    // Different authentication method
    `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority&authSource=admin&appName=Cluster0`
  ];
  
  for (let i = 0; i < testUris.length; i++) {
    const uri = testUris[i];
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    
    console.log(`\n🧪 Test ${i + 1}: ${maskedUri}`);
    
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
      });
      
      console.log('✅ Connection successful!');
      console.log(`Host: ${conn.connection.host}`);
      console.log(`Database: ${conn.connection.name}`);
      
      // Test a simple operation
      await mongoose.connection.db.admin().ping();
      console.log('✅ Database ping successful');
      
      // Show available databases
      const admin = mongoose.connection.db.admin();
      const result = await admin.listDatabases();
      console.log('📊 Available databases:');
      result.databases.forEach(db => {
        console.log(`  - ${db.name}`);
      });
      
      await mongoose.connection.close();
      console.log('🎉 This connection string works!');
      console.log(`\nℹ️  Update your .env file with:`);
      console.log(`MONGODB_URI=${uri}`);
      return;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    }
  }
  
  console.log('\n❌ All connection attempts failed.');
  console.log('\n🛠️  Please check the following:');
  console.log('1. MongoDB Atlas cluster is running (not paused)');
  console.log('2. Username and password are correct');
  console.log('3. User has proper database permissions');
  console.log('4. Your IP address is whitelisted (or use 0.0.0.0/0 for testing)');
  console.log('5. Database user is created in the correct database');
  
  console.log('\n📝 MongoDB Atlas Setup Checklist:');
  console.log('□ Cluster is active and running');
  console.log('□ Database user is created');
  console.log('□ User has "readWrite" permissions on the database');
  console.log('□ IP address is whitelisted in Network Access');
  console.log('□ Connection string is correct');
};

// Run the troubleshooter
troubleshootConnection().catch(console.error).finally(() => process.exit(0));
