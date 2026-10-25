import { createReadStream, stat } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const root = process.cwd();
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

createServer((request, response) => {
  let file;
  try {
    file = resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }
  if (file !== root && !file.startsWith(`${root}/`) && !file.startsWith(`${root}\\`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  stat(file, (error, info) => {
    if (error) {
      response.writeHead(404).end('Not found');
      return;
    }
    if (info.isDirectory()) file = join(file, 'index.html');
    response.setHeader('Content-Type', mime[extname(file).toLowerCase()] ?? 'application/octet-stream');
    createReadStream(file).on('error', () => response.writeHead(404).end('Not found')).pipe(response);
  });
}).listen(8000, '127.0.0.1', () => console.log('Portal available at http://localhost:8000'));
