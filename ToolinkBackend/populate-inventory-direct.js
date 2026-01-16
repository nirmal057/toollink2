import mongoose from 'mongoose';
import Inventory from './src/models/Inventory.js';
import User from './src/models/User.js';
import { config } from 'dotenv';

// Load environment variables
config();

// MongoDB connection
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Sample inventory data for each category
const inventoryItems = [
    // Cement
    { name: 'Portland Cement 50kg', category: 'Cement', quantity: 100, price: 850, location: 'A1', description: 'High quality Portland cement for construction', unit: 'kg', threshold: 20, min_stock_level: 20, max_stock_level: 500, selling_price: 850 },
    { name: 'Quick Setting Cement 25kg', category: 'Cement', quantity: 75, price: 450, location: 'A2', description: 'Fast setting cement for quick projects', unit: 'kg', threshold: 15, min_stock_level: 15, max_stock_level: 300, selling_price: 450 },

    // Steel & Reinforcement
    { name: 'Steel Rebar 12mm', category: 'Steel & Reinforcement', quantity: 200, price: 1200, location: 'B1', description: 'High tensile steel reinforcement bars', unit: 'pieces', threshold: 30, min_stock_level: 30, max_stock_level: 800, selling_price: 1200 },
    { name: 'Steel Mesh 6mm', category: 'Steel & Reinforcement', quantity: 50, price: 2500, location: 'B2', description: 'Welded steel mesh for concrete reinforcement', unit: 'sheets', threshold: 10, min_stock_level: 10, max_stock_level: 200, selling_price: 2500 },

    // Paint & Chemicals
    { name: 'Exterior Wall Paint 4L', category: 'Paint & Chemicals', quantity: 30, price: 3200, location: 'C1', description: 'Weather resistant exterior paint', unit: 'liters', threshold: 5, min_stock_level: 5, max_stock_level: 100, selling_price: 3200 },
    { name: 'Primer Sealer 1L', category: 'Paint & Chemicals', quantity: 45, price: 1800, location: 'C2', description: 'Multi-surface primer and sealer', unit: 'liters', threshold: 8, min_stock_level: 8, max_stock_level: 150, selling_price: 1800 },

    // Electrical Items
    { name: 'PVC Electrical Conduit 20mm', category: 'Electrical Items', quantity: 120, price: 180, location: 'D1', description: 'Flexible PVC electrical conduit', unit: 'meters', threshold: 20, min_stock_level: 20, max_stock_level: 500, selling_price: 180 },
    { name: 'LED Bulb 15W', category: 'Electrical Items', quantity: 80, price: 450, location: 'D2', description: 'Energy efficient LED bulb', unit: 'pieces', threshold: 15, min_stock_level: 15, max_stock_level: 300, selling_price: 450 },

    // Plumbing Supplies
    { name: 'PVC Pipe 25mm x 3m', category: 'Plumbing Supplies', quantity: 60, price: 650, location: 'E1', description: 'High pressure PVC water pipe', unit: 'pieces', threshold: 12, min_stock_level: 12, max_stock_level: 250, selling_price: 650 },
    { name: 'Brass Gate Valve 1/2"', category: 'Plumbing Supplies', quantity: 25, price: 850, location: 'E2', description: 'Heavy duty brass gate valve', unit: 'pieces', threshold: 5, min_stock_level: 5, max_stock_level: 100, selling_price: 850 },

    // Tools & Equipment
    { name: 'Electric Drill 500W', category: 'Tools & Equipment', quantity: 15, price: 4500, location: 'F1', description: 'Professional electric drill with bits', unit: 'pieces', threshold: 3, min_stock_level: 3, max_stock_level: 50, selling_price: 4500 },
    { name: 'Hand Saw 22"', category: 'Tools & Equipment', quantity: 20, price: 1200, location: 'F2', description: 'Sharp hand saw for wood cutting', unit: 'pieces', threshold: 4, min_stock_level: 4, max_stock_level: 80, selling_price: 1200 },

    // Hardware & Fasteners
    { name: 'Wood Screws 4x50mm (100pc)', category: 'Hardware & Fasteners', quantity: 40, price: 380, location: 'G1', description: 'Zinc plated wood screws pack', unit: 'boxes', threshold: 8, min_stock_level: 8, max_stock_level: 160, selling_price: 380 },
    { name: 'Hex Bolts M10x60mm (10pc)', category: 'Hardware & Fasteners', quantity: 35, price: 420, location: 'G2', description: 'High tensile hex bolts with nuts', unit: 'boxes', threshold: 7, min_stock_level: 7, max_stock_level: 140, selling_price: 420 },

    // Tiles & Ceramics
    { name: 'Ceramic Floor Tiles 30x30cm', category: 'Tiles & Ceramics', quantity: 80, price: 2200, location: 'H1', description: 'Non-slip ceramic floor tiles per sqm', unit: 'pieces', threshold: 16, min_stock_level: 16, max_stock_level: 320, selling_price: 2200 },
    { name: 'Wall Tiles 20x20cm', category: 'Tiles & Ceramics', quantity: 60, price: 1800, location: 'H2', description: 'Glossy ceramic wall tiles per sqm', unit: 'pieces', threshold: 12, min_stock_level: 12, max_stock_level: 240, selling_price: 1800 },

    // Roofing Materials
    { name: 'Corrugated Iron Sheets 3m', category: 'Roofing Materials', quantity: 40, price: 1500, location: 'I1', description: 'Galvanized corrugated roofing sheets', unit: 'sheets', threshold: 8, min_stock_level: 8, max_stock_level: 160, selling_price: 1500 },
    { name: 'Roof Tiles Clay 350mm', category: 'Roofing Materials', quantity: 200, price: 85, location: 'I2', description: 'Traditional clay roof tiles', unit: 'pieces', threshold: 40, min_stock_level: 40, max_stock_level: 800, selling_price: 85 },

    // Safety Equipment
    { name: 'Safety Helmet Yellow', category: 'Safety Equipment', quantity: 30, price: 850, location: 'J1', description: 'ANSI approved safety helmet', unit: 'pieces', threshold: 6, min_stock_level: 6, max_stock_level: 120, selling_price: 850 },
    { name: 'Safety Goggles Clear', category: 'Safety Equipment', quantity: 25, price: 320, location: 'J2', description: 'Impact resistant safety goggles', unit: 'pieces', threshold: 5, min_stock_level: 5, max_stock_level: 100, selling_price: 320 },

    // Sand & Aggregate
    { name: 'River Sand per Cube', category: 'Sand & Aggregate', quantity: 50, price: 3500, location: 'K1', description: 'Clean washed river sand', unit: 'units', threshold: 10, min_stock_level: 10, max_stock_level: 200, selling_price: 3500 },
    { name: 'Crushed Stone 20mm per Cube', category: 'Sand & Aggregate', quantity: 30, price: 4200, location: 'K2', description: 'Graded crushed stone aggregate', unit: 'units', threshold: 6, min_stock_level: 6, max_stock_level: 120, selling_price: 4200 },

    // Bricks
    { name: 'Red Clay Bricks (100pc)', category: 'Bricks', quantity: 20, price: 1800, location: 'L1', description: 'Standard red clay building bricks', unit: 'sets', threshold: 4, min_stock_level: 4, max_stock_level: 80, selling_price: 1800 },
    { name: 'Concrete Blocks 200x200x400mm', category: 'Bricks', quantity: 150, price: 180, location: 'L2', description: 'Hollow concrete masonry blocks', unit: 'pieces', threshold: 30, min_stock_level: 30, max_stock_level: 600, selling_price: 180 },

    // Stones
    { name: 'Granite Slabs 600x300mm', category: 'Stones', quantity: 25, price: 2800, location: 'M1', description: 'Polished granite slabs for countertops', unit: 'pieces', threshold: 5, min_stock_level: 5, max_stock_level: 100, selling_price: 2800 },
    { name: 'Limestone Blocks 400x200x200mm', category: 'Stones', quantity: 40, price: 650, location: 'M2', description: 'Natural limestone building blocks', unit: 'pieces', threshold: 8, min_stock_level: 8, max_stock_level: 160, selling_price: 650 }
];

