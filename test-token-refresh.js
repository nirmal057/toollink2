// Test Token Refresh Functionality
// Run this in browser console to test token refresh

console.log('=== Token Refresh Test ===');

// Check current tokens
const accessToken = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');

console.log('Current access token:', accessToken ? accessToken.substring(0, 20) + '...' : 'None');
console.log('Current refresh token:', refreshToken ? refreshToken.substring(0, 20) + '...' : 'None');

if (!accessToken || !refreshToken) {
    console.error('No tokens found. Please login first.');
} else {
    // Test the token refresh endpoint directly
    fetch('http://localhost:3000/api/auth/refresh-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            refreshToken: refreshToken
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Refresh response:', data);
            if (data.success) {
                console.log('✅ Token refresh successful');
                console.log('New access token:', data.accessToken ? data.accessToken.substring(0, 20) + '...' : 'None');
                console.log('New refresh token:', data.refreshToken ? data.refreshToken.substring(0, 20) + '...' : 'None');

                // Update tokens in localStorage
                if (data.accessToken) {
                    localStorage.setItem('accessToken', data.accessToken);
                }
                if (data.refreshToken) {
                    localStorage.setItem('refreshToken', data.refreshToken);
                }
                console.log('✅ Tokens updated in localStorage');
            } else {
                console.error('❌ Token refresh failed:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ Token refresh error:', error);
        });
}
