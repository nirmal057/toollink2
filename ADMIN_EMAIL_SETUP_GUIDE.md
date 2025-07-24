# 📧 ToolLink Admin Email Configuration Guide

## 🎯 **How to Add Admin Emails to ToolLink**

### **Method 1: Add New Admin User Account** ✅

#### Step 1: Edit the Admin Creation Script
1. Open `ToolinkBackend/add-new-admin.js`
2. Update these details:
   ```javascript
   const newAdminData = {
       username: 'yourusername',        // ← Your username
       email: 'your-email@gmail.com',   // ← Your email address
       password: 'admin123',            // ← Your password
       fullName: 'Your Full Name',      // ← Your name
       phone: '+94712345678',           // ← Your phone number
   };
   ```

#### Step 2: Run the Script
```bash
cd ToolinkBackend
node add-new-admin.js
```

#### Step 3: Login with New Admin Account
- **URL**: http://localhost:5173/auth/login
- **Email**: your-email@gmail.com (what you set above)
- **Password**: admin123 (what you set above)

---

### **Method 2: Add Email to Notification List** 📬

#### Update Environment Variables
Add your email to the `.env` file:
```env
# Multiple admin emails for notifications (comma separated)
ADMIN_NOTIFICATION_EMAILS=admin@toollink.com,admin1@toollink.lk,your-email@gmail.com

# Support email
SUPPORT_EMAIL=toollink1234@gmail.com
```

---

### **Method 3: Update Email Service Configuration** 🔧

#### For Gmail Sending Service:
```env
# Main email account for sending emails
TOOLLINK_EMAIL=toollink1234@gmail.com
TOOLLINK_EMAIL_PASSWORD=200013704210

# Display name for emails
FROM_NAME=ToolLink Admin Team
FROM_EMAIL=toollink1234@gmail.com
```

---

## 🎉 **What Admin Emails Receive:**

### **📨 Automatic Notifications:**
- New customer registrations (requires approval)
- Low stock alerts
- System notifications
- Order confirmations
- Security alerts

### **🔔 System Access:**
- Admin dashboard
- User management
- Order management
- Inventory management
- System reports

---

## 🧪 **Quick Test Instructions:**

### Test 1: Create Admin Account
```bash
cd ToolinkBackend
node add-new-admin.js
```

### Test 2: Login as Admin
1. Go to http://localhost:5173/auth/login
2. Use your new admin credentials
3. Access admin dashboard

### Test 3: Verify Email Notifications
1. Register a new customer account
2. Check if admin receives notification email
3. Approve/reject customer from admin panel

---

## 📋 **Current Admin Accounts:**

| Email | Username | Password | Status |
|-------|----------|----------|---------|
| admin@toollink.com | admin | admin123 | ✅ Active |
| admin1@toollink.lk | admin1 | admin123 | ✅ Active |
| test@admin.com | testadmin | test123 | ✅ Active |
| **your-email@gmail.com** | **yourusername** | **admin123** | ⏳ To Create |

---

## 🔧 **Email Service Status:**

| Configuration | Current Value | Status |
|---------------|---------------|---------|
| **Gmail Account** | toollink1234@gmail.com | ✅ Configured |
| **App Password** | 200013704210 | ⚠️ Needs 16 chars |
| **SMTP Service** | Gmail SMTP | ✅ Ready |
| **Email Templates** | 6 Templates | ✅ Ready |

---

## 🚨 **Next Steps:**

1. **Fix Gmail App Password**: Get proper 16-character app password
2. **Add Your Admin Email**: Edit and run `add-new-admin.js`
3. **Test Email System**: Verify notifications work
4. **Login as Admin**: Access admin dashboard

---

## 📞 **Need Help?**

If you encounter issues:
- Make sure MongoDB is running
- Check your Gmail app password is 16 characters
- Verify email addresses are correct
- Test login with existing admin accounts first

**Current Working Admin Login:**
- Email: admin@toollink.com
- Password: admin123
