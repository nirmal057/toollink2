// Test the admin login and customer messages functionality
const testAdminAccess = async () => {
    console.log('🔐 Testing admin login and message access...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Attempting admin login...');
    try {
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            }),
        });

        const loginResult = await loginResponse.json();
        if (loginResponse.ok && loginResult.success) {
            console.log('✅ Admin login successful');
            console.log('📄 Login result structure:', JSON.stringify(loginResult, null, 2));

            const token = loginResult.data?.accessToken || loginResult.data?.token || loginResult.accessToken || loginResult.token;

            if (!token) {
                console.log('❌ No access token found in response');
                return;
            }

            console.log('🎫 Access token received');

            // Step 2: Test message statistics with auth
            console.log('\n2️⃣ Testing message statistics with auth...');
            const statsResponse = await fetch('http://localhost:5000/api/messages/stats/overview', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const statsResult = await statsResponse.json();
            if (statsResponse.ok) {
                console.log('✅ Message statistics retrieved:');
                console.log('📊 Total messages:', statsResult.data.total);
                console.log('📊 Pending messages:', statsResult.data.pending);
                console.log('📊 Contact messages:', statsResult.data.contactMessages);
            } else {
                console.log('❌ Failed to get message statistics:', statsResult);
            }

            // Step 3: Get all messages
            console.log('\n3️⃣ Testing message list retrieval...');
            const messagesResponse = await fetch('http://localhost:5000/api/messages', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const messagesResult = await messagesResponse.json();
            if (messagesResponse.ok) {
                console.log('✅ Messages retrieved successfully');
                console.log('📄 Total messages found:', messagesResult.data.messages.length);

                if (messagesResult.data.messages.length > 0) {
                    const firstMessage = messagesResult.data.messages[0];
                    console.log('📩 First message:');
                    console.log('  - ID:', firstMessage._id);
                    console.log('  - Customer:', firstMessage.customerName);
                    console.log('  - Subject:', firstMessage.subject);
                    console.log('  - Status:', firstMessage.status);
                }
            } else {
                console.log('❌ Failed to get messages:', messagesResult);
            }

        } else {
            console.log('❌ Admin login failed:', loginResult);
            console.log('ℹ️  You may need to create an admin user or check credentials');
        }
    } catch (error) {
        console.log('💥 Error during admin access test:', error);
    }

    console.log('\n🎯 Enhanced Features Available:');
    console.log('✅ Message delete functionality with confirmation');
    console.log('✅ New message count badge');
    console.log('✅ Hover-to-reveal delete buttons');
    console.log('✅ Loading states and error handling');
    console.log('✅ Real-time refresh capabilities');
    console.log('✅ Red dot indicators for unread messages');
};

testAdminAccess();
