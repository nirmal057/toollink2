const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectToMongoDB() {
    const MONGODB_URI = process.env.MONGODB_URI;
    const DB_NAME = process.env.DB_NAME || 'toollink';

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            dbName: DB_NAME
        });
        console.log('Connected to MongoDB successfully');
        return true;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        return false;
    }
}

// Check orders by customer
async function checkOrdersByCustomer(customerName) {
    try {
        const orders = await mongoose.connection.db.collection('orders')
            .find({ customerName: { $regex: new RegExp(customerName, 'i') } })
            .toArray();

        console.log(`Found ${orders.length} orders for customer "${customerName}":`);

        orders.forEach(order => {
            console.log(`\nOrder #${order.orderNumber}:`);
            console.log(`- Customer: ${order.customerName}`);
            console.log(`- Status: ${order.status}`);
            console.log(`- Total Amount: ${order.totalAmount} LKR`);
            console.log(`- Delivery Date: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}`);

            if (order.items && order.items.length > 0) {
                console.log('- Items:');
                order.items.forEach(item => {
                    console.log(`  * ${item.quantity} ${item.unit} of ${item.materialName} @ ${item.unitPrice} LKR each = ${item.subtotal} LKR`);
                });
            }
        });

        return orders;
    } catch (error) {
        console.error(`Error checking orders for customer "${customerName}":`, error);
        return [];
    }
}

// Check all orders
async function checkAllOrders(limit = 10) {
    try {
        const orders = await mongoose.connection.db.collection('orders')
            .find({})
            .limit(limit)
            .sort({ createdAt: -1 })
            .toArray();

        console.log(`\nLatest ${orders.length} orders in the system:`);

        orders.forEach(order => {
            console.log(`\nOrder #${order.orderNumber}:`);
            console.log(`- Customer: ${order.customerName}`);
            console.log(`- Status: ${order.status}`);
            console.log(`- Total Amount: ${order.totalAmount} LKR`);
            console.log(`- Created: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Not set'}`);
            console.log(`- Delivery: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}`);

            if (order.items && order.items.length > 0) {
                console.log(`- Items: ${order.items.length}`);
                order.items.slice(0, 2).forEach(item => {
                    console.log(`  * ${item.quantity} ${item.unit} of ${item.materialName} @ ${item.unitPrice} LKR each`);
                });
                if (order.items.length > 2) {
                    console.log(`  * ... and ${order.items.length - 2} more items`);
                }
            }
        });

        return orders;
    } catch (error) {
        console.error('Error checking all orders:', error);
        return [];
    }
}

// Check materials
async function checkMaterials() {
    try {
        const materials = await mongoose.connection.db.collection('materials')
            .find({})
            .toArray();

        console.log(`\nFound ${materials.length} materials in the system:`);

        materials.forEach(material => {
            console.log(`- ${material.name} (${material.code}): ${material.price} LKR per ${material.unit}`);
        });

        return materials;
    } catch (error) {
        console.error('Error checking materials:', error);
        return [];
    }
}

// Main function
async function main() {
    try {
        // Connect to MongoDB
        const connected = await connectToMongoDB();
        if (!connected) {
            process.exit(1);
        }

        console.log('\n=== ORDER MANAGEMENT VERIFICATION ===\n');

        // Check some orders by customer name
        await checkOrdersByCustomer('Sri Lanka Traders');

        // Check all recent orders
        await checkAllOrders(5);

        // Check materials
        await checkMaterials();

        console.log('\n=== END OF VERIFICATION ===');
    } catch (error) {
        console.error('An error occurred during verification:', error);
    } finally {
        // Close the MongoDB connection
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the verification
main();
