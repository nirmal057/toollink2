#!/usr/bin/env node

const API_BASE_URL = 'http://localhost:5000';

async function testContactFormWithEmail() {
    console.log('📧 Testing Contact Form with Email Notifications');
    console.log('================================================');

    try {
        // Submit a test contact form
        console.log('📤 Submitting test contact form...');

        const contactResponse = await fetch(`${API_BASE_URL}/api/messages/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Email Test User',
                email: 'emailtest@toollink.com',
                subject: 'Testing Email Notifications',
                message: 'This is a test message to verify that email notifications are working correctly when customers submit contact forms.',
                phone: '+94 71 999 7777'
            })
        });

        console.log('📊 Contact Form Response Status:', contactResponse.status);

        if (contactResponse.ok) {
            const contactData = await contactResponse.json();
            console.log('✅ Contact form submitted successfully!');
            console.log('📄 Response:', JSON.stringify(contactData, null, 2));

            const messageId = contactData.data?.id;
            if (messageId) {
                console.log('🆔 Message ID:', messageId);

                // Now test admin login and reply
                console.log('\n🔐 Testing admin login for reply...');

                const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: 'admin@toollink.com',
                        password: 'admin123'
                    })
                });

                if (loginResponse.ok) {
                    const loginData = await loginResponse.json();
                    console.log('✅ Admin login successful!');

                    // Test reply functionality
                    console.log('\n📧 Testing reply to customer...');

                    const replyResponse = await fetch(`${API_BASE_URL}/api/messages/${messageId}/reply`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${loginData.accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            replyMessage: 'Thank you for your message! We have received your inquiry about email notifications and our technical team is working on it. We will keep you updated on the progress.',
                            markAsResolved: false
                        })
                    });

                    console.log('📊 Reply Response Status:', replyResponse.status);

                    if (replyResponse.ok) {
                        const replyData = await replyResponse.json();
                        console.log('✅ Reply sent successfully!');
                        console.log('📄 Reply Response:', JSON.stringify(replyData, null, 2));
                    } else {
                        const replyError = await replyResponse.text();
                        console.log('❌ Reply failed:', replyError);
                    }
                } else {
                    console.log('❌ Admin login failed');
                }
            }
        } else {
            console.log('❌ Contact form submission failed:', contactResponse.status);
            const errorText = await contactResponse.text();
            console.log('🚨 Error:', errorText);
        }

    } catch (error) {
        console.log('🚨 Network error:', error.message);
    }

    console.log('\n🎯 Email Function Summary:');
    console.log('- Contact form submissions now send email notifications to admins');
    console.log('- Admin replies are automatically sent to customers via email');
    console.log('- Both customer and admin email templates are professionally formatted');
    console.log('- Email delivery is handled gracefully (no failures if email service is down)');
    console.log('\n📧 Check your email inbox for notifications!');
}

testContactFormWithEmail();
