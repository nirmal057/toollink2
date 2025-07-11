const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000/api/users-new';

async function testCreateUser() {
    console.log('Testing add user form functionality...\n');

    try {
        // Test creating a user with frontend-style data
        console.log('1. Testing CREATE user with frontend data structure...');
        const frontendUserData = {
            name: 'Test User Frontend',
            email: 'test.frontend@example.com',
            password: 'password123',
            role: 'Customer',
            phone: '+94771234567'
        };

        console.log('Sending data:', frontendUserData);

        const createResponse = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(frontendUserData)
        });

        const createResult = await createResponse.json();
        console.log('CREATE Response Status:', createResponse.status);
        console.log('CREATE Response:', createResult.success ? 'SUCCESS' : 'FAILED');
        console.log('CREATE Message:', createResult.message);

        if (!createResult.success) {
            console.log('Error details:', createResult);
            if (createResult.errors) {
                console.log('Validation errors:', createResult.errors);
            }
        } else {
            console.log('User created successfully:', createResult.data);

            // Clean up - delete the test user
            const userId = createResult.data.id || createResult.data._id;
            if (userId) {
                console.log('\n2. Cleaning up test user...');
                const deleteResponse = await fetch(`${BASE_URL}/${userId}`, {
                    method: 'DELETE'
                });
                const deleteResult = await deleteResponse.json();
                console.log('Cleanup result:', deleteResult.message);
            }
        }

    } catch (error) {
        console.error('Test failed with error:', error.message);
    }
}

testCreateUser();
