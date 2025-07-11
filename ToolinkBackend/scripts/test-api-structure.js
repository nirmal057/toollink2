import fetch from 'node-fetch';

async function testUsersAPI() {
    console.log('🧪 Testing Users API Response Structure...\n');

    try {
        // Test the API
        const response = await fetch('http://localhost:3000/api/users-new?limit=3');
        const result = await response.json();

        console.log('✅ API Response:');
        console.log('Status:', response.status);
        console.log('Response structure:');
        console.log({
            success: result.success,
            dataType: Array.isArray(result.data) ? `Array[${result.data.length}]` : typeof result.data,
            hasPagination: !!result.pagination
        });

        if (result.success && result.data?.length > 0) {
            console.log('\n👤 Sample user data:');
            console.log('User keys:', Object.keys(result.data[0]));
            console.log('Sample user:', {
                name: result.data[0].name,
                email: result.data[0].email,
                role: result.data[0].role,
                status: result.data[0].status
            });
        }

        console.log('\n🎯 The frontend should access users via: response.data.data');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testUsersAPI();
