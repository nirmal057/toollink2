import mongoose from 'mongoose';
import XLSX from 'xlsx';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

async function importUsersFromExcel() {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB Atlas successfully!');

        // Path to the Excel file
        const excelPath = path.join(__dirname, '..', 'ToolLink_User_List.xlsx');
        console.log('📊 Reading Excel file:', excelPath);

        // Read the Excel file
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📈 Found ${data.length} users in Excel file`);

        // Transform data to match our schema
        const usersToInsert = data.map((row, index) => {
            const user = {
                name: row.Name,
                email: row.Email,
                password: row.password || 'default123',
                role: row.Role,
                status: 'Active'
            };

            // Parse last login if present
            if (row['Last Login'] && row['Last Login'] !== '') {
                try {
                    user.lastLogin = new Date(row['Last Login']);
                } catch (e) {
                    console.warn(`Warning: Invalid date format for user ${row.Name}: ${row['Last Login']}`);
                }
            }

            return user;
        });

        console.log('🗑️  Clearing existing users...');
        await User.deleteMany({});

        console.log('📥 Inserting users...');
        const insertedUsers = await User.insertMany(usersToInsert);

        console.log(`✅ Successfully inserted ${insertedUsers.length} users!`);

        // Display summary
        console.log('\n📊 Import Summary:');
        console.log(`Total users imported: ${insertedUsers.length}`);

        // Count by role
        const roleCounts = {};
        insertedUsers.forEach(user => {
            roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
        });

        console.log('👥 Users by role:');
        Object.entries(roleCounts).forEach(([role, count]) => {
            console.log(`  ${role}: ${count}`);
        });

        console.log('\n👤 Sample users:');
        insertedUsers.slice(0, 3).forEach(user => {
            console.log(`  ${user.name} (${user.email}) - ${user.role}`);
        });

        console.log('\n🎉 Import completed successfully!');

    } catch (error) {
        console.error('❌ Error importing users:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔐 Database connection closed.');
        process.exit(0);
    }
}

importUsersFromExcel();
