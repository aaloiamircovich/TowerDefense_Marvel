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

    if (expected.attackCount !== undefined) {
        const frames = enemy.visual?.attack?.frames || [];
        assert.equal(frames.length, expected.attackCount, `${enemy.id} ataque debe tener ${expected.attackCount} frames`);
        frames.forEach((source) => assert.ok(fs.existsSync(path.join(projectRoot, source)), `${enemy.id} ataque no existe: ${source}`));
    }
}

test('enemigos importados desde carpeta heroes usan sprites configurados', () => {
    for (const id of ['aim_scientist', 'black_order_hunter', 'dark_elf', 'frost_giant_scout', 'chitauri_warrior', 'skrull_infiltrator', 'hand_ninja', 'raft_escapee', 'sakaaran_soldier']) {
        assertEnemyVisual(enemies.normal[id], {
            size: 96,
            walkCounts: { south: 4, north: 4, east: 4, west: 4 },
            attackCount: 0
        });
    }
    assertEnemyVisual(enemies.normal.symbiote_spawn, {
        size: 96,
        walkCounts: { south: 4, north: 4, east: 4, west: 4 },
        attackCount: 9
    });
});

test('Loki, Magneto y Hela usan sprites de villano configurados', () => {
    assertEnemyVisual(enemies.bosses.loki, {
        size: 96,
        walkCounts: { south: 4, north: 4, east: 4, west: 4 },
        attackCount: 0
    });
    for (const id of ['magneto', 'hela', 'thanos_final']) {
        assertEnemyVisual(enemies.bosses[id], {
            size: 96,
            walkCounts: { south: 4, north: 4, east: 4, west: 4 },
            attackCount: 9
        });
    }
    for (const id of ['kang', 'ultron_prime']) {
        assertEnemyVisual(enemies.bosses[id], {
            size: 96,
            walkCounts: { south: 9, north: 9, east: 9, west: 9 },
            attackCount: 9
        });
    }
});
