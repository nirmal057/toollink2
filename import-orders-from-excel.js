const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const EXCEL_FILE_PATH = path.join(__dirname, 'orders.xlsx');
const API_URL = 'http://localhost:3001/api/orders';
const API_TOKEN = ''; // Will need to be filled with a valid JWT token
const AUTH_URL = 'http://localhost:3001/api/auth/login';

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

// Transform data from Excel format to API format
function transformOrderData(excelOrders) {
    const materialIdMapping = {
        'Portland Cement': '60f1b2d15e8f6c2b58c71001',
        'White Cement': '60f1b2d15e8f6c2b58c71002',
        'Ready Mix Concrete': '60f1b2d15e8f6c2b58c71003',
        'Steel Rebar 12mm': '60f1b2d15e8f6c2b58c71004',
        'Steel Rebar 16mm': '60f1b2d15e8f6c2b58c71005',
        'Steel Angle Bar': '60f1b2d15e8f6c2b58c71006',
        'Galvanized Iron Sheet': '60f1b2d15e8f6c2b58c71007',
        'Red Clay Bricks': '60f1b2d15e8f6c2b58c71008',
        'Concrete Blocks': '60f1b2d15e8f6c2b58c71009',
        'Hollow Concrete Blocks': '60f1b2d15e8f6c2b58c71010',
        'River Sand': '60f1b2d15e8f6c2b58c71011',
        'Sea Sand': '60f1b2d15e8f6c2b58c71012',
        'Gravel 20mm': '60f1b2d15e8f6c2b58c71013',
        'Crushed Stone': '60f1b2d15e8f6c2b58c71014',
        'Clay Roof Tiles': '60f1b2d15e8f6c2b58c71015',
        'Asbestos Cement Sheets': '60f1b2d15e8f6c2b58c71016',
        'PVC Pipe 2 inch': '60f1b2d15e8f6c2b58c71017',
        'PVC Pipe 4 inch': '60f1b2d15e8f6c2b58c71018',
        'Emulsion Paint': '60f1b2d15e8f6c2b58c71019',
        'Wood Stain': '60f1b2d15e8f6c2b58c71020',
    };

    return excelOrders.map((row, index) => {
        // Use the field names as they appear in the Excel file
        const orderNumber = row['Order ID'] || row['Order No'] || `TL${Date.now().toString().substring(3)}-${index}`;

        // Extract customer information - make sure it's a string-based object
        const customer = {
            name: String(row['Customer Name'] || 'Unknown Customer'),
            email: String(row['Customer Email'] || `customer_${orderNumber}@example.com`),
            phone: String(row['Customer Phone'] || row['Phone'] || 'N/A'),
            address: {
                street: String(row['Delivery Address'] || row['Address'] || 'No address provided'),
                city: String(row['City'] || 'Colombo'),
                state: String(row['Province'] || 'Western Province'),
                postalCode: String(row['Postal Code'] || '00100'),
                country: String('Sri Lanka')
            }
        };

        // Create items array from primary item fields
        const items = [];

        // Add the main product if it exists
        if (row['Material'] && row['Quantity']) {
            const productName = row['Material'];
            const materialId = materialIdMapping[productName] || '60f1b2d15e8f6c2b58c71234'; // Default ID

            items.push({
                materialId,
                name: productName,
                quantity: Number(row['Quantity']) || 1,
                unitPrice: Number(row['Unit Price (LKR)'] || row['Unit Price'] || row['Price']) || 1000,
                unit: String(row['Unit'] || 'Unit'),
                notes: row['Item Notes'] || 'Order item from Excel import'
            });
        } else if (row['Product Name'] && row['Quantity']) {
            const productName = row['Product Name'];
            const materialId = materialIdMapping[productName] || '60f1b2d15e8f6c2b58c71234'; // Default ID

            items.push({
                materialId,
                name: productName,
                quantity: Number(row['Quantity']) || 1,
                unitPrice: Number(row['Unit Price'] || row['Price']) || 1000,
                unit: String(row['Unit'] || 'Unit'),
                notes: row['Item Notes'] || 'Order item from Excel import'
            });
        }

        // Add additional items if specified in the Excel sheet
        // For example: Product2, Quantity2, Price2
        for (let i = 2; i <= 5; i++) {
            const productKey = `Product${i}`;
            const quantityKey = `Quantity${i}`;
            const priceKey = `Price${i}`;

            if (row[productKey] && row[quantityKey]) {
                const productName = row[productKey];
                const materialId = materialIdMapping[productName] || '60f1b2d15e8f6c2b58c71234'; // Default ID

                items.push({
                    materialId,
                    name: productName,
                    quantity: Number(row[quantityKey]) || 1,
                    unitPrice: Number(row[priceKey]) || 1000,
                    notes: ''
                });
            }
        }

        // If no items were found, create a default item
        if (items.length === 0) {
            items.push({
                materialId: '60f1b2d15e8f6c2b58c71234',
                name: 'Portland Cement',
                quantity: 10,
                unitPrice: 1200,
                notes: 'Default item - actual items not specified in Excel'
            });
        }

        // Calculate pricing based on items
        let subtotal = 0;
        items.forEach(item => {
            subtotal += item.quantity * item.unitPrice;
        });

        const tax = Number(row['Tax'] || row['VAT']) || subtotal * 0.12; // Default 12% tax
        const deliveryCharges = Number(row['Delivery Charges'] || row['Delivery Fee']) || 2000; // Default 2000 LKR
        const total = Number(row['Total Amount'] || row['Total']) || (subtotal + tax + deliveryCharges);

        // Parse date from Excel (handle various formats)
        let deliveryDate = new Date();
        let orderDate = new Date();

        if (row['Delivery Date']) {
            // Try to parse the date in Excel format
            const excelDate = row['Delivery Date'];
            if (typeof excelDate === 'number') {
                // Excel stores dates as days since 1900-01-01
                deliveryDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
            } else {
                try {
                    deliveryDate = new Date(row['Delivery Date']);
                } catch (e) {
                    console.log(`Could not parse delivery date for order ${orderNumber}, using current date`);
                }
            }
        }

        if (row['Order Date']) {
            // Try to parse the date in Excel format
            const excelDate = row['Order Date'];
            if (typeof excelDate === 'number') {
                // Excel stores dates as days since 1900-01-01
                orderDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
            } else {
                try {
                    orderDate = new Date(row['Order Date']);
                } catch (e) {
                    console.log(`Could not parse order date for order ${orderNumber}, using current date`);
                }
            }
        }

        // Create full order object
        return {
            orderNumber,
            customer,
            items,
            deliveryDetails: {
                requestedDate: deliveryDate,
                timeSlot: row['Time Slot'] || '09:00-12:00',
                specialInstructions: row['Special Instructions'] || row['Instructions'] || ''
            },
            pricing: {
                subtotal,
                tax,
                deliveryCharges,
                total
            },
            status: row['Status'] || 'pending',
            orderDate: orderDate,
            paymentStatus: row['Payment Status'] || 'pending',
            paymentMethod: row['Payment Method'] || 'cash',
            notes: row['Notes'] || row['Order Notes'] || 'Order imported from Excel'
        };
    });
}

