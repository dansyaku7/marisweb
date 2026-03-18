// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Pastikan NODE_ENV diatur ke 'production' di cPanel
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// cPanel akan menyediakan port-nya melalui process.env.PORT
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});