import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MIME_TYPES = {
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

export function getMimeType(filePath) {
    return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

export function resolveRequestFile(requestUrl = '/', rootDir = process.cwd()) {
    const root = path.resolve(rootDir);
    let urlPath;
    try {
        urlPath = decodeURIComponent(String(requestUrl || '/').split('?')[0]);
    } catch (error) {
        return { status: 400, message: 'Bad request', root };
    }

    if (urlPath === '/') urlPath = '/index.html';

    const file = path.resolve(root, `.${urlPath}`);
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
        return { status: 403, message: 'Forbidden', root, file };
    }

    return { status: 200, root, file };
}

export function createStaticServer({ rootDir = process.cwd() } = {}) {
    return http.createServer((req, res) => {
        const resolved = resolveRequestFile(req.url, rootDir);
        if (resolved.status !== 200) {
            res.writeHead(resolved.status);
            res.end(resolved.message);
            return;
        }

        const file = resolved.file;
        fs.readFile(file, (error, data) => {
            if (error) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }

            const headers = { 'Content-Type': getMimeType(file) };
            if (path.basename(file) === 'service-worker.js') headers['Cache-Control'] = 'no-cache';
            res.writeHead(200, headers);
            res.end(data);
        });
    });
}

const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '0.0.0.0';
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
    createStaticServer().listen(port, host, () => {
        const displayHost = host === '0.0.0.0' ? '127.0.0.1' : host;
        console.log(`Super Hero TD listo en http://${displayHost}:${port}`);
    });
}
