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

// Get all collections
async function listCollections() {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in the database:');
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });
        return collections.map(c => c.name);
    } catch (error) {
        console.error('Error listing collections:', error);
        return [];
    }
}

// Count documents in a collection
async function countDocuments(collectionName) {
    try {
        const count = await mongoose.connection.db.collection(collectionName).countDocuments();
        console.log(`Collection ${collectionName} has ${count} documents`);
        return count;
    } catch (error) {
        console.error(`Error counting documents in ${collectionName}:`, error);
        return -1;
    }
}

// List some sample documents from a collection
async function listSampleDocuments(collectionName, limit = 3) {
    try {
        const documents = await mongoose.connection.db.collection(collectionName)
            .find({})
            .limit(limit)
            .toArray();

        console.log(`Sample ${limit} documents from ${collectionName}:`);
        documents.forEach(doc => {
            // Format the document for better readability
            const simplifiedDoc = {
                _id: doc._id,
                ...collectionName === 'users' ? {
                    username: doc.username,
                    email: doc.email,
                    firstName: doc.firstName,
                    lastName: doc.lastName,
                    role: doc.role,
                    status: doc.status
                } : collectionName === 'orders' ? {
                    orderNumber: doc.orderNumber,
                    customerName: doc.customerName,
                    totalAmount: doc.totalAmount,
                    status: doc.status,
                    itemCount: doc.items ? doc.items.length : 0
                } : collectionName === 'materials' ? {
                    name: doc.name,
                    code: doc.code,
                    price: doc.price,
                    unit: doc.unit,
                    quantityAvailable: doc.quantityAvailable
                } : {
                    // Default - just show a few key properties
                    ...Object.fromEntries(
                        Object.entries(doc).slice(0, 6)
                    )
                }
            };

            console.log(JSON.stringify(simplifiedDoc, null, 2));
        });

        return documents;
    } catch (error) {
        console.error(`Error listing documents from ${collectionName}:`, error);
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

        // List all collections
        const collections = await listCollections();

        // Verify imported data
        console.log('\n--- VERIFICATION REPORT ---');

        if (collections.includes('users')) {
            const userCount = await countDocuments('users');
            console.log(`\nVerifying Users Collection (${userCount} documents):`);
            await listSampleDocuments('users');
        } else {
            console.log('Users collection not found!');
        }

        if (collections.includes('orders')) {
            const orderCount = await countDocuments('orders');
            console.log(`\nVerifying Orders Collection (${orderCount} documents):`);
            await listSampleDocuments('orders');
        } else {
            console.log('Orders collection not found!');
        }

        if (collections.includes('materials')) {
            const materialCount = await countDocuments('materials');
            console.log(`\nVerifying Materials Collection (${materialCount} documents):`);
            await listSampleDocuments('materials');
        } else {
            console.log('Materials collection not found!');
        }

        console.log('\n--- END OF VERIFICATION REPORT ---');
    } catch (error) {
        console.error('An error occurred during verification:', error);
    } finally {
        // Close the MongoDB connection
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the verification
main();
