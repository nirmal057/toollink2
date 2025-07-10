/**
 * Frontend-Backend Connection Test for Inventory Page
 * Run this in the browser console when on the inventory page to diagnose issues
 */

// Test API connection
async function testApiConnection() {
    console.log('🔍 Testing API Connection...');
    
    try {
        // Test 1: Health Check
        console.log('\n1️⃣ Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:5000/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData.success ? 'PASSED' : 'FAILED');
        console.log('   Message:', healthData.message);
        
        // Test 2: Check if user is logged in
        console.log('\n2️⃣ Checking authentication...');
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.log('❌ No auth token found. Please login first.');
            return false;
        }
        console.log('✅ Auth token found');
        
        // Test 3: Test inventory endpoint
        console.log('\n3️⃣ Testing inventory endpoint...');
        const inventoryResponse = await fetch('http://localhost:5000/api/inventory', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (inventoryResponse.ok) {
            const inventoryData = await inventoryResponse.json();
            console.log('✅ Inventory API:', inventoryData.success ? 'WORKING' : 'ERROR');
            console.log('   Items found:', Array.isArray(inventoryData.data) ? inventoryData.data.length : 0);
        } else {
            console.log('❌ Inventory API failed:', inventoryResponse.status, inventoryResponse.statusText);
            const errorData = await inventoryResponse.json().catch(() => ({}));
            console.log('   Error:', errorData.error || 'Unknown error');
        }
        
        // Test 4: Test stats endpoint
        console.log('\n4️⃣ Testing stats endpoint...');
        const statsResponse = await fetch('http://localhost:5000/api/inventory/stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('✅ Stats API:', statsData.success ? 'WORKING' : 'ERROR');
            console.log('   Stats:', statsData.data);
        } else {
            console.log('❌ Stats API failed:', statsResponse.status, statsResponse.statusText);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return false;
    }
}

// Test if page components are working
function testPageComponents() {
    console.log('\n📱 Testing Page Components...');
    
    // Check if React components are mounted
    const inventoryPage = document.querySelector('[class*="space-y"]');
    if (inventoryPage) {
        console.log('✅ Inventory page component is mounted');
    } else {
        console.log('❌ Inventory page component not found');
    }
    
    // Check for error messages in the UI
    const errorElements = document.querySelectorAll('[class*="bg-red"]');
    if (errorElements.length > 0) {
        console.log('⚠️ Error messages found on page:', errorElements.length);
        errorElements.forEach((el, i) => {
            console.log(`   Error ${i + 1}:`, el.textContent?.trim());
        });
    } else {
        console.log('✅ No error messages visible');
    }
    
    // Check for loading states
    const loadingElements = document.querySelectorAll('[class*="animate-spin"]');
    if (loadingElements.length > 0) {
        console.log('🔄 Loading indicators found:', loadingElements.length);
    } else {
        console.log('✅ No loading indicators (page loaded or error occurred)');
    }
}

// Run comprehensive test
async function runDiagnostics() {
    console.clear();
    console.log('🚀 Inventory Page Diagnostics');
    console.log('=============================');
    
    // Test API connection
    const apiWorking = await testApiConnection();
    
    // Test page components
    testPageComponents();
    
    // Final recommendations
    console.log('\n📋 Recommendations:');
    if (!apiWorking) {
        console.log('1. ❌ Make sure backend server is running on port 5000');
        console.log('2. ❌ Check if you are logged in with admin/warehouse role');
        console.log('3. ❌ Verify CORS settings allow frontend origin');
    } else {
        console.log('1. ✅ Backend API is working correctly');
        console.log('2. ✅ Authentication is set up properly');
        console.log('3. ✅ Inventory endpoints are functional');
    }
    
    // Check console for React errors
    console.log('\n⚠️ Check browser console for any React component errors');
    console.log('⚠️ Check network tab for failed API requests');
}

// Auto-run diagnostics
runDiagnostics();
