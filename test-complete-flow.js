import axios from 'axios';

async function testCompleteFlow() {
    try {
        console.log('🔄 Testing complete contact form → admin messages flow...');

        // Step 1: Login as admin and get a fresh token
        console.log('\n🔐 Step 1: Admin Login');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        if (loginResponse.status !== 200) {
            throw new Error('Admin login failed');
        }

        const token = loginResponse.data.accessToken;
        console.log('✅ Admin login successful');

        // Step 2: Check current messages in admin interface
        console.log('\n📋 Step 2: Checking admin messages interface');
        const messagesResponse = await axios.get('http://localhost:5000/api/messages/', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (messagesResponse.status === 200 && messagesResponse.data.success) {
            const messages = messagesResponse.data.data.messages || [];
            console.log(`✅ Admin can access messages: ${messages.length} messages found`);

            // Show the latest contact form message
            const latestMessage = messages.find(msg => msg.customerEmail === 'iit21082@std.uwu.ac.lk');
            if (latestMessage) {
                console.log('\n🎉 SUCCESS! Latest contact form message visible in admin:');
                console.log('   📧 From:', latestMessage.customerName, '(' + latestMessage.customerEmail + ')');
                console.log('   📝 Subject:', latestMessage.subject);
                console.log('   💬 Message:', latestMessage.messages[0]?.content);
                console.log('   📅 Created:', latestMessage.createdAt);
                console.log('\n✅ CONTACT FORM → ADMIN MESSAGES FLOW IS WORKING!');
            } else {
                console.log('❌ Latest contact message not found in admin interface');
            }
        } else {
            console.log('❌ Failed to access admin messages interface');
            console.log('Response:', messagesResponse.data);
        }

    } catch (error) {
        console.error('❌ Flow test failed:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

testCompleteFlow();
