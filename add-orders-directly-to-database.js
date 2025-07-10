const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Configuration
const EXCEL_FILE_PATH = path.join(__dirname, 'orders.xlsx');

// MongoDB Atlas connection string from ToolinkBackend/.env
const MONGODB_URI = 'mongodb+srv://iit21083:k1zTsck8hslcFiZm@cluster0.q0grz0.mongodb.net/toollink?retryWrites=true&w=majority&appName=Cluster0';

// Check if MongoDB is available via environment variable (like in production)
if (process.env.MONGODB_URI) {
    MONGODB_URI = process.env.MONGODB_URI;
}

// Define the MongoDB schemas
const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        name: { type: String, required: true },
        email: String,
        phone: String,
        address: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String
        }
    },
    items: [{
        materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
        name: String,
        quantity: { type: Number, required: true },
        unitPrice: Number,
        totalPrice: Number,
        unit: String,
        notes: String
    }],
    deliveryDetails: {
        requestedDate: { type: Date, required: true },
        timeSlot: String,
        specialInstructions: String
    },
    pricing: {
        subtotal: { type: Number, required: true },
        tax: Number,
        deliveryCharges: Number,
        total: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'confirmed', 'processing', 'ready', 'in-delivery', 'delivered', 'completed', 'cancelled', 'returned'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'bank-transfer', 'check', 'credit'],
        default: 'cash'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    notes: String
}, { timestamps: true });

// Create the Order model
const Order = mongoose.model('Order', OrderSchema);

// Read the Excel file
function readExcelFile(filePath) {
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
        console.log('Excel headers:', Object.keys(orders[0]).join(', '));

        return orders;
    } catch (error) {
        console.error('Error reading Excel file:', error);
        process.exit(1);
    }
}

// Transform data from Excel format to MongoDB format
function transformOrderData(excelOrders) {
    return excelOrders.map((row, index) => {
        // Generate a TL order number in the format TL + timestamp suffix
        const timestamp = Date.now();
        const orderNumber = `TL-${timestamp}-${index + 1}`;

        // Extract customer information
        const sanitizedOrderNumber = typeof orderNumber === 'string' ?
            orderNumber.replace(/[^a-zA-Z0-9]/g, '') :
            `order${index}`;

        const customer = {
            name: row['Customer Name'] || 'Unknown Customer',
            email: `customer_order${index}@example.com`,
            phone: row['Customer Phone'] || '+94 77 1234567',
            address: {
                street: row['Delivery Address'] || '123 Main Street',
                city: row['City'] || 'Colombo',
                state: row['Province'] || 'Western Province',
                postalCode: row['Postal Code'] || '00100',
                country: 'Sri Lanka'
            }
        };

        // Create items array from the material, quantity, and price
        const items = [];

        if (row['Material'] && row['Quantity']) {
            const materialName = row['Material'];
            const quantity = Number(row['Quantity']) || 1;
            const unitPrice = Number(row['Unit Price (LKR)']) || 1000;
            const totalPrice = unitPrice * quantity;

            items.push({
                materialId: new mongoose.Types.ObjectId(), // Generate a new ObjectId
                name: materialName,
                quantity: quantity,
                unitPrice: unitPrice,
                totalPrice: totalPrice,
                unit: row['Unit'] || 'pcs',
                notes: ''
            });
        }

        // If no items were found, create a default item
        if (items.length === 0) {
            items.push({
                materialId: new mongoose.Types.ObjectId(),
                name: 'Portland Cement',
                quantity: 10,
                unitPrice: 1200,
                totalPrice: 12000,
                unit: 'bags',
                notes: 'Default item - actual items not specified in Excel'
            });
        }

        // Calculate pricing based on items
        let subtotal = 0;
        items.forEach(item => {
            subtotal += item.totalPrice;
        });

        const tax = subtotal * 0.12; // 12% tax
        const deliveryCharges = 2000; // Fixed delivery charge of 2000 LKR
        const total = Number(row['Total Price (LKR)']) || subtotal + tax + deliveryCharges;

        // Parse date from Excel
        let orderDate = new Date();
        if (row['Order Date']) {
            try {
                // Try to handle Excel date format
                const excelDate = row['Order Date'];
                if (typeof excelDate === 'number') {
                    // Excel stores dates as days since 1900-01-01
                    orderDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                } else {
                    orderDate = new Date(row['Order Date']);
                }
            } catch (e) {
                console.log(`Could not parse order date for ${orderNumber}, using current date`);
            }
        }

        let deliveryDate = new Date();
        deliveryDate.setDate(orderDate.getDate() + 3); // Default to 3 days after order date

        if (row['Delivery Date']) {
            try {
                const excelDate = row['Delivery Date'];
                if (typeof excelDate === 'number') {
                    deliveryDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                } else {
                    deliveryDate = new Date(row['Delivery Date']);
                }
            } catch (e) {
                console.log(`Could not parse delivery date for ${orderNumber}, using default`);
            }
        }

        // Map status names
        const statusMap = {
            'Scheduled': 'confirmed',
            'Delivered': 'delivered',
            'Pending': 'pending',
            'Processing': 'processing',
            'Cancelled': 'cancelled'
        };

        const status = statusMap[row['Status']] || 'pending';

        // Create full order object in MongoDB format
        return {
            orderNumber,
            customer,
            items,
            deliveryDetails: {
                requestedDate: deliveryDate,
                timeSlot: '09:00-12:00',
                specialInstructions: ''
            },
            pricing: {
                subtotal,
                tax,
                deliveryCharges,
                total
            },
            status,
            paymentStatus: 'pending',
            paymentMethod: 'cash',
            createdAt: orderDate,
            updatedAt: new Date(),
            notes: ''
        };
    });
}

// Save orders to MongoDB
async function saveOrdersToMongoDB(orders) {
    console.log(`\n📥 Saving ${orders.length} orders to MongoDB...`);

    const results = {
        success: [],
        failed: []
    };

    for (const orderData of orders) {
        try {
            const order = new Order(orderData);
            await order.save();

            console.log(`✅ Successfully saved order: ${orderData.orderNumber}`);
            results.success.push({
                orderNumber: orderData.orderNumber,
                id: order._id.toString()
            });
        } catch (error) {
            console.error(`❌ Failed to save order ${orderData.orderNumber}:`, error.message);
            results.failed.push({
                orderNumber: orderData.orderNumber,
                error: error.message
            });
        }
    }

    return results;
}

// Main function
async function importOrders() {
    try {
        console.log('\n🔄 Starting order import process to MongoDB...\n');

        // 1. Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // 2. Read data from Excel
        const excelData = readExcelFile(EXCEL_FILE_PATH);

        // 3. Transform data to MongoDB format
        const mongoOrders = transformOrderData(excelData);

        // Display sample of transformed data
        console.log('\n📋 Sample of transformed order data:');
        console.log(JSON.stringify(mongoOrders[0], null, 2));

        // 4. Save to MongoDB
        const results = await saveOrdersToMongoDB(mongoOrders);

        // 5. Report results
        console.log('\n📊 Import Results:');
        console.log(`✅ Successfully imported: ${results.success.length} orders`);
        console.log(`❌ Failed to import: ${results.failed.length} orders\n`);

        // Save results to file
        const resultsFilePath = path.join(__dirname, 'orders-import-results.json');
        fs.writeFileSync(resultsFilePath, JSON.stringify(results, null, 2));
        console.log(`📝 Results saved to: ${resultsFilePath}`);

    } catch (error) {
        console.error('❌ Error during import process:', error);
    } finally {
        // Close the MongoDB connection
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    }
}

// Execute the import
importOrders();
