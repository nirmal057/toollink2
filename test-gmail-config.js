const nodemailer = require('nodemailer');

// Test Gmail configuration with ToolLink admin email
const testEmailConfiguration = async () => {
    console.log('📧 Testing ToolLink Admin Email Configuration\\n');
    console.log('=' * 50);

    // Create transporter with Gmail configuration
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'toollink1234@gmail.com',
            pass: 'Nip@0516'
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    console.log('🔧 Email Configuration:');
    console.log(`   📧 Email: toollink1234@gmail.com`);
    console.log(`   🏷️  Service: Gmail SMTP`);
    console.log(`   🌐 Host: smtp.gmail.com`);
    console.log(`   📡 Port: 587`);
    console.log(`   🔒 Secure: false (TLS)`);

    try {
        // Verify connection
        console.log('\\n🔍 Testing connection to Gmail SMTP...');
        await transporter.verify();
        console.log('✅ Connection successful! Gmail SMTP is working.');

        // Send test email
        console.log('\\n📤 Sending test email...');

        const testEmailOptions = {
            from: '"ToolLink Admin" <toollink1234@gmail.com>',
            to: 'toollink1234@gmail.com', // Send to the same email for testing
            subject: '🧪 ToolLink Email System Test',
            html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">🧪 Email Test Successful!</h1>
                        <p style="margin: 10px 0 0 0;">ToolLink email system is working</p>
                    </div>

                    <div style="padding: 30px; background: white; border: 1px solid #ddd;">
                        <h2 style="color: #333; margin-bottom: 20px;">Email Configuration Test</h2>

                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            This test email confirms that the ToolLink email system is properly configured and working with Gmail SMTP.
                        </p>

                        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h3 style="color: #155724; margin-top: 0;">✅ Configuration Details:</h3>
                            <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8; color: #155724;">
                                <li><strong>Email:</strong> toollink1234@gmail.com</li>
                                <li><strong>Service:</strong> Gmail SMTP</li>
                                <li><strong>Host:</strong> smtp.gmail.com</li>
                                <li><strong>Port:</strong> 587 (TLS)</li>
                                <li><strong>Authentication:</strong> Working</li>
                            </ul>
                        </div>

                        <p style="font-size: 16px; line-height: 1.6; margin: 25px 0;">
                            The ToolLink system can now send automatic emails for:
                        </p>

                        <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                            <li>📨 Welcome emails for new customer registrations</li>
                            <li>🔔 Admin notifications for pending approvals</li>
                            <li>🎉 Account approval notifications</li>
                            <li>✅ Email verification messages</li>
                            <li>🔒 Password reset emails</li>
                            <li>📦 Order confirmations</li>
                        </ul>

                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
                                🚀 Email System Ready!
                            </div>
                        </div>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0;">ToolLink Admin Email System - Test Successful</p>
                        <p style="margin: 5px 0 0 0;">© 2025 ToolLink. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(testEmailOptions);

        console.log('✅ Test email sent successfully!');
        console.log(`   📧 Message ID: ${result.messageId}`);
        console.log(`   📬 Email sent to: toollink1234@gmail.com`);
        console.log(`   🎯 Check your inbox for the test email`);

        console.log('\\n🎉 Email Configuration Complete!');
        console.log('\\n📋 What happens now:');
        console.log('   1. ✅ Gmail SMTP connection verified');
        console.log('   2. ✅ Test email sent successfully');
        console.log('   3. ✅ ToolLink can now send automatic emails');
        console.log('   4. ✅ New user registrations will trigger emails');

        console.log('\\n🌐 Next Steps:');
        console.log('   1. Check toollink1234@gmail.com inbox for test email');
        console.log('   2. Test user registration at http://localhost:5173/auth/register');
        console.log('   3. Verify automatic emails are sent to new users');

    } catch (error) {
        console.log('\\n❌ Email configuration failed!');
        console.log(`   Error: ${error.message}`);

        if (error.code === 'EAUTH') {
            console.log('\\n🔧 Authentication Error - Possible Solutions:');
            console.log('   1. Enable "Less secure app access" in Gmail settings');
            console.log('   2. Use an "App Password" instead of regular password');
            console.log('   3. Enable 2-factor authentication and generate app password');
            console.log('   4. Check if the email and password are correct');
        } else if (error.code === 'ECONNECTION') {
            console.log('\\n🌐 Connection Error - Check:');
            console.log('   1. Internet connection');
            console.log('   2. Firewall settings');
            console.log('   3. Gmail SMTP server availability');
        } else {
            console.log('\\n🔍 Debug Information:');
            console.log(`   Code: ${error.code}`);
            console.log(`   Command: ${error.command}`);
        }
    }

    console.log('\\n' + '=' * 50);
};

// Run the test
testEmailConfiguration().catch(console.error);
