const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'ToolinkBackend', 'src', 'data', 'toolink.db');

console.log('🔍 Checking users in database...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');
});

// Check all users
db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
        console.error('❌ Error querying users:', err.message);
        return;
    }
    
    console.log('\n📊 Users in database:');
    console.log('='.repeat(50));
    
    if (rows.length === 0) {
        console.log('No users found in database');
    } else {
        rows.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Full Name: ${user.full_name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Status: ${user.status}`);
            console.log(`   Email Verified: ${user.email_verified}`);
            console.log(`   Password Hash: ${user.password_hash ? 'Present' : 'Missing'}`);
            console.log(`   Created: ${user.created_at}`);
            console.log(`   Last Login: ${user.last_login}`);
            console.log('');
        });
    }
    
    // Test password verification for admin user
    const adminUser = rows.find(user => user.email === 'admin@toollink.com');
    if (adminUser) {
        console.log('🔐 Testing password verification for admin user...');
        
        bcrypt.compare('admin123', adminUser.password_hash)
            .then(isValid => {
                if (isValid) {
                    console.log('✅ Password verification successful!');
                } else {
                    console.log('❌ Password verification failed!');
                }
                
                // Close database
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                    } else {
                        console.log('✅ Database connection closed');
                    }
                });
            })
            .catch(err => {
                console.error('❌ Password verification error:', err);
                db.close();
            });
    } else {
        console.log('❌ Admin user not found!');
        db.close();
    }
});
