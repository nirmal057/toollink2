const axios = require('axios');
require('dotenv').config();

// Test credentials with common password patterns
const testCredentials = [
    // Confirmed working credentials
    { email: 'admin@toollink.com', password: 'admin123', role: 'admin', priority: 'HIGH' },
    { email: 'test@admin.com', password: 'test123', role: 'admin', priority: 'HIGH' },

    // Most likely working based on patterns
    { email: 'superadmin@toollink.lk', password: 'toollink123', role: 'admin', priority: 'HIGH' },
    { email: 'admin1@toollink.lk', password: 'toollink123', role: 'admin', priority: 'HIGH' },
    { email: 'system@toollink.lk', password: 'toollink123', role: 'admin', priority: 'HIGH' },
    { email: 'dev@toollink.lk', password: 'toollink123', role: 'admin', priority: 'HIGH' },
    { email: 'manager@toollink.lk', password: 'toollink123', role: 'admin', priority: 'HIGH' },

    // Alternative admin passwords
    { email: 'admin1@toollink.lk', password: 'admin123', role: 'admin', priority: 'MEDIUM' },
    { email: 'superadmin@toollink.lk', password: 'admin123', role: 'admin', priority: 'MEDIUM' },
    { email: 'superadmin@toollink.lk', password: 'superadmin123', role: 'admin', priority: 'MEDIUM' },

    // Other roles
    { email: 'cashier1@toollink.lk', password: 'toollink123', role: 'cashier', priority: 'MEDIUM' },
    { email: 'cashier1@toollink.lk', password: 'cashier123', role: 'cashier', priority: 'MEDIUM' },
    { email: 'warehouse1@toollink.lk', password: 'toollink123', role: 'warehouse', priority: 'MEDIUM' },
    { email: 'warehouse1@toollink.lk', password: 'warehouse123', role: 'warehouse', priority: 'MEDIUM' },
    { email: 'customer1@toollink.lk', password: 'toollink123', role: 'customer', priority: 'LOW' },
    { email: 'customer1@toollink.lk', password: 'customer123', role: 'customer', priority: 'LOW' },
    { email: 'driver1@toollink.lk', password: 'toollink123', role: 'driver', priority: 'LOW' },
    { email: 'driver1@toollink.lk', password: 'driver123', role: 'driver', priority: 'LOW' },
];

async function testAllCredentials() {
    console.log('🔐 Testing All Login Credentials');
    console.log('================================================================================');
    console.log(`📊 Testing ${testCredentials.length} credential combinations...\n`);

    const workingCredentials = [];
    const failedCredentials = [];

    for (let i = 0; i < testCredentials.length; i++) {
        const cred = testCredentials[i];
        const progress = `[${i + 1}/${testCredentials.length}]`;

        try {
            console.log(`${progress} Testing ${cred.email} (${cred.role}) - Priority: ${cred.priority}`);

            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email: cred.email,
                password: cred.password
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });

            if (response.data.success) {
                console.log(`✅ SUCCESS: ${cred.email} / ${cred.password}`);
                workingCredentials.push({
                    ...cred,
                    userName: response.data.user.fullName || response.data.user.name,
                    actualRole: response.data.user.role,
                    lastLogin: response.data.user.lastLogin
                });
            } else {
                console.log(`❌ FAILED: ${cred.email} - ${response.data.message}`);
                failedCredentials.push({ ...cred, reason: response.data.message });
            }

        } catch (error) {
            if (error.response && error.response.data) {
                console.log(`❌ FAILED: ${cred.email} - ${error.response.data.message}`);
                failedCredentials.push({ ...cred, reason: error.response.data.message });
            } else {
                console.log(`❌ ERROR: ${cred.email} - ${error.message}`);
                failedCredentials.push({ ...cred, reason: error.message });
            }
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 WORKING LOGIN CREDENTIALS SUMMARY');
    console.log('='.repeat(80));

    if (workingCredentials.length > 0) {
        console.log(`\n✅ Found ${workingCredentials.length} working credential(s):\n`);

        // Group by priority
        const highPriority = workingCredentials.filter(c => c.priority === 'HIGH');
        const mediumPriority = workingCredentials.filter(c => c.priority === 'MEDIUM');
        const lowPriority = workingCredentials.filter(c => c.priority === 'LOW');

        if (highPriority.length > 0) {
            console.log('🔥 HIGH PRIORITY (BEST OPTIONS):');
            console.log('─'.repeat(50));
            highPriority.forEach((cred, index) => {
                console.log(`${index + 1}. 📧 Email: ${cred.email}`);
                console.log(`   🔒 Password: ${cred.password}`);
                console.log(`   👤 Name: ${cred.userName}`);
                console.log(`   🎭 Role: ${cred.actualRole}`);
                console.log(`   🕐 Last Login: ${cred.lastLogin || 'Never'}`);
                console.log('');
            });
        }

        if (mediumPriority.length > 0) {
            console.log('⚡ MEDIUM PRIORITY:');
            console.log('─'.repeat(30));
            mediumPriority.forEach((cred, index) => {
                console.log(`${index + 1}. ${cred.email} / ${cred.password} (${cred.actualRole})`);
            });
            console.log('');
        }

        if (lowPriority.length > 0) {
            console.log('💡 LOW PRIORITY:');
            console.log('─'.repeat(25));
            lowPriority.forEach((cred, index) => {
                console.log(`${index + 1}. ${cred.email} / ${cred.password} (${cred.actualRole})`);
            });
            console.log('');
        }

        console.log('🌐 TO LOGIN:');
        console.log('─'.repeat(15));
        console.log('1. Go to: http://localhost:5173');
        console.log('2. Use any email and password combination above');
        console.log('3. Login field accepts both email and username');
        console.log('');

    } else {
        console.log('❌ No working credentials found!');
        console.log('💡 This might indicate a server issue or password encryption problem.');
    }

    if (failedCredentials.length > 0) {
        console.log(`\n⚠️  Failed Credentials: ${failedCredentials.length}`);
        console.log('Most common reasons:');
        const reasons = {};
        failedCredentials.forEach(f => {
            reasons[f.reason] = (reasons[f.reason] || 0) + 1;
        });
        Object.entries(reasons).forEach(([reason, count]) => {
            console.log(`   - ${reason}: ${count} times`);
        });
    }

    console.log('\n📊 FINAL STATISTICS:');
    console.log(`✅ Working: ${workingCredentials.length}/${testCredentials.length}`);
    console.log(`❌ Failed: ${failedCredentials.length}/${testCredentials.length}`);
    console.log(`📈 Success Rate: ${((workingCredentials.length / testCredentials.length) * 100).toFixed(1)}%`);
}

// Run the test
testAllCredentials().catch(console.error);
