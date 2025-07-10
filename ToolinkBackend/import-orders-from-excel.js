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

// Get or create material
async function getOrCreateMaterial(materialData, Material) {
    // Try to find existing material by code or name
    let material = await Material.findOne({
        $or: [
            { code: materialData.code },
            { name: materialData.name }
        ]
    });

    // If material doesn't exist, create it
    if (!material) {
        console.log(`Creating new material: ${materialData.name}`);
        material = await Material.create({
            code: materialData.code || `MAT-${Math.floor(Math.random() * 10000)}`,
            name: materialData.name,
            description: materialData.description || `${materialData.name} material`,
            category: materialData.category || 'General',
            unit: materialData.unit || 'pcs',
            price: materialData.price || 0,
            quantityAvailable: materialData.quantity || 100
        });
    }

    return material;
}

// Get user by email, name or id
async function getUserByIdentifier(identifier, User) {
    // Check if the identifier is an email
    const user = await User.findOne({
        $or: [
            { email: identifier },
            { username: identifier },
            { _id: mongoose.Types.ObjectId.isValid(identifier) ? identifier : null },
            {
                $and: [
                    { firstName: { $regex: new RegExp(identifier.split(' ')[0], 'i') } },
                    { lastName: { $regex: new RegExp(identifier.split(' ')[1] || '', 'i') } }
                ]
            }
        ]
    });

    return user;
}

// Generate a unique order number
function generateOrderNumber() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
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
    if (statusStr.includes('cancel')) return 'cancelled';
    if (statusStr.includes('complete')) return 'delivered';

    return 'pending';
}

// Transform data from Excel format to MongoDB format
async function transformOrderData(excelOrders, models) {
    const { User, Material } = models;
    const transformedOrders = [];

    // Get all materials first to avoid repetitive queries
    const materials = await Material.find({});
    const materialsByName = {};
    materials.forEach(material => {
        materialsByName[material.name.toLowerCase()] = material;
    });

    // Get all users
    const users = await User.find({});
    const usersByEmail = {};
    const usersByName = {};
    users.forEach(user => {
        if (user.email) usersByEmail[user.email.toLowerCase()] = user;
        if (user.firstName && user.lastName) {
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            usersByName[fullName] = user;
        }
    });

    for (const order of excelOrders) {
        try {
            // Find customer by the 'Customer Name' field
            let customer = null;
            if (order['Customer Name']) {
                customer = await getUserByIdentifier(order['Customer Name'], User);
            }

            // Process order items
            const items = [];
            let totalAmount = 0;

            // Use the 'Material', 'Quantity', 'Unit Price (LKR)' fields from the Excel file
            if (order['Material']) {
                const materialName = order['Material'];
                const quantity = order['Quantity'] || 1;
                const unitPrice = order['Unit Price (LKR)'] || 0;

                // Find material
                let material = materialsByName[materialName.toLowerCase()];
                if (!material) {
                    material = await getOrCreateMaterial({
                        name: materialName,
                        price: unitPrice,
                        unit: order['Unit'] || 'pcs',
                        code: `MAT-${Math.floor(Math.random() * 10000)}`
                    }, Material);
                    materialsByName[materialName.toLowerCase()] = material;
                }

                const subtotal = quantity * unitPrice;
                totalAmount += subtotal;

                items.push({
                    materialId: material._id,
                    materialName: material.name,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    unit: material.unit,
                    subtotal: subtotal
                });
            }
            // If we have items as a JSON string or array
            else if (order.items) {
                let orderItems = [];

                if (typeof order.items === 'string') {
                    try {
                        orderItems = JSON.parse(order.items);
                    } catch (e) {
                        console.warn(`Could not parse items for order: ${order.orderNumber || 'unknown'}`);
                        orderItems = [];
                    }
                } else if (Array.isArray(order.items)) {
                    orderItems = order.items;
                }

                for (const item of orderItems) {
                    const materialName = item.materialName || item.name || item.item;
                    const quantity = item.quantity || 1;
                    const unitPrice = item.unitPrice || item.price || 0;

                    // Find material
                    let material = materialsByName[materialName.toLowerCase()];
                    if (!material) {
                        material = await getOrCreateMaterial({
                            name: materialName,
                            price: unitPrice,
                            unit: item.unit || 'pcs',
                            code: `MAT-${Math.floor(Math.random() * 10000)}`
                        }, Material);
                        materialsByName[materialName.toLowerCase()] = material;
                    }

                    const subtotal = quantity * unitPrice;
                    totalAmount += subtotal;

                    items.push({
                        materialId: material._id,
                        materialName: material.name,
                        quantity: quantity,
                        unitPrice: unitPrice,
                        unit: material.unit,
                        subtotal: subtotal
                    });
                }
            }            // Use 'Total Price (LKR)' from Excel if available
            if (order['Total Price (LKR)']) {
                totalAmount = order['Total Price (LKR)'];
            }

            const transformedOrder = {
                orderNumber: 'ORD-' + (order['Order ID'] ? order['Order ID'].toString().padStart(6, '0') : generateOrderNumber()),
                customerId: customer ? customer._id : null,
                customerName: order['Customer Name'] || 'Unknown Customer',
                customerEmail: customer ? customer.email : '',
                customerPhone: customer ? customer.phoneNumber : '',
                deliveryAddress: customer ? customer.address : 'Default Address',
                items: items,
                totalAmount: totalAmount,
                status: mapOrderStatus(order['Status']),
                paymentStatus: 'pending',
                paymentMethod: 'cash',
                deliveryDate: order['Delivery Date'] ? new Date(order['Delivery Date']) : null,
                notes: '',
                createdAt: order['Order Date'] ? new Date(order['Order Date']) : new Date(),
                updatedAt: new Date()
            };

            transformedOrders.push(transformedOrder);
        } catch (error) {
            console.error(`Error transforming order:`, error);
            console.error('Problematic order data:', JSON.stringify(order, null, 2));
        }
    }

    return transformedOrders;
}

