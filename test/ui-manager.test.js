import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBossHudState, buildCombatPressureState, buildEnemyIntel, buildLeakIntel, buildOnboardingCoachState, buildPressureActionState, buildRosterWaveFitView, buildShopItemInsight, buildShopSetProgress, buildSpawnQueueState, buildStatusLegendModel, buildStealthCoverageState, buildTacticalContributionModel, buildTargetingControlState, buildWaveLaunchState, buildWavePrepActionControl, buildWavePreparationPlan, buildWaveReportActionState, buildWaveReportGrade, buildWaveReportLesson, buildWaveReportState, evaluateHeroWaveFit, getNextTargetingPriority, UIManager } from '../src/systems/UIManager.js';

test('buildWaveLaunchState muestra riesgo critico en el CTA', () => {
    const state = buildWaveLaunchState(true, {
        pressureScore: 29,
        threatTier: { id: 'critical', label: 'Amenaza critica', advice: 'Invierte antes de iniciar.' }
    });

    assert.equal(state.tier, 'critical');
    assert.equal(state.primary, 'INICIAR CON RIESGO');
    assert.equal(state.secondary, 'Amenaza critica · 29');
    assert.match(state.ariaLabel, /Puntaje 29/);
    assert.equal(state.tooltip, 'Invierte antes de iniciar.');
});

test('buildWaveLaunchState diferencia amenaza alta de una oleada normal', () => {
    const high = buildWaveLaunchState(true, {
        pressureScore: 20,
        threatTier: { id: 'high', label: 'Amenaza alta', advice: 'Refuerza dano o control.' }
    });
    const low = buildWaveLaunchState(true, null);

    assert.equal(high.primary, 'INICIAR ALERTA');
    assert.equal(low.primary, 'INICIAR OLEADA');
    assert.equal(low.secondary, 'Amenaza baja · 0');
});

test('buildWaveLaunchState anticipa bonus por oleada perfecta', () => {
    const state = buildWaveLaunchState(true, {
        pressureScore: 14,
        perfectBonus: 30,
        threatTier: { id: 'guarded', label: 'Amenaza media', advice: 'Cubre salida.' }
    });

    assert.equal(state.secondary, 'Amenaza media | 14 | Perfecta +$30');
    assert.match(state.ariaLabel, /Bonus perfecto 30/);
});

test('buildWaveLaunchState bloquea lectura cuando la oleada esta activa', () => {
    const state = buildWaveLaunchState(false, {
        pressureScore: 99,
        threatTier: { id: 'critical', label: 'Amenaza critica', advice: 'No importa durante oleada.' }
    });

    assert.equal(state.tier, 'active');
    assert.equal(state.primary, 'OLEADA EN CURSO');
    assert.equal(state.secondary, 'Defensa activa');
});

test('buildOnboardingCoachState guia segun el estado tactico actual', () => {
    const noTeam = buildOnboardingCoachState({ activeTeamCount: 0 }, { tutorialHints: true });
    const placing = buildOnboardingCoachState({ activeTeamCount: 1, placingHero: true, hasSuggestion: true }, { tutorialHints: true });
    const report = buildOnboardingCoachState({ activeTeamCount: 1, deployedCount: 1, currentWave: 2, hasReport: true }, { tutorialHints: true });
    const disabled = buildOnboardingCoachState({ activeTeamCount: 1 }, { tutorialHints: false });

    assert.equal(noTeam.id, 'squad');
    assert.equal(placing.id, 'suggestion');
    assert.equal(placing.progressLabel, '3/5');
    assert.equal(report.id, 'report');
    assert.equal(disabled, null);
});

test('getNextTargetingPriority cicla prioridades tacticas del roster', () => {
    assert.equal(getNextTargetingPriority('Primero'), 'Último');
    assert.equal(getNextTargetingPriority('Jefe'), 'Primero');
    assert.equal(getNextTargetingPriority('Sigilo', -1), 'Rápido');
    assert.equal(getNextTargetingPriority('Desconocido'), 'Último');
});

test('buildTargetingControlState resume el modo actual y el siguiente click', () => {
    const state = buildTargetingControlState('Rápido');

    assert.equal(state.priority, 'Rápido');
    assert.equal(state.next, 'Sigilo');
    assert.equal(state.label, 'Rap');
    assert.match(state.tooltip, /corredores/);
    assert.match(state.ariaLabel, /Sigilo/);
});

