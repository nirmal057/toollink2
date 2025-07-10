const axios = require('axios');

const sriLankanInventoryItems = [
  // Construction Materials - Sri Lankan specific
  {
    name: "Holcim Cement 50kg",
    category: "Building Materials",
    description: "Premium Portland cement manufactured in Sri Lanka",
    sku: "HOL-CEM-50",
    pricing: {
      costPrice: 1200.00,
      sellingPrice: 1350.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 200,
      minimumQuantity: 50,
      unit: "piece"
    },
    location: {
      warehouse: "Main Store",
      zone: "Construction Section"
    },
    supplier: {
      name: "Holcim Lanka Ltd",
      phone: "+94-11-269-4600",
      address: "110, Negombo Road, Peliyagoda"
    }
  },
  {
    name: "Red Bricks - Ratnapura",
    category: "Building Materials", 
    description: "High quality clay bricks from Ratnapura kilns",
    sku: "BRK-RAT-RED",
    pricing: {
      costPrice: 22.00,
      sellingPrice: 25.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 5000,
      minimumQuantity: 1000,
      unit: "piece"
    },
    location: {
      warehouse: "Outdoor Yard",
      zone: "Brick Storage"
    },
    supplier: {
      name: "Ratnapura Brick Works",
      phone: "+94-45-222-3456",
      address: "Brick Kiln Road, Ratnapura"
    }
  },
  {
    name: "Coconut Timber 2x4 inches",
    category: "Building Materials",
    description: "Treated coconut timber for construction - eco-friendly",
    sku: "COC-TMB-2X4",
    pricing: {
      costPrice: 180.00,
      sellingPrice: 220.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 150,
      minimumQuantity: 30,
      unit: "feet"
    },
    location: {
      warehouse: "Timber Section",
      zone: "Local Wood"
    },
    supplier: {
      name: "Lanka Coconut Timber Co.",
      phone: "+94-31-227-8901",
      address: "Kurunegala Road, Negombo"
    }
  },
  // Roofing Materials
  {
    name: "Asbestos Sheets 8ft x 4ft",
    category: "Building Materials",
    description: "Standard roofing sheets for residential construction",
    sku: "ASB-SHT-8X4",
    pricing: {
      costPrice: 1800.00,
      sellingPrice: 2100.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 80,
      minimumQuantity: 20,
      unit: "piece"
    },
    location: {
      warehouse: "Roofing Section",
      zone: "Sheet Storage"
    },
    supplier: {
      name: "Everest Industries Lanka",
      phone: "+94-11-243-7890",
      address: "Ratmalana Industrial Estate"
    }
  },
  // Tiles - Sri Lankan brands
  {
    name: "Rocell Floor Tiles - Kandyan",
    category: "Building Materials",
    description: "Premium ceramic tiles with traditional Kandyan patterns",
    sku: "ROC-FLR-KAN",
    pricing: {
      costPrice: 420.00,
      sellingPrice: 495.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 300,
      minimumQuantity: 75,
      unit: "piece"
    },
    location: {
      warehouse: "Tiles Showroom",
      zone: "Premium Section"
    },
    supplier: {
      name: "Rocell Bathware",
      phone: "+94-11-267-3456",
      address: "Biyagama Export Processing Zone"
    }
  },
  // Steel & Metal - Local suppliers
  {
    name: "SLI Steel Bars 16mm",
    category: "Building Materials",
    description: "High grade deformed steel bars from Steel & Tube Mills",
    sku: "SLI-STL-16",
    pricing: {
      costPrice: 185.00,
      sellingPrice: 210.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 500,
      minimumQuantity: 100,
      unit: "kg"
    },
    location: {
      warehouse: "Steel Section",
      zone: "Heavy Materials"
    },
    supplier: {
      name: "Steel & Tube Mills Ltd",
      phone: "+94-11-234-5600",
      address: "Ekala, Ja-Ela"
    }
  },
  // Plumbing - Local brands
  {
    name: "Dimo PVC Pipes 6 inch",
    category: "Plumbing",
    description: "Heavy duty PVC pipes for main drainage systems",
    sku: "DIM-PVC-6IN",
    pricing: {
      costPrice: 2800.00,
      sellingPrice: 3200.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 45,
      minimumQuantity: 15,
      unit: "piece"
    },
    location: {
      warehouse: "Plumbing Section",
      zone: "Large Pipes"
    },
    supplier: {
      name: "Dimo Engineering Products",
      phone: "+94-11-243-6789",
      address: "Wattala Industrial Park"
    }
  },
  // Electrical - Sri Lankan context
  {
    name: "Kelani 3-Core Cable 2.5mm²",
    category: "Electrical",
    description: "Three core electrical cable for household wiring",
    sku: "KEL-3C-2.5",
    pricing: {
      costPrice: 125.00,
      sellingPrice: 145.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 1000,
      minimumQuantity: 200,
      unit: "meter"
    },
    location: {
      warehouse: "Electrical Section",
      zone: "Cables"
    },
    supplier: {
      name: "Kelani Cables PLC",
      phone: "+94-11-267-8900",
      address: "Kelaniya Industrial Zone"
    }
  },
  // Tools - with local prices
  {
    name: "Stanley Hammer 1lb",
    category: "Tools",
    description: "Claw hammer with fiberglass handle - ideal for Sri Lankan conditions",
    sku: "STN-HAM-1LB",
    pricing: {
      costPrice: 1200.00,
      sellingPrice: 1450.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 25,
      minimumQuantity: 10,
      unit: "piece"
    },
    location: {
      warehouse: "Tools Section",
      zone: "Hand Tools"
    },
    supplier: {
      name: "Stanley Black & Decker Lanka",
      phone: "+94-11-234-7890",
      address: "Colombo 3"
    }
  },
  // Paint - tropical climate suitable
  {
    name: "Nippon Paint Weather Guard",
    category: "Hardware",
    description: "Weather resistant exterior paint for tropical climate",
    sku: "NIP-WG-4L",
    pricing: {
      costPrice: 2800.00,
      sellingPrice: 3250.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 35,
      minimumQuantity: 20,
      unit: "piece"
    },
    location: {
      warehouse: "Paint Section",
      zone: "Exterior Paints"
    },
    supplier: {
      name: "Nippon Paint Lanka",
      phone: "+94-11-287-6543",
      address: "Horana Industrial Zone"
    }
  },
  // Hardware - locally relevant
  {
    name: "Zinc Coated Nails 4 inch",
    category: "Fasteners",
    description: "Rust resistant nails suitable for coastal areas",
    sku: "ZNC-NAL-4IN",
    pricing: {
      costPrice: 320.00,
      sellingPrice: 375.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 200,
      minimumQuantity: 50,
      unit: "kg"
    },
    location: {
      warehouse: "Hardware Section",
      zone: "Fasteners"
    },
    supplier: {
      name: "Lanka Hardware Industries",
      phone: "+94-33-223-4567",
      address: "Matara Industrial Estate"
    }
  },
  // Safety equipment
  {
    name: "Safety Helmet - Yellow",
    category: "Safety",
    description: "Industrial safety helmet meeting Sri Lankan safety standards",
    sku: "SAF-HLM-YEL",
    pricing: {
      costPrice: 850.00,
      sellingPrice: 1050.00,
      currency: "LKR"
    },
    stock: {
      currentQuantity: 50,
      minimumQuantity: 25,
      unit: "piece"
    },
    location: {
      warehouse: "Safety Section",
      zone: "PPE Equipment"
    },
    supplier: {
      name: "Safety First Lanka",
      phone: "+94-11-276-5432",
      address: "Mount Lavinia Industrial Zone"
    }
  }
];

