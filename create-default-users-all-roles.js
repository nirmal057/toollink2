const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User schema (matching your backend model)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: String,
  role: {
    type: String,
    enum: ['admin', 'user', 'warehouse', 'cashier', 'customer', 'driver', 'editor'],
    default: 'customer'
  },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false }
  },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  refreshTokens: [String],
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Default users for different roles
const defaultUsers = [
  {
    username: 'admin',
    email: 'admin@toollink.com',
    password: 'admin123',
    fullName: 'System Administrator',
    phone: '+1-555-0101',
    role: 'admin',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '123 Admin Street',
      city: 'Tech City',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    }
  },
  {
    username: 'cashier1',
    email: 'cashier1@toollink.com',
    password: 'cashier123',
    fullName: 'John Cashier',
    phone: '+1-555-0201',
    role: 'cashier',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '456 Cashier Lane',
      city: 'Commerce City',
      state: 'CA',
      zipCode: '90211',
      country: 'USA'
    }
  },
  {
    username: 'cashier2',
    email: 'cashier2@toollink.com',
    password: 'cashier123',
    fullName: 'Sarah Counter',
    phone: '+1-555-0202',
    role: 'cashier',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '789 Register Road',
      city: 'Commerce City',
      state: 'CA',
      zipCode: '90212',
      country: 'USA'
    }
  },
  {
    username: 'warehouse1',
    email: 'warehouse1@toollink.com',
    password: 'warehouse123',
    fullName: 'Mike Warehouse',
    phone: '+1-555-0301',
    role: 'warehouse',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '101 Storage Street',
      city: 'Industrial City',
      state: 'CA',
      zipCode: '90213',
      country: 'USA'
    }
  },
  {
    username: 'warehouse2',
    email: 'warehouse2@toollink.com',
    password: 'warehouse123',
    fullName: 'Lisa Manager',
    phone: '+1-555-0302',
    role: 'warehouse',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '202 Inventory Ave',
      city: 'Industrial City',
      state: 'CA',
      zipCode: '90214',
      country: 'USA'
    }
  },
  {
    username: 'customer1',
    email: 'customer1@email.com',
    password: 'customer123',
    fullName: 'David Customer',
    phone: '+1-555-0401',
    role: 'customer',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '303 Client Street',
      city: 'Customer City',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    }
  },
  {
    username: 'customer2',
    email: 'customer2@email.com',
    password: 'customer123',
    fullName: 'Emily Buyer',
    phone: '+1-555-0402',
    role: 'customer',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '404 Purchase Place',
      city: 'Customer City',
      state: 'NY',
      zipCode: '10002',
      country: 'USA'
    }
  },
  {
    username: 'customer3',
    email: 'customer3@email.com',
    password: 'customer123',
    fullName: 'Robert Client',
    phone: '+1-555-0403',
    role: 'customer',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '505 Order Lane',
      city: 'Customer City',
      state: 'NY',
      zipCode: '10003',
      country: 'USA'
    }
  },
  {
    username: 'driver1',
    email: 'driver1@toollink.com',
    password: 'driver123',
    fullName: 'Tom Driver',
    phone: '+1-555-0501',
    role: 'driver',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '606 Delivery Drive',
      city: 'Transport City',
      state: 'TX',
      zipCode: '75001',
      country: 'USA'
    }
  },
  {
    username: 'editor1',
    email: 'editor1@toollink.com',
    password: 'editor123',
    fullName: 'Anna Editor',
    phone: '+1-555-0601',
    role: 'editor',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '707 Content Street',
      city: 'Media City',
      state: 'FL',
      zipCode: '33101',
      country: 'USA'
    }
  }
];

async function createDefaultUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 Connected to MongoDB');
    console.log('📊 Creating default users for all roles...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [
            { email: userData.email },
            { username: userData.username }
          ]
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.username} (${userData.role}) already exists - skipping`);
          skippedCount++;
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Create user
        const user = new User({
          ...userData,
          password: hashedPassword
        });

        await user.save();
        createdCount++;

        console.log(`✅ Created ${userData.role}: ${userData.username} (${userData.fullName})`);
        console.log(`   📧 Email: ${userData.email}`);
        console.log(`   📞 Phone: ${userData.phone}`);
        console.log(`   🏠 Location: ${userData.address.city}, ${userData.address.state}`);
        console.log('');

      } catch (error) {
        console.error(`❌ Failed to create user ${userData.username}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Created: ${createdCount} users`);
    console.log(`⚠️  Skipped: ${skippedCount} users (already exist)`);
    console.log(`📝 Total processed: ${defaultUsers.length} users`);

    console.log('\n🔐 Login Credentials:');
    console.log('Role       | Username    | Password    | Email');
    console.log('-----------|-------------|-------------|---------------------------');
    defaultUsers.forEach(user => {
      console.log(`${user.role.padEnd(10)} | ${user.username.padEnd(11)} | ${user.password.padEnd(11)} | ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error creating default users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
createDefaultUsers();
