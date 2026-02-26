const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendFile(res, filepath) {
  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
      return;
    }

    const ext = path.extname(filepath).toLowerCase();
    const type = CONTENT_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const cleanPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const requestPath = cleanPath === '/' ? '/index.html' : cleanPath;
  const normalized = path.normalize(requestPath).replace(/^\.+/, '');
  const filepath = path.join(ROOT, normalized);

  if (!filepath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filepath, (err, stats) => {
    if (!err && stats.isFile()) {
      sendFile(res, filepath);
      return;
    }

    sendFile(res, path.join(ROOT, 'index.html'));
  });
});

server.listen(PORT, () => {
  console.log(`Xpress Logistics preview running at http://0.0.0.0:${PORT}`);
});
