// Script to add inventory items via API
const API_BASE = 'http://localhost:5001/api';

// Sample inventory items for each category
const inventoryItems = [
    // Cement Category
    {
        name: 'Tokyo Cement OPC',
        description: 'High quality Ordinary Portland Cement suitable for all construction works',
        category: 'Cement',
        sku: 'CEM-TOK-OPC-50',
        quantity: 500,
        current_stock: 500,
        unit: 'kg',
        threshold: 50,
        cost_price: 850,
        selling_price: 950,
        supplier: 'Tokyo Cement Lanka',
        location: 'Main Warehouse - Section A'
    },
    {
        name: 'Lafarge Cement',
        description: 'Premium cement for heavy construction projects',
        category: 'Cement',
        sku: 'CEM-LAF-PRM-50',
        quantity: 300,
        current_stock: 300,
        unit: 'kg',
        threshold: 30,
        cost_price: 900,
        selling_price: 1000,
        supplier: 'Lafarge Cement',
        location: 'Main Warehouse - Section A'
    },

    // Steel & Reinforcement
    {
        name: 'Steel Bars 12mm',
        description: 'High tensile strength steel reinforcement bars',
        category: 'Steel & Reinforcement',
        sku: 'STL-BAR-12MM',
        quantity: 100,
        current_stock: 100,
        unit: 'pieces',
        threshold: 10,
        cost_price: 1200,
        selling_price: 1350,
        supplier: 'Lanka Steel Corporation',
        location: 'Steel Yard - Section B'
    },
    {
        name: 'Steel Bars 16mm',
        description: 'Heavy duty steel reinforcement bars for large constructions',
        category: 'Steel & Reinforcement',
        sku: 'STL-BAR-16MM',
        quantity: 80,
        current_stock: 80,
        unit: 'pieces',
        threshold: 8,
        cost_price: 1800,
        selling_price: 2000,
        supplier: 'Lanka Steel Corporation',
        location: 'Steel Yard - Section B'
    },

    // Paint & Chemicals
    {
        name: 'Dulux Weatherguard Paint',
        description: 'Exterior wall paint with weather protection',
        category: 'Paint & Chemicals',
        sku: 'PNT-DUL-WG-4L',
        quantity: 200,
        current_stock: 200,
        unit: 'liters',
        threshold: 20,
        cost_price: 3500,
        selling_price: 4000,
        supplier: 'Dulux Lanka',
        location: 'Paint Storage - Section D'
    },
    {
        name: 'Nippon Paint Interior',
        description: 'Premium interior wall paint with low VOC',
        category: 'Paint & Chemicals',
        sku: 'PNT-NIP-INT-4L',
        quantity: 150,
        current_stock: 150,
        unit: 'liters',
        threshold: 15,
        cost_price: 2800,
        selling_price: 3200,
        supplier: 'Nippon Paint Lanka',
        location: 'Paint Storage - Section D'
    },

    // Electrical Items
    {
        name: 'Copper Wire 2.5mm',
        description: 'High quality copper electrical wire',
        category: 'Electrical Items',
        sku: 'ELC-COP-25MM-100M',
        quantity: 50,
        current_stock: 50,
        unit: 'rolls',
        threshold: 5,
        cost_price: 8500,
        selling_price: 9500,
        supplier: 'Ceylon Electricity Board',
        location: 'Electrical Storage - Section F'
    },
    {
        name: 'LED Bulb 12W',
        description: 'Energy efficient LED light bulbs',
        category: 'Electrical Items',
        sku: 'ELC-LED-12W',
        quantity: 200,
        current_stock: 200,
        unit: 'pieces',
        threshold: 20,
        cost_price: 350,
        selling_price: 450,
        supplier: 'Lighting Solutions',
        location: 'Electrical Storage - Section F'
    },

    // Plumbing Supplies
    {
        name: 'PVC Pipe 4 inch',
        description: 'High grade PVC drainage pipe',
        category: 'Plumbing Supplies',
        sku: 'PLB-PVC-4IN-6M',
        quantity: 100,
        current_stock: 100,
        unit: 'pieces',
        threshold: 10,
        cost_price: 800,
        selling_price: 950,
        supplier: 'Plastics Lanka',
        location: 'Plumbing Storage - Section H'
    },
    {
        name: 'Water Tap Brass',
        description: 'Heavy duty brass water tap',
        category: 'Plumbing Supplies',
        sku: 'PLB-TAP-BRS',
        quantity: 80,
        current_stock: 80,
        unit: 'pieces',
        threshold: 8,
        cost_price: 1500,
        selling_price: 1800,
        supplier: 'Plumbing Solutions',
        location: 'Plumbing Storage - Section H'
    },

    // Tools & Equipment
    {
        name: 'Hammer 500g',
        description: 'Heavy duty construction hammer',
        category: 'Tools & Equipment',
        sku: 'TOL-HAM-500G',
        quantity: 60,
        current_stock: 60,
        unit: 'pieces',
        threshold: 6,
        cost_price: 800,
        selling_price: 1000,
        supplier: 'Tools Lanka',
        location: 'Tools Storage - Section J'
    },
    {
        name: 'Electric Drill 13mm',
        description: 'Professional electric drill with variable speed',
        category: 'Tools & Equipment',
        sku: 'TOL-DRL-13MM-ELC',
        quantity: 20,
        current_stock: 20,
        unit: 'pieces',
        threshold: 2,
        cost_price: 8500,
        selling_price: 10000,
        supplier: 'Power Tools Lanka',
        location: 'Tools Storage - Section K'
    },

    // Hardware & Fasteners
    {
        name: 'Screws 2 inch',
        description: 'Galvanized wood screws',
        category: 'Hardware & Fasteners',
        sku: 'HWR-SCR-2IN-100',
        quantity: 500,
        current_stock: 500,
        unit: 'pieces',
        threshold: 50,
        cost_price: 5,
        selling_price: 8,
        supplier: 'Hardware Solutions',
        location: 'Hardware Storage - Section L'
    },
    {
        name: 'Nuts & Bolts Set M8',
        description: 'Complete set of M8 nuts and bolts',
        category: 'Hardware & Fasteners',
        sku: 'HWR-NB-M8-SET',
        quantity: 200,
        current_stock: 200,
        unit: 'sets',
        threshold: 20,
        cost_price: 150,
        selling_price: 200,
        supplier: 'Fasteners Lanka',
        location: 'Hardware Storage - Section L'
    },

    // Tiles & Ceramics
    {
        name: 'Floor Tiles 12x12',
        description: 'Premium ceramic floor tiles',
        category: 'Tiles & Ceramics',
        sku: 'TIL-FLR-12X12',
        quantity: 1000,
        current_stock: 1000,
        unit: 'pieces',
        threshold: 100,
        cost_price: 120,
        selling_price: 150,
        supplier: 'Lanka Tiles',
        location: 'Tiles Storage - Section N'
    },
    {
        name: 'Wall Tiles 8x12',
        description: 'Glossy ceramic wall tiles for bathrooms',
        category: 'Tiles & Ceramics',
        sku: 'TIL-WAL-8X12',
        quantity: 800,
        current_stock: 800,
        unit: 'pieces',
        threshold: 80,
        cost_price: 80,
        selling_price: 110,
        supplier: 'Ceramic Works',
        location: 'Tiles Storage - Section O'
    },

    // Roofing Materials
    {
        name: 'Roof Tiles Clay',
        description: 'Traditional clay roof tiles',
        category: 'Roofing Materials',
        sku: 'ROF-TIL-CLY',
        quantity: 2000,
        current_stock: 2000,
        unit: 'pieces',
        threshold: 200,
        cost_price: 45,
        selling_price: 60,
        supplier: 'Clay Tiles Lanka',
        location: 'Roofing Storage - Section P'
    },
    {
        name: 'Aluminum Sheets',
        description: 'Corrugated aluminum roofing sheets',
        category: 'Roofing Materials',
        sku: 'ROF-ALM-COR-3M',
        quantity: 100,
        current_stock: 100,
        unit: 'sheets',
        threshold: 10,
        cost_price: 2500,
        selling_price: 3000,
        supplier: 'Aluminum Works',
        location: 'Roofing Storage - Section Q'
    },

    // Safety Equipment
    {
        name: 'Safety Helmet',
        description: 'High impact safety helmet with chin strap',
        category: 'Safety Equipment',
        sku: 'SAF-HLM-WHT',
        quantity: 100,
        current_stock: 100,
        unit: 'pieces',
        threshold: 10,
        cost_price: 800,
        selling_price: 1000,
        supplier: 'Safety First Lanka',
        location: 'Safety Storage - Section R'
    },
    {
        name: 'Safety Gloves',
        description: 'Heavy duty work gloves',
        category: 'Safety Equipment',
        sku: 'SAF-GLV-HVY',
        quantity: 200,
        current_stock: 200,
        unit: 'pairs',
        threshold: 20,
        cost_price: 250,
        selling_price: 350,
        supplier: 'Work Safety Co',
        location: 'Safety Storage - Section R'
    },

    // Sand & Aggregate
    {
        name: 'River Sand Fine',
        description: 'Fine river sand for construction',
        category: 'Sand & Aggregate',
        sku: 'SND-RVR-FIN',
        quantity: 10000,
        current_stock: 10000,
        unit: 'kg',
        threshold: 1000,
        cost_price: 15,
        selling_price: 20,
        supplier: 'Sand Quarry Lanka',
        location: 'Sand Storage - Yard A'
    },
    {
        name: 'Gravel 20mm',
        description: 'Crushed gravel for concrete mix',
        category: 'Sand & Aggregate',
        sku: 'GRV-CRS-20MM',
        quantity: 8000,
        current_stock: 8000,
        unit: 'kg',
        threshold: 800,
        cost_price: 25,
        selling_price: 32,
        supplier: 'Quarry Works',
        location: 'Gravel Storage - Yard B'
    },

    // Bricks
    {
        name: 'Red Bricks Standard',
        description: 'Standard red clay bricks',
        category: 'Bricks',
        sku: 'BRK-RED-STD',
        quantity: 5000,
        current_stock: 5000,
        unit: 'pieces',
        threshold: 500,
        cost_price: 12,
        selling_price: 18,
        supplier: 'Brick Factory Lanka',
        location: 'Brick Storage - Yard C'
    },
    {
        name: 'Hollow Blocks',
        description: 'Concrete hollow blocks for walls',
        category: 'Bricks',
        sku: 'BRK-HLW-CON',
        quantity: 3000,
        current_stock: 3000,
        unit: 'pieces',
        threshold: 300,
        cost_price: 35,
        selling_price: 45,
        supplier: 'Concrete Products',
        location: 'Block Storage - Yard D'
    },

    // Stones
    {
        name: 'Black Stones Crushed',
        description: 'Crushed black stones for construction',
        category: 'Stones',
        sku: 'STN-BLK-CRS',
        quantity: 12000,
        current_stock: 12000,
        unit: 'kg',
        threshold: 1200,
        cost_price: 18,
        selling_price: 25,
        supplier: 'Stone Quarry Co',
        location: 'Stone Storage - Yard E'
    },
    {
        name: 'White Stones Decorative',
        description: 'Decorative white stones for landscaping',
        category: 'Stones',
        sku: 'STN-WHT-DEC',
        quantity: 5000,
        current_stock: 5000,
        unit: 'kg',
        threshold: 500,
        cost_price: 30,
        selling_price: 40,
        supplier: 'Decorative Stones Lanka',
        location: 'Stone Storage - Yard F'
    }
];

