const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');

const PORT = 3000;
const DB_PATH = '/home/z/my-project/db/babirye.db';
const JWT_SECRET = 'babirye-titanium-ultra-v10-production-secret-2024';
const PROJECT = '/home/z/my-project';

// Simple health check endpoint
const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ status: 'ok', db: DB_PATH }));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  fs.appendFileSync('/tmp/health-server.log', `Health server on ${PORT}\n`);
});

// Also start Next.js
const next = require('child_process').spawn('npx', ['next', 'start', '-p', '3001'], {
  cwd: PROJECT,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE_URL: `file:${DB_PATH}`,
    BABIRYE_JWT_SECRET: JWT_SECRET,
    PORT: '3001',
  },
  stdio: 'inherit',
});