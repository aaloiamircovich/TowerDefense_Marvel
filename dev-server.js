import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 5173);

const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json; charset=utf-8'
};

http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    const file = path.normalize(path.join(root, urlPath));
    if (!file.startsWith(root)) {
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
}).listen(port, '127.0.0.1', () => {
    console.log(`Super Hero TD listo en http://127.0.0.1:${port}`);
});
