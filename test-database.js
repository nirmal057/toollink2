// Simple test to check if messages exist in database
console.log('🧪 Testing database connection...');

async function testMessageDatabase() {
    try {
        const response = await fetch('http://localhost:5000/api/messages/test');
        console.log('📨 Response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('📄 Response data:', data);

            if (data.success) {
                console.log(`✅ Found ${data.count} messages in database`);
                if (data.data && data.data.length > 0) {
                    console.log('\n📋 Messages in database:');
                    data.data.forEach((msg, index) => {
                        console.log(`${index + 1}. ${msg.subject} - ${msg.customerName} (${msg.customerEmail})`);
                        console.log(`   Created: ${new Date(msg.createdAt).toLocaleString()}`);
                    });
                } else {
                    console.log('📭 No messages found');
                }
            } else {
                console.log('❌ API returned error:', data.error);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ HTTP Error:', response.status, errorText);
        }
    } catch (error) {
        console.log('💥 Error:', error.message);
    }
}

testMessageDatabase();
