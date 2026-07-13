const { spawn } = require('child_process');
const fs = require('fs');

const log = (msg) => fs.appendFileSync('/tmp/server-wrapper.log', `[${new Date().toISOString()}] ${msg}\n`);
log('Starting server wrapper...');

process.on('SIGTERM', () => log('WRAPPER SIGTERM'));
process.on('SIGINT', () => log('WRAPPER SIGINT'));

const child = spawn('node', ['server.js'], {
  cwd: '/home/z/my-project/.next/standalone',
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: ['pipe', 'pipe', 'pipe'],
});

child.stdout.on('data', (d) => {
  process.stdout.write(d);
  log('OUT: ' + d.toString().trim().slice(0, 200));
});

child.stderr.on('data', (d) => {
  process.stderr.write(d);
  log('ERR: ' + d.toString().trim().slice(0, 200));
});

child.on('exit', (code, signal) => {
  log(`EXIT: code=${code} signal=${signal}`);
});

child.on('error', (err) => {
  log('ERROR: ' + err.message);
});

// Keep wrapper alive
setInterval(() => {}, 10000);