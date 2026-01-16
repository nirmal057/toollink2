import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

console.log('=== Environment Debug Info ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('Current directory:', __dirname);
console.log('Process cwd:', process.cwd());
console.log('All MongoDB related env vars:');
Object.keys(process.env).filter(key => key.toLowerCase().includes('mongo')).forEach(key => {
    console.log(`${key}:`, process.env[key]);
});
