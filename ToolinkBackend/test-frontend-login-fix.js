// Test the frontend login fix
const axios = require('axios');

// Simulate the API_CONFIG and createApiHeaders from frontend
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login'
        }
    }
};

function createApiHeaders() {
    return {
        'Content-Type': 'application/json',
    };
}

async function testFrontendLogin() {
    console.log('🔧 Testing Frontend Login Fix...');

    const credentials = {
        email: 'admin@toollink.com',
        password: 'admin123'
    };

    try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`;
        console.log('📡 Attempting login with API:', url);

        const response = await axios.post(url, credentials, {
            headers: createApiHeaders(),
        });

        const data = response.data;
        console.log('📊 Response status:', response.status);
        console.log('📋 Login response:', data);

        // Use the fixed logic from authService.ts
        if (response.status === 200 && data.success) {
            const user = data.user;
            const accessToken = data.accessToken;
            const refreshToken = data.refreshToken;

            if (user && accessToken) {
                console.log('✅ LOGIN SUCCESSFUL!');
                console.log('👤 User:', user.fullName || user.name);
                console.log('🎭 Role:', user.role);
                console.log('📧 Email:', user.email);
                console.log('🎫 Access Token:', accessToken ? 'Present' : 'Missing');
                console.log('🔄 Refresh Token:', refreshToken ? 'Present' : 'Missing');
                return { success: true, user };
            }
        }

    } catch (error) {
        console.log('📊 Error status:', error.response?.status);
        console.log('📋 Error response:', error.response?.data);

        // Handle errors like the fixed frontend code
        if (error.response?.status === 401) {
            console.log('❌ 401 Unauthorized - Invalid credentials');
            return {
                success: false,
                error: error.response.data.message || 'Invalid email or password',
                errorType: 'INVALID_CREDENTIALS'
            };
        }

        console.log('❌ Login failed:', error.response?.data?.message || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'Login failed. Please try again.',
            errorType: 'credentials'
        };
    }
}

// Test with multiple credentials
async function testMultipleCredentials() {
    const testCreds = [
        { email: 'admin@toollink.com', password: 'admin123', name: 'Primary Admin' },
        { email: 'test@admin.com', password: 'test123', name: 'Test Admin' },
        { email: 'admin@toollink.com', password: 'wrong123', name: 'Wrong Password Test' }
    ];

    for (const cred of testCreds) {
        console.log(`\n🧪 Testing ${cred.name}:`);
        console.log(`   Email: ${cred.email}, Password: ${cred.password}`);
        await testFrontendLogin();
    }
}

testMultipleCredentials();