// Import orders to MongoDB
async function importOrdersToDB(orders) {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            dbName: DB_NAME
        });
        console.log('Connected to MongoDB successfully');

        // Get or create models
        const User = mongoose.model('User', mongoose.model.hasOwnProperty('User') ?
            mongoose.model.User.schema : new mongoose.Schema({
                username: String,
                email: String,
                firstName: String,
                lastName: String,
                phoneNumber: String,
                address: String
            })
        );

        const Material = mongoose.model('Material', mongoose.model.hasOwnProperty('Material') ?
            mongoose.model.Material.schema : MaterialSchema
        );

        const Order = mongoose.model('Order', mongoose.model.hasOwnProperty('Order') ?
            mongoose.model.Order.schema : OrderSchema
        );

        console.log('Models initialized');

        // Transform orders with access to User and Material models
        const transformedOrders = await transformOrderData(orders, { User, Material });

        console.log(`Importing ${transformedOrders.length} orders to MongoDB...`);

        // Track results
        const results = {
            total: transformedOrders.length,
            success: 0,
            failed: 0,
            errors: []
        };

        // Import orders one by one to handle duplicates gracefully
        for (const order of transformedOrders) {
            try {
                // Check if order with same orderNumber already exists
                const existingOrder = await Order.findOne({ orderNumber: order.orderNumber });

                if (existingOrder) {
                    console.log(`Order already exists: ${order.orderNumber}. Updating...`);

                    // Update existing order
                    await Order.updateOne(
                        { _id: existingOrder._id },
                        { $set: { ...order, updatedAt: new Date() } }
                    );

                    results.success++;
                } else {
                    // Create new order
                    await Order.create(order);
                    results.success++;
                }
            } catch (error) {
                console.error(`Error importing order ${order.orderNumber}:`, error.message);
                results.failed++;
                results.errors.push({
                    orderNumber: order.orderNumber,
                    error: error.message
                });
            }
        }

        console.log('Import completed with results:', results);
        console.log(`Successfully imported/updated ${results.success} orders`);

        if (results.failed > 0) {
            console.log(`Failed to import ${results.failed} orders`);
            console.log('Errors:', JSON.stringify(results.errors, null, 2));
        }

        // Save results to file
        fs.writeFileSync(
            path.join(__dirname, 'order-import-results.json'),
            JSON.stringify(results, null, 2)
        );

        return results;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    } finally {
        // Close the MongoDB connection
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Main function to run the import
async function main() {
    try {
        // 1. Read Excel file
        const excelOrders = await readExcelFile(EXCEL_FILE_PATH);

        // 2. Import to MongoDB - transformation is handled inside
        await importOrdersToDB(excelOrders);

    } catch (error) {
        console.error('An error occurred during the import process:', error);
        process.exit(1);
    }
}

// Run the import process
main();
