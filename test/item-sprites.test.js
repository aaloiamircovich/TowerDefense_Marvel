import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const items = JSON.parse(fs.readFileSync(path.join(root, 'data', 'items.json'), 'utf8'));

test('todos los objetos usan un sprite propio existente', () => {
    for (const [id, item] of Object.entries(items)) {
        assert.equal(item.icon, `assets/images/items/${id}.png`, `${id} debe apuntar a su sprite propio`);
        assert.equal(fs.existsSync(path.join(root, item.icon)), true, `${id} no tiene archivo de sprite`);
    }
});
