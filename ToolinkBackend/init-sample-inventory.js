import mongoose from 'mongoose';
import { config } from 'dotenv';
import Inventory from './src/models/Inventory.js';
import logger from './src/utils/logger.js';

// Load environment variables
config();

const sampleInventory = [
    {
        name: 'Steel Rods 12mm',
        description: 'High grade steel rods for construction',
        category: 'Materials',
        sku: 'SR12MM001',
        quantity: 100,
        current_stock: 100,
        unit: 'pieces',
        threshold: 20,
        min_stock_level: 20,
        max_stock_level: 500,
        location: 'Warehouse A - Section 1',
        cost: 250,
        selling_price: 300,
        supplier_info: {
            name: 'Steel Lanka Ltd',
            contact: 'John Perera',
            phone: '+94771234567'
        },
        status: 'active'
    },
    {
        name: 'Cement 50kg Bags',
        description: 'Premium quality Portland cement',
        category: 'Materials',
        sku: 'CEM50KG001',
        quantity: 200,
        current_stock: 200,
        unit: 'bags',
        threshold: 50,
        min_stock_level: 50,
        max_stock_level: 1000,
        location: 'Warehouse B - Section 2',
        cost: 800,
        selling_price: 950,
        supplier_info: {
            name: 'Lanka Cement Co',
            contact: 'Sunil Fernando',
            phone: '+94772345678'
        },
        status: 'active'
    },
    {
        name: 'Power Drill Set',
        description: 'Professional 18V cordless drill with accessories',
        category: 'Tools',
        sku: 'PDS18V001',
        quantity: 25,
        current_stock: 25,
        unit: 'sets',
        threshold: 5,
        min_stock_level: 5,
        max_stock_level: 50,
        location: 'Tool Storage - Rack 3',
        cost: 12000,
        selling_price: 15000,
        supplier_info: {
            name: 'Tool Master Lanka',
            contact: 'Ravi Wickramasinghe',
            phone: '+94773456789'
        },
        status: 'active'
    },
    {
        name: 'Safety Helmets',
        description: 'Industrial safety helmets - white',
        category: 'Safety',
        sku: 'SH001',
        quantity: 50,
        current_stock: 50,
        unit: 'pieces',
        threshold: 10,
        min_stock_level: 10,
        max_stock_level: 100,
        location: 'Safety Equipment Storage',
        cost: 800,
        selling_price: 1200,
        supplier_info: {
            name: 'Safety First Lanka',
            contact: 'Kamala Silva',
            phone: '+94774567890'
        },
        status: 'active'
    },
    {
        name: 'Electrical Wire 2.5mm',
        description: 'Copper electrical wire for house wiring',
        category: 'Electrical',
        sku: 'EW25MM001',
        quantity: 500,
        current_stock: 500,
        unit: 'meters',
        threshold: 100,
        min_stock_level: 100,
        max_stock_level: 2000,
        location: 'Electrical Section - Rack 1',
        cost: 25,
        selling_price: 35,
        supplier_info: {
            name: 'Lanka Wires Ltd',
            contact: 'Pradeep Mendis',
            phone: '+94775678901'
        },
        status: 'active'
    }
];

async function initializeSampleInventory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        logger.info('Connected to MongoDB');

        // Check if inventory already exists
        const existingCount = await Inventory.countDocuments();

        if (existingCount > 0) {
            logger.info(`Inventory already has ${existingCount} items. Skipping initialization.`);
            return;
        }

        // Create sample inventory items
        for (const item of sampleInventory) {
            try {
                await Inventory.create(item);
                logger.info(`Created inventory item: ${item.name}`);
            } catch (error) {
                logger.error(`Failed to create ${item.name}:`, error.message);
            }
        }

        logger.info('Sample inventory initialization completed');

        // Display summary
        const totalItems = await Inventory.countDocuments();
        const stats = await Inventory.getStatistics();

        logger.info('Inventory Summary:');
        logger.info(`Total Items: ${totalItems}`);
        logger.info(`Categories: ${JSON.stringify(stats.byCategory)}`);
        logger.info(`Total Value: Rs. ${stats.totalValue.toLocaleString()}`);

    } catch (error) {
        logger.error('Inventory initialization error:', error);
    } finally {
        await mongoose.connection.close();
        logger.info('Database connection closed');
    }
}

// Run the initialization
initializeSampleInventory();
