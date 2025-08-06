import axios from 'axios';

async function testDatabaseAccess() {
    try {
        console.log('🧪 Testing database access via /api/messages/test endpoint...');

        const response = await axios.get('http://localhost:5000/api/messages/test');

        console.log('📨 Response status:', response.status);
        console.log('📄 Response data:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ Test successful! Found', response.data.count, 'messages');
        }

    } catch (error) {
        console.error('❌ Test failed');
        if (error.response) {
            console.log('📨 Response status:', error.response.status);
            console.log('📄 Error response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Network error:', error.message);
        }
    }
}

testDatabaseAccess();
