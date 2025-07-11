const { spawn } = require('child_process');
const { createServer } = require('http');
const { parse } = require('url');

const port = process.env.PORT || 5173;

// Function to check if port is available
function checkPort(port, callback) {
  const server = createServer();
  
  server.listen(port, (err) => {
    if (err) {
      callback(false);
    } else {
      server.close(() => callback(true));
    }
  });
  
  server.on('error', () => callback(false));
}

// Function to wait for dev server
function waitForDevServer(port, callback) {
  const checkInterval = setInterval(() => {
    const http = require('http');
    const req = http.request({
      host: 'localhost',
      port: port,
      path: '/',
      timeout: 1000
    }, (res) => {
      clearInterval(checkInterval);
      callback();
    });
    
    req.on('error', () => {
      // Server not ready yet, continue waiting
    });
    
    req.on('timeout', () => {
      req.abort();
    });
    
    req.end();
  }, 1000);
}

// Start development server
console.log('Starting development server...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait for dev server to be ready, then start Electron
waitForDevServer(port, () => {
  console.log('Starting Electron...');
  const electronProcess = spawn('npx', ['electron', 'electron-main.js'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  // Handle process cleanup
  process.on('SIGINT', () => {
    electronProcess.kill();
    viteProcess.kill();
    process.exit();
  });
});