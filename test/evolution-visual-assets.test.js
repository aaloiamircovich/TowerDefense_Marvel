import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIRECTIONS } from '../src/rendering/SpriteAnimator.js';
import { EVOLUTION_CATALOG } from '../src/systems/EvolutionSystem.js';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const evolutionVisuals = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data/evolutionVisuals.json'), 'utf8').replace(/^\uFEFF/, ''));

const EXPECTED_VISUAL_IDS = [
    'adam_warlock_gauntlet',
    'angela_evolution',
    'captain_marvel_evolution',
    'capitan_america_mjolnir',
    'cyclops_evolution',
    'magik_evolution',
    'dark_phoenix',
    'dark_surfer',
    'doctor_strange_dios_magia',
    'emma_frost_evolution',
    'ghost_rider_evolution',
    'venom_jeff',
    'groot_evolution',
    'king_in_black_venom',
    'thor_evolution',
    'loki_evolution',
    'star_lord_evolution',
    'hawkeye_evolution',
    'iron_man_extremis',
    'mister_fantastic_evolution',
    'the_void',
    'hulk_evolution',
    'spiderman_black_suit'
];

test('sprites de evoluciones importados tienen contratos completos', () => {
    assert.deepEqual(Object.keys(evolutionVisuals).sort(), [...EXPECTED_VISUAL_IDS].sort());

    for (const id of EXPECTED_VISUAL_IDS) {
        const contract = evolutionVisuals[id];
        assert.ok(contract, `${id} debe existir`);
        assert.ok(contract.heroId, `${id} debe declarar heroId`);
        assert.equal(contract.visual?.size, 96, `${id} usa tamano visual 96`);
        assert.equal(contract.visual?.defaultDirection, 'south', `${id} mira al sur por defecto`);
        assert.ok(fs.existsSync(path.join(projectRoot, contract.sprite)), `${id} sprite principal no existe`);
        for (const direction of DIRECTIONS) {
            const source = contract.visual?.idle?.[direction];
            assert.ok(source, `${id} falta idle ${direction}`);
            assert.ok(fs.existsSync(path.join(projectRoot, source)), `${id} idle ${direction} no existe`);
        }
        for (const direction of ['south', 'north', 'east', 'west']) {
            const frames = contract.visual?.attack?.frames?.[direction] || [];
            assert.equal(frames.length, 9, `${id} ataque ${direction} debe tener 9 frames`);
            frames.forEach((source) => assert.ok(fs.existsSync(path.join(projectRoot, source)), `${id} ataque no existe: ${source}`));
        }
    }
});

test('cada contrato visual de evolucion corresponde al catalogo o a una transformacion', () => {
    const validIds = new Set(Object.keys(EVOLUTION_CATALOG));
    for (const evolution of Object.values(EVOLUTION_CATALOG)) {
        for (const transform of evolution.itemTransforms || []) validIds.add(transform.id);
    }

    for (const id of EXPECTED_VISUAL_IDS) {
        assert.equal(validIds.has(id), true, `${id} debe existir como evolucion o transformacion`);
    }
});
