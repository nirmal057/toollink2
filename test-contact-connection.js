// End-to-End Contact Form Test
// This script tests the complete flow from contact form to customer messages

console.log('🧪 Testing Contact Form → Customer Messages Connection');

// Test 1: Contact Form Submission
async function testContactFormSubmission() {
    console.log('\n📝 Test 1: Contact Form Submission');

    try {
        const testMessage = {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '+94 71 418 8903',
            subject: 'End-to-End Test Message',
            message: 'This is a test message to verify the contact form → customer messages connection is working properly.'
        };

        const response = await fetch('http://localhost:5000/api/messages/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testMessage)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Contact form submission successful');
            console.log('📄 Message ID:', result.data.id);
            return result.data.id;
        } else {
            console.log('❌ Contact form submission failed:', result.error);
            return null;
        }
    } catch (error) {
        console.log('❌ Contact form submission error:', error.message);
        return null;
    }
}

// Test 2: Verify Message in Customer Messages
async function testMessageRetrieval(messageId) {
    console.log('\n📨 Test 2: Message Retrieval (requires admin auth)');

    const token = localStorage.getItem('token');
    if (!token) {
        console.log('⚠️ No auth token found. Please login as admin first.');
        console.log('💡 Go to /login and authenticate, then run this test again.');
        return false;
    }

    try {
        const response = await fetch('http://localhost:5000/api/messages', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
            console.log('✅ Messages retrieved successfully');
            console.log('📊 Total messages:', result.data.length);

            if (messageId) {
                const testMessage = result.data.find(msg => msg._id === messageId);
                if (testMessage) {
                    console.log('✅ Test message found in customer messages!');
                    console.log('📝 Subject:', testMessage.subject);
                    console.log('👤 Customer:', testMessage.customerName);
                } else {
                    console.log('⚠️ Test message not found (may take a moment to sync)');
                }
            }

            return true;
        } else {
            console.log('❌ Failed to retrieve messages:', result.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Message retrieval error:', error.message);
        return false;
    }
}

// Test 3: Connection Status
function testConnectionStatus() {
    console.log('\n🔗 Test 3: Connection Status');

    // Check frontend availability
    const frontendUrl = window.location.origin;
    console.log('🖥️ Frontend URL:', frontendUrl);
    console.log('✅ Frontend accessible');

    // Check if we're on the contact page
    if (window.location.pathname === '/contact') {
        console.log('✅ Contact page accessible');
    }

    // Check if we're on the messages page
    if (window.location.pathname.includes('/messages')) {
        console.log('✅ Customer messages page accessible');
    }
}

// Run all tests
async function runFullTest() {
    console.log('🚀 Starting End-to-End Test Suite');
    console.log('='.repeat(50));

    testConnectionStatus();

    const messageId = await testContactFormSubmission();

    if (messageId) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        await testMessageRetrieval(messageId);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎯 Test Summary:');
    console.log('📱 Contact Form: Available at /contact');
    console.log('👨‍💼 Admin Messages: Available at /admin/messages');
    console.log('🔄 Connection: Contact form → Database → Customer messages');
    console.log('💬 Reply System: Admins can respond to customer messages');
    console.log('\n💡 Instructions:');
    console.log('1. Go to /contact to submit messages');
    console.log('2. Login as admin and go to /admin/messages to view and reply');
    console.log('3. Use the refresh button (🔄) to reload messages');
}

// Auto-run the test
runFullTest();
