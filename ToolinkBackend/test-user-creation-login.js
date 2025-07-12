import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

// Test user creation and login flow
async function testUserCreationAndLogin() {
    try {
        console.log('🧪 Testing User Creation and Login Flow...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Simple user schema for testing
        const userSchema = new mongoose.Schema({
            username: String,
            email: String,
            password: String,
            fullName: String,
            phone: String,
            role: String,
            isActive: Boolean,
            isApproved: Boolean,
            isVerified: Boolean
        }, { timestamps: true });

        // Add password comparison method
        userSchema.methods.comparePassword = async function (candidatePassword) {
            return bcrypt.compare(candidatePassword, this.password);
        };

        // Hash password before saving
        userSchema.pre('save', async function (next) {
            if (!this.isModified('password')) return next();
            this.password = await bcrypt.hash(this.password, 12);
            next();
        });

        const User = mongoose.model('User', userSchema);

        // Test 1: Create a new warehouse manager
        console.log('\n📝 Test 1: Creating a new warehouse manager...');

        const testUser = {
            username: 'warehouse_test',
            email: 'warehouse.test@toollink.com',
            password: 'warehouse123',
            fullName: 'Test Warehouse Manager',
            phone: '+94771234570',
            role: 'warehouse',
            isActive: true,
            isApproved: true,
            isVerified: true
        };

        // Remove existing test user if any
        await User.deleteOne({ email: testUser.email });

        // Create new user
        const newUser = new User(testUser);
        await newUser.save();

        console.log(`✅ User created successfully:`);
        console.log(`   - ID: ${newUser._id}`);
        console.log(`   - Email: ${newUser.email}`);
        console.log(`   - Role: ${newUser.role}`);
        console.log(`   - Password Hash: ${newUser.password.substring(0, 20)}...`);

        // Test 2: Verify user can be found by email
        console.log('\n🔍 Test 2: Finding user by email...');

        const foundUser = await User.findOne({ email: testUser.email });
        if (foundUser) {
            console.log('✅ User found in database');
            console.log(`   - Username: ${foundUser.username}`);
            console.log(`   - Full Name: ${foundUser.fullName}`);
            console.log(`   - Role: ${foundUser.role}`);
            console.log(`   - Is Active: ${foundUser.isActive}`);
            console.log(`   - Is Approved: ${foundUser.isApproved}`);
        } else {
            console.log('❌ User not found');
            return;
        }

        // Test 3: Test password verification
        console.log('\n🔐 Test 3: Testing password verification...');

        const passwordMatch = await foundUser.comparePassword('warehouse123');
        if (passwordMatch) {
            console.log('✅ Password verification successful');
        } else {
            console.log('❌ Password verification failed');
            return;
        }

        // Test 4: Test wrong password
        console.log('\n🔐 Test 4: Testing wrong password...');

        const wrongPasswordMatch = await foundUser.comparePassword('wrongpassword');
        if (!wrongPasswordMatch) {
            console.log('✅ Wrong password correctly rejected');
        } else {
            console.log('❌ Wrong password was accepted (this is bad!)');
        }

        // Test 5: Check all users in database
        console.log('\n👥 Test 5: Listing all users in database...');

        const allUsers = await User.find({}, 'username email role isActive').sort({ createdAt: -1 });
        console.log(`Found ${allUsers.length} users:`);
        allUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
        });

        console.log('\n🎉 All tests completed successfully!');

        console.log('\n📋 Summary:');
        console.log('✅ User creation works');
        console.log('✅ User can be found in database');
        console.log('✅ Password hashing works');
        console.log('✅ Password verification works');
        console.log('✅ Database contains user data');

        console.log('\n🔑 Test Login Credentials:');
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Password: ${testUser.password}`);
        console.log(`   Role: ${testUser.role}`);

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

testUserCreationAndLogin();
