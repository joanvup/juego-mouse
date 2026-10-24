/* Sirve el juego en local o en la red del colegio, sin dependencias.
   Uso:
     node tools/serve.cjs                 → http://127.0.0.1:8123
     node tools/serve.cjs 8080           → cambia el puerto
     node tools/serve.cjs 8123 0.0.0.0  → accesible en la red local
     node tools/serve.cjs 8123 --open   → abre el navegador al iniciar
*/
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2).filter((a) => a.indexOf('--') !== 0);
const flags = process.argv.slice(2).filter((a) => a.indexOf('--') === 0);
const PORT = Number(args[0] || process.env.PORT || 8123);
const HOST = args[1] || process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    res.writeHead(400); res.end('Solicitud inválida'); return;
  }
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.resolve(ROOT, '.' + pathname);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== path.join(ROOT, 'index.html')) {
    res.writeHead(403); res.end('Prohibido'); return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('No encontrado: ' + pathname);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

function lanAddresses() {
  const out = [];
  const nets = os.networkInterfaces();
  Object.keys(nets).forEach((name) => {
    (nets[name] || []).forEach((net) => {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    });
  });
  return out;
}

server.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? '127.0.0.1' : HOST;
  const url = 'http://' + displayHost + ':' + PORT + '/';
  console.log('Mouse Aventura disponible en ' + url);
  if (HOST === '0.0.0.0') {
    const ips = lanAddresses();
    if (ips.length) {
      console.log('En la red del colegio:');
      ips.forEach((ip) => console.log('  http://' + ip + ':' + PORT + '/'));
    }
    console.log('Nota: la instalación como PWA y el modo sin conexión requieren HTTPS o localhost.');
  }
  console.log('Presiona Ctrl+C para detener el servidor.');
  if (flags.indexOf('--open') >= 0 && process.platform === 'win32') {
    setTimeout(() => {
      try { spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref(); } catch (e) {}
    }, 400);
  }
});
