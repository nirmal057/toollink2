#!/usr/bin/env node

const API_BASE_URL = 'http://localhost:5000';

async function testLogin() {
    console.log('🔐 Testing Admin Login Process');
    console.log('==============================');

    try {
        console.log('📤 Attempting login...');

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

        console.log('📊 Login Response Status:', loginResponse.status);

        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ Login successful!');
            console.log('📄 Login response:', JSON.stringify(loginData, null, 2));
            console.log('🎫 Access Token received:', loginData.accessToken ? 'Yes' : 'No');

            if (loginData.accessToken) {
                console.log('🔑 Token preview:', loginData.accessToken.substring(0, 20) + '...');

                // Test messages endpoint with fresh token
                console.log('\n📨 Testing Messages Endpoint...');
                const messagesResponse = await fetch(`${API_BASE_URL}/api/messages`, {
                    headers: {
                        'Authorization': `Bearer ${loginData.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('📊 Messages Response Status:', messagesResponse.status);

                if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json();
                    console.log('✅ Messages endpoint working!');
                    console.log('📄 Messages count:', messagesData.data?.messages?.length || 0);

                    if (messagesData.data?.messages?.length > 0) {
                        console.log('📝 Sample message:', messagesData.data.messages[0].subject);
                    }
                } else {
                    console.log('❌ Messages endpoint failed:', messagesResponse.status);
                    const errorText = await messagesResponse.text();
                    console.log('🚨 Error:', errorText);
                }
            }

        } else {
            console.log('❌ Login failed:', loginResponse.status);
            const errorText = await loginResponse.text();
            console.log('🚨 Error:', errorText);
        }

    } catch (error) {
        console.log('🚨 Network error:', error.message);
    }

    console.log('\n🎯 Summary:');
    console.log('- Backend server is running on port 5000');
    console.log('- Frontend should be running on port 5173');
    console.log('- Clear browser localStorage and login fresh');
    console.log('- Use credentials: admin@toollink.com / admin123');
}

testLogin();
