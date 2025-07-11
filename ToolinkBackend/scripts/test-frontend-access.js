// Test script to verify frontend can access users
fetch('http://localhost:5173/')
    .then(() => {
        console.log('Frontend is running');

        // Test the API endpoint directly
        return fetch('http://localhost:3000/api/users-new?limit=20');
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ API Test Results:');
        console.log(`📊 Users found: ${data.length || 0}`);
        console.log(`📄 First few users:`, data.slice(0, 3));

        console.log('\n🎯 Navigate to: http://localhost:5173');
        console.log('📝 Then go to User Management page to see all users!');
    })
    .catch(error => {
        console.error('❌ Error:', error);
    });
