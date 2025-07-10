const XLSX = require('xlsx');
const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Configuration
const EXCEL_FILE_PATH = path.join(__dirname, '..', 'orders.xlsx');
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'toollink';

// MongoDB Schemas
const MaterialSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    category: String,
    unit: String,
    price: {
        type: Number,
        required: true
    },
    quantityAvailable: {
        type: Number,
        default: 0
    }
});

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: String,
    customerPhone: String,
    deliveryAddress: {
        type: String,
        required: true
    },
    items: [{
        materialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Material'
        },
        materialName: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        unit: String,
        subtotal: Number
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'bank_transfer', 'cheque', 'other'],
        default: 'cash'
    },
    deliveryDate: Date,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Read the Excel file
async function readExcelFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            process.exit(1);
        }

        console.log(`Reading Excel file: ${filePath}`);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Direct conversion to objects with headers
        const orders = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Successfully read ${orders.length} orders from Excel file`);
        if (orders.length > 0) {
            console.log('Excel headers:', Object.keys(orders[0]).join(', '));
        }

        return orders;
    } catch (error) {
        console.error('Error reading Excel file:', error);
        process.exit(1);
    }
}

// Map order status to valid enum value
function mapOrderStatus(status) {
    if (!status) return 'pending';

    const statusStr = status.toLowerCase();

    if (statusStr.includes('scheduled')) return 'processing';
    if (statusStr.includes('pending')) return 'pending';
    if (statusStr.includes('confirm')) return 'confirmed';
    if (statusStr.includes('ship')) return 'shipped';
    if (statusStr.includes('deliver')) return 'delivered';
    if (statusStr.includes('complete')) return 'delivered';
    if (statusStr.includes('cancel')) return 'cancelled';

    return 'pending';
}

// Clean existing orders that might be problematic
async function cleanExistingOrders() {
    try {
        console.log('Cleaning up any problematic orders...');

        // Delete orders with no customer name or "Unknown Customer"
        const result = await mongoose.connection.db.collection('orders')
            .deleteMany({
                $or: [
                    { customerName: 'Unknown Customer' },
                    { customerName: { $exists: false } },
                    { customerName: '' },
                    { totalAmount: 0 }
                ]
            });

        console.log(`Cleaned up ${result.deletedCount} problematic orders`);
    } catch (error) {
        console.error('Error cleaning up orders:', error);
    }
}

// Import orders from Excel
async function importOrdersFromExcel(excelOrders) {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
        dbName: DB_NAME
    });
    console.log('Connected to MongoDB successfully');

    try {
        // Clean up any problematic orders first
        await cleanExistingOrders();

        // Set up models
        const Material = mongoose.model('Material', MaterialSchema);
        const Order = mongoose.model('Order', OrderSchema);

        console.log(`Importing ${excelOrders.length} orders to MongoDB...`);

        // Track results
        const results = {
            total: excelOrders.length,
            success: 0,
            failed: 0,
            errors: []
        };

        // First, prepare materials
        const materials = {};

        for (const order of excelOrders) {
            const materialName = order['Material'];
            const unitPrice = order['Unit Price (LKR)'] || 0;
            const unit = order['Unit'] || 'pcs';

            if (materialName && !materials[materialName]) {
                // Create a material code based on the name
                const code = `MAT-${materialName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

                materials[materialName] = {
                    code: code,
                    name: materialName,
                    description: `${materialName} - imported from Excel`,
                    category: 'Construction',
                    unit: unit,
                    price: unitPrice,
                    quantityAvailable: 100
                };
            }
        }

        // Save materials to database
        console.log(`Creating ${Object.keys(materials).length} materials...`);

        const materialDocs = {};
        for (const [name, material] of Object.entries(materials)) {
            try {
                // Check if material already exists
                let materialDoc = await Material.findOne({ name: name });

                if (!materialDoc) {
                    materialDoc = await Material.create(material);
                    console.log(`Created new material: ${name}`);
                } else {
                    // Update existing material
                    await Material.updateOne(
                        { _id: materialDoc._id },
                        {
                            $set: {
                                price: material.price,
                                unit: material.unit,
                                updatedAt: new Date()
                            }
                        }
                    );
                    console.log(`Updated existing material: ${name}`);
                }

                materialDocs[name] = materialDoc;
            } catch (error) {
                console.error(`Error creating material ${name}:`, error.message);
                results.errors.push({
                    material: name,
                    error: error.message
                });
            }
        }

        // Now process orders
        for (const orderData of excelOrders) {
            try {
                const orderNumber = 'ORD-' + orderData['Order ID'].toString().padStart(6, '0');
                const materialName = orderData['Material'];
                const material = materialDocs[materialName];

                if (!material) {
                    throw new Error(`Material ${materialName} not found in database`);
                }

                // Create order items
                const quantity = orderData['Quantity'] || 1;
                const unitPrice = orderData['Unit Price (LKR)'] || 0;
                const subtotal = quantity * unitPrice;
                const totalAmount = orderData['Total Price (LKR)'] || subtotal;

                const orderItem = {
                    materialId: material._id,
                    materialName: material.name,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    unit: material.unit,
                    subtotal: subtotal
                };

                // Create or update the order
                const existingOrder = await Order.findOne({ orderNumber });

                if (existingOrder) {
                    // Update existing order
                    await Order.updateOne(
                        { _id: existingOrder._id },
                        {
                            $set: {
                                customerName: orderData['Customer Name'],
                                deliveryAddress: 'Customer Address',
                                items: [orderItem],
                                totalAmount: totalAmount,
                                status: mapOrderStatus(orderData['Status']),
                                deliveryDate: orderData['Delivery Date'] ? new Date(orderData['Delivery Date']) : null,
                                createdAt: orderData['Order Date'] ? new Date(orderData['Order Date']) : new Date(),
                                updatedAt: new Date()
                            }
                        }
                    );

                    console.log(`Updated order: ${orderNumber}`);
                    results.success++;
                } else {
                    // Create new order
                    await Order.create({
                        orderNumber: orderNumber,
                        customerName: orderData['Customer Name'],
                        customerEmail: '',
                        customerPhone: '',
                        deliveryAddress: 'Customer Address',
                        items: [orderItem],
                        totalAmount: totalAmount,
                        status: mapOrderStatus(orderData['Status']),
                        paymentStatus: 'pending',
                        paymentMethod: 'cash',
                        deliveryDate: orderData['Delivery Date'] ? new Date(orderData['Delivery Date']) : null,
                        notes: '',
                        createdAt: orderData['Order Date'] ? new Date(orderData['Order Date']) : new Date(),
                        updatedAt: new Date()
                    });

                    console.log(`Created new order: ${orderNumber}`);
                    results.success++;
                }
            } catch (error) {
                console.error(`Error processing order ${orderData['Order ID']}:`, error.message);
                results.failed++;
                results.errors.push({
                    order: orderData['Order ID'],
                    error: error.message
                });
            }
        }

        console.log('\nImport completed with results:', results);
        console.log(`Successfully imported/updated ${results.success} orders`);

        if (results.failed > 0) {
            console.log(`Failed to import ${results.failed} orders`);
            console.log('Errors:', JSON.stringify(results.errors, null, 2));
        }

        return results;
    } catch (error) {
        console.error('Error during import process:', error);
        throw error;
    } finally {
        // Close the MongoDB connection
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Main function
async function main() {
    try {
        // Read Excel file
        const excelOrders = await readExcelFile(EXCEL_FILE_PATH);

        // Import orders
        await importOrdersFromExcel(excelOrders);

    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

// Run the main function
main();
