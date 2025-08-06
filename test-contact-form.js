import axios from 'axios';

async function testContactFormSubmission() {
    try {
        console.log('📝 Testing contact form submission...');

        const contactData = {
            name: 'Test Customer Flow',
            email: 'flowtest@example.com',
            subject: 'Testing Contact→Customer Messages Flow',
            message: 'This is a test message to verify the contact form to customer messages flow is working properly.',
            phone: '+94 71 123 4567'
        };

        console.log('📤 Submitting contact form with data:', contactData);

        const response = await axios.post('http://localhost:5000/api/messages/contact', contactData);

        console.log('📨 Contact Form Response Status:', response.status);
        console.log('📄 Contact Form Response:', JSON.stringify(response.data, null, 2));

        if (response.status === 201) {
            console.log('✅ Contact form submitted successfully!');

            // Wait a moment then check if it appears in the test endpoint
            console.log('⏳ Waiting 2 seconds then checking database...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const checkResponse = await axios.get('http://localhost:5000/api/messages/test');
            console.log('📊 Current messages count:', checkResponse.data.count);

            // Look for our new message
            const ourMessage = checkResponse.data.data.find(msg =>
                msg.customerEmail === 'flowtest@example.com'
            );

            if (ourMessage) {
                console.log('🎉 SUCCESS! New contact message found in database:');
                console.log('   - ID:', ourMessage._id);
                console.log('   - Name:', ourMessage.customerName);
                console.log('   - Email:', ourMessage.customerEmail);
                console.log('   - Subject:', ourMessage.subject);
                console.log('   - Message:', ourMessage.messages[0]?.content);
                console.log('   - Created:', ourMessage.createdAt);
            } else {
                console.log('❌ Message not found in database');
            }
        }

    } catch (error) {
        console.error('❌ Contact form submission failed');
        if (error.response) {
            console.log('📨 Error Status:', error.response.status);
            console.log('📄 Error Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Network error:', error.message);
        }
    }
}

testContactFormSubmission();
