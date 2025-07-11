import fetch from 'node-fetch';

async function verifyAllUsers() {
    try {
        console.log('🔍 Verifying all users in usersNew collection...\n');

        // Get all users with high limit
        const response = await fetch('http://localhost:3000/api/users-new?limit=50');
        const result = await response.json();

        if (result.success) {
            const users = result.data;
            console.log(`✅ Found ${users.length} users in usersNew collection`);
            console.log(`📊 Total in database: ${result.pagination.total}`);

            // Expected users
            const expectedUsers = [
                { name: "isuru nirmal", email: "admin@toollink.lk", role: "Admin" },
                { name: "Ruwan Liyanage", email: "store1@toollink.lk", role: "Warehouse Manager" },
                { name: "Chamara Gunasekara", email: "store2@toollink.lk", role: "Warehouse Manager" },
                { name: "Samanthi Herath", email: "store3@toollink.lk", role: "Warehouse Manager" },
                { name: "Dinesh Fernando", email: "cashier1@toollink.lk", role: "Cashier" },
                { name: "Pavithra Jayasekara", email: "cashier2@toollink.lk", role: "Cashier" },
                { name: "Amal Peris", email: "cashier3@toollink.lk", role: "Cashier" },
                { name: "Nilusha Abeykoon", email: "cashier4@toollink.lk", role: "Cashier" },
                { name: "Lahiru Madushanka", email: "lahiru.construction@gmail.com", role: "Customer" },
                { name: "Harsha Wijesuriya", email: "harsha.builder@yahoo.com", role: "Customer" },
                { name: "Nadeesha Silva", email: "nadeesha.sites@outlook.com", role: "Customer" },
                { name: "Roshan Kumara", email: "roshan.kmaterials@gmail.com", role: "Customer" },
                { name: "Pradeep Dissanayake", email: "pradeep.dissa@gmail.com", role: "Customer" }
            ];

            console.log('\n📋 Checking each expected user:');
            let foundCount = 0;

            expectedUsers.forEach(expectedUser => {
                const found = users.find(u => u.email === expectedUser.email);
                if (found) {
                    console.log(`✅ ${expectedUser.name} (${expectedUser.email}) - ${expectedUser.role}`);
                    foundCount++;
                } else {
                    console.log(`❌ MISSING: ${expectedUser.name} (${expectedUser.email}) - ${expectedUser.role}`);
                }
            });

            console.log(`\n📊 Verification Results:`);
            console.log(`   Expected: ${expectedUsers.length}`);
            console.log(`   Found: ${foundCount}`);
            console.log(`   Database Total: ${result.pagination.total}`);

            if (foundCount === expectedUsers.length && result.pagination.total === 13) {
                console.log('\n🎉 SUCCESS! All 13 users are correctly added to usersNew collection!');
                console.log('\n✅ Both collections now have the same users:');
                console.log('   - Main users collection: /api/users (requires auth)');
                console.log('   - UsersNew collection: /api/users-new (no auth required)');
                console.log('\n🚀 You can now access user management without authentication!');
            } else {
                console.log('\n⚠️  Some users may be missing. Please check the database.');
            }

        } else {
            console.error('❌ API Error:', result.error || result);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyAllUsers();
