# Customer Registration with Approval Workflow 🏗️

## Overview
This document describes the customer registration and approval workflow implemented in the ToolLink system.

## Workflow Steps

### 1. Customer Registration
- **Location**: Home page → Register form
- **Process**:
  - Customer fills out registration form (Name, Email, Phone, Password)
  - Customer clicks "Register" or "Sign Up"
  - System creates account with `isApproved: false` status
  - Customer receives confirmation message: "Account created successfully! Your account is pending approval."

### 2. Pending Approval State
- **Status**: Customer account exists but cannot login
- **Database**: User record with `isApproved: false`
- **Login Attempt**: Shows "Account is pending approval" error message

### 3. Admin/Cashier Approval Process
- **Who can approve**: Admin users and Cashier users
- **Access**: Customer Approval page in admin interface
- **Actions**:
  - **View pending customers**: See list of all pending registrations
  - **Approve**: Set `isApproved: true` and send approval email
  - **Reject**: Delete user account and send rejection email with reason

### 4. Post-Approval Access
- **Customer Login**: After approval, customer can login normally
- **Portal Access**: Customer gains access to customer portal features
- **Database Update**: User record updated with `isApproved: true`

## Technical Implementation

### Backend Changes
1. **Registration Endpoint** (`/api/auth/register`):
   - Modified to set `isApproved: false` for role: 'customer'
   - Returns `requiresApproval: true` for customers

2. **New Approval Endpoints**:
   - `GET /api/auth/pending-users` - Get pending customers (Admin/Cashier only)
   - `POST /api/auth/approve-user` - Approve customer (Admin/Cashier only)
   - `POST /api/auth/reject-user` - Reject and delete customer (Admin/Cashier only)

3. **Login Validation**:
   - Added check for `isApproved` status
   - Returns "Account is pending approval" error for unapproved accounts

### Frontend Changes
1. **Registration Form**:
   - Shows appropriate message based on `requiresApproval` flag
   - Longer delay before redirect for approval message

2. **Customer Approval Page**:
   - List of pending customers
   - Approve/Reject buttons with confirmation
   - Real-time updates after actions

### Database Schema
```javascript
User Model:
{
  // ... existing fields
  isApproved: {
    type: Boolean,
    default: false  // For customers, true for other roles
  }
}
```

## User Experience Flow

### For Customers:
1. **Registration**: Fill form → Submit → "Pending approval" message
2. **Waiting**: Cannot login, receives "pending approval" error
3. **Notification**: Receives email when approved/rejected
4. **Access**: Can login and use customer portal after approval

### For Admin/Cashiers:
1. **Notification**: See pending customer count in dashboard
2. **Review**: Access Customer Approval page
3. **Decision**: Review customer details and approve/reject
4. **Action**: Customer receives email notification

## Security Features
- **Role-based access**: Only Admin and Cashier can approve customers
- **JWT Authentication**: All approval endpoints require valid tokens
- **Audit Trail**: All approval/rejection actions are logged
- **Email Notifications**: Automatic emails for approval/rejection

## Testing
Use the test page: `test-customer-registration-approval.html`

### Test Scenarios:
1. **New Customer Registration**:
   - Fill registration form
   - Verify "pending approval" status
   - Confirm cannot login

2. **Admin Approval Process**:
   - Login as admin/cashier
   - View pending customers
   - Approve customer
   - Verify customer can now login

3. **Customer Rejection**:
   - Reject pending customer
   - Verify customer account is deleted
   - Confirm cannot login

## Configuration
- **Auto-approval**: Currently disabled for customers
- **Email settings**: Configure SMTP in environment variables
- **Approval roles**: Admin and Cashier (configurable in middleware)

## API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|---------|-------------|
| POST | `/api/auth/register` | Public | Register new customer (pending approval) |
| POST | `/api/auth/login` | Public | Login (checks approval status) |
| GET | `/api/auth/pending-users` | Admin/Cashier | Get pending customers |
| POST | `/api/auth/approve-user` | Admin/Cashier | Approve customer |
| POST | `/api/auth/reject-user` | Admin/Cashier | Reject customer |

## Notes
- Customer accounts require approval by default
- Other roles (admin, warehouse, cashier) are auto-approved
- Rejected customers are permanently deleted
- Email notifications are sent for both approval and rejection
- System maintains audit logs for all approval activities

---

**Status**: ✅ Implemented and Ready for Use
**Last Updated**: July 12, 2025
**Version**: 1.0
