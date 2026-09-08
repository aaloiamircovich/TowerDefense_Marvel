import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildBossMilestoneState,
    buildCounterCoverageModel,
    buildRosterWaveFitView,
    buildStealthCoverageState,
    buildWaveDamageCheckMeter,
    buildWavePreparationPlan,
    buildWavePrepActionControl
} from '../src/ui/WaveTacticsState.js';

function deployedHero(overrides = {}) {
    return {
        id: overrides.id || 'hero',
        name: overrides.name || 'Heroe',
        level: overrides.level || 1,
        damage: overrides.damage || 20,
        fireRate: overrides.fireRate || 1,
        range: overrides.range || 120,
        config: { ...overrides }
    };
}

test('WaveTacticsState mide cobertura lista disponible y faltante', () => {
    const model = buildCounterCoverageModel(
        {
            stealthCount: 1,
            armoredCount: 1,
            barrierCount: 0,
            fastest: 96,
            roles: ['stealth', 'tank', 'runner'],
            maxThreat: 4
        },
        [
            { id: 'spiderman', name: 'Spider-Man', canSeeStealth: true, damage: 16, fireRate: 2, range: 130, teamMetrics: { detection: 5, control: 4 } }
        ],
        [
            deployedHero({ id: 'iron_man', name: 'Iron Man', level: 2, damage: 58, fireRate: 1.4, range: 180 })
        ]
    );

    assert.equal(model.label, 'Cobertura tactica');
    assert.equal(model.covered, 1);
    assert.deepEqual(model.entries.map((entry) => [entry.id, entry.tone]), [
        ['detection', 'warning'],
        ['piercing', 'ready'],
        ['control', 'warning']
    ]);
    assert.match(model.entries[0].detail, /Spider-Man/);
});

test('WaveTacticsState resume mini boss y final boss con condicion fatal', () => {
    const mini = buildBossMilestoneState([
        { id: 'ultron_prime', name: 'Ultron Prime', isBoss: true, hp: 15400, armor: 0.34, speed: 38, reward: 2000, phases: [{ name: 'Drones' }], threat: 5 }
    ], 25, {
        hasBoss: true,
        bossMilestone: {
            wave: 25,
            bossName: 'Ultron Prime',
            label: 'Mini boss 1/3',
            warning: 'Si el boss llega a la base, pierdes la run.',
            hp: 15400,
            armor: 0.34,
            speed: 38,
            reward: 2000,
            phaseCount: 1,
            threat: 5
        }
    });
    const final = buildBossMilestoneState([
        { id: 'thanos_final', name: 'Thanos', isBoss: true, isFinalBoss: true, hp: 900000, armor: 0.55, speed: 25, immuneToStun: true }
    ], 100, null);

    assert.equal(mini.title, 'Mini boss 1/3');
    assert.equal(mini.tone, 'mini');
    assert.ok(mini.counters.includes('Perforacion'));
    assert.equal(final.tone, 'final');
    assert.equal(final.isFinalBoss, true);
    assert.match(final.warning, /pierdes/);
});

test('WaveTacticsState recomienda acciones tacticas antes de oleadas criticas', () => {
    const detectionPlan = buildWavePreparationPlan(
        {
            stealthCount: 3,
            armoredCount: 0,
            barrierCount: 0,
            fastest: 92,
            roles: ['stealth'],
            pressureScore: 18,
            threatTier: { id: 'high' },
            readiness: { id: 'underbuilt' }
        },
        [
            { id: 'spiderman', name: 'Spider-Man', cost: 150, canSeeStealth: true, damage: 16, fireRate: 2, range: 130, teamMetrics: { detection: 5 } }
        ],
        [],
        180
    );
    const upgradePlan = buildWavePreparationPlan(
        {
            stealthCount: 0,
            armoredCount: 2,
            barrierCount: 1,
            hasBoss: true,
            fastest: 72,
            roles: ['tank'],
            pressureScore: 24,
            threatTier: { id: 'critical' },
            readiness: { id: 'thin' }
        },
        [],
        [deployedHero({ id: 'iron_man', name: 'Iron Man', level: 2, damage: 48, fireRate: 1.4, range: 170 })],
        260,
        (level) => level * 120
    );

    assert.equal(detectionPlan[0].type, 'deploy');
    assert.equal(detectionPlan[0].heroId, 'spiderman');
    assert.equal(upgradePlan[0].type, 'upgrade');
    assert.equal(upgradePlan[0].cost, 240);
});

test('WaveTacticsState recomienda deteccion contra faseadores aunque no haya contador de sigilo', () => {
    const plan = buildWavePreparationPlan(
        {
            stealthCount: 0,
            armoredCount: 0,
            barrierCount: 0,
            fastest: 74,
            roles: ['phaser'],
            pressureScore: 18,
            threatTier: { id: 'high' },
            readiness: { id: 'thin' }
        },
        [
            { id: 'daredevil', name: 'Daredevil', cost: 150, damage: 26, fireRate: 1.8, range: 145, teamMetrics: { detection: 4 } }
        ],
        [],
        150
    );

    assert.equal(plan[0].type, 'deploy');
    assert.equal(plan[0].heroId, 'daredevil');
    assert.match(plan[0].reason, /fase/);
});

test('WaveTacticsState nombra faseadores en cobertura de deteccion', () => {
    const coverage = buildStealthCoverageState(
        { stealthCount: 0, roles: ['phaser'] },
        [{ id: 'daredevil', name: 'Daredevil', teamMetrics: { detection: 4 } }],
        [],
        0
    );
    const mixed = buildStealthCoverageState(
        { stealthCount: 2, roles: ['stealth', 'phaser'] },
        [],
        [{ id: 'spiderman', name: 'Spider-Man', canSeeStealth: true }],
        0
    );

    assert.equal(coverage.label, 'Fase sin desplegar');
    assert.match(coverage.detail, /Daredevil/);
    assert.equal(mixed.label, 'Sigilo/fase cubierto');
});

test('WaveTacticsState arma medidor controles clickeables y vista de ajuste', () => {
    const meter = buildWaveDamageCheckMeter({ expectedDamage: 3600, requiredDamage: 2400 });
    const deficit = buildWaveDamageCheckMeter({ expectedDamage: 1800, requiredDamage: 2400 });
    const deploy = buildWavePrepActionControl({ type: 'deploy', heroId: 'iron_man', label: 'Colocar Iron Man', reason: 'DPS', cost: 0 });
    const fit = buildRosterWaveFitView({
        id: 'prime',
        label: 'Counter ideal',
        score: 8.4,
        reasons: ['detecta sigilo', 'frena corredores']
    });

    assert.equal(meter.ratioPct, 150);
    assert.equal(meter.fillPct, 100);
    assert.equal(meter.gap, 1200);
    assert.equal(meter.gapTone, 'surplus');
    assert.equal(meter.gapLabel, 'Margen +1.2k');
    assert.equal(deficit.gapTone, 'deficit');
    assert.equal(deficit.gapLabel, 'Faltan 600');
    assert.equal(deploy.actionable, true);
    assert.equal(deploy.tag, 'button');
    assert.equal(fit.scoreLabel, '8 pts');
    assert.equal(buildRosterWaveFitView({ id: 'neutral', score: 0 }), null);
});
