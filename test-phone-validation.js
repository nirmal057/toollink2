// Test script to verify the phone number limitation to exactly 9 digits after +94
const testPhoneNumberValidation = async () => {
    console.log('🧪 Testing phone number validation with 9-digit limit...\n');

    const testCases = [
        {
            name: 'Valid 9-digit phone',
            phone: '+94 712345678',
            shouldPass: true
        },
        {
            name: 'Too short (8 digits)',
            phone: '+94 71234567',
            shouldPass: false
        },
        {
            name: 'Too long (10 digits)',
            phone: '+94 7123456789',
            shouldPass: false
        },
        {
            name: 'Empty phone (optional field)',
            phone: '+94 ',
            shouldPass: true
        }
    ];

    for (const testCase of testCases) {
        try {
            const response = await fetch('http://localhost:5000/api/messages/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'Test User',
                    email: 'test@example.com',
                    phone: testCase.phone,
                    subject: `Testing: ${testCase.name}`,
                    message: `Test case for phone validation: ${testCase.phone}`
                }),
            });

            const result = await response.json();

            if (testCase.shouldPass && response.ok) {
                console.log(`✅ ${testCase.name}: PASSED`);
                console.log(`   Phone: "${testCase.phone}" - Successfully accepted`);
            } else if (!testCase.shouldPass && !response.ok) {
                console.log(`✅ ${testCase.name}: PASSED`);
                console.log(`   Phone: "${testCase.phone}" - Correctly rejected`);
            } else if (testCase.shouldPass && !response.ok) {
                console.log(`❌ ${testCase.name}: FAILED`);
                console.log(`   Phone: "${testCase.phone}" - Should have been accepted but was rejected`);
                console.log(`   Error: ${result.message}`);
            } else {
                console.log(`❌ ${testCase.name}: FAILED`);
                console.log(`   Phone: "${testCase.phone}" - Should have been rejected but was accepted`);
            }

        } catch (error) {
            console.log(`❌ ${testCase.name}: ERROR`);
            console.log(`   Error: ${error.message}`);
        }

        console.log(''); // Empty line for readability
    }
};

// Run the tests
testPhoneNumberValidation();
