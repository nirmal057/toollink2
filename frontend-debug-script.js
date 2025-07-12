// Frontend form submission debugger
// Add this script to browser console to debug the user creation form

console.log('🔍 Frontend User Creation Form Debugger Loaded');

// Function to check if user management form exists
function checkUserManagementForm() {
    console.log('🔍 Checking for user management form...');

    const forms = document.querySelectorAll('form');
    console.log(`Found ${forms.length} forms on page`);

    forms.forEach((form, index) => {
        console.log(`Form ${index + 1}:`, {
            id: form.id,
            className: form.className,
            action: form.action,
            method: form.method,
            elements: form.elements.length
        });
    });

    // Look for user-related inputs
    const userInputs = document.querySelectorAll('input[name*="user"], input[name*="name"], input[name*="email"], input[name*="username"]');
    console.log(`Found ${userInputs.length} user-related inputs:`, userInputs);

    // Look for submit buttons
    const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
    console.log(`Found ${submitButtons.length} submit buttons:`, submitButtons);

    return { forms, userInputs, submitButtons };
}

// Function to add form submission listener
function addDebugListener() {
    console.log('🎯 Adding debug listener to forms...');

    document.addEventListener('submit', (e) => {
        console.log('🚀 FORM SUBMISSION DETECTED!');
        console.log('Form:', e.target);
        console.log('Form data:', new FormData(e.target));
        console.log('Event:', e);

        // Don't prevent default for now, just log
    }, true);

    // Also listen for button clicks
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.type === 'submit' || target.tagName === 'BUTTON') {
            console.log('🖱️ SUBMIT BUTTON CLICKED!');
            console.log('Button:', target);
            console.log('Button type:', target.type);
            console.log('Button text:', target.textContent);
            console.log('Form:', target.form);
        }
    }, true);
}

// Function to check for JavaScript errors
function checkForErrors() {
    console.log('❌ Checking for JavaScript errors...');

    // Override console.error to catch errors
    const originalError = console.error;
    console.error = function (...args) {
        console.log('🚨 CONSOLE ERROR DETECTED:', args);
        originalError.apply(console, args);
    };

    // Check for React errors
    window.addEventListener('error', (e) => {
        console.log('🚨 GLOBAL ERROR DETECTED:', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            error: e.error
        });
    });

    // Check for unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
        console.log('🚨 UNHANDLED PROMISE REJECTION:', e.reason);
    });
}

// Function to test userApiService directly
function testUserApiServiceDirectly() {
    console.log('🧪 Testing userApiService directly...');

    // Try to access the service
    try {
        // This might not work if it's not globally available
        if (window.userApiService) {
            console.log('✅ userApiService found globally');
            return window.userApiService;
        } else {
            console.log('⚠️ userApiService not found globally');
        }
    } catch (e) {
        console.log('❌ Error accessing userApiService:', e);
    }
}

// Function to simulate form submission
function simulateFormSubmission() {
    console.log('🎭 Simulating form submission...');

    const forms = document.querySelectorAll('form');
    if (forms.length === 0) {
        console.log('❌ No forms found to simulate');
        return;
    }

    const form = forms[0]; // Use first form
    console.log('📝 Using form:', form);

    // Try to fill form with test data
    const usernameInput = form.querySelector('input[name*="username"], input[name*="user"]');
    const emailInput = form.querySelector('input[type="email"], input[name*="email"]');
    const passwordInput = form.querySelector('input[type="password"], input[name*="password"]');
    const nameInput = form.querySelector('input[name*="name"], input[name*="fullName"]');

    if (usernameInput) {
        usernameInput.value = `test_debug_${Date.now()}`;
        console.log('✅ Set username');
    }

    if (emailInput) {
        emailInput.value = `test_debug_${Date.now()}@example.com`;
        console.log('✅ Set email');
    }

    if (passwordInput) {
        passwordInput.value = 'TestPassword123!';
        console.log('✅ Set password');
    }

    if (nameInput) {
        nameInput.value = 'Debug Test User';
        console.log('✅ Set name');
    }

    // Try to submit
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitButton) {
        console.log('🎯 Clicking submit button...');
        submitButton.click();
    } else {
        console.log('⚠️ No submit button found, dispatching submit event');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
}

// Main debug function
function debugUserCreationForm() {
    console.log('🔧 Starting User Creation Form Debug...');
    console.log('================================');

    // Step 1: Check form structure
    const formInfo = checkUserManagementForm();

    // Step 2: Add debug listeners
    addDebugListener();

    // Step 3: Check for errors
    checkForErrors();

    // Step 4: Test service
    testUserApiServiceDirectly();

    console.log('================================');
    console.log('✅ Debug setup complete!');
    console.log('Now try to submit the form and watch the console');
    console.log('Or run simulateFormSubmission() to test automatically');

    return {
        formInfo,
        simulate: simulateFormSubmission,
        check: checkUserManagementForm
    };
}

// Auto-run debug
const debugTools = debugUserCreationForm();

// Make functions available globally for manual testing
window.debugUserForm = debugTools;
window.simulateFormSubmission = simulateFormSubmission;
window.checkUserManagementForm = checkUserManagementForm;
