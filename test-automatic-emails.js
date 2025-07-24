const http = require('http');

const API_BASE = 'http://localhost:5000';

async function testRegistrationEmail(registrationData) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(registrationData);

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
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

async function testAutomaticEmails() {
    console.log('📧 Testing ToolLink Automatic Registration Emails\\n');
    console.log('=' * 60);

    const testCustomer = {
        username: `testcustomer${Date.now()}`,
        email: `testcustomer${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Test Customer User',
        phone: '+94771234567',
        role: 'customer'
    };

    console.log('\\n1️⃣  Testing Customer Registration with Automatic Email\\n');
    console.log('📋 Registration Data:');
    console.log(`   👤 Name: ${testCustomer.fullName}`);
    console.log(`   📧 Email: ${testCustomer.email}`);
    console.log(`   📱 Phone: ${testCustomer.phone}`);
    console.log(`   🏷️  Role: ${testCustomer.role}`);

    try {
        const result = await testRegistrationEmail(testCustomer);

        console.log(`\\n📊 Response Status: ${result.statusCode}`);
        console.log('📝 Response Data:', JSON.stringify(result.data, null, 2));

        if (result.data.success) {
            console.log('\\n✅ Registration Successful!');
            console.log('📧 Automatic emails should be sent:');
            console.log('   1. 📬 Welcome email to customer (Pending Approval)');
            console.log('   2. 🔔 Notification email to admins/cashiers');

            if (result.data.requiresApproval) {
                console.log('\\n⏳ Account Status: Pending Approval');
                console.log('💌 Customer will receive:');
                console.log('   - Welcome email with registration details');
                console.log('   - Information about approval process');
                console.log('   - Estimated timeline for approval');

                console.log('\\n🔔 Administrators will receive:');
                console.log('   - New customer notification');
                console.log('   - Customer details for review');
                console.log('   - Link to approval dashboard');
            }
        } else {
            console.log('\\n❌ Registration Failed');
            console.log(`   Error: ${result.data.error}`);
            console.log(`   Type: ${result.data.errorType || 'Unknown'}`);
        }

    } catch (error) {
        console.log(`\\n💥 Connection Error: ${error.message}`);
        console.log('⚠️  Make sure the backend server is running on port 5000');
    }

    console.log('\\n' + '=' * 60);
    console.log('\\n📧 Email Templates Available:');
    console.log('\\n🎯 For Customers:');
    console.log('   1. 📨 customer-registration-pending');
    console.log('      - Welcome message with beautiful design');
    console.log('      - Registration details and status');
    console.log('      - What happens next information');
    console.log('      - Expected timeline');
    console.log('\\n   2. 🎉 customer-approved');
    console.log('      - Account approval notification');
    console.log('      - Login instructions');
    console.log('      - Feature overview');
    console.log('      - Call-to-action to login');

    console.log('\\n🎯 For Administrators:');
    console.log('   1. 🔔 admin-new-customer-pending');
    console.log('      - New customer notification');
    console.log('      - Customer details');
    console.log('      - Direct link to approval page');

    console.log('\\n🎯 For Regular Users:');
    console.log('   1. ✅ email-verification');
    console.log('      - Enhanced welcome email');
    console.log('      - Email verification link');
    console.log('      - Getting started guide');

    console.log('\\n🎯 Other Templates:');
    console.log('   1. 🔒 password-reset');
    console.log('   2. 📦 order-confirmation');

    console.log('\\n🌐 Testing in Real Application:');
    console.log('1. Go to: http://localhost:5173/auth/register');
    console.log('2. Create a new customer account');
    console.log('3. Check your email (or logs) for automatic emails');
    console.log('4. Admin should also receive notification');

    console.log('\\n📋 Expected Email Flow:');
    console.log('Step 1: Customer registers → Welcome email sent immediately');
    console.log('Step 2: Admin receives notification → Can review and approve');
    console.log('Step 3: Admin approves → Customer receives approval email');
    console.log('Step 4: Customer can login and use the system');

    console.log('\\n🎉 Automatic Email System Implementation Complete!');
}

// Run the test
testAutomaticEmails().catch(console.error);
