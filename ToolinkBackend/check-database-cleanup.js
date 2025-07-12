import { MongoClient } from 'mongodb';

async function checkDatabase() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('toollink');

        console.log('=== DATABASE COLLECTIONS CHECK ===');
        const collections = await db.listCollections().toArray();
        console.log('All collections:', collections.map(c => c.name));

        console.log('\n=== CHECKING FOR USERNEW/USERNEWS COLLECTIONS ===');
        const userNewExists = collections.some(c => c.name.toLowerCase().includes('usernew'));
        console.log('UserNew/UserNews collections exist:', userNewExists);

        if (userNewExists) {
            const userNewCollections = collections.filter(c => c.name.toLowerCase().includes('usernew'));
            console.log('Found UserNew collections:', userNewCollections.map(c => c.name));

            for (const collection of userNewCollections) {
                const count = await db.collection(collection.name).countDocuments();
                console.log(`Collection '${collection.name}' has ${count} documents`);

                if (count > 0) {
                    console.log('Documents in', collection.name, ':');
                    const docs = await db.collection(collection.name).find({}).toArray();
                    docs.forEach((doc, i) => {
                        console.log(`  ${i + 1}. ${doc.username || doc.email || doc._id} - ${doc.role || 'no role'}`);
                    });
                }
            }
        }

        console.log('\n=== MAIN USERS COLLECTION ===');
        const usersCount = await db.collection('users').countDocuments();
        console.log('Main users collection count:', usersCount);

        console.log('\n=== CLEANUP RECOMMENDATION ===');
        if (userNewExists) {
            console.log('⚠️  Found UserNew collections that should be removed');
            console.log('📝 Will create cleanup script to remove them');
        } else {
            console.log('✅ No UserNew collections found - database is clean');
        }

    } catch (error) {
        console.error('Database error:', error.message);
    } finally {
        await client.close();
    }
}

checkDatabase();
