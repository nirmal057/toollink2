# Excel Data Import Completed Successfully

## Overview

The data from the Excel files (`users.xlsx` and `orders.xlsx`) has been successfully imported into the MongoDB database.

## Import Date: July 10, 2025

## Files Imported

1. `E:\Project 2\users.xlsx` - User data imported to the Users collection
2. `E:\Project 2\orders.xlsx` - Order data imported to the Orders collection

## Import Results

### Users Import
- Source: `E:\Project 2\users.xlsx`
- Total records: 10
- Successfully imported: 10
- Failed records: 0

The user records from the Excel file have been successfully imported with the following field mappings:
- `User ID` → Internal ID
- `Name` → Split into firstName and lastName
- `Role` → Mapped to system roles (admin, manager, cashier, customer)
- `Email` → email
- `Contact Number` → phoneNumber
- `Address` → address

### Orders Import
- Source: `E:\Project 2\orders.xlsx`
- Total records: 10
- Successfully imported: 10
- Failed records: 0

The order records from the Excel file have been successfully imported with the following field mappings:
- `Order ID` → orderNumber (with 'ORD-' prefix)
- `Customer Name` → customerName
- `Material` → materialName for order items
- `Quantity` → quantity for order items
- `Unit` → unit for order items
- `Unit Price (LKR)` → unitPrice for order items
- `Total Price (LKR)` → totalAmount
- `Order Date` → createdAt
- `Delivery Date` → deliveryDate
- `Status` → Mapped to system statuses (pending, processing, delivered, etc.)

## Database Status After Import

### Collections
- users: 60 total documents
- orders: 51 total documents
- materials: 10 total documents

### Sample Data
The imported user and order data can be verified in the MongoDB database and is accessible through the ToolLink application.

## How to Access the Data

The data is now accessible through:

1. The ToolLink Web Application:
   - URL: http://localhost:5173
   - Backend API: http://localhost:5000

2. MongoDB directly:
   - Connection URI is stored in the `.env` file
   - Database name: toollink

## Next Steps

1. Log in to the ToolLink application using the credentials of the imported users:
   - Admin users: admin1@toollink.lk, admin2@toollink.lk (password: toollink123)
   - Manager users: manager1@toollink.lk, manager2@toollink.lk (password: toollink123)
   - Cashier users: cashier1@toollink.lk, cashier2@toollink.lk (password: toollink123)
   - Customer users: customer1@toollink.lk, customer2@toollink.lk (password: toollink123)

2. Navigate to the Order Management section to view the imported orders.

3. Navigate to the User Management section to view and manage the imported users.

## Scripts Created

The following scripts were created to facilitate the import:
1. `import-users-from-excel.js` - For importing user data from Excel
2. `import-orders-from-excel.js` - For importing order data from Excel
3. `verify-imported-data.js` - For verifying the imported data

These scripts are located in the `ToolinkBackend` directory.

---
