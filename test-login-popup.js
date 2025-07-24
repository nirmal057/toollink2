const https = require('https');

const API_BASE = 'http://localhost:5000';

// Test data for different scenarios
const testScenarios = [
    {
        name: 'Valid Admin Login',
        email: 'admin@toollink.com',
        password: 'admin123',
        expectedResult: 'success'
    },
    {
        name: 'Invalid Email',
        email: 'nonexistent@example.com',
        password: 'anypassword',
        expectedResult: 'INVALID_CREDENTIALS'
    },
    {
        name: 'Invalid Password',
        email: 'admin@toollink.com',
        password: 'wrongpassword',
        expectedResult: 'INVALID_CREDENTIALS'
    },
    {
        name: 'Pending Customer (if exists)',
        email: 'pending@customer.com',
        password: 'password123',
        expectedResult: 'ACCOUNT_PENDING_APPROVAL'
    }
];

async function testLogin(email, password) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ email, password });

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = require('http').request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: { error: 'Invalid JSON response', raw: data }
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(postData);
        req.end();
    });
}

async function runLoginPopupTests() {
    console.log('🧪 Testing ToolLink Login Popup Messages\n');
    console.log('=' * 50);

    for (const scenario of testScenarios) {
        console.log(`\\n📋 Testing: ${scenario.name}`);
        console.log(`📧 Email: ${scenario.email}`);
        console.log(`🔒 Password: ${scenario.password}`);

        try {
            const result = await testLogin(scenario.email, scenario.password);

            console.log(`📊 Status Code: ${result.statusCode}`);
            console.log(`📝 Response:`, JSON.stringify(result.data, null, 2));

            if (result.data.success) {
                console.log('✅ Result: SUCCESS - Login successful');
                if (result.data.user) {
                    console.log(`👤 User: ${result.data.user.fullName} (${result.data.user.role})`);
                }
            } else {
                console.log(`❌ Result: FAILED - ${result.data.errorType || 'UNKNOWN_ERROR'}`);
                console.log(`💬 Message: ${result.data.error || 'No error message'}`);

                // Check for enhanced messages
                if (result.data.errorType === 'ACCOUNT_PENDING_APPROVAL') {
                    console.log('⏳ POPUP: Account Pending Approval popup will be shown');
                    if (result.data.submittedAt) {
                        console.log(`📅 Submitted: ${result.data.submittedAt}`);
                    }
                } else if (result.data.errorType === 'INVALID_CREDENTIALS') {
                    console.log('❌ POPUP: Invalid credentials popup will be shown');
                } else if (result.data.errorType === 'ACCOUNT_LOCKED') {
                    console.log('🔒 POPUP: Account locked popup will be shown');
                }
            }

        } catch (error) {
            console.log(`💥 Connection Error: ${error.message}`);
            console.log('⚠️  Make sure the backend server is running on port 5000');
        }

        console.log('-' * 40);
    }

    console.log('\\n🎉 Login popup testing complete!\\n');

    console.log('📋 Summary of Popup Messages:');
    console.log('1. ⏳ Pending Approval: "Your account registration is pending approval..."');
    console.log('2. ❌ Invalid Credentials: "Invalid email or password. Please check..."');
    console.log('3. 🔒 Account Locked: "Your account has been temporarily locked..."');
    console.log('4. ✅ Success: "Welcome back! Redirecting to dashboard..."');

    console.log('\\n🌐 To test in browser:');
    console.log('1. Go to: http://localhost:5173/auth/login');
    console.log('2. Try different credentials to see popup messages');
    console.log('3. Check the test page at: file:///e:/toollink%202/toollink2/test-login-popup.html');
}

// Run the tests
runLoginPopupTests().catch(console.error);