test('buildEnemyIntel resume sigilo y recomienda deteccion', () => {
    const intel = buildEnemyIntel({ name: 'Ninja de La Mano', archetype: 'stealth', stealth: true, threat: 3, speed: 90 });

    assert.equal(intel.roleLabel, 'Sigilo');
    assert.equal(intel.counter, 'Deteccion');
    assert.equal(intel.danger, 'guarded');
    assert.ok(intel.traits.includes('Sigilo'));
    assert.ok(intel.traits.includes('Rapido'));
});

test('buildEnemyIntel prioriza perforacion ante blindaje y barreras', () => {
    const intel = buildEnemyIntel({ name: 'Centinela', archetype: 'tank', armor: 0.6, barrierRatio: 0.2, threat: 5 });

    assert.equal(intel.counter, 'Perforacion');
    assert.equal(intel.danger, 'critical');
    assert.ok(intel.traits.includes('Blindaje'));
    assert.ok(intel.traits.includes('Barrera'));
});

test('buildEnemyIntel distingue soporte e invocador', () => {
    const support = buildEnemyIntel({ name: 'Cientifico A.I.M.', archetype: 'support', healPower: 0.06, threat: 2 });
    const summoner = buildEnemyIntel({ name: 'Doombot', archetype: 'summoner', summonId: 'ultron_drone', threat: 4 });

    assert.equal(support.counter, 'Foco al soporte');
    assert.ok(support.traits.includes('Cura'));
    assert.equal(summoner.counter, 'Corta invocador');
    assert.equal(summoner.danger, 'high');
});

test('buildStatusLegendModel prioriza counters de la oleada', () => {
    const model = buildStatusLegendModel({
        stealthCount: 2,
        armoredCount: 1,
        barrierCount: 1,
        fastest: 98,
        roles: ['stealth', 'runner', 'tank'],
        maxThreat: 4
    });

    assert.deepEqual(model.entries.map((entry) => entry.id), ['detection', 'piercing', 'control']);
    assert.equal(model.label, 'Counters clave');
});

test('buildStealthCoverageState distingue detector desplegado, banco y faltante', () => {
    const summary = { stealthCount: 2, roles: ['stealth'] };
    const detector = { id: 'black_widow', name: 'Black Widow', cost: 180, canSeeStealth: true };
    const deployed = buildStealthCoverageState(summary, [detector], [{ ...detector, cost: 180 }], 0);
    const available = buildStealthCoverageState(summary, [detector], [], 0);
    const missing = buildStealthCoverageState(summary, [{ id: 'hulk', name: 'Hulk', cost: 220 }], [], 300);

    assert.equal(deployed.tone, 'ready');
    assert.match(deployed.detail, /Black Widow/);
    assert.equal(available.tone, 'warning');
    assert.equal(available.heroId, 'black_widow');
    assert.equal(missing.tone, 'danger');
    assert.match(missing.detail, /No hay detector/);
});

test('buildLeakIntel resume enemigo filtrado y counter recomendado', () => {
    const intel = buildLeakIntel([
        { name: 'Ninja de La Mano', counter: 'Deteccion', lifeLoss: 1, segmentPct: 98, traits: ['Sigilo'] }
    ]);

    assert.equal(intel.label, 'Lectura de fugas');
    assert.equal(intel.items[0].name, 'Ninja de La Mano');
    assert.equal(intel.items[0].counter, 'Deteccion');
    assert.match(intel.items[0].detail, /98% ruta/);
});

test('buildRosterWaveFitView expone score y razones visibles', () => {
    const view = buildRosterWaveFitView({
        id: 'prime',
        label: 'Counter ideal',
        score: 8.4,
        reasons: ['detecta sigilo', 'frena corredores']
    });

    assert.equal(view.id, 'prime');
    assert.equal(view.scoreLabel, '8 pts');
    assert.equal(view.reasonText, 'detecta sigilo + frena corredores');
    assert.match(view.ariaLabel, /Puntaje 8/);
});

test('buildRosterWaveFitView oculta perfiles neutros', () => {
    assert.equal(buildRosterWaveFitView({ id: 'neutral', score: 0 }), null);
});

