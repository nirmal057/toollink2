// Test the admin reports endpoint
async function testAdminReports() {
  try {
    console.log('🧪 Testing Admin Reports Endpoint...\n');

    // First, authenticate as admin
    console.log('1. Authenticating as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@toollink.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Authentication failed:', loginData.error);
      return;
    }

    console.log('✅ Authentication successful');
    const token = loginData.token;

    // Test the admin reports endpoint
    console.log('\n2. Fetching admin reports...');
    
    const reportsResponse = await fetch('http://localhost:5000/api/admin/reports', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await reportsResponse.text();
    console.log('🔍 Raw response:', responseText);

    let reportsData;
    try {
      reportsData = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON');
      return;
    }

    if (reportsData.success) {
      console.log('✅ Admin reports fetched successfully!');
      console.log('📊 Report summary:');
      console.log(`   - Users: ${reportsData.reports.userStats.total} total, ${reportsData.reports.userStats.active} active`);
      console.log(`   - Orders: ${reportsData.reports.orderStats.total} total, ${reportsData.reports.orderStats.pending} pending`);
      console.log(`   - Inventory: ${reportsData.reports.inventoryStats.total} items, ${reportsData.reports.inventoryStats.lowStock} low stock`);
      console.log(`   - Revenue: ${reportsData.reports.revenueStats.total} ${reportsData.reports.revenueStats.currency}`);
      console.log(`   - Generated at: ${reportsData.reports.generatedAt}`);

      console.log('\n🎉 Admin reports endpoint working correctly!');
    } else {
      console.error('❌ Failed to fetch admin reports:', reportsData.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAdminReports();
