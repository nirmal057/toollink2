// Check database users and create cashier if needed
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'ToolinkBackend', 'database', 'toolink.db');

console.log('🔍 Checking database for users...\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');
    
    // Check all users
    db.all('SELECT id, username, email, full_name, role, status FROM users', [], (err, rows) => {
        if (err) {
            console.error('❌ Query error:', err.message);
            return;
        }
        
        console.log('📊 Current users in database:');
        console.table(rows);
        
        // Check if cashier exists
        const cashier = rows.find(user => user.email === 'cashier@toollink.com');
        
        if (cashier) {
            console.log('\n✅ Cashier user found:', cashier);
        } else {
            console.log('\n❌ Cashier user NOT found!');
            console.log('💡 Need to create cashier user...');
        }
        
        db.close();
    });
});
