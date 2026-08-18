const { createServer } = require('http');
const next = require('next');

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(3000, '0.0.0.0', () => {
    console.log('BABIRYE serving on http://0.0.0.0:3000');
  });
}).catch(err => { console.error(err); process.exit(1); });
