# Enhanced Authentication System Documentation

## Overview

This document describes the enhanced authentication system for the ToolLink project, which provides secure login functionality with JWT tokens, bcrypt password hashing, login attempt tracking, account locking, and password reset capabilities.

## Features

### 🔐 Secure Authentication
- **JWT Token Generation**: Access and refresh tokens with configurable expiration
- **bcrypt Password Hashing**: Secure password storage with salt rounds
- **Role-Based Access Control**: Support for multiple user roles (admin, manager, warehouse_staff, delivery_staff, customer_service, customer)

### 🛡️ Security Features
- **Login Attempt Tracking**: Tracks failed login attempts per user
- **Account Locking**: Automatically locks accounts after 3 failed attempts for 2 hours
- **Rate Limiting**: IP-based rate limiting to prevent brute force attacks
- **Password Reset**: Secure token-based password reset functionality

### 📊 User Management
- **Account Status**: Active/inactive account management
- **Last Login Tracking**: Records when users last logged in
- **Email Validation**: Ensures valid email format and uniqueness

## API Endpoints

### Enhanced Authentication Route: `/api/auth-enhanced`

#### 1. Login
```http
POST /api/auth-enhanced/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "customer",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

*Invalid Credentials (401):*
```json
{
  "success": false,
  "message": "Email or password is incorrect. 2 attempts remaining.",
  "errorType": "INVALID_CREDENTIALS",
  "remainingAttempts": 2
}
```

*Account Locked (423):*
```json
{
  "success": false,
  "message": "Account has been locked due to too many failed login attempts. Please try again in 2 hours or use forgot password.",
  "errorType": "ACCOUNT_LOCKED",
  "remainingAttempts": 0
}
```

*Account Inactive (401):*
```json
{
  "success": false,
  "message": "Account is not active. Please contact support.",
  "errorType": "ACCOUNT_INACTIVE"
}
```

#### 2. Forgot Password
```http
POST /api/auth-enhanced/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset instructions have been sent to your email.",
  "resetToken": "abc123..." // Only in development mode
}
```

#### 3. Reset Password
```http
POST /api/auth-enhanced/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

#### 4. Refresh Token
```http
POST /api/auth-enhanced/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Database Schema

### User Model (Sequelize)
```javascript
{
  id: INTEGER (Primary Key, Auto Increment),
  email: STRING (Unique, Not Null, Email Validation),
  password: STRING (Not Null, Min 6 chars, Hashed),
  role: ENUM ('admin', 'manager', 'warehouse_staff', 'delivery_staff', 'customer_service', 'customer'),
  firstName: STRING,
  lastName: STRING,
  phone: STRING,
  isActive: BOOLEAN (Default: true),
  lastLogin: DATE,
  
  // Login attempt tracking
  loginAttempts: INTEGER (Default: 0),
  lockUntil: DATE,
  
  // Password reset
  resetPasswordToken: STRING,
  resetPasswordExpires: DATE,
  
  // Timestamps
  createdAt: DATE,
  updatedAt: DATE
}
```

### User Model Methods

**Instance Methods:**
- `comparePassword(candidatePassword)` - Compare plain text password with hashed password
- `isLocked()` - Check if account is currently locked
- `incLoginAttempts()` - Increment login attempts and lock if necessary
- `resetLoginAttempts()` - Reset login attempts to 0
- `generatePasswordResetToken()` - Generate secure password reset token

**Class Methods:**
- `findByEmail(email)` - Find user by email with password included

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRE=7d

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=toollink_db
DB_USER=root
DB_PASSWORD=your-password

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## Security Considerations

### 1. Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Plain text passwords are never stored in the database
- Password validation requires minimum 6 characters

### 2. Account Locking
- Accounts are locked after 3 consecutive failed login attempts
- Lock duration is 2 hours
- Locked accounts can be unlocked via password reset

### 3. JWT Tokens
- Access tokens expire in 24 hours (configurable)
- Refresh tokens expire in 7 days (configurable)
- Tokens include user ID, email, and role
- Separate secrets for access and refresh tokens

### 4. Rate Limiting
- IP-based rate limiting: 10 login attempts per 15 minutes
- API-wide rate limiting: 100 requests per 15 minutes per IP

### 5. Password Reset
- Reset tokens expire in 10 minutes
- Tokens are hashed before storage
- Email validation prevents information disclosure

## Frontend Integration

### Authentication Hook (useAuth)
```typescript
const { login, isLoading, error, user } = useAuth();

