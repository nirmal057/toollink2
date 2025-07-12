import mongoose from 'mongoose';
import User from './src/models/User.js';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toollink';

console.log('🔄 User Database Consolidation Script');
console.log('=====================================');

async function consolidateUsers() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get direct access to both collections
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const usersNewCollection = db.collection('usernews'); // MongoDB pluralizes collection names

        // Check if usernews collection exists
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('📋 Available collections:', collectionNames);

        const hasUsersNew = collectionNames.includes('usernews');

        if (!hasUsersNew) {
            console.log('ℹ️  No "usernews" collection found. Checking for alternative names...');

            // Check for other possible names
            const possibleNames = ['usernew', 'usersnew', 'users-new', 'users_new'];
            let foundCollection = null;

            for (const name of possibleNames) {
                if (collectionNames.includes(name)) {
                    foundCollection = name;
                    break;
                }
            }

            if (foundCollection) {
                console.log(`✅ Found collection: ${foundCollection}`);
                const altCollection = db.collection(foundCollection);

                // Get all users from the alternative collection
                const usersFromAlt = await altCollection.find({}).toArray();
                console.log(`📊 Found ${usersFromAlt.length} users in ${foundCollection} collection`);

                if (usersFromAlt.length > 0) {
                    console.log('🔄 Moving users to main users collection...');

                    for (const user of usersFromAlt) {
                        // Check if user already exists in main collection
                        const existingUser = await usersCollection.findOne({
                            $or: [
                                { email: user.email },
                                { username: user.username }
                            ]
                        });

                        if (!existingUser) {
                            // Standardize the user object to match main User model
                            const standardizedUser = {
                                username: user.username || user.email?.split('@')[0],
                                email: user.email,
                                password: user.password,
                                fullName: user.fullName || user.name,
                                phone: user.phone || '',
                                role: user.role?.toLowerCase() || 'customer',
                                status: user.status?.toLowerCase() || 'active',
                                isActive: user.isActive !== false,
                                isApproved: user.isApproved !== false,
                                emailVerified: user.emailVerified !== false,
                                createdAt: user.createdAt || new Date(),
                                updatedAt: user.updatedAt || new Date(),
                                lastLogin: user.lastLogin,
                                nicNumber: user.nicNumber,
                                address: user.address || {}
                            };

                            await usersCollection.insertOne(standardizedUser);
                            console.log(`✅ Moved user: ${user.email}`);
                        } else {
                            console.log(`⚠️  User already exists in main collection: ${user.email}`);
                        }
                    }

                    console.log('🗑️  Dropping the redundant collection...');
                    await altCollection.drop();
                    console.log(`✅ Dropped ${foundCollection} collection`);
                }
            } else {
                console.log('ℹ️  No redundant user collections found.');
            }
        } else {
            // Handle usernews collection
            const usersFromNew = await usersNewCollection.find({}).toArray();
            console.log(`📊 Found ${usersFromNew.length} users in usernews collection`);

            if (usersFromNew.length > 0) {
                console.log('🔄 Moving users to main users collection...');

                for (const user of usersFromNew) {
                    const existingUser = await usersCollection.findOne({
                        $or: [
                            { email: user.email },
                            { username: user.username }
                        ]
                    });

                    if (!existingUser) {
                        const standardizedUser = {
                            username: user.username || user.email?.split('@')[0],
                            email: user.email,
                            password: user.password,
                            fullName: user.fullName || user.name,
                            phone: user.phone || '',
                            role: user.role?.toLowerCase() || 'customer',
                            status: user.status?.toLowerCase() || 'active',
                            isActive: user.isActive !== false,
                            isApproved: user.isApproved !== false,
                            emailVerified: user.emailVerified !== false,
                            createdAt: user.createdAt || new Date(),
                            updatedAt: user.updatedAt || new Date(),
                            lastLogin: user.lastLogin,
                            nicNumber: user.nicNumber,
                            address: user.address || {}
                        };

                        await usersCollection.insertOne(standardizedUser);
                        console.log(`✅ Moved user: ${user.email}`);
                    } else {
                        console.log(`⚠️  User already exists: ${user.email}`);
                    }
                }

                console.log('🗑️  Dropping usernews collection...');
                await usersNewCollection.drop();
                console.log('✅ Dropped usernews collection');
            }
        }

        // Final count
        const finalCount = await usersCollection.countDocuments();
        console.log(`\n📊 Final user count in main collection: ${finalCount}`);

        // Show all users
        const allUsers = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
        console.log('\n👥 All users in main collection:');
        allUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.username} (${user.email}) - ${user.role}`);
        });

        console.log('\n🎉 User consolidation completed successfully!');
        console.log('✅ All users are now in the main "users" collection');
        console.log('✅ Redundant collections have been removed');

    } catch (error) {
        console.error('❌ Error during consolidation:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

consolidateUsers();
