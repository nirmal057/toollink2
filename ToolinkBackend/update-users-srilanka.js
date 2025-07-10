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

// Updated user data with Sri Lankan names
const userUpdates = [
  {
    username: 'admin',
    fullName: 'Nuwan Sampath',
    phone: '+94-77-123-4567',
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
    fullName: 'Kasun Perera',
    phone: '+94-71-234-5678',
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
    fullName: 'Sanduni Fernando',
    phone: '+94-76-345-6789',
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
    fullName: 'Tharaka Jayasinghe',
    phone: '+94-78-456-7890',
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
    fullName: 'Dilani Rathnayake',
    phone: '+94-72-567-8901',
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
    fullName: 'Chaminda Silva',
    phone: '+94-75-678-9012',
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
    fullName: 'Priyani Wijeratne',
    phone: '+94-70-789-0123',
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
    fullName: 'Roshan Gunawardena',
    phone: '+94-77-890-1234',
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
    fullName: 'Nimal Bandara',
    phone: '+94-71-901-2345',
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
    fullName: 'Amara Dissanayake',
    phone: '+94-76-012-3456',
    address: {
      street: '707 Badulla Road',
      city: 'Badulla',
      state: 'Uva',
      zipCode: '90300',
      country: 'Sri Lanka'
    }
  }
];

async function updateUsersToSriLankanNames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 Connected to MongoDB');
    console.log('📊 Updating existing users with Sri Lankan names...\n');

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const updateData of userUpdates) {
      try {
        // Find and update user
        const user = await User.findOneAndUpdate(
          { username: updateData.username },
          {
            $set: {
              fullName: updateData.fullName,
              phone: updateData.phone,
              address: updateData.address
            }
          },
          { new: true, runValidators: true }
        );

        if (user) {
          updatedCount++;
          console.log(`✅ Updated ${user.role}: ${updateData.username}`);
          console.log(`   👤 Name: ${updateData.fullName}`);
          console.log(`   📞 Phone: ${updateData.phone}`);
          console.log(`   🏠 Location: ${updateData.address.city}, ${updateData.address.state}`);
          console.log('');
        } else {
          notFoundCount++;
          console.log(`❌ User not found: ${updateData.username}`);
        }

      } catch (error) {
        console.error(`❌ Failed to update user ${updateData.username}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updatedCount} users`);
    console.log(`❌ Not found: ${notFoundCount} users`);
    console.log(`📝 Total processed: ${userUpdates.length} users`);

    console.log('\n🇱🇰 Updated Sri Lankan Users:');
    console.log('Role       | Username    | Full Name              | Location');
    console.log('-----------|-------------|------------------------|------------------------');
    
    const updatedUsers = await User.find({ username: { $in: userUpdates.map(u => u.username) } });
    updatedUsers.forEach(user => {
      const location = user.address ? `${user.address.city}, ${user.address.state}` : 'N/A';
      console.log(`${user.role.padEnd(10)} | ${user.username.padEnd(11)} | ${user.fullName.padEnd(22)} | ${location}`);
    });

  } catch (error) {
    console.error('❌ Error updating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
updateUsersToSriLankanNames();