async function addSriLankanInventoryItems() {
  try {
    console.log('🇱🇰 Adding Sri Lankan Hardware Store Inventory...');
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
    
    console.log('📦 Step 2: Adding Sri Lankan inventory items...');
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < sriLankanInventoryItems.length; i++) {
      const item = sriLankanInventoryItems[i];
      console.log(`\n📦 Adding item ${i + 1}/${sriLankanInventoryItems.length}: ${item.name}`);
      console.log(`   Price: LKR ${item.pricing.sellingPrice.toLocaleString()}`);
      console.log(`   Stock: ${item.stock.currentQuantity} ${item.stock.unit}`);
      console.log(`   Supplier: ${item.supplier.name}`);
      
      try {
        const response = await axios.post('http://localhost:5000/api/inventory', item, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          console.log(`   ✅ Successfully added`);
          successCount++;
        } else {
          console.log(`   ❌ Failed: ${response.data.error}`);
          failCount++;
        }
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.log(`   ❌ Error: ${errorMsg}`);
        failCount++;
      }
    }
    
    console.log('\n🎉 Sri Lankan Hardware Store Inventory Setup Complete!');
    console.log(`✅ Successfully added: ${successCount} items`);
    console.log(`❌ Failed to add: ${failCount} items`);
    console.log('\n💰 Price Range: LKR 25 - LKR 3,250');
    console.log('🏪 Categories: Construction, Tools, Electrical, Plumbing, Safety');
    console.log('🚚 Local Suppliers: Holcim, Rocell, Kelani Cables, Stanley Lanka, etc.');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

addSriLankanInventoryItems();
