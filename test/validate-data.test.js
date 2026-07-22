import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildBootstrapSource, DATA_KEYS } from '../scripts/lib/project-data.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const validator = path.join(root, 'scripts', 'validate-data.js');

test('validate-data acepta el contrato de datos actual', () => {
    const workspace = createDataWorkspace();
    const result = runValidator(workspace);

    assert.equal(result.status, 0, result.stderr);
});

test('validate-data bloquea evoluciones parciales del roster', () => {
    const workspace = createDataWorkspace((data) => {
        data.heroes.iron_man.evolutionId = 'iron_man_extremis';
    });
    const result = runValidator(workspace);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /evolutionId debe activarse para todo el roster/);
});

test('validate-data bloquea campos no declarados en heroes', () => {
    const workspace = createDataWorkspace((data) => {
        data.heroes.iron_man.campoInventado = true;
    });
    const result = runValidator(workspace);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /heroes\.iron_man\.campoInventado no esta permitido/);
});

test('validate-data bloquea rarezas invalidas en objetos', () => {
    const workspace = createDataWorkspace((data) => {
        data.items.reactor_arc.rarity = 'Celestial';
    });
    const result = runValidator(workspace);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /items\.reactor_arc\.rarity debe ser Common, Rare, Epic, Legendary, Mythic o Secret/);
});

test('validate-data bloquea campos no declarados en estructuras internas de niveles', () => {
    const workspace = createDataWorkspace((data) => {
        data.levels[0].theme.paletteSecret = ['#fff'];
        data.levels[0].mission.mechanic.experimentalHook = true;
        data.levels[0].mission.objectives[0].hiddenMultiplier = 2;
    });
    const result = runValidator(workspace);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /levels\.level_1\.theme\.paletteSecret no esta permitido/);
    assert.match(result.stderr, /levels\.level_1\.mission\.mechanic\.experimentalHook no esta permitido/);
    assert.match(result.stderr, /levels\.level_1\.mission\.objectives\.avengers_base_systems\.hiddenMultiplier no esta permitido/);
});

test('validate-data bloquea campos y valores invalidos en especiales de heroes', () => {
    const workspace = createDataWorkspace((data) => {
        data.heroes.loki.special.statModifiers.trucoSecreto = 0.2;
        data.heroes.loki.special.statModifiers.cooldown = 1.4;
        data.heroes.loki.special.attackEffects[0].type = 'freeze';
        data.heroes.loki.special.attackEffects[0].chance = 2;
        data.heroes.loki.special.projectileProfile = { chainCount: 1.5, splashFactor: 1.2 };
        data.heroes.loki.special.visualStyle = 'unknown';
        data.heroes.loki.special.projectileColor = 'green';
    });
    const result = runValidator(workspace);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /heroes\.loki\.special\.statModifiers\.trucoSecreto no esta permitido/);
    assert.match(result.stderr, /heroes\.loki\.special\.statModifiers\.cooldown debe estar entre 0 y 1/);
    assert.match(result.stderr, /heroes\.loki\.special\.attackEffects\.0\.type no es valido/);
    assert.match(result.stderr, /heroes\.loki\.special\.attackEffects\.0\.chance debe estar entre 0 y 1/);
    assert.match(result.stderr, /heroes\.loki\.special\.projectileProfile\.chainCount debe ser un entero no negativo/);
    assert.match(result.stderr, /heroes\.loki\.special\.projectileProfile\.splashFactor debe estar entre 0 y 1/);
    assert.match(result.stderr, /heroes\.loki\.special\.visualStyle no es valido/);
    assert.match(result.stderr, /heroes\.loki\.special\.projectileColor debe ser color hex/);
});

function createDataWorkspace(mutator = null) {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'marvel-td-data-'));
    const dataDir = path.join(workspace, 'data');
    fs.mkdirSync(dataDir);
    const data = Object.fromEntries(DATA_KEYS.map((key) => [
        key,
        JSON.parse(fs.readFileSync(path.join(root, 'data', `${key}.json`), 'utf8'))
    ]));
    mutator?.(data);
    DATA_KEYS.forEach((key) => {
        fs.writeFileSync(path.join(dataDir, `${key}.json`), `${JSON.stringify(data[key], null, 2)}\n`, 'utf8');
    });
    fs.copyFileSync(path.join(root, 'data', 'sprite-atlas.js'), path.join(dataDir, 'sprite-atlas.js'));
    fs.writeFileSync(path.join(dataDir, 'bootstrapData.js'), buildBootstrapSource(data), 'utf8');
    return workspace;
}

function runValidator(workspace) {
    return spawnSync(process.execPath, [validator], {
        cwd: workspace,
        encoding: 'utf8'
    });
}
