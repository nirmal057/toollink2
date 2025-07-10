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
    fullName: 'Nuwan Sampath',
    phone: '+94-77-123-4567',
    role: 'admin',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '123 Galle Road',
      city: 'Colombo',
      state: 'Western',
      zipCode: '00100',
      country: 'Sri Lanka'
    }
  },
  {
    username: 'cashier1',
    email: 'cashier1@toollink.com',
    password: 'cashier123',
    fullName: 'Kasun Perera',
    phone: '+94-71-234-5678',
    role: 'cashier',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '456 Kandy Road',
      city: 'Maharagama',
      state: 'Western',
      zipCode: '10280',
      country: 'Sri Lanka'
    }
  },
  {
    username: 'cashier2',
    email: 'cashier2@toollink.com',
    password: 'cashier123',
    fullName: 'Sanduni Fernando',
    phone: '+94-76-345-6789',
    role: 'cashier',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '789 Negombo Road',
      city: 'Kelaniya',
      state: 'Western',
      zipCode: '11600',
      country: 'Sri Lanka'
    }
  },
  {
    username: 'warehouse1',
    email: 'warehouse1@toollink.com',
    password: 'warehouse123',
    fullName: 'Tharaka Jayasinghe',
    phone: '+94-78-456-7890',
    role: 'warehouse',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '101 Avissawella Road',
      city: 'Homagama',
      state: 'Western',
      zipCode: '10200',
      country: 'Sri Lanka'
    }
  },
  {
    username: 'warehouse2',
    email: 'warehouse2@toollink.com',
    password: 'warehouse123',
    fullName: 'Dilani Rathnayake',
    phone: '+94-72-567-8901',
    role: 'warehouse',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '202 Kottawa Road',
      city: 'Pannipitiya',
      state: 'Western',
      zipCode: '10230',
      country: 'Sri Lanka'
    }
  },
  {
    username: 'customer1',
    email: 'customer1@email.com',
    password: 'customer123',
    fullName: 'Chaminda Silva',
    phone: '+94-75-678-9012',
    role: 'customer',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '303 Peradeniya Road',
      city: 'Kandy',
      state: 'Central',
      zipCode: '20000',
      country: 'Sri Lanka'
    }
  },
  {
    username: 'customer2',
    email: 'customer2@email.com',
    password: 'customer123',
    fullName: 'Priyani Wijeratne',
    phone: '+94-70-789-0123',
    role: 'customer',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '404 Matara Road',
      city: 'Galle',
      state: 'Southern',
      zipCode: '80000',
      country: 'Sri Lanka'
    }
  },
  {
    username: 'customer3',
    email: 'customer3@email.com',
    password: 'customer123',
    fullName: 'Roshan Gunawardena',
    phone: '+94-77-890-1234',
    role: 'customer',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '505 Jaffna Road',
      city: 'Anuradhapura',
      state: 'North Central',
      zipCode: '50000',
      country: 'Sri Lanka'
    }
  },
  {
    username: 'driver1',
    email: 'driver1@toollink.com',
    password: 'driver123',
    fullName: 'Nimal Bandara',
    phone: '+94-71-901-2345',
    role: 'driver',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '606 Kurunegala Road',
      city: 'Kurunegala',
      state: 'North Western',
      zipCode: '60000',
      country: 'Sri Lanka'
    }
  },
  {
    username: 'editor1',
    email: 'editor1@toollink.com',
    password: 'editor123',
    fullName: 'Amara Dissanayake',
    phone: '+94-76-012-3456',
    role: 'editor',
    isApproved: true,
    emailVerified: true,
    address: {
      street: '707 Badulla Road',
      city: 'Badulla',
      state: 'Uva',
      zipCode: '90300',
      country: 'Sri Lanka'
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
