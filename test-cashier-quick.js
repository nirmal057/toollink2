/**
 * Simple test to check existing cashier credentials and approve pending customer
 */

const API_BASE = 'http://localhost:5000/api';

async function testCashierLogin() {
    console.log('🧪 Testing Cashier Login...\n');

    // Try different possible passwords for cashier
    const possiblePasswords = ['cashier123', 'password', 'admin123', 'cashier', 'toolink123'];
    
    for (const password of possiblePasswords) {
        console.log(`Trying password: ${password}`);
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'cashier@toolink.com',
                    password: password
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Cashier login successful with password:', password);
                console.log('Token:', data.accessToken.substring(0, 20) + '...');
                
                // Test pending users endpoint
                await testPendingUsers(data.accessToken);
                return;
            } else {
                console.log('❌ Failed:', data.error);
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
    }
    
    console.log('❌ None of the passwords worked for cashier account');
}

async function testPendingUsers(token) {
    console.log('\n📋 Testing pending users endpoint...');
    
    try {
        const response = await fetch(`${API_BASE}/auth/pending-users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Pending Users Response:', JSON.stringify(data, null, 2));
        
        if (response.ok && data.users?.length > 0) {
            console.log(`✅ Found ${data.users.length} pending user(s)`);
            
            // Try to approve the first pending user
            const firstPendingUser = data.users[0];
            console.log(`\n✅ Attempting to approve user: ${firstPendingUser.email}`);
            
            const approveResponse = await fetch(`${API_BASE}/auth/approve-user/${firstPendingUser.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const approveData = await approveResponse.json();
            console.log('Approval Response:', JSON.stringify(approveData, null, 2));
            
            if (approveResponse.ok) {
                console.log('✅ User approved successfully!');
            } else {
                console.log('❌ Approval failed:', approveData.error);
            }
        } else {
            console.log('No pending users found or request failed');
        }
    } catch (error) {
        console.log('❌ Error testing pending users:', error.message);
    }
}

testCashierLogin();
