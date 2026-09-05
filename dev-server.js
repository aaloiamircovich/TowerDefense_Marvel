import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(process.cwd());
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '0.0.0.0';

const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.webmanifest': 'application/manifest+json; charset=utf-8'
};

http.createServer((req, res) => {
    let urlPath;
    try {
        urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch (error) {
        res.writeHead(400);
        res.end('Bad request');
        return;
    }
    if (urlPath === '/') urlPath = '/index.html';

    const file = path.resolve(root, `.${urlPath}`);
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(file, (error, data) => {
        if (error) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        const headers = { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' };
        if (path.basename(file) === 'service-worker.js') headers['Cache-Control'] = 'no-cache';
        res.writeHead(200, headers);
        res.end(data);
    });
}).listen(port, host, () => {
    const displayHost = host === '0.0.0.0' ? '127.0.0.1' : host;
    console.log(`Super Hero TD listo en http://${displayHost}:${port}`);
});
