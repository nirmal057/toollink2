const axios = require('axios');

async function checkInventoryStructure() {
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@toollink.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    const response = await axios.get('http://localhost:5000/api/inventory?limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Sample inventory item structure:');
    console.log(JSON.stringify(response.data.items[0], null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkInventoryStructure();
