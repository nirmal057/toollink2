/**
 * Quick test to manually approve a pending customer
 * This bypasses rate limiting by waiting a bit between requests
 */

const API_BASE = 'http://localhost:5000/api';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function quickApprovalTest() {
    console.log('🧪 Quick Customer Approval Test...\n');
    
    // Wait for rate limit to reset
    console.log('⏳ Waiting for rate limit to reset...');
    await sleep(5000);
    
    // Try login with the correct cashier credentials
    const cashierCredentials = [
        { email: 'cashier@toolink.com', password: 'password123' },
        { email: 'mike@example.com', password: 'password123' },
        { email: 'admin@toolink.com', password: 'admin123' }
    ];
    
    let cashierToken = null;
    
    for (const cred of cashierCredentials) {
        console.log(`Trying login: ${cred.email}`);
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cred)
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log(`✅ Login successful: ${cred.email}`);
                cashierToken = data.accessToken;
                break;
            } else {
                console.log(`❌ Login failed: ${data.error}`);
                await sleep(2000); // Wait between attempts
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    if (!cashierToken) {
        console.log('❌ Could not login with any credentials');
        return;
    }
    
    // Get pending users
    console.log('\n📋 Fetching pending users...');
    try {
        const response = await fetch(`${API_BASE}/auth/pending-users`, {
            headers: {
                'Authorization': `Bearer ${cashierToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Found ${data.users?.length || 0} pending users`);
            
            if (data.users && data.users.length > 0) {
                const user = data.users[0];
                console.log(`\n🎯 Approving: ${user.email} (ID: ${user.id})`);
                
                const approveResponse = await fetch(`${API_BASE}/auth/approve-user/${user.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${cashierToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const approveData = await approveResponse.json();
                
                if (approveResponse.ok) {
                    console.log(`✅ User approved successfully! ${approveData.message}`);
                    
                    // Try to login as the approved customer if we have credentials
                    if (user.email === 'nirmalisuranga4210@gmail.com') {
                        console.log('\n🔐 Testing customer login after approval...');
                        // This would require knowing the customer's password
                        console.log('💡 Customer can now login through the frontend!');
                    }
                } else {
                    console.log(`❌ Approval failed: ${approveData.error}`);
                }
            } else {
                console.log('ℹ️  No pending users to approve');
            }
        } else {
            console.log(`❌ Failed to get pending users: ${data.error}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

quickApprovalTest();
