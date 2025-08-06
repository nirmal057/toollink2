import axios from 'axios';

asyn            if (messagesResponse.data.success && messagesResponse.data.data.messages) {
    console.log('📊 Messages Count:', messagesResponse.data.data.messages.length);

    // Look for our test message
    const testMessage = messagesResponse.data.data.messages.find(msg =>
        msg.customerEmail === 'flowtest@example.com'
    );ion testAdminLogin() {
        try {
            console.log('🔐 Testing admin login...');

            // First, try to login as admin
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'admin@toollink.com',
                password: 'admin123'
            });

            console.log('📨 Login Response Status:', loginResponse.status);

            if (loginResponse.status === 200) {
                console.log('📄 Full login response:', JSON.stringify(loginResponse.data, null, 2));
                const token = loginResponse.data.token || loginResponse.data.accessToken;
                console.log('✅ Admin login successful! Token received:', !!token);

                // Now test accessing messages with authentication
                console.log('🔍 Testing admin access to customer messages...');

                const messagesResponse = await axios.get('http://localhost:5000/api/messages/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('📨 Messages Response Status:', messagesResponse.status);
                console.log('� Full Messages Response:', JSON.stringify(messagesResponse.data, null, 2));

                if (messagesResponse.data.success && messagesResponse.data.data) {
                    console.log('�📊 Messages Count:', messagesResponse.data.data.length);

                    // Look for our test message
                    const testMessage = messagesResponse.data.data.find(msg =>
                        msg.customerEmail === 'flowtest@example.com'
                    );

                    if (testMessage) {
                        console.log('🎉 SUCCESS! Test contact message visible in admin interface:');
                        console.log('   - ID:', testMessage._id);
                        console.log('   - Name:', testMessage.customerName);
                        console.log('   - Subject:', testMessage.subject);
                        console.log('   - Status:', testMessage.status);
                        console.log('   - Created:', testMessage.createdAt);
                        console.log('');
                        console.log('✅ FLOW VERIFIED: Contact Form → Database → Admin Messages ✅');
                    } else {
                        console.log('❌ Test message not found in admin interface');
                    }
                } else {
                    console.log('❌ Invalid response format or failed request');
                }

            } else {
                console.log('❌ Admin login failed');
            }

        } catch (error) {
            console.error('❌ Test failed');
            if (error.response) {
                console.log('📨 Error Status:', error.response.status);
                console.log('📄 Error Response:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error('Network error:', error.message);
            }
        }
    }

    testAdminLogin();
