const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAdminReplyEmail() {
    console.log('🧪 Testing Admin Reply Email Functionality...\n');

    try {
        // Step 1: Login as admin to get token
        console.log('1️⃣ Logging in as admin...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        const adminToken = loginResponse.data.accessToken;
        console.log('✅ Admin login successful');

        // Step 2: Create a test contact message
        console.log('\n2️⃣ Creating test contact message...');
        const contactResponse = await axios.post(`${API_BASE}/messages/contact`, {
            name: 'Test Customer for Reply',
            email: 'customer.reply.test@example.com',
            phone: '+94 77 555 1234',
            subject: 'Testing Admin Reply Email Feature',
            message: 'This is a test message to verify that admin replies are sent automatically via email to customers.'
        });

        const messageId = contactResponse.data.data.id;
        console.log('✅ Contact message created with ID:', messageId);

        // Step 3: Admin replies to the message
        console.log('\n3️⃣ Admin replying to customer message...');
        const replyResponse = await axios.post(`${API_BASE}/messages/${messageId}/reply`, {
            replyMessage: 'Thank you for contacting ToolLink! We have received your inquiry about testing our reply system. Our team has reviewed your message and we are pleased to confirm that our automatic email reply feature is working perfectly. We will continue to provide excellent customer support through our automated email system.',
            markAsResolved: false
        }, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Admin reply sent successfully!');
        console.log('📄 Reply response:', JSON.stringify(replyResponse.data, null, 2));

        console.log('\n🔍 Check backend logs for:');
        console.log('   📧 Email sending attempt logs');
        console.log('   ✅ "Reply email sent to customer: customer.reply.test@example.com"');
        console.log('   ❌ Any error messages if email failed');

        console.log('\n📧 Email Details:');
        console.log('   📤 Template: customer-message-reply');
        console.log('   📥 Recipient: customer.reply.test@example.com');
        console.log('   📋 Subject: ✉️ Reply from ToolLink Support');
        console.log('   📝 Contains: Original message + Admin reply + Support agent name');

        console.log('\n✨ Features included in reply email:');
        console.log('   🎨 Professional green gradient header');
        console.log('   👤 Personalized customer greeting');
        console.log('   📄 Original message reference');
        console.log('   💬 Admin reply content');
        console.log('   👨‍💼 Support agent identification');
        console.log('   📞 "Contact Us Again" button');
        console.log('   🏢 ToolLink branding and footer');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.log('💡 This might be an authentication issue - check admin credentials');
        }
    }
}

testAdminReplyEmail();
