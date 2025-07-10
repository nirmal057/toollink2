/**
 * Backend Fix and Restart Script
 * This script will ensure the database is properly initialized with inventory tables
 */

const { initialize, database } = require('./ToolinkBackend/src/config/database');
const path = require('path');
const fs = require('fs');

async function fixBackend() {
    console.log('🔧 Fixing Backend Database Schema...\n');

    try {
        // Initialize database with new schema
        console.log('1️⃣ Initializing database...');
        await initialize();
        console.log('✅ Database initialized successfully\n');

        // Check if inventory table exists
        console.log('2️⃣ Checking inventory table...');
        try {
            const result = await database.query("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory'");
            if (result && result.length > 0) {
                console.log('✅ Inventory table exists');
            } else {
                console.log('❌ Inventory table missing - this should have been created');
            }
        } catch (error) {
            console.log('⚠️ Could not check inventory table:', error.message);
        }

        // Check table structure
        console.log('3️⃣ Checking table structure...');
        try {
            const structure = await database.query("PRAGMA table_info(inventory)");
            console.log('✅ Inventory table structure:');
            if (Array.isArray(structure)) {
                structure.forEach(col => {
                    console.log(`   - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}`);
                });
            }
        } catch (error) {
            console.log('⚠️ Could not check table structure:', error.message);
        }

        // Test inventory operations
        console.log('\n4️⃣ Testing inventory operations...');
        try {
            // Try to insert a test item
            const testItem = {
                name: 'Test Item',
                description: 'Test description',
                category: 'Test Category',
                sku: 'TEST-001',
                current_stock: 10,
                min_stock_level: 5,
                max_stock_level: 100,
                unit_price: 25.99,
                location: 'Test Location',
                status: 'active'
            };

            const result = await database.execute(
                `INSERT INTO inventory (name, description, category, sku, current_stock, min_stock_level, max_stock_level, unit_price, location, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [testItem.name, testItem.description, testItem.category, testItem.sku, testItem.current_stock, 
                 testItem.min_stock_level, testItem.max_stock_level, testItem.unit_price, testItem.location, testItem.status]
            );

            console.log('✅ Test item inserted successfully, ID:', result.lastID);

            // Clean up test item
            await database.execute('DELETE FROM inventory WHERE sku = ?', ['TEST-001']);
            console.log('✅ Test item cleaned up');

        } catch (error) {
            console.log('❌ Inventory operations test failed:', error.message);
        }

        console.log('\n🎉 Backend fix completed!');
        console.log('\n📋 Next Steps:');
        console.log('1. Start the backend server: cd ToolinkBackend && npm start');
        console.log('2. Test the frontend inventory page');
        console.log('3. Check browser console for any remaining errors');

    } catch (error) {
        console.error('❌ Backend fix failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Make sure you are in the project root directory');
        console.log('2. Ensure ToolinkBackend folder exists');
        console.log('3. Check if SQLite database file is writable');
    }
}

// Run the fix
fixBackend().catch(console.error);
