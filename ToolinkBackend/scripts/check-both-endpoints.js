import fetch from 'node-fetch';

async function checkBothEndpoints() {
    try {
        console.log('🔍 Checking both user endpoints...\n');

        // Test /api/users-new (no auth)
        console.log('1️⃣ Testing /api/users-new (no authentication):');
        try {
            const response1 = await fetch('http://localhost:3000/api/users-new?limit=20');
            const result1 = await response1.json();
            console.log(`   ✅ Status: ${response1.status}`);
            console.log(`   📊 Users found: ${result1.data?.length || 0}`);
            console.log(`   📄 Total: ${result1.pagination?.total || 0}`);
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log('\n2️⃣ Testing /api/users (requires authentication):');
        try {
            const response2 = await fetch('http://localhost:3000/api/users?limit=20');
            const result2 = await response2.json();
            console.log(`   ✅ Status: ${response2.status}`);
            if (result2.success) {
                console.log(`   📊 Users found: ${result2.data?.users?.length || result2.data?.length || 0}`);
            } else {
                console.log(`   ❌ Error: ${result2.error || 'Authentication required'}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log('\n💡 If /api/users shows authentication error, that explains why user management page is empty!');
        console.log('💡 The frontend needs to be logged in to see users from /api/users endpoint.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkBothEndpoints();
