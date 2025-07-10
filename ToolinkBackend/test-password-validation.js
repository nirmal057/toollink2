const axios = require('axios');

async function testWrongPassword() {
    console.log('🧪 Testing WRONG PASSWORD to debug backend...');

    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@toollink.com',
            password: 'definitely_wrong_password_123'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('📊 Response status:', response.status);
        console.log('📋 Response data:', response.data);
        console.log('❌ ERROR: Wrong password was accepted!');

    } catch (error) {
        if (error.response) {
            console.log('✅ CORRECT: Wrong password was rejected');
            console.log('📊 Error status:', error.response.status);
            console.log('📋 Error data:', error.response.data);
        } else {
            console.log('❌ Connection error:', error.message);
        }
    }
}

async function testCorrectPassword() {
    console.log('\n🧪 Testing CORRECT PASSWORD...');

    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@toollink.com',
            password: 'admin123'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ CORRECT: Correct password was accepted');
        console.log('📊 Response status:', response.status);
        console.log('👤 User:', response.data.user.fullName);
        console.log('📧 Email:', response.data.user.email);

    } catch (error) {
        console.log('❌ ERROR: Correct password was rejected!');
        if (error.response) {
            console.log('📊 Error status:', error.response.status);
            console.log('📋 Error data:', error.response.data);
        }
    }
}

async function testNonExistentUser() {
    console.log('\n🧪 Testing NON-EXISTENT USER...');

    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'nonexistent@example.com',
            password: 'any_password'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('❌ ERROR: Non-existent user was accepted!');
        console.log('📊 Response status:', response.status);
        console.log('📋 Response data:', response.data);

    } catch (error) {
        console.log('✅ CORRECT: Non-existent user was rejected');
        if (error.response) {
            console.log('📊 Error status:', error.response.status);
            console.log('📋 Error data:', error.response.data);
        }
    }
}

async function runAllTests() {
    await testWrongPassword();
    await testCorrectPassword();
    await testNonExistentUser();
}

runAllTests();
