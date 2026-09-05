import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function listJavaScriptFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return listJavaScriptFiles(fullPath);
        return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
    });
}

test('scripts generadores no reintroducen fuga, brecha ni curacion de base', () => {
    const forbidden = /fuga|brecha|recupera una vida|convierte[^.\n]+vida|bonus perfecto|sin_danos|salvage|forja|craftear/i;
    const offenders = listJavaScriptFiles(path.join(process.cwd(), 'scripts'))
        .map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }))
        .filter(({ text }) => forbidden.test(text))
        .map(({ file }) => path.relative(process.cwd(), file));

    assert.deepEqual(offenders, []);
});

test('datos y UI visible no reintroducen copia antigua de objetivo defensivo', () => {
    const files = [
        'data/heroes.json',
        'data/levels.json',
        'data/bootstrapData.js',
        'src/systems/UIManager.js',
        'src/systems/WaveManager.js',
        'src/ui/WaveReportPanel.js'
    ];
    const forbidden = [
        /\bsalidas?\b/i,
        /\bbonus perfecto\b/i,
        /\bcerca de meta\b/i,
        /\bantes de meta\b/i,
        /\bcruz[óo]\s+la\s+salida\b/i
    ];
    const offenders = files
        .map((file) => ({ file, text: fs.readFileSync(path.join(process.cwd(), file), 'utf8') }))
        .flatMap(({ file, text }) => forbidden
            .filter((pattern) => pattern.test(text))
            .map((pattern) => `${file}: ${pattern}`));

    assert.deepEqual(offenders, []);
});
