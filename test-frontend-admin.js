// Simple test to verify admin login
const testAdminAccess = async () => {
    console.log('🔧 Testing Frontend Admin Access...\n');
    
    // Test if localStorage has user data
    const userStr = localStorage.getItem('user');
    const tokenStr = localStorage.getItem('token');
    
    console.log('localStorage user:', userStr);
    console.log('localStorage token:', tokenStr ? 'Present' : 'Missing');
    
    if (userStr) {
        const user = JSON.parse(userStr);
        console.log('Parsed user:', user);
        console.log('User role:', user.role);
    }
    
    // Test direct login and check RBAC
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });
        
        const result = await response.json();
        console.log('Direct login result:', result);
        
        if (result.success) {
            // Store the data as the frontend would
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('token', result.accessToken);
            
            console.log('✅ Login successful, user stored in localStorage');
            console.log('User data:', result.user);
            console.log('Role:', result.user.role);
        }
    } catch (error) {
        console.log('❌ Login test failed:', error);
    }
};

// Run the test
testAdminAccess();
