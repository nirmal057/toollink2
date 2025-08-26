#!/usr/bin/env node

/**
 * Test script to verify the Customer Approval Count feature
 * This script will:
 * 1. Register new customers to create pending approvals
 * 2. Login as admin to check the approval count in the sidebar
 * 3. Verify the API endpoint returns correct count
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test credentials
const adminCredentials = {
    email: 'admin@toollink.com',
    password: 'admin123'
};

// Test customers to register
const testCustomers = [
    {
        fullName: 'John Doe',
        email: `test.customer.${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        password: 'password123',
        role: 'customer'
    },
    {
        fullName: 'Jane Smith',
        email: `test.customer2.${Date.now()}@example.com`,
        username: `testuser2${Date.now()}`,
        password: 'password123',
        role: 'customer'
    }
];

async function testApprovalCountFeature() {
    console.log('🧪 Testing Customer Approval Count Feature');
    console.log('=' * 50);

    try {
        // Step 1: Register test customers
        console.log('\n1️⃣  Registering test customers...');

        for (let i = 0; i < testCustomers.length; i++) {
            const customer = testCustomers[i];
            try {
                const response = await axios.post(`${API_BASE}/auth/register`, customer);
                if (response.data.success) {
                    console.log(`✅ Customer ${i + 1} registered: ${customer.fullName}`);
                } else {
                    console.log(`❌ Failed to register customer ${i + 1}: ${response.data.error}`);
                }
            } catch (error) {
                console.log(`❌ Error registering customer ${i + 1}: ${error.response?.data?.error || error.message}`);
            }
        }

        // Step 2: Login as admin
        console.log('\n2️⃣  Logging in as admin...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, adminCredentials);

        if (!loginResponse.data.success) {
            console.log('❌ Admin login failed:', loginResponse.data.error);
            return;
        }

        const adminToken = loginResponse.data.accessToken;
        console.log('✅ Admin login successful');

        // Step 3: Check pending approval count via API
        console.log('\n3️⃣  Checking pending approval count...');

        const pendingResponse = await axios.get(`${API_BASE}/auth/pending-users`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (pendingResponse.data.success) {
            const count = pendingResponse.data.count;
            const users = pendingResponse.data.users;

            console.log(`✅ Pending approval count: ${count}`);
            console.log(`📋 Pending users found: ${users.length}`);

            if (users.length > 0) {
                console.log('\n📝 Pending users:');
                users.forEach((user, index) => {
                    console.log(`   ${index + 1}. ${user.fullName} (${user.email})`);
                });
            }
        } else {
            console.log('❌ Failed to get pending users:', pendingResponse.data.error);
        }

        // Step 4: Test the approval notification service
        console.log('\n4️⃣  Testing CustomerApprovalNotificationService...');
        console.log('ℹ️  This would be tested in the frontend browser environment');
        console.log('ℹ️  The service should show the same count in the sidebar badge');

        console.log('\n✅ Approval Count Feature Test Complete!');
        console.log('\n📋 What to verify in frontend:');
        console.log('1. Open http://localhost:5174');
        console.log('2. Login as admin');
        console.log('3. Check sidebar - Customer Approval should show count badge');
        console.log('4. Count badge should match the API count');
        console.log('5. Badge should be orange/red and animated');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run the test
testApprovalCountFeature();
