// Customer Approval Management Test Script
console.log('🧪 Customer Approval Management - End-to-End Test');
console.log('==================================================\n');

// Test the complete workflow
async function testCustomerApprovalWorkflow() {
    const baseUrl = 'http://localhost:5000';
    
    try {
        console.log('1️⃣ Attempting admin login...');
        
        // Login as admin
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            const loginError = await loginResponse.json().catch(() => ({}));
            console.log('❌ Admin login failed:', loginError.error || 'Unknown error');
            console.log('ℹ️  Note: Make sure to create an admin user first or use existing credentials');
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Admin login successful');
        
        const token = loginData.accessToken;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        console.log('\n2️⃣ Fetching pending users...');
        
        // Get pending users
        const pendingResponse = await fetch(`${baseUrl}/api/auth/pending-users`, {
            headers
        });
        
        if (!pendingResponse.ok) {
            const pendingError = await pendingResponse.json().catch(() => ({}));
            console.log('❌ Failed to fetch pending users:', pendingError.error || 'Unknown error');
            return;
        }
        
        const pendingData = await pendingResponse.json();
        console.log(`✅ Found ${pendingData.users?.length || 0} pending user(s)`);
        
        if (pendingData.users && pendingData.users.length > 0) {
            console.log('\n📋 Pending users:');
            pendingData.users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.full_name || user.username} (${user.email})`);
                console.log(`      Username: ${user.username}`);
                console.log(`      Phone: ${user.phone || 'N/A'}`);
                console.log(`      Registered: ${new Date(user.created_at).toLocaleDateString()}`);
                console.log('');
            });
            
            // Test approving the first user
            const userToApprove = pendingData.users[0];
            console.log(`3️⃣ Testing approval for user: ${userToApprove.email}...`);
            
            const approveResponse = await fetch(`${baseUrl}/api/auth/approve-user/${userToApprove.id}`, {
                method: 'POST',
                headers
            });
            
            if (approveResponse.ok) {
                const approveData = await approveResponse.json();
                console.log('✅ User approved successfully:', approveData.message);
            } else {
                const approveError = await approveResponse.json().catch(() => ({}));
                console.log('❌ Failed to approve user:', approveError.error || 'Unknown error');
            }
            
            // Fetch pending users again to show the change
            console.log('\n4️⃣ Checking pending users after approval...');
            const updatedPendingResponse = await fetch(`${baseUrl}/api/auth/pending-users`, {
                headers
            });
            
            if (updatedPendingResponse.ok) {
                const updatedPendingData = await updatedPendingResponse.json();
                console.log(`✅ Now ${updatedPendingData.users?.length || 0} pending user(s) remaining`);
            }
        } else {
            console.log('ℹ️  No pending users found to test with');
        }
        
        console.log('\n🎉 Customer Approval Management Test Complete!');
        console.log('\n📱 Frontend Access:');
        console.log('1. Open http://localhost:5174 in your browser');
        console.log('2. Login as admin (admin@toollink.com)');
        console.log('3. Navigate to Customer Approval Management');
        console.log('4. Review and approve/reject pending customers');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
    // Node.js environment
    const { fetch } = require('undici');
    testCustomerApprovalWorkflow();
} else {
    // Browser environment
    console.log('Run this script in Node.js or copy the functions to browser console');
}
