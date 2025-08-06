const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testContactFormWithThankYou() {
    console.log('🧪 Testing ONLY Customer Thank You Email...\n');

    try {
        const contactData = {
            name: 'Customer Thank You Test',
            email: 'customer.test@example.com',
            phone: '+94 77 999 8888',
            subject: 'Customer Thank You Email Test',
            message: 'Testing if the customer thank you email is sent properly and logs appear in backend console.'
        };

        console.log('📝 Submitting contact form...');
        console.log('📧 Customer email:', contactData.email);
        console.log('📋 Subject:', contactData.subject);
        console.log('👤 Name:', contactData.name);

        const response = await axios.post(`${API_BASE}/messages/contact`, contactData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ Contact form submitted successfully!');
        console.log('📄 Response:', response.data);

        console.log('\n🔍 Now check the backend terminal for these logs:');
        console.log('   📨 Contact form submission received');
        console.log('   📧 Attempting to send admin notifications...');
        console.log('   ✅ Admin notification emails sent successfully');
        console.log('   💌 Attempting to send thank you email to customer...');
        console.log('   ✅ Thank you email sent to customer: customer.test@example.com');

        console.log('\n💡 If you only see admin logs but not customer thank you logs,');
        console.log('   there might be an issue with the sendEmail function or email config.');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
    }
}

testContactFormWithThankYou();
