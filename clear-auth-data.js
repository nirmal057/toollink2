// Clear authentication data script
// Run this in browser console to clear stored authentication data

console.log('🔧 Clearing authentication data...');

// Clear localStorage
console.log('📦 Clearing localStorage...');
const keys = Object.keys(localStorage);
keys.forEach(key => {
    if (key.includes('auth') || key.includes('token') || key.includes('user') || key.includes('login')) {
        console.log(`  - Removing: ${key}`);
        localStorage.removeItem(key);
    }
});

// Clear sessionStorage
console.log('📦 Clearing sessionStorage...');
const sessionKeys = Object.keys(sessionStorage);
sessionKeys.forEach(key => {
    if (key.includes('auth') || key.includes('token') || key.includes('user') || key.includes('login')) {
        console.log(`  - Removing: ${key}`);
        sessionStorage.removeItem(key);
    }
});

// Clear all cookies
console.log('🍪 Clearing cookies...');
document.cookie.split(";").forEach(function (c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

console.log('✅ Authentication data cleared!');
console.log('🔄 Please refresh the page and login again.');
console.log('📋 Navigate to /admin/messages or /messages after logging in.');

// Instructions
console.log('\n📖 INSTRUCTIONS:');
console.log('1. Refresh the page (F5 or Ctrl+R)');
console.log('2. Login with admin credentials');
console.log('3. Navigate to Customer Messages');
console.log('4. You should now see the contact form messages');
