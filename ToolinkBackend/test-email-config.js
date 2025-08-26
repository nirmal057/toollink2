import { config } from 'dotenv';
import { sendEmail } from './src/utils/emailService.js';

// Load environment variables
config();

async function testEmailConfiguration() {
    console.log('🧪 Testing Email Configuration...');
    console.log('📧 Using email:', process.env.TOOLLINK_EMAIL);
    console.log('🔐 Password configured:', process.env.TOOLLINK_EMAIL_PASSWORD ? 'Yes' : 'No');

    try {
        // Test email sending
        const testResult = await sendEmail({
            to: 'toollinksrilanka@gmail.com', // Send to same email for testing
            template: 'test-email',
            data: {
                testMessage: 'Email configuration is working perfectly!',
                timestamp: new Date().toLocaleString()
            }
        });

        console.log('✅ Email sent successfully!');
        console.log('📨 Message ID:', testResult.messageId);
        console.log('🎉 Email system is configured correctly with toollinksrilanka@gmail.com');

    } catch (error) {
        console.error('❌ Email test failed:', error.message);
        console.error('🔧 Please check your app password and email settings');
    }
}

// Run the test
testEmailConfiguration();
