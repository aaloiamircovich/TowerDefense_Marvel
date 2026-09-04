import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('simulate-economy mantiene una sola ponderacion por heroe', () => {
    const source = fs.readFileSync(new URL('../scripts/simulate-economy.js', import.meta.url), 'utf8');
    const utilityBody = source.match(/const utility = \{([\s\S]*?)\};/)?.[1] || '';
    const keys = [...utilityBody.matchAll(/([a-z0-9_]+)\s*:/g)].map((match) => match[1]);
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);

    assert.deepEqual(duplicates, []);
});