test('buildShopItemInsight conecta deteccion y blindaje con la oleada', () => {
    const stealth = buildShopItemInsight({ set: 'stark', tier: 1, effects: { detectStealth: true } }, { stealthCount: 2, roles: ['stealth'] });
    const armor = buildShopItemInsight({ set: 'shield', tier: 2, effects: { armorPenetration: 0.2 } }, { armoredCount: 3, barrierCount: 1, roles: ['tank'] });

    assert.equal(stealth.label, 'cubre sigilo');
    assert.equal(stealth.tone, 'counter');
    assert.equal(armor.label, 'rompe blindaje');
    assert.equal(armor.tone, 'counter');
});

test('buildShopItemInsight reconoce control, grupos y fallback de set', () => {
    const control = buildShopItemInsight({ set: 'pym', tier: 1, effects: { slowChance: 0.3, splashRadius: 40 } }, { fastest: 96, total: 10, roles: ['runner'] });
    const utility = buildShopItemInsight({ set: 'mystic', tier: 1, effects: { allowWater: true } }, null);

    assert.deepEqual(control.reasons.slice(0, 2), ['frena corredores', 'limpia grupos']);
    assert.equal(control.tone, 'counter');
    assert.equal(utility.label, 'abre posiciones');
    assert.equal(utility.tone, 'utility');
});

test('buildShopSetProgress queda desactivado con objeto unico', () => {
    const itemDatabase = {
        reactor_arc: { id: 'reactor_arc', set: 'stark' },
        lentes_edith: { id: 'lentes_edith', set: 'stark' }
    };
    const progress = buildShopSetProgress(
        { id: 'lentes_edith', name: 'LENTES E.D.I.T.H.', set: 'stark' },
        ['reactor_arc'],
        {},
        itemDatabase
    );

    assert.equal(progress, null);
});

test('evaluateHeroWaveFit recomienda deteccion contra sigilo', () => {
    const fit = evaluateHeroWaveFit({
        id: 'spiderman',
        name: 'Spider-Man',
        cost: 150,
        damage: 15,
        fireRate: 2.2,
        range: 110,
        canSeeStealth: true,
        teamMetrics: { control: 4 }
    }, {
        stealthCount: 3,
        fastest: 92,
        roles: ['stealth'],
        pressureScore: 14
    }, 180);

    assert.equal(fit.id, 'good');
    assert.match(fit.reasons.join(' '), /detecta sigilo/);
});

test('evaluateHeroWaveFit detecta antiarmadura y DPS de jefe', () => {
    const fit = evaluateHeroWaveFit({
        id: 'iron_man',
        cost: 250,
        damage: 30,
        fireRate: 1.5,
        range: 165,
        abilityDesc: 'Laser ARC atraviesa armadura.'
    }, {
        armoredCount: 4,
        barrierCount: 1,
        hasBoss: true,
        fastest: 80,
        roles: ['tank'],
        pressureScore: 22
    }, 100);

    assert.equal(fit.id, 'prime');
    assert.match(fit.reasons.join(' '), /rompe armadura/);
    assert.match(fit.reasons.join(' '), /DPS de jefe/);
});

test('evaluateHeroWaveFit deja neutral a un heroe sin respuesta clara', () => {
    const fit = evaluateHeroWaveFit({
        id: 'rookie',
        cost: 90,
        damage: 8,
        fireRate: 1,
        range: 90,
        teamMetrics: { control: 0, detection: 0 }
    }, {
        stealthCount: 0,
        armoredCount: 0,
        fastest: 70,
        roles: ['soldier'],
        pressureScore: 6
    }, 200);

    assert.equal(fit.id, 'neutral');
});

test('buildWavePreparationPlan recomienda desplegar deteccion contra sigilo', () => {
    const plan = buildWavePreparationPlan(
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
            { id: 'spiderman', name: 'Spider-Man', cost: 150, canSeeStealth: true, damage: 16, fireRate: 2, range: 130, teamMetrics: { detection: 5 } },
            { id: 'hulk', name: 'Hulk', cost: 260, damage: 40, fireRate: 0.8, range: 90 }
        ],
        [],
        180
    );

    assert.equal(plan[0].type, 'deploy');
    assert.equal(plan[0].heroId, 'spiderman');
    assert.match(plan[0].reason, /deteccion/);
});

