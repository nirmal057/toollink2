const axios = require('axios');

const sampleInventoryItems = [
  {
    name: "Portland Cement 50kg",
    category: "Building Materials",
    description: "High quality Portland cement for construction",
    sku: "CEM-PORT-50",
    pricing: {
      costPrice: 750.00,
      sellingPrice: 850.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 150,
      minimumQuantity: 20,
      unit: "piece"
    },
    location: {
      warehouse: "Warehouse A",
      zone: "Section 1"
    },
    supplier: {
      name: "Ceylon Cement Company",
      phone: "+94-11-123-4567"
    }
  },
  {
    name: "Steel Rods 12mm x 6m",
    category: "Building Materials",
    description: "High tensile steel rods for construction",
    sku: "STL-ROD-12-6",
    pricing: {
      costPrice: 1100.00,
      sellingPrice: 1250.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 75,
      minimumQuantity: 10,
      unit: "piece"
    },
    location: {
      warehouse: "Warehouse B",
      zone: "Section 2"
    },
    supplier: {
      name: "Lanka Steel Corporation",
      phone: "+94-11-234-5678"
    }
  },
  {
    name: "Ceramic Floor Tiles 60x60cm",
    category: "Building Materials",
    description: "Premium ceramic floor tiles",
    sku: "TIL-CER-6060",
    pricing: {
      costPrice: 380.00,
      sellingPrice: 450.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 200,
      minimumQuantity: 50,
      unit: "piece"
    },
    location: {
      warehouse: "Warehouse C",
      zone: "Section 1"
    },
    supplier: {
      name: "Royal Ceramics Lanka",
      phone: "+94-11-345-6789"
    }
  },
  {
    name: "PVC Pipes 4 inch x 6m",
    category: "Plumbing",
    description: "Heavy duty PVC pipes for plumbing",
    sku: "PVC-PIPE-4-6",
    pricing: {
      costPrice: 1600.00,
      sellingPrice: 1800.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 30,
      minimumQuantity: 25,
      unit: "piece"
    },
    location: {
      warehouse: "Warehouse A",
      zone: "Section 3"
    },
    supplier: {
      name: "Dimo Industrial Supplies",
      phone: "+94-11-456-7890"
    }
  },
  {
    name: "Electrical Cable 2.5mm²",
    category: "Electrical",
    description: "Single core electrical cable",
    sku: "ELC-CBL-2.5",
    pricing: {
      costPrice: 70.00,
      sellingPrice: 85.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 500,
      minimumQuantity: 100,
      unit: "meter"
    },
    location: {
      warehouse: "Warehouse B",
      zone: "Section 1"
    },
    supplier: {
      name: "Kelani Cables PLC",
      phone: "+94-11-567-8901"
    }
  },
  {
    name: "Hammer 500g",
    category: "Tools",
    description: "Claw hammer with steel handle",
    sku: "HAM-500G",
    pricing: {
      costPrice: 800.00,
      sellingPrice: 950.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 12,
      minimumQuantity: 15,
      unit: "piece"
    },
    location: {
      warehouse: "Warehouse C",
      zone: "Section 2"
    },
    supplier: {
      name: "Stanley Tools Lanka",
      phone: "+94-11-678-9012"
    }
  }
];

async function addSampleInventoryItems() {
  try {
    console.log('🔐 Step 1: Logging in as admin...');
    
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
    
    console.log('📦 Step 2: Adding sample inventory items...');
    
    for (let i = 0; i < sampleInventoryItems.length; i++) {
      const item = sampleInventoryItems[i];
      console.log(`Adding item ${i + 1}/${sampleInventoryItems.length}: ${item.name}`);
      
      try {
        const response = await axios.post('http://localhost:5000/api/inventory', item, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          console.log(`✅ Added: ${item.name}`);
        } else {
          console.log(`❌ Failed to add ${item.name}: ${response.data.error}`);
        }
      } catch (error) {
        console.log(`❌ Error adding ${item.name}: ${error.response?.data?.error || error.message}`);
      }
    }
    
    console.log('🎉 Sample inventory items added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

addSampleInventoryItems();