// Function to get admin token
async function getAdminToken() {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@toollink.com',
                password: 'admin123'
            })
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
        }

        const data = await response.json();
        return data.accessToken;
    } catch (error) {
        console.error('Failed to get admin token:', error);
        throw error;
    }
}

// Function to add inventory item
async function addInventoryItem(token, item) {
    try {
        const response = await fetch(`${API_BASE}/inventory`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to add ${item.name}: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error adding ${item.name}:`, error.message);
        return null;
    }
}

// Function to populate all inventory items
async function populateInventory() {
    try {
        console.log('🔄 Starting inventory population...');

        // Get admin token
        const token = await getAdminToken();
        console.log('✅ Admin token obtained');

        let successCount = 0;
        let errorCount = 0;

        // Add each inventory item
        for (const item of inventoryItems) {
            console.log(`📦 Adding: ${item.name} (${item.category})`);

            const result = await addInventoryItem(token, item);
            if (result) {
                successCount++;
                console.log(`   ✅ Added successfully`);
            } else {
                errorCount++;
                console.log(`   ❌ Failed to add`);
            }

            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('\n📋 Summary:');
        console.log('===========');
        console.log(`✅ Successfully added: ${successCount} items`);
        console.log(`❌ Failed to add: ${errorCount} items`);
        console.log(`📦 Total items processed: ${inventoryItems.length}`);

        // Display summary by category
        const categories = [...new Set(inventoryItems.map(item => item.category))];
        console.log('\n📂 Items by Category:');
        console.log('====================');

        categories.forEach(category => {
            const categoryItems = inventoryItems.filter(item => item.category === category);
            console.log(`${category}: ${categoryItems.length} items`);
        });

        console.log('\n🎉 Inventory population completed!');

    } catch (error) {
        console.error('❌ Failed to populate inventory:', error);
    }
}

// Run the population
populateInventory();
