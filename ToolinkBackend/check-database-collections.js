import mongoose from 'mongoose';
import { config } from 'dotenv';
import logger from './src/utils/logger.js';

// Load environment variables
config();

async function checkDatabaseCollections() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        logger.info('Connected to MongoDB');

        // Get all collection names
        const collections = await mongoose.connection.db.listCollections().toArray();

        logger.info('Database Collections:');
        collections.forEach(collection => {
            logger.info(`- ${collection.name}`);
        });

        // Check if orders collection exists and show sample data
        if (collections.some(col => col.name === 'orders')) {
            logger.info('\n=== ORDERS COLLECTION ===');

            const ordersCollection = mongoose.connection.db.collection('orders');
            const orderCount = await ordersCollection.countDocuments();
            logger.info(`Total orders: ${orderCount}`);

            if (orderCount > 0) {
                const sampleOrders = await ordersCollection.find({}).limit(3).toArray();
                logger.info('Sample orders:');
                sampleOrders.forEach((order, index) => {
                    logger.info(`\nOrder ${index + 1}:`);
                    logger.info(`- ID: ${order._id}`);
                    logger.info(`- Order Number: ${order.orderNumber || 'N/A'}`);
                    logger.info(`- Customer: ${order.customer || order.customerName || 'N/A'}`);
                    logger.info(`- Status: ${order.status || 'N/A'}`);
                    logger.info(`- Items: ${order.items?.length || 0} items`);
                    logger.info(`- Created: ${order.createdAt || order.created_at || 'N/A'}`);
                });
            }
        } else {
            logger.info('\nOrders collection does not exist yet.');
        }

        // Check inventory collection
        if (collections.some(col => col.name === 'inventories')) {
            logger.info('\n=== INVENTORY COLLECTION ===');

            const inventoryCollection = mongoose.connection.db.collection('inventories');
            const inventoryCount = await inventoryCollection.countDocuments();
            logger.info(`Total inventory items: ${inventoryCount}`);

            if (inventoryCount > 0) {
                const sampleInventory = await inventoryCollection.find({}).limit(3).toArray();
                logger.info('Sample inventory items:');
                sampleInventory.forEach((item, index) => {
                    logger.info(`\nItem ${index + 1}:`);
                    logger.info(`- ID: ${item._id}`);
                    logger.info(`- Name: ${item.name}`);
                    logger.info(`- Category: ${item.category}`);
                    logger.info(`- Current Stock: ${item.current_stock || item.quantity}`);
                    logger.info(`- Unit: ${item.unit}`);
                    logger.info(`- Price: Rs. ${item.selling_price || item.cost || 'N/A'}`);
                });
            }
        }

        // Check users collection
        if (collections.some(col => col.name === 'users')) {
            logger.info('\n=== USERS COLLECTION ===');

            const usersCollection = mongoose.connection.db.collection('users');
            const userCount = await usersCollection.countDocuments();
            logger.info(`Total users: ${userCount}`);

            const approvedUsers = await usersCollection.countDocuments({ isApproved: true });
            const pendingUsers = await usersCollection.countDocuments({ isApproved: false });
            logger.info(`- Approved users: ${approvedUsers}`);
            logger.info(`- Pending approval: ${pendingUsers}`);
        }

    } catch (error) {
        logger.error('Database check error:', error);
    } finally {
        await mongoose.connection.close();
        logger.info('\nDatabase connection closed');
    }
}

// Run the check
checkDatabaseCollections();
