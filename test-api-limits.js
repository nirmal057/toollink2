#!/usr/bin/env node

/**
 * Test API User Fetch with Different Limits
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const ADMIN_CREDENTIALS = {
    email: 'admin@toollink.com',
    password: 'admin123'
};

async function testUserFetchLimits() {
    console.log('🔍 Testing API User Fetch with Different Limits\n');

    // Login first
    try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, ADMIN_CREDENTIALS);
        const authToken = loginResponse.data.accessToken;
        console.log('✅ Login successful');

        // Test different limits
        const limits = [10, 50, 100, 1000];

        for (const limit of limits) {
            try {
                const response = await axios.get(`${BASE_URL}/api/users?limit=${limit}&page=1`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });

                const users = response.data.users || [];
                const pagination = response.data.pagination || {};

                console.log(`📊 Limit ${limit}: Got ${users.length} users`);
                console.log(`   Total in DB: ${pagination.totalUsers || 'unknown'}`);
                console.log(`   Total pages: ${pagination.totalPages || 'unknown'}`);

                if (users.length >= 50) {
                    console.log('✅ API can return more than 10 users');
                    break;
                }
            } catch (error) {
                console.error(`❌ Failed with limit ${limit}:`, error.response?.data?.error || error.message);
            }
        }

    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.error || error.message);
    }
}

testUserFetchLimits();
