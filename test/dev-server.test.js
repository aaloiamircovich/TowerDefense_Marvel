import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { getMimeType, resolveRequestFile } from '../dev-server.js';

test('dev-server resuelve la raiz hacia index.html dentro del proyecto', () => {
    const root = path.resolve('public-root');
    const resolved = resolveRequestFile('/', root);

    assert.equal(resolved.status, 200);
    assert.equal(resolved.root, root);
    assert.equal(resolved.file, path.join(root, 'index.html'));
});

test('dev-server bloquea traversal de rutas codificadas', () => {
    const root = path.resolve('public-root');
    const resolved = resolveRequestFile('/..%2fpackage.json', root);

    assert.equal(resolved.status, 403);
    assert.ok(!resolved.file.startsWith(`${root}${path.sep}`));
});

test('dev-server declara MIME para musica y sprites animados', () => {
    assert.equal(getMimeType('assets/audio/music/theme.mp3'), 'audio/mpeg');
    assert.equal(getMimeType('assets/images/enemies/loki.gif'), 'image/gif');
    assert.equal(getMimeType('assets/images/ui/icon.webp'), 'image/webp');
    assert.equal(getMimeType('assets/icons/favicon.ico'), 'image/x-icon');
    assert.equal(getMimeType('assets/unknown.asset'), 'application/octet-stream');
});
