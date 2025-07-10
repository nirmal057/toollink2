#!/usr/bin/env node

/**
 * Quick Login Test Script
 * Tests login functionality with the backend API
 */

const API_BASE = 'http://localhost:5000';

async function testLogin() {
    console.log('🧪 Testing ToolLink Login...');
    console.log('=' .repeat(40));

    // Test credentials
    const testCredentials = [
        { email: 'admin@toollink.com', password: 'admin123', role: 'admin' },
        { email: 'cashier@toollink.com', password: 'cashier123', role: 'cashier' },
        { email: 'customer@toollink.com', password: 'customer123', role: 'customer' }
    ];

    // First check if backend is running
    console.log('\n🔍 Checking backend health...');
    try {
        const healthResponse = await fetch(`${API_BASE}/api/health`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Backend is healthy:', healthData.message);
        } else {
            console.log('❌ Backend health check failed');
            console.log('   Make sure the backend server is running on port 5000');
            return;
        }
    } catch (error) {
        console.log('❌ Cannot connect to backend server');
        console.log('   Error:', error.message);
        console.log('   Make sure to start the backend first:');
        console.log('   cd ToolinkBackend && node src/app.js');
        return;
    }

    // Test each login
    for (const creds of testCredentials) {
        console.log(`\n🔐 Testing ${creds.role} login...`);
        console.log(`   Email: ${creds.email}`);
        
        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: creds.email,
                    password: creds.password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log(`   ✅ ${creds.role.toUpperCase()} LOGIN SUCCESS!`);
                console.log(`   User: ${data.user.fullName} (${data.user.role})`);
                console.log(`   Status: ${data.user.status}`);
                console.log(`   Token: ${data.accessToken ? 'Generated' : 'Missing'}`);
            } else {
                console.log(`   ❌ ${creds.role.toUpperCase()} LOGIN FAILED`);
                console.log(`   Status: ${response.status}`);
                console.log(`   Error: ${data.error || 'Unknown error'}`);
                
                if (data.status) {
                    console.log(`   Account Status: ${data.status}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ ${creds.role.toUpperCase()} LOGIN ERROR`);
            console.log(`   Error: ${error.message}`);
        }
    }

    console.log('\n' + '=' .repeat(40));
    console.log('🎯 Login Test Summary:');
    console.log('   If all logins succeeded: ✅ Login system is working!');
    console.log('   If any failed: Run fix-login-issues.js first');
    console.log('\n📱 Frontend Access:');
    console.log('   1. Start frontend: cd ToolLink && npm run dev');
    console.log('   2. Visit: http://localhost:5173');
    console.log('   3. Use any of the credentials above to login');
}

// Run the test
testLogin().catch(console.error);
