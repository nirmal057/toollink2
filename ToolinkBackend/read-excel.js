import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readExcelFile() {
    try {
        // Path to the Excel file
        const excelPath = path.join(__dirname, '..', 'ToolLink_User_List.xlsx');
        console.log('📊 Reading Excel file:', excelPath);

        // Read the Excel file
        const workbook = XLSX.readFile(excelPath);

        // Get the first sheet name
        const sheetName = workbook.SheetNames[0];
        console.log('📋 Sheet name:', sheetName);

        // Get the worksheet
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log('📈 Total rows:', data.length);
        console.log('🔍 Sample data (first 3 rows):');
        console.log(JSON.stringify(data.slice(0, 3), null, 2));

        if (data.length > 0) {
            console.log('📝 Column headers:', Object.keys(data[0]));
        }

        return data;

    } catch (error) {
        console.error('❌ Error reading Excel file:', error.message);
        return null;
    }
}

readExcelFile();
