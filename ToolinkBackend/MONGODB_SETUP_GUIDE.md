# ToolLink Backend - MongoDB Atlas Setup Guide

## 🗄️ MongoDB Atlas Configuration

Your backend is now configured to connect to MongoDB Atlas with the following details:

### Connection Details
- **Connection String**: `mongodb+srv://iit21057:4bl7HdiWlc2fvWeK@cluster0.ynpjyrl.mongodb.net/toollink?retryWrites=true&w=majority&appName=Cluster0`
- **Database Name**: `toollink`
- **Username**: `iit21057`
- **Password**: `4bl7HdiWlc2fvWeK`

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd "e:\Project 2\ToolinkBackend"
npm install
```

### 2. Test MongoDB Connection
```bash
npm run test-atlas
```

### 3. Start the Backend Server
```bash
npm run dev
```

## 📋 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with auto-reload
- `npm run test-atlas` - Test MongoDB Atlas connection
- `npm test` - Run basic connection test

## 🔗 API Endpoints

Once the server is running on `http://localhost:5000`:

- **Health Check**: `GET /api/health`
- **Database Test**: `GET /api/db-test`
- **API Info**: `GET /api`

## 🧪 Testing the Connection

### Method 1: Use the Test Script
```bash
npm run test-atlas
```

### Method 2: Check Health Endpoint
Open your browser and go to: `http://localhost:5000/api/health`

### Method 3: Check Database Status
Open your browser and go to: `http://localhost:5000/api/db-test`

## 📁 Project Structure

```
ToolinkBackend/
├── src/
│   ├── config/
│   │   └── mongodb.js          # MongoDB Atlas connection
│   ├── models/                 # Mongoose models (to be added)
│   ├── routes/                 # API routes (to be added)
│   ├── services/              # Business logic (to be added)
│   └── app.js                 # Main Express application
├── .env                       # Environment variables
├── package.json              # Dependencies and scripts
├── test-atlas-connection.js  # Connection test script
└── start-with-mongodb.bat   # Windows startup script
```

## 🔧 Environment Variables

The following environment variables are configured in `.env`:

```
MONGODB_URI=mongodb+srv://iit21057:4bl7HdiWlc2fvWeK@cluster0.ynpjyrl.mongodb.net/toollink?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=toollink
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
BCRYPT_ROUNDS=12
```

## ✅ What's Been Set Up

1. **MongoDB Atlas Connection**: Properly configured with your credentials
2. **Express Server**: Basic setup with CORS, security, and error handling
3. **Health Checks**: Endpoints to verify server and database status
4. **Development Tools**: Hot reload with nodemon
5. **Security**: Helmet for security headers, CORS configuration
6. **Logging**: Morgan for request logging

## 🔄 Next Steps

1. **Test the connection** using `npm run test-atlas`
2. **Start the backend** using `npm run dev`
3. **Add your models** in the `src/models/` directory
4. **Create API routes** in the `src/routes/` directory
5. **Implement authentication** using JWT tokens
6. **Connect your frontend** to the backend API

## 🛠️ Creating Models

Example User model (`src/models/User.js`):

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'warehouse', 'cashier', 'customer'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('User', userSchema);
```

## 🔐 Security Considerations

- Change the JWT_SECRET in production
- Use strong passwords for MongoDB Atlas
- Whitelist specific IP addresses in MongoDB Atlas
- Enable MongoDB Atlas monitoring and alerts
- Use environment variables for all sensitive data

## 📞 Support

If you encounter any issues:

1. Check the console output for error messages
2. Verify your MongoDB Atlas cluster is running
3. Ensure your IP address is whitelisted
4. Test the connection using the test script
5. Check the health endpoint for status information

## 🎯 Success Indicators

✅ `npm run test-atlas` shows "All MongoDB Atlas tests passed!"
✅ `http://localhost:5000/api/health` returns database: "Connected"
✅ Server starts without errors on port 5000
✅ Frontend can make requests to the backend API
