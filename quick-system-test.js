const axios = require('axios');

class QuickSystemTest {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.adminToken = null;
    }

    async log(message, status = 'INFO') {
        console.log(`[${new Date().toISOString()}] [${status}] ${message}`);
    }

    async makeRequest(method, endpoint, data = null, token = null) {
        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: { 'Content-Type': 'application/json' }
            };

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return { success: true, data: response.data, status: response.status };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status
            };
        }
    }

    async testHealthCheck() {
        await this.log('Testing health check...');
        const result = await this.makeRequest('GET', '/health');
        
        if (result.success) {
            await this.log('✅ Health check passed');
            return true;
        } else {
            await this.log(`❌ Health check failed: ${result.error}`, 'ERROR');
            return false;
        }
    }

    async testAuthentication() {
        await this.log('Testing admin login...');
        const result = await this.makeRequest('POST', '/auth/login', {
            email: 'admin@toollink.com',
            password: 'admin123'
        });

        if (result.success && result.data.accessToken) {
            this.adminToken = result.data.accessToken;
            await this.log('✅ Admin login successful');
            return true;
        } else {
            await this.log(`❌ Admin login failed: ${result.error}`, 'ERROR');
            return false;
        }
    }

    async testUserManagement() {
        if (!this.adminToken) {
            await this.log('❌ Cannot test user management - no admin token', 'ERROR');
            return false;
        }

        await this.log('Testing user listing...');
        const result = await this.makeRequest('GET', '/users', null, this.adminToken);

        if (result.success) {
            await this.log(`✅ User listing successful - found ${result.data.users?.length || 0} users`);
            return true;
        } else {
            await this.log(`❌ User listing failed: ${result.error}`, 'ERROR');
            return false;
        }
    }

    async testInventoryManagement() {
        if (!this.adminToken) {
            await this.log('❌ Cannot test inventory management - no admin token', 'ERROR');
            return false;
        }

        await this.log('Testing inventory listing...');
        const result = await this.makeRequest('GET', '/inventory', null, this.adminToken);

        if (result.success) {
            await this.log(`✅ Inventory listing successful - found ${result.data.inventory?.length || 0} items`);
            return true;
        } else {
            await this.log(`❌ Inventory listing failed: ${result.error}`, 'ERROR');
            return false;
        }
    }

    async testOrderManagement() {
        if (!this.adminToken) {
            await this.log('❌ Cannot test order management - no admin token', 'ERROR');
            return false;
        }

        await this.log('Testing order listing...');
        const result = await this.makeRequest('GET', '/orders', null, this.adminToken);

        if (result.success) {
            await this.log(`✅ Order listing successful - found ${result.data.orders?.length || 0} orders`);
            return true;
        } else {
            await this.log(`❌ Order listing failed: ${result.error}`, 'ERROR');
            return false;
        }
    }

    async runAllTests() {
        await this.log('=== Starting Quick System Test ===');
        
        const tests = [
            { name: 'Health Check', fn: () => this.testHealthCheck() },
            { name: 'Authentication', fn: () => this.testAuthentication() },
            { name: 'User Management', fn: () => this.testUserManagement() },
            { name: 'Inventory Management', fn: () => this.testInventoryManagement() },
            { name: 'Order Management', fn: () => this.testOrderManagement() }
        ];

        let passed = 0;
        const total = tests.length;

        for (const test of tests) {
            try {
                const result = await test.fn();
                if (result) passed++;
            } catch (error) {
                await this.log(`❌ ${test.name} test threw error: ${error.message}`, 'ERROR');
            }
        }

        await this.log('=== Test Summary ===');
        await this.log(`Total Tests: ${total}`);
        await this.log(`Passed: ${passed}`);
        await this.log(`Failed: ${total - passed}`);
        await this.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        return passed === total;
    }
}

// Run the tests
const tester = new QuickSystemTest();
tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
