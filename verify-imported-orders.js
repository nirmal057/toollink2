const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB Atlas connection string from ToolinkBackend/.env
const MONGODB_URI = 'mongodb+srv://iit21083:k1zTsck8hslcFiZm@cluster0.q0grz0.mongodb.net/toollink?retryWrites=true&w=majority&appName=Cluster0';

async function verifyOrders() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Define a simplified Order schema for querying
        const OrderSchema = new mongoose.Schema({}, { strict: false });
        const Order = mongoose.model('Order', OrderSchema);

        // Get order count
        const orderCount = await Order.countDocuments();
        console.log(`\n📊 Total orders in database: ${orderCount}`);

        // Get the latest 10 orders
        const latestOrders = await Order.find().sort({ createdAt: -1 }).limit(10);

        console.log('\n🔎 Latest 10 orders:');
        latestOrders.forEach((order, index) => {
            console.log(`\n📦 Order #${index + 1}:`);
            console.log(`   Order Number: ${order.orderNumber}`);
            console.log(`   Customer: ${order.customer?.name || 'N/A'}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Total Items: ${order.items?.length || 0}`);
            console.log(`   Total Amount: ${order.pricing?.total || 0} LKR`);
            console.log(`   Created: ${order.createdAt}`);
        });

        // Save detailed order information to a file
        const orderDetails = latestOrders.map(order => ({
            id: order._id.toString(),
            orderNumber: order.orderNumber,
            customer: order.customer,
            items: order.items,
            total: order.pricing?.total || 0,
            status: order.status,
            createdAt: order.createdAt
        }));

        const detailsFilePath = path.join(__dirname, 'order-verification-results.json');
        fs.writeFileSync(detailsFilePath, JSON.stringify(orderDetails, null, 2));
        console.log(`\n📝 Detailed order information saved to: ${detailsFilePath}`);

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    }
}

verifyOrders();
