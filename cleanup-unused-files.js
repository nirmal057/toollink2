import fs from 'fs';
import path from 'path';

// Get current working directory (should be toollink2)
const rootDir = process.cwd();

// Files to remove from root directory (toollink2/)
const unusedRootFiles = [
    // Documentation files that are no longer needed
    'AUDIT_LOGS_IMPLEMENTATION_COMPLETE.md',
    'BEAUTIFUL_DELETE_MODAL_UPGRADE.md',
    'CONTACT_MESSAGES_CONNECTION_COMPLETE.md',
    'CUSTOMER_MESSAGES_FIXED_COMPLETE.md',
    'FULL_PROJECT_REPORT.md',
    'LOGIN_AUDIT_LOGGING_FIX.md',
    'PROJECT_CLEANUP_REPORT.md',
    'REACT_ERROR_FIXED.md',

    // Old test files that are outdated
    'clear-auth-data.js',
    'debug-contact-test.js',
    'simple-audit-test.js',
    'test-admin-flow.js', // Keep test-admin-flow-fixed.js
    'test-admin-messages.js', // Keep test-admin-messages-access.js
    'test-audit-logs-functionality.js',
    'test-beautiful-delete-modal.js',
    'test-complete-flow.js',
    'test-contact-connection.js',
    'test-contact-form.js',
    'test-contact-phone.js',
    'test-cors-fix.js',
    'test-customer-messages-enhanced.js',
    'test-fresh-message.js',
    'test-frontend-audit-logs.js',
    'test-login-audit-logs.js',
    'test-message-box-scrolling.js',
    'test-phone-validation.js',
    'test-status-indicator-removal.js',
    'test-thank-you-email.js'
];

// Files to remove from ToolinkBackend directory
const unusedBackendFiles = [
    'add-new-admin.js',
    'auth-fix-summary.js',
    'cleanup-soft-deleted-users.js',
    'clear-browser-tokens.js',
    'clear-messages.js',
    'create-new-admin.js',
    'email-implementation-summary.js',
    'fix-admin-email.js',
    'fix-inventory-stock.js',
    'test-admin-auth.js',
    'test-api-endpoints.js',
    'test-email-functionality.js',
    'test-login-flow.js',
    'troubleshoot-gmail.js'
];

// Keep these essential test files in root
const keepRootFiles = [
    'test-admin-flow-fixed.js',
    'test-admin-messages-access.js',
    'test-admin-reply-email.js',
    'test-customer-thank-you-only.js',
    'test-enhanced-message-reply.js',
    'test-message-reply-api.js',
    'test-simple-reply.js'
];

// Keep this essential file in backend
const keepBackendFiles = [
    'create-test-admin.js'
];

function removeFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Removed: ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`⚠️  File not found: ${path.basename(filePath)}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error removing ${path.basename(filePath)}: ${error.message}`);
        return false;
    }
}

function cleanupProject() {
    console.log('🧹 Starting Project Cleanup...');
    console.log('===============================\n');

    let removedCount = 0;
    let totalAttempted = 0;

    // Remove unused files from root directory
    console.log('📁 Cleaning root directory...');
    unusedRootFiles.forEach(file => {
        const filePath = path.join(rootDir, file);
        totalAttempted++;
        if (removeFile(filePath)) {
            removedCount++;
        }
    });

    console.log('\n📁 Cleaning ToolinkBackend directory...');
    unusedBackendFiles.forEach(file => {
        const filePath = path.join(rootDir, 'ToolinkBackend', file);
        totalAttempted++;
        if (removeFile(filePath)) {
            removedCount++;
        }
    });

    console.log('\n📊 Cleanup Summary:');
    console.log('==================');
    console.log(`Total files attempted: ${totalAttempted}`);
    console.log(`Successfully removed: ${removedCount}`);
    console.log(`Failed/Not found: ${totalAttempted - removedCount}`);

    console.log('\n✅ Essential files kept in root:');
    keepRootFiles.forEach(file => console.log(`   - ${file}`));

    console.log('\n✅ Essential files kept in backend:');
    keepBackendFiles.forEach(file => console.log(`   - ${file}`));

    console.log('\n🎉 Project cleanup completed!');
    console.log('Your project is now cleaner with only essential files.');
}

// Run the cleanup
cleanupProject();
