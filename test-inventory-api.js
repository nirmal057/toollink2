const axios = require('axios');

async function testInventoryAPI() {
  try {
    console.log('🔐 Step 1: Logging in...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@toollink.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.error);
    }
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful, token obtained');
    
    console.log('📦 Step 2: Testing inventory API...');
    
    // Test inventory API
    const inventoryResponse = await axios.get('http://localhost:5000/api/inventory', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Inventory API Response:');
    console.log('Success:', inventoryResponse.data.success);
    console.log('Data:', JSON.stringify(inventoryResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testInventoryAPI();
