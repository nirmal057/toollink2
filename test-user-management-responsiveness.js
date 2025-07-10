/**
 * Test script to verify user management functionality and form responsiveness
 * Tests both MongoDB backend and responsive frontend
 */

const BASE_URL = 'http://localhost:3000/api';

// Test admin credentials  
const ADMIN_CREDENTIALS = {
    email: 'admin@toollink.com',
    password: 'admin123'
};

async function testUserManagementFlow() {
    console.log('🧪 Testing User Management Flow with MongoDB Backend');
    console.log('=' .repeat(60));
    
    try {
        // 1. Test admin login
        console.log('1️⃣ Testing admin login...');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ADMIN_CREDENTIALS)
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Admin login successful');
        console.log(`   Response:`, JSON.stringify(loginData, null, 2));
        
        const token = loginData.accessToken;
        
        // 2. Test fetching users
        console.log('\n2️⃣ Testing user list fetch...');
        const usersResponse = await fetch(`${BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!usersResponse.ok) {
            throw new Error(`Failed to fetch users: ${usersResponse.status}`);
        }
        
        const usersData = await usersResponse.json();
        console.log('✅ Users response:', JSON.stringify(usersData, null, 2));
        
        const users = Array.isArray(usersData) ? usersData : (usersData.users || []);
        console.log(`✅ Successfully fetched ${users.length} users`);
        if (users.length > 0) {
            console.log(`   Users: ${users.map(u => u.username || u.name).join(', ')}`);
        }
        
        // 3. Test creating a new user
        console.log('\n3️⃣ Testing user creation...');
        const newUser = {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            fullName: 'Test User',
            role: 'customer',
            employeeId: `EMP${Date.now()}`,
            department: 'Testing'
        };
        
        const createResponse = await fetch(`${BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newUser)
        });
        
        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Failed to create user: ${createResponse.status} - ${errorText}`);
        }
        
        const createdUser = await createResponse.json();
        console.log('✅ User created successfully');
        console.log(`   New user ID: ${createdUser.user._id}`);
        console.log(`   Email: ${createdUser.user.email}`);
        
        // 4. Test updating the user
        console.log('\n4️⃣ Testing user update...');
        const updateData = {
            fullName: 'Updated Test User',
            department: 'Updated Department'
        };
        
        const updateResponse = await fetch(`${BASE_URL}/users/${createdUser.user._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (!updateResponse.ok) {
            throw new Error(`Failed to update user: ${updateResponse.status}`);
        }
        
        const updatedUser = await updateResponse.json();
        console.log('✅ User updated successfully');
        console.log(`   Updated name: ${updatedUser.fullName}`);
        
        // 5. Test deleting the user
        console.log('\n5️⃣ Testing user deletion...');
        const deleteResponse = await fetch(`${BASE_URL}/users/${createdUser.user._id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!deleteResponse.ok) {
            throw new Error(`Failed to delete user: ${deleteResponse.status}`);
        }
        
        console.log('✅ User deleted successfully');
        
        console.log('\n🎉 All user management tests passed!');
        console.log('\n📱 Frontend Testing Instructions:');
        console.log('   1. Open http://localhost:5173/ in your browser');
        console.log('   2. Login with admin/admin123');
        console.log('   3. Navigate to User Management');
        console.log('   4. Click "Add User" to test the responsive form modal');
        console.log('   5. Test the form on different screen sizes:');
        console.log('      - Mobile (320px-768px): Form should stack vertically');
        console.log('      - Tablet (768px-1024px): Form should have medium spacing');
        console.log('      - Desktop (1024px+): Form should have full spacing');
        console.log('\n📋 Responsive Features to Test:');
        console.log('   ✓ Modal container scales appropriately');
        console.log('   ✓ Form fields stack on mobile, side-by-side on desktop');
        console.log('   ✓ Button layout: vertical on mobile, horizontal on desktop');
        console.log('   ✓ Text sizes adjust based on screen size');
        console.log('   ✓ Padding and margins respond to screen size');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testUserManagementFlow();
