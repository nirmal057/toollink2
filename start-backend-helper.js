const { spawn } = require('child_process');

console.log('Starting ToolinkBackend...');

const backend = spawn('npm', ['start'], {
  cwd: 'ToolinkBackend',
  stdio: 'inherit'
});

backend.on('error', (err) => {
  console.error('Failed to start backend:', err);
});

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('Stopping backend...');
  backend.kill();
  process.exit();
});
