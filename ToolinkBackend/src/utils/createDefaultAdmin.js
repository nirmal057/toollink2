import User from '../models/User.js';
import logger from './logger.js';

export const createDefaultAdmin = async () => {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            logger.info('Admin user already exists');
            return;
        }

        // Create default admin user
        const adminUser = new User({
            username: 'admin',
            email: process.env.ADMIN_EMAIL || 'admin@toollink.com',
            password: process.env.ADMIN_PASSWORD || 'admin123',
            fullName: 'System Administrator',
            role: 'admin',
            isActive: true,
            isApproved: true,
            emailVerified: true,
            phone: '+1-555-0000',
            address: {
                street: '123 Admin Street',
                city: 'Admin City',
                state: 'Admin State',
                zipCode: '12345',
                country: 'USA'
            }
        });

        await adminUser.save();
        logger.info('Default admin user created successfully');
    } catch (error) {
        logger.error('Error creating default admin user:', error);
    }
};
