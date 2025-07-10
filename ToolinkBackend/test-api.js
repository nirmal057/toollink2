// Quick API test for Order Management System
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testOrderAPI() {
  try {
    console.log('🧪 Testing Order Management API...\n');

    // Step 1: Test health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend is running:', healthResponse.data.status);

    // Step 2: Login to get token (you'll need to replace with actual credentials)
    console.log('\n2. Testing authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@toolink.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Authentication successful');

      // Step 3: Test order creation
      console.log('\n3. Testing order creation...');
      const orderData = {
        customer: {
          customerId: loginResponse.data.user.id,
          name: 'API Test Customer',
          email: 'apitest@example.com',
          phone: '+94771234567',
          address: {
            street: '123 API Test Lane',
            city: 'Colombo',
            district: 'Colombo',
            postalCode: '10100'
          }
        },
        items: [
          {
            materialId: '67787c8f4d0b123456789abc', // Replace with actual material ID
            materialName: 'Test Material',
            materialSku: 'TEST-001',
            quantity: 5,
            unit: 'pieces',
            unitPrice: 100,
            totalPrice: 500
          }
        ],
        pricing: {
          subtotal: 500,
          tax: 50,
          deliveryCharges: 100,
          discount: 50,
          total: 600,
          currency: 'LKR'
        },
        deliveryPreferences: {
          preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          specialInstructions: 'API test order'
        },
        priority: 'normal'
      };

      try {
        const createOrderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Order created:', createOrderResponse.data.data.orderNumber);

        // Step 4: Test order retrieval
        console.log('\n4. Testing order retrieval...');
        const getOrdersResponse = await axios.get(`${BASE_URL}/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Orders retrieved:', getOrdersResponse.data.data.orders.length, 'orders found');

        // Step 5: Test order statistics
        console.log('\n5. Testing order statistics...');
        const statsResponse = await axios.get(`${BASE_URL}/orders/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Statistics retrieved:', stats.data.data.overview);

      } catch (orderError) {
        console.log('⚠️  Order operations failed:', orderError.response?.data?.message || orderError.message);
        console.log('This might be due to missing material data or other dependencies.');
      }

    } else {
      console.log('❌ Authentication failed:', loginResponse.data.message);
      console.log('Please create an admin user first or update the credentials in this test.');
    }

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data?.message || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running on http://localhost:5000');
    }
  }
}

// Only run if axios is available
try {
  testOrderAPI();
} catch (e) {
  console.log('⚠️  axios not found. Install it with: npm install axios');
  console.log('Or test the API manually using a tool like Postman or curl.');
}

// Manual testing commands:
console.log('\n📋 Manual API Testing Commands:');
console.log('1. Health Check:');
console.log('   curl http://localhost:5000/api/health');
console.log('\n2. Login:');
console.log('   curl -X POST http://localhost:5000/api/auth/login \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"email":"admin@toolink.com","password":"admin123"}\'');
console.log('\n3. Get Orders (replace TOKEN with actual token):');
console.log('   curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/orders');
console.log('\n4. Get Order Stats:');
console.log('   curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/orders/stats');
