import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

const inventorySchema = new mongoose.Schema({}, { strict: false });
const Inventory = mongoose.model('Inventory', inventorySchema);

async function updateCurrentStock() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update all items to set current_stock = quantity
        const result = await Inventory.updateMany(
            {},
            [{ $set: { current_stock: '$quantity' } }]
        );

        console.log('Updated', result.modifiedCount, 'items');

        // Verify updates
        const items = await Inventory.find({});
        console.log('Current inventory stock levels:');
        items.forEach(item => {
            console.log(`- ${item.name}: current_stock=${item.current_stock}, quantity=${item.quantity}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

updateCurrentStock();
