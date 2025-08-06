const API_BASE = 'http://localhost:5000';

async function testEnhancedMessageReply() {
    console.log('🧪 Testing Enhanced Message Reply Feature');
    console.log('=====================================');

    try {
        // Step 1: Create a test contact message
        console.log('\n📨 Step 1: Creating test contact message...');
        const contactResponse = await fetch(`${API_BASE}/api/messages/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Enhanced Test Customer',
                email: 'enhanced.test@example.com',
                phone: '+94771234567',
                subject: 'Enhanced Reply Feature Test',
                message: 'Testing the enhanced reply feature with better error handling and improved email templates.'
            })
        });

        const contactResult = await contactResponse.json();

        if (contactResult.success) {
            console.log('✅ Contact message created successfully');
            console.log('   Message ID:', contactResult.data.id);
        } else {
            console.log('❌ Failed to create contact message:', contactResult.error);
            return;
        }

        // Wait a moment for message to be saved
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 2: Get all messages to find our test message
        console.log('\n📋 Step 2: Fetching messages...');
        const messagesResponse = await fetch(`${API_BASE}/api/messages/test`);
        const messagesResult = await messagesResponse.json();

        if (!messagesResult.success) {
            console.log('❌ Failed to fetch messages:', messagesResult.error);
            return;
        }

        const testMessage = messagesResult.data.find(msg =>
            msg.customerEmail === 'enhanced.test@example.com' &&
            msg.subject === 'Enhanced Reply Feature Test'
        );

        if (!testMessage) {
            console.log('❌ Could not find the test message');
            return;
        }

        console.log('✅ Found test message:', testMessage._id);
        console.log('   Customer:', testMessage.customerName);
        console.log('   Email:', testMessage.customerEmail);
        console.log('   Subject:', testMessage.subject);

        // Step 3: Admin login (simulate)
        console.log('\n🔐 Step 3: Simulating admin login...');
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });

        let authToken = null;
        if (loginResponse.ok) {
            const loginResult = await loginResponse.json();
            if (loginResult.success) {
                authToken = loginResult.data.token;
                console.log('✅ Admin logged in successfully');
            } else {
                console.log('❌ Admin login failed:', loginResult.error);
                return;
            }
        } else {
            console.log('❌ Admin login request failed');
            return;
        }

        // Step 4: Test the enhanced reply feature
        console.log('\n💬 Step 4: Testing enhanced reply feature...');
        const replyResponse = await fetch(`${API_BASE}/api/messages/${testMessage._id}/reply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                replyMessage: `Dear Enhanced Test Customer,

Thank you for your inquiry about our enhanced reply feature. I'm pleased to confirm that we have implemented several improvements:

🔧 Enhanced Features:
- Better error handling and user feedback
- Improved email templates with professional styling
- Real-time status updates
- Optimistic UI updates for better user experience
- Comprehensive logging and audit trails

✅ System Status:
- All reply functionality is working correctly
- Email notifications are being sent successfully
- Backend logging shows all operations completing successfully

If you have any additional questions or need further assistance, please don't hesitate to reach out to us again.

Best regards,
ToolLink Enhanced Support Team`,
                sender: 'admin',
                senderName: 'Enhanced Support Agent',
                markAsResolved: false
            })
        });

        const replyResult = await replyResponse.json();

        if (replyResult.success) {
            console.log('✅ Enhanced reply sent successfully!');
            console.log('📧 Email sent to customer:', replyResult.data.emailSent ? 'Yes' : 'No');
            console.log('📝 Reply details:');
            console.log('   - Message ID:', replyResult.data.messageId);
            console.log('   - Status:', replyResult.data.status);
            console.log('   - Reply ID:', replyResult.data.replyId);
            console.log('   - Conversation length:', replyResult.data.conversationLength);
            console.log('   - Updated at:', replyResult.data.updatedAt);

            if (replyResult.data.reply) {
                console.log('   - Reply content length:', replyResult.data.reply.content.length, 'characters');
                console.log('   - Reply sender:', replyResult.data.reply.senderName);
                console.log('   - Reply timestamp:', replyResult.data.reply.timestamp);
            }
        } else {
            console.log('❌ Enhanced reply failed:', replyResult.error);
            if (replyResult.details) {
                console.log('   Error details:', replyResult.details);
            }
        }

        // Step 5: Verify the conversation was updated
        console.log('\n🔍 Step 5: Verifying conversation update...');
        const updatedMessagesResponse = await fetch(`${API_BASE}/api/messages/test`);
        const updatedMessagesResult = await updatedMessagesResponse.json();

        if (updatedMessagesResult.success) {
            const updatedMessage = updatedMessagesResult.data.find(msg => msg._id === testMessage._id);
            if (updatedMessage) {
                console.log('✅ Message conversation updated:');
                console.log('   - Total messages in conversation:', updatedMessage.messages.length);
                console.log('   - Status:', updatedMessage.status);
                console.log('   - Last updated:', updatedMessage.updatedAt);

                const lastMessage = updatedMessage.messages[updatedMessage.messages.length - 1];
                if (lastMessage && lastMessage.sender === 'admin') {
                    console.log('   - Last reply by:', lastMessage.senderName);
                    console.log('   - Reply timestamp:', lastMessage.timestamp);
                    console.log('   - Reply preview:', lastMessage.content.substring(0, 100) + '...');
                }
            } else {
                console.log('❌ Could not find updated message');
            }
        }

        console.log('\n🎉 Enhanced Message Reply Test Completed!');
        console.log('=====================================');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testEnhancedMessageReply();
