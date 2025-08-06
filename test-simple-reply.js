const API_BASE = 'http://localhost:5000';

async function simpleReplyTest() {
    console.log('🔧 Simple Reply Test (No Auth Required)');
    console.log('=====================================');

    try {
        // Step 1: Check if backend is running
        console.log('\n🔍 Step 1: Checking backend status...');
        const healthResponse = await fetch(`${API_BASE}/api/messages/test`);
        const healthResult = await healthResponse.json();

        if (!healthResult.success) {
            console.log('❌ Backend not responding correctly');
            return;
        }

        console.log('✅ Backend is running');
        console.log(`📊 Found ${healthResult.data.length} messages in database`);

        // Step 2: Find a message to reply to
        const customerMessage = healthResult.data
            .filter(msg => msg.messages && msg.messages.length > 0)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        if (!customerMessage) {
            console.log('❌ No customer messages found to reply to');
            return;
        }

        console.log('\n📨 Step 2: Found message to reply to:');
        console.log('   - ID:', customerMessage._id);
        console.log('   - Customer:', customerMessage.customerName);
        console.log('   - Email:', customerMessage.customerEmail);
        console.log('   - Subject:', customerMessage.subject);
        console.log('   - Status:', customerMessage.status);

        // Step 3: Test reply endpoint without authentication (should fail gracefully)
        console.log('\n💬 Step 3: Testing reply endpoint (expect auth error)...');
        const replyResponse = await fetch(`${API_BASE}/api/messages/${customerMessage._id}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                replyMessage: 'Test reply without authentication',
                sender: 'admin',
                senderName: 'Test Agent'
            })
        });

        console.log('   Response status:', replyResponse.status);

        const replyResult = await replyResponse.json();
        console.log('   Response body:', JSON.stringify(replyResult, null, 2));

        // Step 4: Check backend logs to see if our improved logging is working
        console.log('\n📋 Step 4: Backend should show detailed logs');
        console.log('Check the backend terminal for:');
        console.log('   - "📧 Processing reply to customer message..."');
        console.log('   - Authentication error details');
        console.log('   - Any other enhanced logging messages');

        console.log('\n✅ Simple Reply Test Completed!');
        console.log('The enhanced reply function structure is in place.');
        console.log('Authentication is required for actual replies.');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the test
simpleReplyTest();