// Login with error handling
const handleLogin = async (email: string, password: string) => {
  try {
    await login(email, password);
    // Handle success
  } catch (error) {
    if (error.errorType === 'INVALID_CREDENTIALS') {
      setMessage(`Invalid credentials. ${error.remainingAttempts} attempts remaining.`);
    } else if (error.errorType === 'ACCOUNT_LOCKED') {
      setMessage('Account locked. Please try again later or reset your password.');
      setShowForgotPassword(true);
    } else if (error.errorType === 'ACCOUNT_INACTIVE') {
      setMessage('Account is not active. Please contact support.');
    }
  }
};
```

### Authentication Service
```typescript
// Enhanced login with error propagation
const login = async (email: string, password: string) => {
  const response = await api.post('/auth-enhanced/login', { email, password });
  
  // Store tokens
  localStorage.setItem('accessToken', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
  
  return response.data;
};
```

## Testing

### Running Tests
```bash
# Start the backend server
cd ToolLink-MySQL-Backend
npm start

# Run the enhanced authentication test suite
node test-enhanced-auth.js
```

### Test Coverage
The test suite covers:
- ✅ Invalid email login attempts
- ✅ Invalid password login attempts
- ✅ Valid login with JWT token generation
- ✅ Login attempt tracking and account locking
- ✅ Forgot password functionality
- ✅ Password reset functionality

## Migration from Basic Auth

If you're currently using the basic auth system, here's how to migrate:

### 1. Update Frontend Routes
```typescript
// Change from:
const response = await api.post('/auth/login', { email, password });

// To:
const response = await api.post('/auth-enhanced/login', { email, password });
```

### 2. Handle New Error Types
Update your error handling to support the new error types:
- `INVALID_CREDENTIALS`
- `ACCOUNT_LOCKED`
- `ACCOUNT_INACTIVE`

### 3. Update User Model
Ensure your database has the new fields:
- `loginAttempts`
- `lockUntil`
- `resetPasswordToken`
- `resetPasswordExpires`

## Troubleshooting

### Common Issues

**1. "User model not found"**
- Ensure the User model is properly imported in your routes
- Check that associations are loaded

**2. "JWT secret not defined"**
- Set the `JWT_SECRET` environment variable
- Use a strong, random secret in production

**3. "Rate limit exceeded"**
- Wait for the rate limit window to reset
- Adjust rate limiting configuration if needed

**4. "Account locked but no email service"**
- Users can wait 2 hours for automatic unlock
- Implement email service for password reset
- Manually reset in database if needed

### Debug Mode
Set `NODE_ENV=development` to enable:
- Reset tokens in API responses
- Detailed error logging
- Development-friendly settings

## Production Deployment

### Security Checklist
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS for all API endpoints
- [ ] Configure email service for password reset
- [ ] Set up proper logging and monitoring
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting appropriate for your traffic
- [ ] Set up database backups
- [ ] Configure CORS for your frontend domain only

### Performance Considerations
- Database indexes on email and resetPasswordToken fields
- Connection pooling for database
- Redis for session storage in multi-server setup
- CDN for static assets

## Support

For issues or questions about the enhanced authentication system:
1. Check the troubleshooting section above
2. Run the test suite to verify functionality
3. Check server logs for detailed error information
4. Ensure all environment variables are properly set

---

*Last updated: January 2024*
*Version: 1.0.0*
