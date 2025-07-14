import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'dev-jwt-secret-key-2024-toollink';

async function testDeleteUser() {
    try {
        // Create a test token for admin user
        const token = jwt.sign(
            { userId: '68720ac9f2e38e6726e3539c', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('Testing hard delete functionality...');

        // Test deleting another soft-deleted user
        const userIdToDelete = '687510e4ad7fb8d3def736f9'; // Delete Test User

        console.log('\\nAttempting to permanently delete user:', userIdToDelete);

        const deleteResponse = await fetch(`http://localhost:3000/api/users/${userIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const deleteData = await deleteResponse.json();

        console.log('Delete Response Status:', deleteResponse.status);
        console.log('Delete Response:', JSON.stringify(deleteData, null, 2));

        if (deleteData.success) {
            console.log('\\n✅ User successfully deleted from database!');

            // Verify deletion by getting all users again
            console.log('\\nVerifying deletion - getting all users...');
            const usersResponse = await fetch('http://localhost:3000/api/users?limit=1000', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const usersData = await usersResponse.json();
            const userStillExists = usersData.data.find(u => u._id === userIdToDelete);

            if (userStillExists) {
                console.log('❌ User still exists in database after delete');
            } else {
                console.log('✅ User successfully removed from database');
                console.log('Total users remaining:', usersData.data.length);
            }
        } else {
            console.log('❌ Delete failed:', deleteData.message || deleteData.error);
        }

    } catch (error) {
        console.error('Error testing delete:', error);
    }
}

testDeleteUser();
