# 🔧 ToolLink Troubleshooting Guide

## Current Issue: Backend Not Starting

### Step 1: Test Simple Server
```cmd
cd ToolinkBackend
node simple-server.js
```
**Expected Output:**
```
🚀 Simple Backend Test Starting...
✅ Simple backend server started successfully!
📡 Server running on: http://localhost:5000
🔍 Test URL: http://localhost:5000/api/health
====================================
```

If this works, the issue is with the main app.js file.
If this doesn't work, there's a Node.js or dependency issue.

### Step 2: Check Dependencies
```cmd
cd ToolinkBackend
npm list
```

Look for any missing packages or errors.

### Step 3: Reinstall Dependencies (if needed)
```cmd
cd ToolinkBackend
rmdir /s node_modules
del package-lock.json
npm install
```

### Step 4: Test Database
```cmd
cd ToolinkBackend
node test-startup.js
```

### Step 5: Check Port Usage
```cmd
netstat -ano | findstr :5000
```
If port 5000 is in use, kill the process or change the port.

### Step 6: Try Alternative Startup Methods

**Method A: Using npm**
```cmd
cd ToolinkBackend
npm start
```

**Method B: Direct node**
```cmd
cd ToolinkBackend
node src/app.js
```

**Method C: With debugging**
```cmd
cd ToolinkBackend
node --inspect src/app.js
```

### Step 7: Manual Terminal Method

Open **Command Prompt** (not PowerShell) and try:
```cmd
cd "c:\Users\Laptop Island\Desktop\Chivantha\project 2\ToolinkBackend"
node simple-server.js
```

### Step 8: Check for Error Messages

If you see no output at all, try:
```cmd
cd ToolinkBackend
node -e "console.log('Node.js is working')"
```

## Common Solutions

### Port Already in Use
```cmd
# Find process using port 5000
netstat -ano | findstr :5000
# Kill the process (replace PID with actual number)
taskkill /PID 1234 /F
```

### Database Issues
1. Delete the database file:
   ```cmd
   del "src\data\toolink.db"
   ```
2. Restart the server

### Permission Issues
Run Command Prompt as Administrator

### Node.js Issues
1. Check Node.js version: `node --version`
2. Should be v16+ for this project
3. Reinstall Node.js if needed

## Success Indicators

✅ You should see server startup messages
✅ No error messages in the terminal
✅ Server responds to http://localhost:5000/api/health
✅ No "port in use" errors

## Next Steps After Backend Works

1. **Test the Backend:**
   ```cmd
   # In a web browser, visit:
   http://localhost:5000/api/health
   ```

2. **Start the Frontend:**
   ```cmd
   cd ToolLink
   npm run dev
   ```

3. **Access the Application:**
   ```
   Frontend: http://localhost:5173
   Backend API: http://localhost:5000/api
   ```

## If Nothing Works

Try these emergency steps:

1. **Restart your computer** - Sometimes clears port/permission issues
2. **Run as Administrator** - Right-click Command Prompt → "Run as Administrator"
3. **Check Windows Firewall** - Make sure Node.js is allowed
4. **Use different ports** - Change PORT=5001 in .env file

## Contact Debug Info

When asking for help, please provide:
1. Exact error messages (if any)
2. Output from `node --version`
3. Output from `npm --version`
4. Which step failed
5. Your Windows version
