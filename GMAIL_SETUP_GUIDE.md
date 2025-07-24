📧 ToolLink Gmail Setup Guide
===============================

🚨 IMPORTANT: Gmail Authentication Issue Detected!

Your Gmail account (toollink1234@gmail.com) needs additional setup to work with the ToolLink email system.

🔐 Gmail Security Requirements:
Gmail has enhanced security that blocks "less secure apps" by default. You need to either:

Option 1: Enable App Passwords (RECOMMENDED) ✅
==============================================
1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" on the left sidebar
3. Enable "2-Step Verification" if not already enabled
4. Once 2-Step Verification is enabled, you'll see "App passwords"
5. Click "App passwords"
6. Select "Mail" as the app
7. Select "Other (custom name)" as the device
8. Enter "ToolLink Email System" as the name
9. Click "Generate"
10. Copy the 16-character app password (it looks like: xxxx xxxx xxxx xxxx)
11. Use this app password instead of your regular Gmail password

Option 2: Enable Less Secure App Access (NOT RECOMMENDED) ⚠️
============================================================
1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn on "Allow less secure apps"
3. This makes your account less secure, so Option 1 is better

🔧 Update Your ToolLink Configuration:
=====================================
After getting your app password, update the .env file:

TOOLLINK_EMAIL=toollink1234@gmail.com
TOOLLINK_EMAIL_PASSWORD=[YOUR_16_CHARACTER_APP_PASSWORD]

For example:
TOOLLINK_EMAIL=toollink1234@gmail.com
TOOLLINK_EMAIL_PASSWORD=abcd efgh ijkl mnop

✅ Quick Test Instructions:
==========================
1. Set up App Password following Option 1 above
2. Update your .env file with the app password
3. Run: node test-gmail-config.js
4. Look for "✅ Test email sent successfully!"

🌐 What This Enables:
====================
Once configured, ToolLink will automatically send:
- 📨 Welcome emails to new customers
- 🔔 Notifications to admins about pending approvals
- 🎉 Account approval confirmations
- ✅ Email verification messages
- 🔒 Password reset emails
- 📦 Order confirmation emails

🎯 Next Steps:
=============
1. Follow Option 1 (App Passwords) above
2. Update the TOOLLINK_EMAIL_PASSWORD in your .env file
3. Test again with: node test-gmail-config.js
4. Check your inbox for the test email

📞 Need Help?
============
If you run into issues:
- Make sure 2-Step Verification is enabled first
- The app password should be 16 characters with spaces
- Use the app password, not your regular Gmail password
- Double-check the .env file has the correct format

🚀 Once working, your ToolLink system will have professional automated email communication!
