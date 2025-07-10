const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb+srv://iit21083:k1zTsck8hslcFiZm@cluster0.q0grz0.mongodb.net/toollink_db?retryWrites=true&w=majority&appName=Cluster0');

// User schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'user', 'manager', 'cashier', 'customer', 'driver', 'warehouse'], default: 'user' },
    phone: { type: String },
    address: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    emailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'test@admin.com' });
        if (existingAdmin) {
            console.log('❌ Admin test@admin.com already exists');

            // Try to update the password
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.findOneAndUpdate(
                { email: 'test@admin.com' },
                { password: hashedPassword, status: 'Active' }
            );
            console.log('✅ Updated password for test@admin.com');
        } else {
            // Create new admin
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const newAdmin = new User({
                name: 'Test Admin',
                email: 'test@admin.com',
                password: hashedPassword,
                role: 'admin',
                status: 'Active',
                emailVerified: true
            });

            await newAdmin.save();
            console.log('✅ Created new admin: test@admin.com');
        }

        console.log('✅ Admin user ready: test@admin.com / admin123');

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        mongoose.connection.close();
    }
}

createTestAdmin();
