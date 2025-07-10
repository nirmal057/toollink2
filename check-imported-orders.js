const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB Atlas connection string from ToolinkBackend/.env
const MONGODB_URI = 'mongodb+srv://iit21083:k1zTsck8hslcFiZm@cluster0.q0grz0.mongodb.net/toollink?retryWrites=true&w=majority&appName=Cluster0';

async function checkImportedOrders() {
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

        // Get all orders sorted by creation date (newest first)
        const importedOrders = await Order.find().sort({ createdAt: -1 }).limit(20);

        console.log(`\n📊 Found ${importedOrders.length} recently imported orders`);

        if (importedOrders.length > 0) {
            console.log('\n🔎 Imported orders:');
            importedOrders.forEach((order, index) => {
                console.log(`\n📦 Order #${index + 1}:`);
                console.log(`   Order Number: ${order.orderNumber}`);
                console.log(`   Customer: ${order.customer?.name || 'N/A'}`);
                console.log(`   Item: ${order.items && order.items[0] ? order.items[0].name : 'N/A'}`);
                console.log(`   Quantity: ${order.items && order.items[0] ? order.items[0].quantity : 0} ${order.items && order.items[0] ? order.items[0].unit || '' : ''}`);
                console.log(`   Unit Price: ${order.items && order.items[0] ? order.items[0].unitPrice : 0} LKR`);
                console.log(`   Total: ${order.pricing?.total || 0} LKR`);
                console.log(`   Status: ${order.status}`);
                console.log(`   Created: ${order.createdAt}`);
            });

            // Save detailed order information to a file
            const orderDetails = importedOrders.map(order => ({
                id: order._id.toString(),
                orderNumber: order.orderNumber,
                customer: order.customer,
                items: order.items,
                total: order.pricing?.total || 0,
                status: order.status,
                createdAt: order.createdAt
            }));

            const detailsFilePath = path.join(__dirname, 'imported-orders-details.json');
            fs.writeFileSync(detailsFilePath, JSON.stringify(orderDetails, null, 2));
            console.log(`\n📝 Detailed order information saved to: ${detailsFilePath}`);
        } else {
            console.log('\n❌ No recently imported orders found. Check if the import was successful.');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    }
}

checkImportedOrders();
