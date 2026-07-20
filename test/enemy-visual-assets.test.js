import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const enemies = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/enemies.json'), 'utf8'));

function assertEnemyVisual(enemy, expected) {
    assert.ok(enemy.sprite, `${enemy.id} debe tener sprite principal`);
    assert.ok(fs.existsSync(path.join(projectRoot, enemy.sprite)), `${enemy.id} sprite no existe`);
    assert.equal(enemy.visual?.size, expected.size);
    assert.equal(enemy.visual?.defaultDirection, 'south');

    for (const direction of ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']) {
        const source = enemy.visual?.idle?.[direction];
        assert.ok(source, `${enemy.id} falta idle ${direction}`);
        assert.ok(fs.existsSync(path.join(projectRoot, source)), `${enemy.id} idle ${direction} no existe`);
    }

    for (const [direction, count] of Object.entries(expected.walkCounts)) {
        const frames = enemy.visual?.walk?.frames?.[direction] || [];
        assert.equal(frames.length, count, `${enemy.id} walk ${direction} debe tener ${count} frames`);
        frames.forEach((source) => assert.ok(fs.existsSync(path.join(projectRoot, source)), `${enemy.id} frame no existe: ${source}`));
    }
}

test('Ultron, Kang y Ninja de La Mano usan sprites importados', () => {
    assertEnemyVisual(enemies.bosses.ultron_prime, {
        size: 96,
        walkCounts: { south: 6, north: 9, east: 7, west: 7 }
    });
    assertEnemyVisual(enemies.bosses.kang, {
        size: 96,
        walkCounts: { south: 4, north: 4, east: 4, west: 4 }
    });
    assertEnemyVisual(enemies.normal.hand_ninja, {
        size: 72,
        walkCounts: { south: 4, north: 4, east: 4, west: 4 }
    });
    assert.equal(enemies.normal.hand_ninja.visual.attack, undefined);
});
