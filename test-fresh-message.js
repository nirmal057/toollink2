import axios from 'axios';

async function testFreshContactMessage() {
    try {
        console.log('📝 Submitting a fresh contact form message...');

        const timestamp = new Date().toISOString();
        const contactData = {
            name: 'Flow Test User',
            email: 'flowtest@toollink.com',
            subject: `Test Message ${timestamp.slice(11, 19)}`,
            message: `This is a test message submitted at ${timestamp} to verify the contact form to customer messages flow.`,
            phone: '+94 71 999 8888'
        };

        // Submit contact form
        const contactResponse = await axios.post('http://localhost:5000/api/messages/contact', contactData);

        if (contactResponse.status === 201) {
            console.log('✅ Contact form submitted successfully');
            console.log('📧 Message from:', contactData.name);
            console.log('📝 Subject:', contactData.subject);

            // Wait a moment for processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Test admin access
            console.log('\n🔐 Testing admin access...');
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'admin@toollink.com',
                password: 'admin123'
            });

            const token = loginResponse.data.accessToken;

            const messagesResponse = await axios.get('http://localhost:5000/api/messages/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (messagesResponse.data.success) {
                const messages = messagesResponse.data.data.messages || [];
                const ourMessage = messages.find(msg => msg.customerEmail === 'flowtest@toollink.com');

                if (ourMessage) {
                    console.log('🎉 SUCCESS! Message appears in admin interface:');
                    console.log('   📧 From:', ourMessage.customerName);
                    console.log('   📝 Subject:', ourMessage.subject);
                    console.log('   💬 Content:', ourMessage.messages[0]?.content.substring(0, 50) + '...');
                    console.log('\n✅ COMPLETE FLOW VERIFIED: Contact Form → Database → Admin Interface');
                } else {
                    console.log('❌ Message not found in admin interface');
                }
            } else {
                console.log('❌ Failed to get messages from admin interface');
            }
        } else {
            console.log('❌ Contact form submission failed');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFreshContactMessage();
