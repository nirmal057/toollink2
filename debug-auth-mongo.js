/**
 * Debug authentication issues
 */

const BASE_URL = 'http://localhost:3000/api';

async function debugAuth() {
    console.log('🔍 Debugging Authentication Issues');
    console.log('=' .repeat(50));
    
    try {
        // 1. Check if server is running
        console.log('1️⃣ Testing server health...');
        const healthResponse = await fetch(`${BASE_URL}/health`);
        
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('✅ Server is healthy:', health);
        } else {
            console.log('❌ Server health check failed:', healthResponse.status);
        }
        
        // 2. Test different login attempts
        console.log('\n2️⃣ Testing login endpoints...');
        
        const attempts = [
            { username: 'admin', password: 'admin123' },
            { email: 'admin@toollink.com', password: 'admin123' },
            { username: 'admin', password: 'password' }
        ];
        
        for (const credentials of attempts) {
            console.log(`\n   Testing with: ${JSON.stringify(credentials)}`);
            
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            
            const text = await response.text();
            console.log(`   Status: ${response.status}`);
            console.log(`   Response: ${text}`);
        }
        
        // 3. Check if we can list users (might need to create them first)
        console.log('\n3️⃣ Checking available users...');
        
        // First, let's create an admin user if it doesn't exist
        console.log('\n   Creating admin user...');
        const createResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                email: 'admin@toollink.com',
                password: 'admin123',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                employeeId: 'ADMIN001',
                department: 'Administration'
            })
        });
        
        const createText = await createResponse.text();
        console.log(`   Create admin status: ${createResponse.status}`);
        console.log(`   Create admin response: ${createText}`);
        
        // Try login again
        console.log('\n   Retrying admin login...');
        const retryResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        const retryText = await retryResponse.text();
        console.log(`   Retry status: ${retryResponse.status}`);
        console.log(`   Retry response: ${retryText}`);
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugAuth();
