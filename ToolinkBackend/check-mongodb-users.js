const mongoose = require('mongoose');
require('dotenv').config();

// User schema - simplified for checking
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  fullName: String,
  role: String,
  isActive: Boolean
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function checkMongoUsers() {
  try {
    console.log('🔍 CHECKING MONGODB USERS');
    console.log('========================\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get all users
    const users = await User.find({}).select('username email fullName role isActive');
    
    console.log(`📊 Found ${users.length} users in database:`);
    console.log('----------------------------------------');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName || user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);
      console.log('');
    });
    
    // Check specific roles
    const adminUsers = users.filter(u => u.role === 'admin');
    const warehouseUsers = users.filter(u => u.role === 'warehouse');
    const cashierUsers = users.filter(u => u.role === 'cashier');
    
    console.log('📋 ROLE SUMMARY:');
    console.log(`   👑 Admin users: ${adminUsers.length}`);
    console.log(`   📦 Warehouse users: ${warehouseUsers.length}`);
    console.log(`   💰 Cashier users: ${cashierUsers.length}`);
    
    // Check for missing roles
    if (warehouseUsers.length === 0) {
      console.log('\n⚠️  WARNING: No warehouse users found!');
      console.log('   This may be why inventory is not visible in warehouse portal');
    }
    
    if (cashierUsers.length === 0) {
      console.log('\n⚠️  WARNING: No cashier users found!');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkMongoUsers();
