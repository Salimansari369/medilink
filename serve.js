const http = require('http');
const fs = require('fs');
const path = require('path');

const host = '127.0.0.1';
const startPort = 5500;
const rootDir = __dirname;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
        'Content-Type': 'text/plain; charset=utf-8'
      });
      response.end(error.code === 'ENOENT' ? '404 Not Found' : '500 Internal Server Error');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(data);
  });
}

function getSafePath(requestUrl) {
  const parsedUrl = new URL(requestUrl, `http://${host}`);
  const pathname = decodeURIComponent(parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname);
  const normalizedPath = path.normalize(pathname).replace(/^([\\/])+/, '');
  const resolvedPath = path.resolve(rootDir, normalizedPath);

  if (!resolvedPath.startsWith(rootDir)) {
    return null;
  }

  return resolvedPath;
}

function createServer() {
  return http.createServer((request, response) => {
    const safePath = getSafePath(request.url || '/');

    if (!safePath) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('403 Forbidden');
      return;
    }

    fs.stat(safePath, (error, stats) => {
      if (!error && stats.isDirectory()) {
        sendFile(response, path.join(safePath, 'index.html'));
        return;
      }

      sendFile(response, safePath);
    });
  });
}

function startServer(port) {
  const server = createServer();

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      startServer(port + 1);
      return;
    }

    console.error(error);
    process.exit(1);
  });

  server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
    console.log('Press Ctrl+C to stop the server.');
  });
}

startServer(startPort);
