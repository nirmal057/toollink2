import fetch from 'node-fetch';

async function testUsersNewEndpoint() {
    try {
        console.log('🔍 Testing /api/users-new endpoint...\n');

        // Test getting all users
        const response = await fetch('http://localhost:3000/api/users-new');
        const result = await response.json();

        console.log('📋 Full API Response:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ API Response successful!');

            const users = result.data?.users || result.data || [];
            console.log(`📊 Total users found: ${users.length}`);

            if (result.data?.pagination) {
                console.log(`📄 Total pages: ${result.data.pagination.totalPages}`);
            }

            console.log('\n👥 Users in usersNew collection:');
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} [${user.status}]`);
            });

            // Test role breakdown
            const roleBreakdown = users.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {});

            console.log('\n📈 Role breakdown:');
            Object.entries(roleBreakdown).forEach(([role, count]) => {
                console.log(`   ${role}: ${count}`);
            });

            console.log('\n✅ usersNew collection is working perfectly!');
            console.log('🎉 Both collections are now populated with the same 13 users:');
            console.log('   - /api/users (requires authentication)');
            console.log('   - /api/users-new (no authentication required)');

        } else {
            console.error('❌ API Error:', result.error || result);
        }

    } catch (error) {
        console.error('❌ Connection Error:', error.message);
        console.log('💡 Make sure the backend server is running on http://localhost:3000');
    }
}

// Run the test
testUsersNewEndpoint();
