import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI;

// Sample inventory data
const sampleInventory = [
    {
        name: 'Steel Bars 10mm',
        sku: 'STEEL-10MM-001',
        category: 'Materials',
        description: 'High quality steel bars 10mm diameter',
        quantity: 100,
        unit: 'pieces',
        unitPrice: 450.00,
        threshold: 20,
        location: 'Warehouse A-1',
        supplier: 'Steel Lanka Ltd',
        status: 'active',
        specifications: {
            material: 'Steel',
            diameter: '10mm',
            length: '6m',
            weight: '4.74kg'
        }
    },
    {
        name: 'Cement Bags',
        sku: 'CEMENT-50KG-001',
        category: 'Materials',
        description: 'Portland cement 50kg bags',
        quantity: 200,
        unit: 'pieces',
        unitPrice: 1850.00,
        threshold: 50,
        location: 'Warehouse B-2',
        supplier: 'Lanka Cement Co',
        status: 'active',
        specifications: {
            type: 'Portland Cement',
            weight: '50kg',
            grade: 'OPC 53'
        }
    },
    {
        name: 'Electrical Cables 2.5mm',
        sku: 'CABLE-2.5MM-001',
        category: 'Electrical',
        description: 'Copper electrical cables 2.5mm',
        quantity: 500,
        unit: 'meters',
        unitPrice: 125.00,
        threshold: 100,
        location: 'Warehouse C-3',
        supplier: 'Electric Solutions',
        status: 'active',
        specifications: {
            material: 'Copper',
            size: '2.5mm²',
            insulation: 'PVC',
            voltage: '750V'
        }
    },
    {
        name: 'Paint - White Matt',
        sku: 'PAINT-WHITE-001',
        category: 'Materials',
        description: 'Interior white matt paint',
        quantity: 75,
        unit: 'liters',
        unitPrice: 2250.00,
        threshold: 15,
        location: 'Warehouse D-4',
        supplier: 'Color World',
        status: 'active',
        specifications: {
            type: 'Water-based',
            finish: 'Matt',
            coverage: '12-14 sqm/liter',
            dryTime: '2-4 hours'
        }
    },
    {
        name: 'PVC Pipes 4 inch',
        sku: 'PVC-4INCH-001',
        category: 'Plumbing',
        description: 'PVC pipes 4 inch diameter',
        quantity: 150,
        unit: 'pieces',
        unitPrice: 890.00,
        threshold: 30,
        location: 'Warehouse E-5',
        supplier: 'Pipe Masters',
        status: 'active',
        specifications: {
            material: 'PVC',
            diameter: '4 inch',
            length: '6m',
            pressure: '6 bar'
        }
    }
];

// Inventory Schema (simplified for direct insert)
const inventorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    sku: { type: String, unique: true, required: true },
    category: { type: String, required: true },
    description: String,
    quantity: { type: Number, default: 0 },
    unit: { type: String, required: true },
    unitPrice: { type: Number, default: 0 },
    threshold: { type: Number, default: 10 },
    location: String,
    supplier: String,
    status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' },
    specifications: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

async function addSampleInventory() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('📦 Adding sample inventory items...');

        // Clear existing inventory
        await Inventory.deleteMany({});
        console.log('🗑️ Cleared existing inventory');

        // Insert sample data
        const insertedItems = await Inventory.insertMany(sampleInventory);
        console.log(`✅ Added ${insertedItems.length} inventory items`);

        // Display the added items
        console.log('\n📋 Added inventory items:');
        insertedItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name} (ID: ${item._id})`);
        });

        console.log('\n🎉 Sample inventory setup complete!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

addSampleInventory();
