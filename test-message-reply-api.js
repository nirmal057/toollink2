const API_BASE = 'http://localhost:5000';

async function testMessageReplyAPI() {
    console.log('🔧 Testing Message Reply API Functionality');
    console.log('==========================================');

    try {
        // Step 1: Get existing messages
        console.log('\n📋 Step 1: Fetching existing messages...');
        const messagesResponse = await fetch(`${API_BASE}/api/messages/test`);
        const messagesResult = await messagesResponse.json();

        if (!messagesResult.success || messagesResult.data.length === 0) {
            console.log('❌ No messages found or fetch failed');
            return;
        }

        // Find the most recent customer message
        const customerMessage = messagesResult.data
            .filter(msg => msg.messages && msg.messages.length > 0)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        if (!customerMessage) {
            console.log('❌ No customer messages found');
            return;
        }

        console.log('✅ Found customer message to reply to:');
        console.log('   - ID:', customerMessage._id);
        console.log('   - Customer:', customerMessage.customerName);
        console.log('   - Email:', customerMessage.customerEmail);
        console.log('   - Subject:', customerMessage.subject);
        console.log('   - Current status:', customerMessage.status);
        console.log('   - Messages in conversation:', customerMessage.messages.length);

        // Step 2: Admin login
        console.log('\n🔐 Step 2: Admin authentication...');
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
                console.log('✅ Admin authenticated successfully');
            } else {
                console.log('❌ Admin authentication failed:', loginResult.error);
                return;
            }
        } else {
            console.log('❌ Authentication request failed');
            return;
        }

        // Step 3: Test reply with different payload formats
        console.log('\n📧 Step 3: Testing reply API...');

        const testCases = [
            {
                name: 'Standard Reply Format',
                payload: {
                    replyMessage: `Hello ${customerMessage.customerName},

Thank you for your message regarding "${customerMessage.subject}".

We have reviewed your inquiry and are happy to assist you. Our team has looked into your request and we have the following response:

✅ Your message has been received and processed
🔧 We are working on addressing your concerns
📞 If you need immediate assistance, please call us directly

We appreciate your patience and will continue to provide you with excellent service.

Best regards,
ToolLink Customer Support Team`,
                    sender: 'admin',
                    senderName: 'API Test Agent',
                    markAsResolved: false
                }
            },
            {
                name: 'Content Field Format (Compatibility)',
                payload: {
                    content: `Follow-up message to ensure our API handles both replyMessage and content fields correctly.

This is a compatibility test to ensure both field names work properly.

Thank you for your continued business!`,
                    sender: 'admin',
                    senderName: 'Compatibility Test Agent',
                    markAsResolved: false
                }
            }
        ];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n🧪 Test Case ${i + 1}: ${testCase.name}`);

            const replyResponse = await fetch(`${API_BASE}/api/messages/${customerMessage._id}/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testCase.payload)
            });

            console.log('   Request status:', replyResponse.status);

            const replyResult = await replyResponse.json();

            if (replyResult.success) {
                console.log('   ✅ Reply sent successfully!');
                console.log('   📊 Response data:');
                console.log('      - Message ID:', replyResult.data.messageId);
                console.log('      - New status:', replyResult.data.status);
                console.log('      - Reply ID:', replyResult.data.replyId);
                console.log('      - Email sent:', replyResult.data.emailSent ? 'Yes' : 'No');
                console.log('      - Conversation length:', replyResult.data.conversationLength);
                console.log('      - Updated at:', replyResult.data.updatedAt);

                if (replyResult.data.reply) {
                    console.log('      - Reply sender:', replyResult.data.reply.senderName);
                    console.log('      - Reply timestamp:', replyResult.data.reply.timestamp);
                }
            } else {
                console.log('   ❌ Reply failed:', replyResult.error);
                if (replyResult.details) {
                    console.log('      Error details:', replyResult.details);
                }
            }

            // Wait between test cases
            if (i < testCases.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Step 4: Verify final conversation state
        console.log('\n🔍 Step 4: Verifying final conversation state...');
        const finalMessagesResponse = await fetch(`${API_BASE}/api/messages/test`);
        const finalMessagesResult = await finalMessagesResponse.json();

        if (finalMessagesResult.success) {
            const finalMessage = finalMessagesResult.data.find(msg => msg._id === customerMessage._id);
            if (finalMessage) {
                console.log('✅ Final conversation state:');
                console.log('   - Total messages:', finalMessage.messages.length);
                console.log('   - Status:', finalMessage.status);
                console.log('   - Last updated:', finalMessage.updatedAt);

                console.log('\n📝 Conversation timeline:');
                finalMessage.messages.forEach((msg, index) => {
                    console.log(`   ${index + 1}. [${msg.sender}] ${msg.senderName} - ${new Date(msg.timestamp).toLocaleString()}`);
                    console.log(`      "${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}"`);
                });
            }
        }

        console.log('\n🎉 Message Reply API Test Completed!');
        console.log('=======================================');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testMessageReplyAPI();
