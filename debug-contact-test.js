// Test contact form submission directly
console.log('🧪 Testing Contact Form Submission');

async function testContactSubmission() {
    const testData = {
        name: 'Debug Test User',
        email: 'debug@test.com',
        subject: 'Debug Test Message',
        message: 'This is a test message to debug the contact form issue.',
        phone: '+94 71 418 8903'
    };

    console.log('📤 Sending test message:', testData);

    try {
        const response = await fetch('http://localhost:5000/api/messages/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        console.log('📨 Response status:', response.status);
        console.log('📨 Response ok:', response.ok);

        const result = await response.json();
        console.log('📄 Response data:', result);

        if (result.success) {
            console.log('✅ Contact form submission successful!');
            console.log('🆔 Message ID:', result.data.id);
            return result.data.id;
        } else {
            console.log('❌ Contact form submission failed:', result.error);
        }
    } catch (error) {
        console.log('💥 Error submitting contact form:', error);
    }
}

// Run the test
testContactSubmission();
