const mongoose = require('mongoose');
const User = require('./ToolinkBackend/src/models/User');

const MONGODB_URI = 'mongodb+srv://dilusha:BWZvqBcD43hxSgGQ@cluster0.q0grz0.mongodb.net/toollink?retryWrites=true&w=majority';

async function fixAdminUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ email: 'admin1@toollink.lk' });

        if (admin) {
            console.log('Admin user found:');
            console.log('- isActive:', admin.isActive);
            console.log('- isApproved:', admin.isApproved);
            console.log('- emailVerified:', admin.emailVerified);

            // Update emailVerified to true
            admin.emailVerified = true;
            await admin.save();
            console.log('✅ Updated emailVerified to true');
        } else {
            console.log('Admin user not found');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixAdminUser();
