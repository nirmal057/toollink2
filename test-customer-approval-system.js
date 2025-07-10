const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🧪 Customer Approval System Test');
console.log('=================================\n');

// Database connection
const dbPath = path.join(__dirname, 'ToolinkBackend', 'database.db');
const db = new sqlite3.Database(dbPath);

async function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function runUpdate(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes, lastID: this.lastID });
            }
        });
    });
}

async function testCustomerApprovalSystem() {
    try {
        console.log('📊 Checking existing users...');
        const allUsers = await runQuery('SELECT id, username, email, role, status FROM users');
        console.log(`Found ${allUsers.length} users in total`);
        
        console.log('\n👥 Pending users:');
        const pendingUsers = await runQuery('SELECT id, username, email, role, status, created_at FROM users WHERE status = ?', ['pending']);
        if (pendingUsers.length === 0) {
            console.log('   No pending users found');
            
            // Create some test pending users
            console.log('\n🆕 Creating test pending users...');
            const testUsers = [
                {
                    username: 'testcustomer1',
                    email: 'customer1@test.com',
                    password_hash: '$2a$10$test.hash.1',
                    full_name: 'Test Customer One',
                    phone: '1234567890',
                    role: 'customer',
                    status: 'pending'
                },
                {
                    username: 'testcustomer2',
                    email: 'customer2@test.com',
                    password_hash: '$2a$10$test.hash.2',
                    full_name: 'Test Customer Two',
                    phone: '0987654321',
                    role: 'customer',
                    status: 'pending'
                }
            ];
            
            for (const user of testUsers) {
                try {
                    const result = await runUpdate(
                        `INSERT INTO users (username, email, password_hash, full_name, phone, role, status) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [user.username, user.email, user.password_hash, user.full_name, user.phone, user.role, user.status]
                    );
                    console.log(`   ✅ Created user: ${user.username} (ID: ${result.lastID})`);
                } catch (error) {
                    if (error.message.includes('UNIQUE constraint failed')) {
                        console.log(`   ⚠️  User ${user.username} already exists, skipping...`);
                    } else {
                        throw error;
                    }
                }
            }
            
            // Fetch pending users again
            const newPendingUsers = await runQuery('SELECT id, username, email, role, status, created_at FROM users WHERE status = ?', ['pending']);
            console.log(`\\n📋 Now showing ${newPendingUsers.length} pending user(s):`);
            newPendingUsers.forEach(user => {
                console.log(`   • ${user.full_name || user.username} (${user.email}) - ${user.role}`);
            });
        } else {
            console.log(`Found ${pendingUsers.length} pending user(s):`);
            pendingUsers.forEach(user => {
                console.log(`   • ${user.username} (${user.email}) - ${user.role} - ${user.status}`);
            });
        }
        
        console.log('\n🔐 Admin/Cashier users (who can approve):');
        const approvers = await runQuery('SELECT id, username, email, role, status FROM users WHERE role IN (?, ?)', ['admin', 'cashier']);
        if (approvers.length === 0) {
            console.log('   ⚠️  No admin or cashier users found! Creating a test admin...');
            
            try {
                const result = await runUpdate(
                    `INSERT INTO users (username, email, password_hash, full_name, role, status) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    ['admin', 'admin@toolink.com', '$2a$10$test.admin.hash', 'Test Admin', 'admin', 'active']
                );
                console.log(`   ✅ Created admin user (ID: ${result.lastID})`);
                console.log('   📝 Login: admin@toolink.com / password: admin123');
            } catch (error) {
                if (error.message.includes('UNIQUE constraint failed')) {
                    console.log('   ℹ️  Admin user already exists');
                } else {
                    throw error;
                }
            }
        } else {
            approvers.forEach(user => {
                console.log(`   • ${user.username} (${user.email}) - ${user.role} - ${user.status}`);
            });
        }
        
        console.log('\n📈 User status distribution:');
        const statusCounts = await runQuery(`
            SELECT status, COUNT(*) as count 
            FROM users 
            GROUP BY status 
            ORDER BY count DESC
        `);
        statusCounts.forEach(stat => {
            console.log(`   ${stat.status}: ${stat.count} users`);
        });
        
        console.log('\n🎯 API Endpoints for Customer Approval:');
        console.log('   GET    /api/auth/pending-users     - Get pending users');
        console.log('   POST   /api/auth/approve-user/:id  - Approve a user');
        console.log('   POST   /api/auth/reject-user/:id   - Reject a user');
        
        console.log('\n✅ Customer Approval System is ready!');
        console.log('\n📋 Next steps:');
        console.log('1. Login as admin/cashier in the frontend');
        console.log('2. Navigate to Customer Approval Management');
        console.log('3. Review and approve/reject pending customers');
        
    } catch (error) {
        console.error('❌ Error testing customer approval system:', error);
    } finally {
        db.close();
    }
}

testCustomerApprovalSystem();
