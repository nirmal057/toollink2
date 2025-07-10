const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveSystemTest {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.authToken = null;
        this.testResults = [];
        this.userTokens = {
            admin: null,
            cashier: null,
            warehouse: null,
            customer: null
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        console.log(logMessage);
        this.testResults.push({ timestamp, type, message });
    }

    async makeRequest(method, endpoint, data = null, token = null) {
        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json'
                }
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
        this.log('Testing health check endpoint...');
        const result = await this.makeRequest('GET', '/health');
        
        if (result.success) {
            this.log('✅ Health check passed');
            return true;
        } else {
            this.log(`❌ Health check failed: ${result.error}`, 'error');
            return false;
        }
    }

    async testUserAuthentication() {
        this.log('Testing user authentication system...');
        
        // Test user registration for each role
        const testUsers = [
            {
                role: 'admin',
                username: 'testadmin',
                email: 'testadmin@toollink.com',
                password: 'TestAdmin123!',
                fullName: 'Test Administrator',
                phone: '+1234567890'
            },
            {
                role: 'cashier',
                username: 'testcashier',
                email: 'testcashier@toollink.com',
                password: 'TestCashier123!',
                fullName: 'Test Cashier',
                phone: '+1234567891'
            },
            {
                role: 'warehouse',
                username: 'testwarehouse',
                email: 'testwarehouse@toollink.com',
                password: 'TestWarehouse123!',
                fullName: 'Test Warehouse Manager',
                phone: '+1234567892'
            },
            {
                role: 'customer',
                username: 'testcustomer',
                email: 'testcustomer@toollink.com',
                password: 'TestCustomer123!',
                fullName: 'Test Customer',
                phone: '+1234567893'
            }
        ];

        let authTestsPassed = 0;
        const totalAuthTests = testUsers.length * 2; // register + login for each

        for (const user of testUsers) {
            // Test registration
            const registerResult = await this.makeRequest('POST', '/auth/register', user);
            if (registerResult.success) {
                this.log(`✅ Registration successful for ${user.role}: ${user.email}`);
                authTestsPassed++;
            } else {
                this.log(`❌ Registration failed for ${user.role}: ${registerResult.error}`, 'error');
            }

            // Test login
            const loginResult = await this.makeRequest('POST', '/auth/login', {
                email: user.email,
                password: user.password
            });

            if (loginResult.success && loginResult.data.token) {
                this.log(`✅ Login successful for ${user.role}: ${user.email}`);
                this.userTokens[user.role] = loginResult.data.token;
                authTestsPassed++;
            } else {
                this.log(`❌ Login failed for ${user.role}: ${loginResult.error}`, 'error');
            }
        }

        this.log(`Authentication tests: ${authTestsPassed}/${totalAuthTests} passed`);
        return authTestsPassed === totalAuthTests;
    }

    async testOrderManagementSystem() {
        this.log('Testing order management system...');
        
        if (!this.userTokens.admin || !this.userTokens.customer) {
            this.log('❌ Cannot test orders - missing auth tokens', 'error');
            return false;
        }

        let orderTestsPassed = 0;
        const totalOrderTests = 7;

        // Test creating an order as customer
        const newOrder = {
            items: [
                {
                    material_id: 1,
                    quantity: 100,
                    unit: 'kg',
                    notes: 'Test order item'
                }
            ],
            delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: 'Test order created by automated test'
        };

        const createOrderResult = await this.makeRequest('POST', '/orders', newOrder, this.userTokens.customer);
        if (createOrderResult.success) {
            this.log('✅ Order creation successful');
            orderTestsPassed++;
            
            const orderId = createOrderResult.data.order.id;

            // Test getting orders as customer
            const getOrdersResult = await this.makeRequest('GET', '/orders', null, this.userTokens.customer);
            if (getOrdersResult.success) {
                this.log('✅ Get orders successful');
                orderTestsPassed++;
            } else {
                this.log(`❌ Get orders failed: ${getOrdersResult.error}`, 'error');
            }

            // Test order status update as admin
            const updateStatusResult = await this.makeRequest('PUT', `/orders/${orderId}/status`, {
                status: 'processing',
                notes: 'Order approved by admin'
            }, this.userTokens.admin);
            
            if (updateStatusResult.success) {
                this.log('✅ Order status update successful');
                orderTestsPassed++;
            } else {
                this.log(`❌ Order status update failed: ${updateStatusResult.error}`, 'error');
            }

            // Test order details retrieval
            const getOrderDetailsResult = await this.makeRequest('GET', `/orders/${orderId}`, null, this.userTokens.admin);
            if (getOrderDetailsResult.success) {
                this.log('✅ Order details retrieval successful');
                orderTestsPassed++;
            } else {
                this.log(`❌ Order details retrieval failed: ${getOrderDetailsResult.error}`, 'error');
            }

            // Test delivery scheduling
            const scheduleDeliveryResult = await this.makeRequest('POST', `/orders/${orderId}/schedule-delivery`, {
                delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                delivery_time_slot: 'morning',
                notes: 'Scheduled by automated test'
            }, this.userTokens.admin);

            if (scheduleDeliveryResult.success) {
                this.log('✅ Delivery scheduling successful');
                orderTestsPassed++;
            } else {
                this.log(`❌ Delivery scheduling failed: ${scheduleDeliveryResult.error}`, 'error');
            }

            // Test order feedback submission
            const feedbackResult = await this.makeRequest('POST', `/orders/${orderId}/feedback`, {
                rating: 5,
                comments: 'Excellent service - automated test feedback',
                feedback_type: 'delivery'
            }, this.userTokens.customer);

            if (feedbackResult.success) {
                this.log('✅ Order feedback submission successful');
                orderTestsPassed++;
            } else {
                this.log(`❌ Order feedback submission failed: ${feedbackResult.error}`, 'error');
            }

            // Test order analytics
            const analyticsResult = await this.makeRequest('GET', '/orders/analytics/dashboard', null, this.userTokens.admin);
            if (analyticsResult.success) {
                this.log('✅ Order analytics retrieval successful');
                orderTestsPassed++;
            } else {
                this.log(`❌ Order analytics retrieval failed: ${analyticsResult.error}`, 'error');
            }

        } else {
            this.log(`❌ Order creation failed: ${createOrderResult.error}`, 'error');
        }

        this.log(`Order management tests: ${orderTestsPassed}/${totalOrderTests} passed`);
        return orderTestsPassed === totalOrderTests;
    }

    async testInventoryManagement() {
        this.log('Testing inventory management system...');
        
        if (!this.userTokens.admin || !this.userTokens.warehouse) {
            this.log('❌ Cannot test inventory - missing auth tokens', 'error');
            return false;
        }

        let inventoryTestsPassed = 0;
        const totalInventoryTests = 6;

        // Test getting inventory list
        const getInventoryResult = await this.makeRequest('GET', '/inventory', null, this.userTokens.warehouse);
        if (getInventoryResult.success) {
            this.log('✅ Inventory list retrieval successful');
            inventoryTestsPassed++;
        } else {
            this.log(`❌ Inventory list retrieval failed: ${getInventoryResult.error}`, 'error');
        }

        // Test creating inventory item
        const newInventoryItem = {
            name: 'Test Material Auto',
            description: 'Material created by automated test',
            category: 'Test Category',
            unit: 'kg',
            current_stock: 1000,
            minimum_stock: 100,
            maximum_stock: 5000,
            unit_price: 25.50,
            supplier_info: 'Test Supplier'
        };

        const createInventoryResult = await this.makeRequest('POST', '/inventory', newInventoryItem, this.userTokens.admin);
        if (createInventoryResult.success) {
            this.log('✅ Inventory item creation successful');
            inventoryTestsPassed++;
            
            const itemId = createInventoryResult.data.material.id;

            // Test inventory item update
            const updateInventoryResult = await this.makeRequest('PUT', `/inventory/${itemId}`, {
                current_stock: 1200,
                unit_price: 26.00
            }, this.userTokens.warehouse);

            if (updateInventoryResult.success) {
                this.log('✅ Inventory item update successful');
                inventoryTestsPassed++;
            } else {
                this.log(`❌ Inventory item update failed: ${updateInventoryResult.error}`, 'error');
            }

            // Test low stock alerts
            const lowStockResult = await this.makeRequest('GET', '/inventory/low-stock', null, this.userTokens.warehouse);
            if (lowStockResult.success) {
                this.log('✅ Low stock alerts retrieval successful');
                inventoryTestsPassed++;
            } else {
                this.log(`❌ Low stock alerts retrieval failed: ${lowStockResult.error}`, 'error');
            }

            // Test inventory analytics
            const inventoryAnalyticsResult = await this.makeRequest('GET', '/inventory/analytics', null, this.userTokens.admin);
            if (inventoryAnalyticsResult.success) {
                this.log('✅ Inventory analytics retrieval successful');
                inventoryTestsPassed++;
            } else {
                this.log(`❌ Inventory analytics retrieval failed: ${inventoryAnalyticsResult.error}`, 'error');
            }

            // Test material prediction
            const predictionResult = await this.makeRequest('GET', '/inventory/predict-demand', null, this.userTokens.admin);
            if (predictionResult.success) {
                this.log('✅ Material demand prediction successful');
                inventoryTestsPassed++;
            } else {
                this.log(`❌ Material demand prediction failed: ${predictionResult.error}`, 'error');
            }

        } else {
            this.log(`❌ Inventory item creation failed: ${createInventoryResult.error}`, 'error');
        }

        this.log(`Inventory management tests: ${inventoryTestsPassed}/${totalInventoryTests} passed`);
        return inventoryTestsPassed === totalInventoryTests;
    }

    async testAdminFunctions() {
        this.log('Testing admin functions...');
        
        if (!this.userTokens.admin) {
            this.log('❌ Cannot test admin functions - missing admin token', 'error');
            return false;
        }

        let adminTestsPassed = 0;
        const totalAdminTests = 5;

        // Test admin dashboard
        const dashboardResult = await this.makeRequest('GET', '/admin/dashboard', null, this.userTokens.admin);
        if (dashboardResult.success) {
            this.log('✅ Admin dashboard retrieval successful');
            adminTestsPassed++;
        } else {
            this.log(`❌ Admin dashboard retrieval failed: ${dashboardResult.error}`, 'error');
        }

        // Test user management
        const usersResult = await this.makeRequest('GET', '/users', null, this.userTokens.admin);
        if (usersResult.success) {
            this.log('✅ User management retrieval successful');
            adminTestsPassed++;
        } else {
            this.log(`❌ User management retrieval failed: ${usersResult.error}`, 'error');
        }

        // Test system reports
        const reportsResult = await this.makeRequest('GET', '/admin/reports', null, this.userTokens.admin);
        if (reportsResult.success) {
            this.log('✅ System reports retrieval successful');
            adminTestsPassed++;
        } else {
            this.log(`❌ System reports retrieval failed: ${reportsResult.error}`, 'error');
        }

        // Test audit logs
        const auditResult = await this.makeRequest('GET', '/admin/audit-logs', null, this.userTokens.admin);
        if (auditResult.success) {
            this.log('✅ Audit logs retrieval successful');
            adminTestsPassed++;
        } else {
            this.log(`❌ Audit logs retrieval failed: ${auditResult.error}`, 'error');
        }

        // Test notifications
        const notificationsResult = await this.makeRequest('GET', '/notifications', null, this.userTokens.admin);
        if (notificationsResult.success) {
            this.log('✅ Notifications retrieval successful');
            adminTestsPassed++;
        } else {
            this.log(`❌ Notifications retrieval failed: ${notificationsResult.error}`, 'error');
        }

        this.log(`Admin functions tests: ${adminTestsPassed}/${totalAdminTests} passed`);
        return adminTestsPassed === totalAdminTests;
    }

    async generateReport() {
        const reportPath = path.join(__dirname, 'comprehensive-test-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            testResults: this.testResults,
            summary: {
                totalTests: this.testResults.filter(r => r.message.includes('✅') || r.message.includes('❌')).length,
                passedTests: this.testResults.filter(r => r.message.includes('✅')).length,
                failedTests: this.testResults.filter(r => r.message.includes('❌')).length
            }
        };

        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        this.log(`Test report generated: ${reportPath}`);
        
        return report;
    }

    async runAllTests() {
        this.log('Starting comprehensive system test...');
        
        const testSuites = [
            { name: 'Health Check', func: () => this.testHealthCheck() },
            { name: 'Authentication', func: () => this.testUserAuthentication() },
            { name: 'Order Management', func: () => this.testOrderManagementSystem() },
            { name: 'Inventory Management', func: () => this.testInventoryManagement() },
            { name: 'Admin Functions', func: () => this.testAdminFunctions() }
        ];

        const results = {};
        
        for (const suite of testSuites) {
            this.log(`\n=== Running ${suite.name} Tests ===`);
            try {
                results[suite.name] = await suite.func();
            } catch (error) {
                this.log(`❌ ${suite.name} test suite failed with error: ${error.message}`, 'error');
                results[suite.name] = false;
            }
        }

        // Generate final report
        const report = await this.generateReport();
        
        this.log('\n=== COMPREHENSIVE TEST SUMMARY ===');
        this.log(`Total Tests: ${report.summary.totalTests}`);
        this.log(`Passed: ${report.summary.passedTests}`);
        this.log(`Failed: ${report.summary.failedTests}`);
        this.log(`Success Rate: ${((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1)}%`);

        return results;
    }
}

// Run the comprehensive test
async function main() {
    const tester = new ComprehensiveSystemTest();
    
    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('Test execution failed:', error);
        process.exit(1);
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = ComprehensiveSystemTest;
