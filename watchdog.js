const { spawn } = require('child_process');
const http = require('http');

function ping() {
  http.get('http://localhost:3000/', () => {}).on('error', () => {});
}

function start() {
  console.log('Starting BABIRYE server...');
  const child = spawn('node', ['serve.js'], {
    env: { ...process.env, NODE_ENV: 'production' },
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  child.stdout.on('data', d => process.stdout.write(d));
  child.stderr.on('data', d => process.stderr.write(d));
  child.on('exit', (code) => {
    console.log('Server died, code=' + code + '. Restarting in 2s...');
    setTimeout(start, 2000);
  });
}

start();
setInterval(ping, 8000);
