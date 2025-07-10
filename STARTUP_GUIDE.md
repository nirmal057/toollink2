# 🚀 ToolLink Project Startup Guide

## Quick Start (Windows)

### Method 1: Double-click the batch files
1. **Double-click `start-backend.bat`** - This starts the backend server
2. **Double-click `start-frontend.bat`** - This starts the frontend (in a new window)

### Method 2: Command Line
Open **two separate** Command Prompt or PowerShell windows:

**Window 1 (Backend):**
```cmd
cd "c:\Users\Laptop Island\Desktop\Chivantha\project 2"
cd ToolinkBackend
node src/app.js
```

**Window 2 (Frontend):**
```cmd
cd "c:\Users\Laptop Island\Desktop\Chivantha\project 2"
cd ToolLink
npm run dev
```

## 🎯 Expected Results

### Backend (Terminal 1)
```
🚀 ToolLink Backend Server Started
📡 Server running on http://localhost:5000
🌍 Environment: development
📊 API Documentation: http://localhost:5000/api
❤️  Health Check: http://localhost:5000/api/health
====================================
```

### Frontend (Terminal 2)
```
VITE v4.x.x ready in xxxms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## 🌐 Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 👤 Test Login Credentials

### Admin User
- **Email**: admin@toollink.com
- **Password**: admin123

### Cashier User
- **Email**: cashier@toollink.com  
- **Password**: cashier123

### Customer User
- **Email**: customer@toollink.com
- **Password**: customer123

## 🔧 Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

**For Backend (Port 5000):**
```cmd
# Find and kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**For Frontend (Port 5173):**
Vite will automatically find another available port.

### Database Issues
If you get database errors:
1. Delete `ToolinkBackend/toolink_development.db`
2. Restart the backend server
3. The database will be recreated automatically

### Missing Dependencies
If you get "module not found" errors:
```cmd
# In ToolinkBackend folder
npm install

# In ToolLink folder  
npm install
```

## 🧪 Testing the System

### Quick Health Check
```cmd
# Test backend
curl http://localhost:5000/api/health

# Or visit in browser
http://localhost:5000/api/health
```

### Test Login Flow
```cmd
node test-cashier-login.js
```

### Complete System Test
```cmd
node test-complete-system.js
```

## 🎉 Success Indicators

✅ **Backend Running**: You see the server startup message  
✅ **Frontend Running**: Vite dev server starts on port 5173  
✅ **Database Connected**: No database connection errors  
✅ **Login Works**: You can log in with test credentials  
✅ **Pages Load**: All admin pages are accessible  

## 📱 Responsive Design

The system is fully responsive and works on:
- 📱 Mobile phones (portrait/landscape)
- 📱 Tablets (813x455 and other sizes)
- 💻 Desktop computers

## 🎯 Ready to Use!

Once both servers are running:
1. Go to http://localhost:5173
2. Click "Login" 
3. Use admin credentials: admin@toollink.com / admin123
4. Access all admin features with full responsive design

---

**Need Help?** 
- Check terminal windows for error messages
- Ensure both backend and frontend are running
- Test the health check endpoint first
