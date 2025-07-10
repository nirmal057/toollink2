const axios = require('axios');

async function testInventoryAPIDetailed() {
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
    console.log('✅ Login successful');
    
    console.log('📦 Step 2: Testing inventory API with detailed logging...');
    
    // Test inventory API with various parameters
    const testQueries = [
      '',
      '?isActive=true',
      '?isActive=false', 
      '?limit=10',
      '?page=1&limit=10&isActive=true'
    ];
    
    for (const queryParams of testQueries) {
      console.log(`\n🔍 Testing: /api/inventory${queryParams}`);
      
      try {
        const response = await axios.get(`http://localhost:5000/api/inventory${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${response.data.success}`);
        console.log(`   Items count: ${response.data.items?.length || 0}`);
        console.log(`   Total items: ${response.data.pagination?.totalItems || 'N/A'}`);
        
        if (response.data.items && response.data.items.length > 0) {
          const item = response.data.items[0];
          console.log(`   First item: ${item.name} (ID: ${item._id})`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Overall Error:', error.response?.data || error.message);
  }
}

testInventoryAPIDetailed();
