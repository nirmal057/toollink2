// Database Refresh Test for User Management
// Run this in browser console to test if UI reflects database changes

console.log('=== User Management Database Refresh Test ===');

// Function to check current user count in UI
const checkUIUserCount = () => {
    const userRows = document.querySelectorAll('tbody tr');
    const uiCount = userRows.length;
    console.log('🔍 Current users shown in UI:', uiCount);
    return uiCount;
};

// Function to get user count from database via API
const checkDatabaseUserCount = async () => {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:3000/api/users?limit=1000', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        const dbCount = data.data ? data.data.length : 0;
        console.log('💾 Current users in database:', dbCount);
        return dbCount;
    } catch (error) {
        console.error('❌ Error fetching database count:', error);
        return 0;
    }
};

// Main test function
const runRefreshTest = async () => {
    console.log('\n📊 Starting User Management Refresh Test...');

    // Step 1: Check initial counts
    const initialUICount = checkUIUserCount();
    const initialDBCount = await checkDatabaseUserCount();

    console.log('\n📈 Initial State:');
    console.log(`UI Shows: ${initialUICount} users`);
    console.log(`Database Has: ${initialDBCount} users`);

    if (initialUICount === initialDBCount) {
        console.log('✅ UI and Database are in sync');
    } else {
        console.log('⚠️ UI and Database are OUT OF SYNC!');
        console.log('🔧 Possible Issue: UI not refreshing after database changes');
    }

    // Step 2: Test manual refresh button
    console.log('\n🔄 Testing manual refresh...');
    const refreshButton = document.querySelector('button[title="Refresh user list from database"]');
    if (refreshButton) {
        console.log('✅ Found refresh button, clicking...');
        refreshButton.click();

        // Wait for refresh to complete
        setTimeout(async () => {
            const afterRefreshUICount = checkUIUserCount();
            const afterRefreshDBCount = await checkDatabaseUserCount();

            console.log('\n📈 After Manual Refresh:');
            console.log(`UI Shows: ${afterRefreshUICount} users`);
            console.log(`Database Has: ${afterRefreshDBCount} users`);

            if (afterRefreshUICount === afterRefreshDBCount) {
                console.log('✅ Manual refresh working - UI and Database in sync');
            } else {
                console.log('❌ Manual refresh failed - UI still out of sync');
            }
        }, 2000);

    } else {
        console.log('❌ Refresh button not found - make sure you are admin user');
    }

    // Step 3: Instructions for further testing
    console.log('\n🧪 Manual Test Instructions:');
    console.log('1. Try adding a new user - check if UI updates immediately');
    console.log('2. Try editing a user - check if changes appear in list');
    console.log('3. Try deleting a user - check if user disappears from list');
    console.log('4. If UI doesn\'t update, click the green "Refresh" button');
    console.log('5. Check browser console for "UserManagement: State updated with X users" messages');

    return {
        initialUI: initialUICount,
        initialDB: initialDBCount,
        inSync: initialUICount === initialDBCount
    };
};

// Run the test
runRefreshTest();
