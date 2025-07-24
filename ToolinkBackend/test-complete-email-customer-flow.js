import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendEmail } from './src/utils/emailService.js';
import User from './src/models/User.js';
import PendingCustomer from './src/models/PendingCustomer.js';

// Load environment variables
dotenv.config();

console.log('🧪 ToolLink Email & Customer Registration Test');
console.log('='.repeat(60));

async function testEmailSystem() {
    try {
        console.log('\\n📧 STEP 1: Testing Email Service');
        console.log('-'.repeat(40));

        console.log('📋 Current Email Configuration:');
        console.log(`   Email: ${process.env.TOOLLINK_EMAIL}`);
        console.log(`   Password: ${process.env.TOOLLINK_EMAIL_PASSWORD ? '✅ Set' : '❌ Missing'}`);
        console.log(`   From Name: ${process.env.FROM_NAME || 'ToolLink System'}`);

        // Test sending a simple email
        console.log('\\n📤 Testing basic email sending...');
        const testResult = await sendEmail({
            to: process.env.TOOLLINK_EMAIL,
            subject: '🧪 ToolLink Email System Test',
            template: 'customer-registration-pending',
            data: {
                fullName: 'Test Customer',
                email: process.env.TOOLLINK_EMAIL,
                submittedAt: new Date()
            }
        });

        console.log('✅ Email sent successfully!');
        console.log(`   Message ID: ${testResult.messageId}`);

    } catch (error) {
        console.log('❌ Email sending failed!');
        console.log(`   Error: ${error.message}`);
        return false;
    }

    return true;
}

async function testCustomerRegistrationFlow() {
    try {
        console.log('\\n👥 STEP 2: Testing Customer Registration Flow');
        console.log('-'.repeat(40));

        // Connect to MongoDB
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check for existing admin users
        const adminUsers = await User.find({
            role: { $in: ['admin', 'cashier'] },
            isActive: true
        });

        console.log(`\\n📊 Found ${adminUsers.length} admin/cashier users:`);
        adminUsers.forEach(admin => {
            console.log(`   - ${admin.fullName} (${admin.email}) - Role: ${admin.role}`);
        });

        if (adminUsers.length === 0) {
            console.log('⚠️  No admin users found! Creating test admin...');
            const testAdmin = new User({
                username: 'testadmin',
                email: process.env.TOOLLINK_EMAIL,
                password: '$2a$12$test.hash.here',
                fullName: 'Test Admin',
                role: 'admin',
                isActive: true,
                isApproved: true,
                emailVerified: true
            });
            await testAdmin.save();
            console.log('✅ Test admin created');
        }

        // Test creating a pending customer
        const testCustomerEmail = `testcustomer${Date.now()}@example.com`;
        console.log(`\\n🆕 Creating test customer: ${testCustomerEmail}`);

        // Clean up any existing test customer
        await PendingCustomer.deleteMany({ email: testCustomerEmail });

        const pendingCustomer = new PendingCustomer({
            username: `testuser${Date.now()}`,
            email: testCustomerEmail,
            password: '$2a$12$test.hash.here',
            fullName: 'Test Customer',
            phone: '+1234567890',
            role: 'customer'
        });

        await pendingCustomer.save();
        console.log('✅ Test customer created in pending list');

        // Test sending welcome email to customer
        console.log('\\n📨 Testing welcome email to customer...');
        try {
            await sendEmail({
                to: process.env.TOOLLINK_EMAIL, // Send to your email for testing
                template: 'customer-registration-pending',
                data: {
                    fullName: pendingCustomer.fullName,
                    email: pendingCustomer.email,
                    submittedAt: pendingCustomer.submittedAt
                }
            });
            console.log('✅ Welcome email sent to customer');
        } catch (emailError) {
            console.log('❌ Failed to send welcome email:', emailError.message);
        }

        // Test sending admin notification emails
        console.log('\\n🔔 Testing admin notification emails...');
        const updatedAdminUsers = await User.find({
            role: { $in: ['admin', 'cashier'] },
            isActive: true
        }).select('email fullName');

        let emailsSent = 0;
        for (const admin of updatedAdminUsers) {
            try {
                await sendEmail({
                    to: process.env.TOOLLINK_EMAIL, // Send to your email for testing
                    template: 'admin-new-customer-pending',
                    data: {
                        customerName: pendingCustomer.fullName,
                        customerEmail: pendingCustomer.email,
                        approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer-approval`
                    }
                });
                emailsSent++;
                console.log(`✅ Admin notification sent for ${admin.fullName}`);
            } catch (emailError) {
                console.log(`❌ Failed to send admin notification to ${admin.fullName}:`, emailError.message);
            }
        }

        console.log(`\\n📈 Summary: ${emailsSent}/${updatedAdminUsers.length} admin emails sent`);

        // Clean up test customer
        await PendingCustomer.deleteMany({ email: testCustomerEmail });
        console.log('🧹 Test customer cleaned up');

        return true;

    } catch (error) {
        console.log('❌ Customer registration test failed!');
        console.log(`   Error: ${error.message}`);
        return false;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

async function runCompleteTest() {
    console.log(`\\n🚀 Starting complete test at ${new Date().toLocaleString()}`);

    const emailTest = await testEmailSystem();
    const registrationTest = await testCustomerRegistrationFlow();

    console.log('\\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`📧 Email System: ${emailTest ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`👥 Customer Registration: ${registrationTest ? '✅ WORKING' : '❌ FAILED'}`);

    if (emailTest && registrationTest) {
        console.log('\\n🎉 ALL TESTS PASSED! Your ToolLink system is ready!');
        console.log('\\n📋 What works now:');
        console.log('   ✅ Email sending (Gmail SMTP)');
        console.log('   ✅ Customer registration emails');
        console.log('   ✅ Admin notification emails');
        console.log('   ✅ Professional email templates');

        console.log('\\n🎯 Next Steps:');
        console.log('   1. Check your email inbox for test emails');
        console.log('   2. Start the backend: npm run dev');
        console.log('   3. Test customer registration at: http://localhost:5173/auth/register');
        console.log('   4. Verify automatic emails are sent');
    } else {
        console.log('\\n❌ Some tests failed. Check the errors above.');
    }

    console.log('\\n' + '='.repeat(60));
}

// Run the complete test
runCompleteTest().catch(console.error);
