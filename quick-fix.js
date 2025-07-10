/**
 * Quick System Fix for ToolLink Connection Issues
 * 
 * This script attempts to automatically fix common connection problems
 */

const { exec, spawn } = require('child_process');
const http = require('http');
const path = require('path');

class SystemFixer {
  constructor() {
    this.backendPath = path.join(__dirname, 'ToolinkBackend');
    this.frontendPath = path.join(__dirname, 'ToolLink');
  }

  async checkBackendStatus() {
    console.log('🔍 Checking backend status...');
    
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/health',
        method: 'GET',
        timeout: 3000
      }, (res) => {
        resolve({ running: true, status: res.statusCode });
      });

      req.on('error', () => {
        resolve({ running: false });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ running: false });
      });

      req.end();
    });
  }

  async killPortProcess(port) {
    console.log(`🔧 Killing processes on port ${port}...`);
    
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        exec(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a 2>nul`, 
          (error) => {
            resolve(!error);
          });
      } else {
        exec(`lsof -ti :${port} | xargs kill -9`, (error) => {
          resolve(!error);
        });
      }
    });
  }

  async startBackend() {
    console.log('🚀 Starting backend server...');
    
    return new Promise((resolve, reject) => {
      const backendProcess = spawn('npm', ['start'], {
        cwd: this.backendPath,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let startupSuccess = false;
      const timeout = setTimeout(() => {
        if (!startupSuccess) {
          backendProcess.kill();
          reject(new Error('Backend startup timeout'));
        }
      }, 30000); // 30 second timeout

      backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        
        if (output.includes('Server running on') || output.includes('localhost:5000')) {
          startupSuccess = true;
          clearTimeout(timeout);
          resolve(backendProcess);
        }
      });

      backendProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('DeprecationWarning')) {
          console.error('Backend error:', error);
        }
      });

      backendProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      backendProcess.on('exit', (code) => {
        clearTimeout(timeout);
        if (code !== 0 && !startupSuccess) {
          reject(new Error(`Backend exited with code ${code}`));
        }
      });
    });
  }

  async waitForBackend() {
    console.log('⏳ Waiting for backend to be ready...');
    
    for (let i = 0; i < 30; i++) { // Wait up to 30 seconds
      const status = await this.checkBackendStatus();
      if (status.running) {
        console.log('✅ Backend is ready!');
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.stdout.write('.');
    }
    
    console.log('\n❌ Backend failed to start within timeout');
    return false;
  }

  async fix() {
    console.log('🔧 ToolLink System Auto-Fix');
    console.log('============================\n');

    try {
      // Step 1: Check current backend status
      const initialStatus = await this.checkBackendStatus();
      
      if (initialStatus.running) {
        console.log('✅ Backend is already running!');
        console.log('   If you\'re still seeing connection errors, try refreshing your browser.');
        return;
      }

      console.log('❌ Backend is not running');

      // Step 2: Clear port 5000
      await this.killPortProcess(5000);
      
      // Wait a moment for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Start backend
      const backendProcess = await this.startBackend();
      
      // Step 4: Wait for backend to be ready
      const isReady = await this.waitForBackend();
      
      if (isReady) {
        console.log('\n🎉 Success! Backend is now running');
        console.log('📡 Backend URL: http://localhost:5000');
        console.log('❤️  Health Check: http://localhost:5000/api/health');
        console.log('\n🌐 You can now start the frontend:');
        console.log('   cd ToolLink && npm run dev');
        console.log('\n🛑 Press Ctrl+C to stop the backend server');
        
        // Keep the process alive
        process.stdin.resume();
        
        process.on('SIGINT', () => {
          console.log('\n🛑 Stopping backend server...');
          backendProcess.kill();
          process.exit(0);
        });
        
      } else {
        console.log('\n❌ Failed to start backend server');
        console.log('   Please check the error messages above and try manually:');
        console.log('   cd ToolinkBackend && npm install && npm start');
      }

    } catch (error) {
      console.error('\n❌ Auto-fix failed:', error.message);
      console.log('\n🔧 Manual fix steps:');
      console.log('1. Open Command Prompt');
      console.log('2. cd "C:\\Users\\Laptop Island\\Desktop\\Chivantha\\project 2\\ToolinkBackend"');
      console.log('3. npm install');
      console.log('4. npm start');
    }
  }
}

// Run the auto-fix
const fixer = new SystemFixer();
fixer.fix();
