import nodemailer from 'nodemailer';

console.log('🔍 Gmail App Password Troubleshooting Guide\n');
console.log('Current App Password: 200013704210');
console.log('Length:', '200013704210'.length, 'characters\n');

console.log('📋 App Password Format Check:');
console.log('✅ Expected: 16 characters (like: abcd efgh ijkl mnop)');
console.log('❓ Your password: 200013704210 (12 characters)');
console.log('\n🚨 ISSUE DETECTED: Your App Password is only 12 characters!');
console.log('Gmail App Passwords should be 16 characters long.\n');

console.log('🔧 How to Fix:');
console.log('1. Go back to Google Account Settings: https://myaccount.google.com/');
console.log('2. Click "Security" → "App passwords"');
console.log('3. DELETE the existing "ToolLink Email System" app password');
console.log('4. CREATE A NEW app password:');
console.log('   - Select "Mail" as the app');
console.log('   - Select "Other (custom name)" as device');
console.log('   - Enter "ToolLink Email System" as name');
console.log('   - Click "Generate"');
console.log('5. Copy the FULL 16-character password (with spaces)');
console.log('   Example: "abcd efgh ijkl mnop" (16 chars total)');
console.log('\n📝 IMPORTANT: Make sure you copy the COMPLETE app password!');

// Test different password formats
const testFormats = [
    '200013704210',           // Original
    '2000 1370 4210',         // With spaces (12 chars)
    '2000 1370 4210 0000',    // Padded to 16 chars
];

console.log('\n🧪 Testing different password formats:');
for (let i = 0; i < testFormats.length; i++) {
    const password = testFormats[i];
    console.log(`${i + 1}. "${password}" (${password.replace(/\s/g, '').length} characters without spaces)`);

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'toollink1234@gmail.com',
                pass: password
            }
        });
        console.log('   📧 Transporter created (connection not tested)');
    } catch (error) {
        console.log(`   ❌ Error creating transporter: ${error.message}`);
    }
}

console.log('\n🎯 Next Steps:');
console.log('1. Generate a NEW App Password (should be 16 characters)');
console.log('2. Update the test with the new password');
console.log('3. Test again');
console.log('\n💡 App passwords look like: "abcd efgh ijkl mnop" (exactly 16 characters)');