const populateInventory = async () => {
    try {
        console.log('🔄 Starting inventory population...');

        // Get admin user ID
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            throw new Error('Admin user not found. Please ensure admin user exists.');
        }
        console.log(`👤 Using admin user: ${adminUser.email}`);

        // Clear existing inventory (optional - remove if you want to keep existing items)
        // await Inventory.deleteMany({});
        // console.log('🗑️ Cleared existing inventory');

        // Add new inventory items
        for (const item of inventoryItems) {
            try {
                // Check if item already exists (by name)
                const existingItem = await Inventory.findOne({ name: item.name });
                if (existingItem) {
                    console.log(`⚠️ Item "${item.name}" already exists, skipping...`);
                    continue;
                }

                // Add created_by field
                const itemWithCreator = {
                    ...item,
                    created_by: adminUser._id,
                    current_stock: item.quantity
                };

                const newItem = new Inventory(itemWithCreator);
                await newItem.save();
                console.log(`✅ Added: ${item.name} (${item.category})`);
            } catch (error) {
                console.error(`❌ Failed to add ${item.name}:`, error.message);
            }
        }

        console.log('🎉 Inventory population completed!');

        // Show summary
        const summary = await Inventory.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        console.log('\n📊 Inventory Summary by Category:');
        summary.forEach(cat => {
            console.log(`  ${cat._id}: ${cat.count} items`);
        });

    } catch (error) {
        console.error('❌ Error populating inventory:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the population
connectDB().then(() => {
    populateInventory();
});
