# Enhanced Authentication System Test Script

## Testing Login Attempt Tracking and Account Locking

This script demonstrates the enhanced authentication features:

1. **Login Attempt Tracking**: System tracks failed login attempts
2. **Account Locking**: After 3 failed attempts, account gets locked for 2 hours
3. **Forgot Password**: Users can reset their password via email link
4. **Enhanced Error Messages**: Clear feedback about remaining attempts

## Test Scenarios

### Scenario 1: Test Failed Login Attempts
```bash
# First failed attempt
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpass1"}'

# Second failed attempt  
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpass2"}'

# Third failed attempt (should lock account)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpass3"}'

# Fourth attempt (should show account locked)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correctpass"}'
```

### Scenario 2: Test Forgot Password
```bash
# Request password reset
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Reset password with token (replace TOKEN with actual token)
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_EMAIL","newPassword":"newpassword123"}'
```

## Frontend Features

1. **Enhanced Login Form**:
   - Shows remaining attempts after failed logins
   - Displays "Forgot Password?" link after multiple failures
   - Beautiful error messages with clear instructions

2. **Forgot Password Page**:
   - Clean, modern interface
   - Email input with validation
   - Success confirmation page

3. **Reset Password Page**:
   - Secure token validation
   - Password confirmation
   - Success feedback

## Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT tokens for authentication
- Rate limiting on login attempts
- Secure password reset tokens (10-minute expiry)
- Account locking (2-hour lockout)
- Input validation and sanitization

## Usage Instructions

1. Start the backend: `node server-mongo.js`
2. Start the frontend: `npm run dev`
3. Navigate to `http://localhost:5174/login`
4. Try logging in with wrong credentials multiple times
5. Use the "Forgot Password?" link when it appears
6. Check the backend console for password reset tokens (in development)

## Demo Accounts

- Admin: admin@toollink.com / admin123
- User: user@toollink.com / user123
- Warehouse: warehouse@toollink.com / warehouse123
- Cashier: cashier@toollink.com / cashier123

## Error Types

- `INVALID_CREDENTIALS`: Wrong email/password
- `ACCOUNT_LOCKED`: Too many failed attempts
- `ACCOUNT_INACTIVE`: Account not active

## Response Examples

### Failed Login (with attempts remaining)
```json
{
  "success": false,
  "message": "Invalid email or password. 2 attempts remaining.",
  "errorType": "INVALID_CREDENTIALS",
  "remainingAttempts": 2
}
```

### Account Locked
```json
{
  "success": false,
  "message": "Account has been locked due to too many failed login attempts. Please try again in 2 hours or use forgot password.",
  "errorType": "ACCOUNT_LOCKED",
  "remainingAttempts": 0
}
```

### Successful Password Reset
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```