// Submit orders to API
async function submitOrdersToAPI(orders, apiUrl, token) {
    console.log(`Submitting ${orders.length} orders to API at ${apiUrl}`);

    const results = {
        success: [],
        failed: []
    };

    for (const order of orders) {
        try {
            // Format the order to match the expected schema
            const formattedOrder = {
                ...order,
                // Make sure customer is a proper nested object, not a reference
                customer: {
                    name: order.customer.name || 'Unknown Customer',
                    email: order.customer.email || `customer_${order.orderNumber}@example.com`,
                    phone: order.customer.phone || 'N/A',
                    address: {
                        street: order.customer.address?.street || 'No address provided',
                        city: order.customer.address?.city || 'Colombo',
                        state: order.customer.address?.state || 'Western Province',
                        postalCode: order.customer.address?.postalCode || '00100',
                        country: order.customer.address?.country || 'Sri Lanka'
                    }
                }
            };

            const response = await axios.post(apiUrl, formattedOrder, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 201 || response.status === 200) {
                console.log(`✅ Successfully created order: ${order.orderNumber}`);
                results.success.push({
                    orderNumber: order.orderNumber,
                    id: response.data.data._id
                });
            } else {
                console.error(`❌ Failed to create order ${order.orderNumber}: Unexpected status ${response.status}`);
                results.failed.push({
                    orderNumber: order.orderNumber,
                    error: `Unexpected status ${response.status}`
                });
            }
        } catch (error) {
            console.error(`❌ Error creating order ${order.orderNumber}:`, error.message);
            results.failed.push({
                orderNumber: order.orderNumber,
                error: error.response?.data?.message || error.message
            });
        }
    }

    return results;
}

// Login to get a token
async function login(credentials) {
    try {
        console.log(`🔑 Attempting to login with ${credentials.email}`);
        const response = await axios.post(AUTH_URL, credentials);

        if (response.data && response.data.success && response.data.data && response.data.data.token) {
            console.log('✅ Authentication successful');
            return response.data.data.token;
        } else if (response.data && response.data.token) {
            console.log('✅ Authentication successful');
            return response.data.token;
        } else {
            console.error('❌ Authentication failed: No token returned');
            console.log('Response:', JSON.stringify(response.data));
            return null;
        }
    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data));
        }
        return null;
    }
}

// Main execution function
async function importOrders() {
    try {
        console.log('\n🔄 Starting order import process...\n');

        // 1. Read data from Excel
        const excelData = readExcelFile(EXCEL_FILE_PATH);

        // 2. Transform data to API format
        const apiOrders = transformOrderData(excelData);

        // Display sample of transformed data
        console.log('\n📋 Sample of transformed order data:');
        console.log(JSON.stringify(apiOrders[0], null, 2));

        // 3. Login to get token if not provided
        let token = API_TOKEN;
        if (!token) {
            // Use the credentials from the AUTHENTICATION_CREDENTIALS_FIXED_COMPLETE.md file
            const credentials = {
                email: 'admin@toollink.lk',
                password: 'admin123'
            };

            token = await login(credentials);
            if (!token) {
                // Try alternative login credentials
                console.log('\n🔄 Trying alternative credentials...');
                const altCredentials = {
                    email: 'admin@toollink.com',
                    password: 'admin123'
                };
                token = await login(altCredentials);

                if (!token) {
                    console.error('❌ Cannot proceed without authentication token');
                    process.exit(1);
                }
            }
        }

        // 4. Submit orders to API
        const results = await submitOrdersToAPI(apiOrders, API_URL, token);

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
    }
}

// Execute the import
importOrders();