test('buildWavePreparationPlan recomienda mejorar defensa desplegada en riesgo', () => {
    const plan = buildWavePreparationPlan(
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

    assert.equal(plan[0].type, 'upgrade');
    assert.equal(plan[0].heroId, 'iron_man');
    assert.equal(plan[0].cost, 240);
});

test('buildWavePreparationPlan recomienda desplegar aunque no sobren creditos', () => {
    const plan = buildWavePreparationPlan(
        {
            stealthCount: 0,
            armoredCount: 0,
            barrierCount: 0,
            fastest: 70,
            roles: ['soldier'],
            pressureScore: 16,
            threatTier: { id: 'guarded' },
            readiness: { id: 'underbuilt' }
        },
        [{ id: 'thor', name: 'Thor', cost: 300, damage: 44, fireRate: 1, range: 160 }],
        [],
        120
    );

    assert.equal(plan[0].type, 'deploy');
    assert.equal(plan[0].label, 'Colocar Thor');
    assert.equal(plan[0].cost, 0);
});

test('buildWavePrepActionControl vuelve clickeables despliegue y mejora', () => {
    const deploy = buildWavePrepActionControl({ type: 'deploy', heroId: 'iron_man', label: 'Colocar Iron Man', reason: 'DPS', cost: 0 });
    const upgrade = buildWavePrepActionControl({ type: 'upgrade', heroId: 'spiderman', label: 'Mejorar Spider-Man' });

    assert.equal(deploy.actionable, true);
    assert.equal(deploy.tag, 'button');
    assert.match(deploy.ariaLabel, /Preparar colocacion/);
    assert.doesNotMatch(deploy.title, /\$250/);
    assert.equal(upgrade.actionable, true);
    assert.match(upgrade.ariaLabel, /Mejorar ahora/);
});

test('buildWavePrepActionControl deja ahorro como nota informativa', () => {
    const control = buildWavePrepActionControl({ type: 'save', label: 'Faltan $80' });

    assert.equal(control.actionable, false);
    assert.equal(control.tag, 'div');
    assert.equal(control.ariaLabel, 'Faltan $80');
});

test('buildCombatPressureState oculta presion cuando no hay oleada activa', () => {
    const state = buildCombatPressureState([
        enemy({ name: 'Hydra', distanceTravelled: 180 })
    ], path(), false);

    assert.equal(state.id, 'clear');
    assert.equal(state.progress, 0);
    assert.equal(state.activeCount, 1);
});

test('buildCombatPressureState vigila un frente a mitad de ruta', () => {
    const state = buildCombatPressureState([
        enemy({ name: 'A.I.M.', distanceTravelled: 220 }),
        enemy({ name: 'Hydra', distanceTravelled: 80 })
    ], path(), true);

    assert.equal(state.id, 'watch');
    assert.equal(state.leadEnemyName, 'A.I.M.');
    assert.equal(state.progress, 55);
    assert.equal(state.dangerCount, 0);
});

test('buildCombatPressureState marca fuga inminente cerca de salida', () => {
    const state = buildCombatPressureState([
        enemy({ name: 'Runner', distanceTravelled: 372, uid: 'lead' }),
        enemy({ name: 'Soldier', distanceTravelled: 330, uid: 'tail' })
    ], path(), true);

    assert.equal(state.id, 'critical');
    assert.equal(state.leadEnemyName, 'Runner');
    assert.equal(state.dangerCount, 2);
    assert.match(state.advice, /Pausa/);
});

test('buildBossHudState oculta panel sin jefe activo', () => {
    assert.equal(buildBossHudState([], true), null);
    assert.equal(buildBossHudState([{ isBoss: true, isAlive: true, hp: 100, maxHp: 100 }], false), null);
});

test('buildBossHudState resume jefe activo y estado critico', () => {
    const state = buildBossHudState([
        { name: 'Loki', isBoss: true, isAlive: true, hp: 240, maxHp: 1000, currentPhase: 'Ilusiones', threat: 5 }
    ], true);

    assert.equal(state.name, 'Loki');
    assert.equal(state.phase, 'Ilusiones');
    assert.equal(state.hpPct, 24);
    assert.equal(state.critical, true);
});

test('buildBossHudState e intel distinguen al jefe final', () => {
    const boss = { name: 'Thanos', isBoss: true, isFinalBoss: true, isAlive: true, hp: 900, maxHp: 1000, threat: 5 };
    const state = buildBossHudState([boss], true);
    const intel = buildEnemyIntel(boss);

    assert.equal(state.isFinalBoss, true);
    assert.equal(state.critical, false);
    assert.ok(intel.traits.includes('Jefe final'));
});

test('buildSpawnQueueState oculta refuerzos sin cola activa', () => {
    assert.equal(buildSpawnQueueState([], 0, true), null);
    assert.equal(buildSpawnQueueState([{ config: { name: 'Hydra' }, delay: 1 }], 0, false), null);
});

test('buildSpawnQueueState resume proximo refuerzo con ETA y peligro', () => {
    const state = buildSpawnQueueState([
        { config: { name: 'Centinela', threat: 5 }, delay: 1.6 },
        { config: { name: 'Hydra', threat: 2 }, delay: 0.8 }
    ], 0.4, true);

    assert.equal(state.name, 'Centinela');
    assert.equal(state.eta, 1.2);
    assert.equal(state.remaining, 2);
    assert.equal(state.danger, 'critical');
});

test('buildPressureActionState recomienda mejorar el mejor heroe asequible', () => {
    const action = buildPressureActionState(
        { id: 'critical' },
        [
            deployedHero({ id: 'spiderman', name: 'Spider-Man', level: 1, damage: 16, fireRate: 2, range: 120, control: 4 }),
            deployedHero({ id: 'iron_man', name: 'Iron Man', level: 1, damage: 30, fireRate: 1.5, range: 165 })
        ],
        140,
        (level) => level * 120
    );

    assert.equal(action.type, 'upgrade');
    assert.equal(action.heroId, 'iron_man');
    assert.equal(action.cost, 120);
    assert.match(action.label, /Iron Man/);
});

test('buildPressureActionState avisa cuanto falta si no alcanza para mejorar', () => {
    const action = buildPressureActionState(
        { id: 'warning' },
        [deployedHero({ id: 'spiderman', name: 'Spider-Man', level: 2, damage: 16, fireRate: 2, range: 120 })],
        150,
        (level) => level * 120
    );

    assert.equal(action.type, 'hint');
    assert.equal(action.label, 'Faltan $90');
});

test('buildPressureActionState pide despliegue si no hay heroes', () => {
    const action = buildPressureActionState({ id: 'watch' }, [], 650);

    assert.equal(action.type, 'hint');
    assert.equal(action.label, 'Sin heroes desplegados');
});

test('UIManager mantiene oculto el panel lateral de presion de ruta', () => {
    const container = {
        innerHTML: '<button>Mejorar Iron Man $360</button>',
        classList: {
            values: new Set(),
            add(value) { this.values.add(value); },
            contains(value) { return this.values.has(value); }
        }
    };
    const previousDocument = globalThis.document;
    globalThis.document = { getElementById: (id) => (id === 'combat-pressure' ? container : null) };
    const ui = Object.create(UIManager.prototype);

    try {
        const state = ui.updateCombatPressure([
            { name: 'Soldado de Hydra', distanceTravelled: 200, isAlive: true, hasReachedEnd: false }
        ], path(), true);

        assert.equal(container.innerHTML, '');
        assert.equal(container.classList.contains('hidden'), true);
        assert.equal(state.id, 'watch');
    } finally {
        globalThis.document = previousDocument;
    }
});

test('buildWaveReportState resume una oleada limpia con consejo de ahorro', () => {
    const report = buildWaveReportState({
        wave: 4,
        leaks: 0,
        lives: 20,
        kills: 12,
        damage: 1840.7,
        credits: 332,
        cleanBonus: 42,
        bestHero: 'Iron Man',
        bestHeroKills: 7,
        bestHeroDamage: 990
    });

    assert.equal(report.tone, 'clean');
    assert.equal(report.label, 'Oleada asegurada');
    assert.equal(report.damage, 1841);
    assert.equal(report.cleanBonus, 42);
    assert.match(report.advice, /ahorrar/);
    assert.equal(report.grade.medal, 'S');
});

test('buildTacticalContributionModel resume aportes no basados en dano', () => {
    const model = buildTacticalContributionModel({
        controlSeconds: 4.4,
        armorBreaks: 2,
        marks: 1,
        detectionReveals: 1,
        livesSaved: 1,
        score: 430,
        heroes: [
            { id: 'luke_cage', name: 'Luke Cage', tacticalScore: 260, controlSeconds: 1, armorBreaks: 1, livesSaved: 1 }
        ]
    });

    assert.equal(model.active, true);
    assert.equal(model.score, 430);
    assert.deepEqual(model.metrics.map((metric) => metric.id), ['control', 'armor', 'marks', 'detect', 'saved']);
    assert.equal(model.heroes[0].name, 'Luke Cage');
    assert.match(model.heroes[0].detail, /vida/);
});

test('buildWaveReportState convierte fugas en recomendacion tactica', () => {
    const report = buildWaveReportState({
        wave: 2,
        leaks: 4,
        lives: 12,
        kills: 5,
        damage: 700
    });

    assert.equal(report.tone, 'breach');
    assert.equal(report.label, 'Brecha seria');
    assert.match(report.advice, /Refuerza la salida/);
    assert.equal(report.lesson.label, 'Prioridad: salida');
});

test('buildWaveReportState destaca maestria cuando no hubo fugas', () => {
    const report = buildWaveReportState({
        wave: 8,
        leaks: 0,
        kills: 18,
        damage: 2400,
        mastery: 2,
        bestHero: 'Spider-Man'
    });

    assert.equal(report.tone, 'mastery');
    assert.equal(report.label, 'Progreso heroico');
});

test('buildWaveReportLesson detecta dependencia excesiva del MVP', () => {
    const lesson = buildWaveReportLesson({
        leaks: 0,
        kills: 14,
        damage: 1000,
        bestHero: 'Iron Man',
        bestHeroDamage: 760
    });

    assert.equal(lesson.tone, 'focus');
    assert.match(lesson.label, /Iron Man/);
    assert.match(lesson.detail, /segundo carry/);
});

test('buildWaveReportLesson recomienda economia en oleadas estables repartidas', () => {
    const lesson = buildWaveReportLesson({
        leaks: 0,
        kills: 14,
        damage: 1800,
        bestHero: 'Spider-Man',
        bestHeroDamage: 600
    });

    assert.equal(lesson.tone, 'economy');
    assert.match(lesson.detail, /set/);
});

test('buildWaveReportGrade premia ejecucion limpia dominante', () => {
    const grade = buildWaveReportGrade({
        leaks: 0,
        kills: 18,
        damage: 2400,
        credits: 520,
        bestHeroDamage: 900
    });

    assert.equal(grade.medal, 'S');
    assert.equal(grade.tone, 'elite');
    assert.match(grade.detail, /Oleada limpia/);
});

test('buildWaveReportGrade degrada una brecha grave aunque haya bajas', () => {
    const grade = buildWaveReportGrade({
        leaks: 4,
        kills: 9,
        damage: 1500,
        credits: 180,
        bestHeroDamage: 900
    });

    assert.equal(grade.medal, 'D');
    assert.equal(grade.tone, 'critical');
    assert.match(grade.detail, /salida/);
});

test('buildWaveReportActionState recomienda mejorar al MVP si hay creditos', () => {
    const action = buildWaveReportActionState(
        { bestHeroId: 'iron_man', bestHero: 'Iron Man', leaks: 0 },
        [deployedHero({ id: 'iron_man', name: 'Iron Man', level: 2, damage: 48, fireRate: 1.3, range: 170 })],
        260,
        (level) => level * 120
    );

    assert.equal(action.type, 'upgrade');
    assert.equal(action.heroId, 'iron_man');
    assert.equal(action.cost, 240);
    assert.match(action.reason, /MVP/);
});

test('buildWaveReportActionState indica ahorro si falta para reforzar tras fugas', () => {
    const action = buildWaveReportActionState(
        { bestHeroId: 'spiderman', bestHero: 'Spider-Man', leaks: 2 },
        [deployedHero({ id: 'spiderman', name: 'Spider-Man', level: 2, damage: 20, fireRate: 2, range: 140 })],
        80,
        (level) => level * 120
    );

    assert.equal(action.type, 'saving');
    assert.equal(action.label, 'Faltan $160');
    assert.match(action.reason, /fuga/);
});

test('UIManager recalcula coste del panel con el nivel vivo tras mejora rapida', () => {
    const ui = createUpgradeUi(250);
    const hero = deployedHero({ id: 'iron_man', name: 'Iron Man', level: 2, damage: 48, fireRate: 1.3, range: 170 });
    const originalRange = hero.range;
    const originalFireRate = hero.fireRate;

    assert.equal(ui.quickUpgradeHero(hero), true);
    assert.equal(hero.level, 3);
    assert.ok(hero.damage > 48);
    assert.equal(hero.range, originalRange);
    assert.equal(hero.fireRate, originalFireRate);
    assert.equal(ui.game.resourceManager.credits, 0);

    ui.game.resourceManager.credits = 300;
    ui.processUpgrade(hero, 1);

    assert.equal(hero.level, 3);
    assert.equal(ui.game.resourceManager.credits, 300);
    assert.ok(ui.__calls.some((call) => call[0] === 'toast' && /insuficientes/i.test(call[1])));
});

test('UIManager mejora rapida no cobra ni sube nivel si faltan creditos', () => {
    const ui = createUpgradeUi(329);
    const hero = deployedHero({ id: 'spiderman', name: 'Spider-Man', level: 3, damage: 20, fireRate: 2, range: 140 });

    assert.equal(ui.quickUpgradeHero(hero), false);

    assert.equal(hero.level, 3);
    assert.equal(ui.game.resourceManager.credits, 329);
    assert.ok(ui.__calls.some((call) => call[0] === 'toast' && /insuficientes/i.test(call[1])));
});

test('UIManager mejora rapida usa creditos visibles si el estado interno quedo sin normalizar', () => {
    const ui = createUpgradeUi(undefined, '889');
    const hero = deployedHero({ id: 'iron_man', name: 'Iron Man', level: 3, damage: 60, fireRate: 1.3, range: 180 });

    assert.equal(ui.canAffordHeroUpgrade(hero, 1), true);
    assert.equal(ui.quickUpgradeHero(hero), true);

    assert.equal(hero.level, 4);
    assert.equal(ui.game.resourceManager.credits, 559);
});

test('UIManager mejora rapida reconoce creditos infinitos de admin', () => {
    const ui = createUpgradeUi(Number.POSITIVE_INFINITY, '∞');
    ui.game.resourceManager.removeCredits = () => true;
    const hero = deployedHero({ id: 'thor', name: 'Thor', level: 5, damage: 80, fireRate: 0.8, range: 180 });

    assert.equal(ui.canAffordHeroUpgrade(hero, 5), true);
    assert.equal(ui.quickUpgradeHero(hero), true);
    assert.equal(hero.level, 6);
});

function path() {
    return [{ x: 0, y: 0 }, { x: 400, y: 0 }];
}

function enemy(overrides = {}) {
    return {
        uid: overrides.uid || overrides.name || 'enemy',
        name: overrides.name || 'Enemigo',
        distanceTravelled: overrides.distanceTravelled || 0,
        isAlive: overrides.isAlive ?? true,
        hasReachedEnd: overrides.hasReachedEnd ?? false
    };
}

function deployedHero({ id, name, level = 1, damage, fireRate, range, control = 0 }) {
    return {
        id,
        name,
        level,
        damage,
        fireRate,
        range,
        config: { id, name, level, teamMetrics: { control } },
        getEffectiveStats: () => ({ damage, fireRate, range })
    };
}

function createUpgradeUi(credits, visibleCredits = '') {
    const calls = [];
    const ui = Object.create(UIManager.prototype);
    ui.__calls = calls;
    ui.overlay = { classList: { contains: () => true } };
    ui.creditsEl = { textContent: visibleCredits };
    ui.game = {
        activeTeam: [],
        inputManager: { setPlacementMode: () => {} },
        resourceManager: {
            credits,
            lives: 20,
            removeCredits(amount) {
                if (!Number.isFinite(this.credits) || this.credits < amount) return false;
                this.credits -= amount;
                return true;
            }
        },
        waveManager: { currentWave: 1, refreshWaveIntel: () => calls.push(['intel']) },
        fps: 60,
        stars: 0,
        replaySystem: { record: (...args) => calls.push(['replay', ...args]) }
    };
    ui.renderHeroRoster = () => calls.push(['roster']);
    ui.updateUI = (...args) => calls.push(['ui', ...args]);
    ui.showToast = (message, type) => calls.push(['toast', message, type]);
    ui.renderHeroDetails = (unit) => calls.push(['details', unit?.id]);
    return ui;
}
