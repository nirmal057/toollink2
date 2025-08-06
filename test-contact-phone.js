// Test script to verify the contact form with +94 phone number functionality
const testContactForm = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/messages/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                phone: '+94 71 234 5678',
                subject: 'Testing Phone Number with +94 Prefix',
                message: 'This is a test message to verify that the phone number field works correctly with the permanent +94 prefix.'
            }),
        });

        const result = await response.json();
        console.log('Contact form test result:', result);

        if (response.ok) {
            console.log('✅ Contact form submission successful!');
            console.log('Phone number sent:', '+94 71 234 5678');
        } else {
            console.log('❌ Contact form submission failed:', result);
        }
    } catch (error) {
        console.error('❌ Error testing contact form:', error);
    }
};

// Run the test
testContactForm();
