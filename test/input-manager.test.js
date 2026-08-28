import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHeroCoverageState, buildPlacementSuggestionState, findBestPlacementCell, InputManager, measurePathCoverage } from '../src/core/InputManager.js';
import { TERRAIN } from '../src/utils/TerrainRules.js';

test('measurePathCoverage mide el tramo de camino dentro del rango', () => {
    const coverage = measurePathCoverage(
        { x: 150, y: 60 },
        100,
        [{ x: 0, y: 0 }, { x: 300, y: 0 }]
    );

    assert.equal(coverage.intervals.length, 1);
    assert.ok(Math.abs(coverage.coveredLength - 160) < 0.001);
    assert.equal(coverage.quality.id, 'excellent');
    assert.deepEqual(roundPoint(coverage.intervals[0].from), { x: 70, y: 0 });
    assert.deepEqual(roundPoint(coverage.intervals[0].to), { x: 230, y: 0 });
});

test('measurePathCoverage suma cobertura al doblar una esquina', () => {
    const coverage = measurePathCoverage(
        { x: 100, y: 100 },
        80,
        [{ x: 0, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 220 }]
    );

    assert.equal(coverage.intervals.length, 2);
    assert.ok(Math.abs(coverage.coveredLength - 160) < 0.001);
    assert.equal(coverage.quality.id, 'excellent');
});

test('measurePathCoverage informa cobertura minima si no alcanza la ruta', () => {
    const coverage = measurePathCoverage(
        { x: 200, y: 200 },
        50,
        [{ x: 0, y: 0 }, { x: 120, y: 0 }]
    );

    assert.equal(coverage.coveredLength, 0);
    assert.equal(coverage.intervals.length, 0);
    assert.equal(coverage.quality.id, 'minimal');
});

test('findBestPlacementCell recomienda una celda valida con cobertura de ruta', () => {
    const game = placementGame();
    const hero = { id: 'iron_man', name: 'Iron Man', range: 95, allowedTerrains: [1] };

    const suggestion = findBestPlacementCell(hero, game);

    assert.ok(suggestion);
    assert.equal(game.terrainMap[suggestion.y][suggestion.x], 1);
    assert.ok(suggestion.coverage.coveredLength > 0);
    assert.ok(suggestion.pathDistance <= hero.range);
});

test('buildPlacementSuggestionState explica terreno, cobertura y distancia', () => {
    const game = placementGame();
    const hero = { id: 'iron_man', name: 'Iron Man', range: 95, allowedTerrains: [1] };
    const suggestion = findBestPlacementCell(hero, game);
    const state = buildPlacementSuggestionState(suggestion, hero);

    assert.equal(state.heroId, 'iron_man');
    assert.match(state.label, /Celda/);
    assert.match(state.detail, /Cobertura/);
    assert.match(state.detail, /camino a/);
    assert.equal(state.actionLabel, 'Colocar aqui');
});

test('findBestPlacementCell evita una celda ocupada por otro heroe', () => {
    const game = placementGame();
    game.heroes.push({ x: 100, y: 60 });
    const hero = { id: 'spiderman', name: 'Spider-Man', range: 90, allowedTerrains: [1] };

    const suggestion = findBestPlacementCell(hero, game);

    assert.ok(suggestion);
    assert.notDeepEqual({ x: suggestion.centerX, y: suggestion.centerY }, { x: 100, y: 60 });
});

test('findBestPlacementCell respeta heroes solo de montana', () => {
    const game = terrainPlacementGame();
    const hero = { id: 'hawkeye', name: 'Hawkeye', range: 120, allowedTerrains: [TERRAIN.mountain] };

    const suggestion = findBestPlacementCell(hero, game);

    assert.ok(suggestion);
    assert.equal(game.terrainMap[suggestion.y][suggestion.x], TERRAIN.mountain);
    assert.notEqual(game.terrainMap[suggestion.y][suggestion.x], TERRAIN.blocked);
});

test('findBestPlacementCell respeta heroes solo de agua', () => {
    const game = terrainPlacementGame();
    const hero = { id: 'namor', name: 'Namor', range: 140, allowedTerrains: [TERRAIN.water] };

    const suggestion = findBestPlacementCell(hero, game);

    assert.ok(suggestion);
    assert.equal(game.terrainMap[suggestion.y][suggestion.x], TERRAIN.water);
});

test('buildHeroCoverageState resume cobertura real del heroe seleccionado', () => {
    const hero = { x: 100, y: 60, range: 100 };
    const state = buildHeroCoverageState(hero, [{ x: 0, y: 100 }, { x: 240, y: 100 }]);

    assert.equal(state.quality.id, 'excellent');
    assert.ok(state.coveredLength > 180);
    assert.match(state.label, /Cobertura excelente/);
});

test('InputManager dibuja rango solo para el heroe seleccionado', () => {
    const input = createInputForSelection();
    const hero = { id: 'iron_man', name: 'Iron Man', x: 100, y: 60, range: 100, getEffectiveStats: () => ({ range: 100 }) };
    const ctx = createCanvasContextSpy();

    input.game.heroes = [hero];
    input.game.selectedUnit = null;
    input.drawSelectedHero(ctx);
    assert.equal(ctx.calls.arc, 0);

    input.game.selectedUnit = hero;
    input.drawSelectedHero(ctx);
    assert.equal(ctx.calls.arc, 1);

    input.game.showHeroRanges = false;
    input.drawSelectedHero(ctx);
    assert.equal(ctx.calls.arc, 1);
});

test('InputManager limpia seleccion al hacer click en mapa vacio', () => {
    const input = createInputForSelection();
    const hero = { id: 'iron_man', name: 'Iron Man', x: 100, y: 60, range: 100 };
    input.game.heroes = [hero];
    input.game.selectedUnit = hero;

    input.checkUnitSelection(300, 300);

    assert.equal(input.game.selectedUnit, null);
});

test('InputManager enfoca enemigos con hover y limpia al salir del canvas', () => {
    const previousWindow = globalThis.window;
    const listeners = {};
    globalThis.window = { addEventListener: () => {} };
    const enemy = {
        uid: 'enemy-hover',
        name: 'Cientifico A.I.M.',
        x: 100,
        y: 120,
        size: 30,
        isAlive: true,
        hasReachedEnd: false,
        takeDamage: () => {},
        getVisualBounds: () => ({ left: 84, top: 104, right: 116, bottom: 136 })
    };
    const game = {
        selectedUnit: null,
        hoveredEnemy: null,
        hoveredEnemyUid: null,
        heroes: [],
        enemies: [enemy],
        progression: { state: { settings: { keyBindings: {} } } },
        tacticalActions: null
    };
    const statuses = [];
    const canvas = {
        width: 400,
        height: 300,
        style: {},
        addEventListener(type, handler) { listeners[type] = handler; },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 })
    };
    const ui = {
        setSelectionStatus: (message) => statuses.push(message),
        inspectUnit: () => {}
    };

    try {
        const input = new InputManager(canvas, game, ui, {});
        listeners.mousemove({ clientX: 100, clientY: 120 });

        assert.equal(input.hoveredEnemy, enemy);
        assert.equal(game.hoveredEnemy, enemy);
        assert.equal(game.hoveredEnemyUid, 'enemy-hover');
        assert.equal(canvas.style.cursor, 'pointer');

        listeners.mouseleave();

        assert.equal(input.hoveredEnemy, null);
        assert.equal(game.hoveredEnemy, null);
        assert.equal(game.hoveredEnemyUid, null);
        assert.equal(canvas.style.cursor, '');
        assert.match(statuses.at(-1), /Elige un héroe/);
    } finally {
        globalThis.window = previousWindow;
    }
});

test('InputManager cicla prioridad del heroe seleccionado con atajo configurable', () => {
    const previousWindow = globalThis.window;
    let keydownHandler = null;
    globalThis.window = {
        addEventListener(type, handler) {
            if (type === 'keydown') keydownHandler = handler;
        }
    };

    const hero = {
        id: 'iron_man',
        name: 'Iron Man',
        targetingPriority: 'Primero',
        config: { id: 'iron_man', targetingPriority: 'Primero' },
        getEffectiveStats: () => ({ range: 160 })
    };
    const calls = [];
    const game = {
        selectedUnit: hero,
        heroes: [hero],
        activeTeam: [hero.config],
        progression: {
            state: { settings: { keyBindings: { targeting: 't' } } },
            setHeroTargetingPriority(heroId, priority) {
                calls.push(['priority', heroId, priority]);
            }
        },
        tacticalActions: null
    };
    const ui = {
        showToast: (message, type) => calls.push(['toast', message, type]),
        setSelectionStatus: (message) => calls.push(['status', message]),
        renderHeroRoster: () => calls.push(['roster'])
    };
    const canvas = { addEventListener: () => {} };
    try {
        const input = new InputManager(canvas, game, ui, {});
        let prevented = false;

        keydownHandler({ key: 't', target: { tagName: 'BODY' }, preventDefault: () => { prevented = true; } });

        assert.ok(input);
        assert.equal(prevented, true);
        assert.equal(hero.targetingPriority, 'Último');
        assert.equal(hero.config.targetingPriority, 'Último');
        assert.deepEqual(calls[0], ['priority', 'iron_man', 'Último']);
        assert.deepEqual(calls[1], ['toast', 'Iron Man: objetivo Último', 'info']);
        assert.deepEqual(calls.at(-1), ['roster']);
    } finally {
        globalThis.window = previousWindow;
    }
});

test('InputManager mejora al heroe seleccionado con atajo configurable', () => {
    const previousWindow = globalThis.window;
    let keydownHandler = null;
    globalThis.window = {
        addEventListener(type, handler) {
            if (type === 'keydown') keydownHandler = handler;
        }
    };

    const hero = { id: 'iron_man', name: 'Iron Man', config: { id: 'iron_man' } };
    const calls = [];
    const game = {
        selectedUnit: hero,
        heroes: [hero],
        activeTeam: [hero.config],
        progression: { state: { settings: { keyBindings: { upgrade: 'u' } } } },
        tacticalActions: null
    };
    const ui = {
        quickUpgradeHero: (unit) => {
            calls.push(unit.id);
            return true;
        },
        setSelectionStatus: () => {}
    };
    const canvas = { addEventListener: () => {} };
    try {
        new InputManager(canvas, game, ui, {});
        let prevented = false;

        keydownHandler({ key: 'u', target: { tagName: 'BODY' }, preventDefault: () => { prevented = true; } });

        assert.equal(prevented, true);
        assert.deepEqual(calls, ['iron_man']);
    } finally {
        globalThis.window = previousWindow;
    }
});

test('InputManager confirma la celda sugerida con Enter durante colocacion', () => {
    const previousWindow = globalThis.window;
    let keydownHandler = null;
    globalThis.window = {
        addEventListener(type, handler) {
            if (type === 'keydown') keydownHandler = handler;
        }
    };

    const heroConfig = { id: 'iron_man', name: 'Iron Man', cost: 250, range: 95, allowedTerrains: [1] };
    const deployed = [];
    const calls = [];
    const resources = {
        credits: 650,
        removeCredits(amount) {
            if (this.credits < amount) return false;
            this.credits -= amount;
            return true;
        }
    };
    const game = {
        ...placementGame(),
        activeTeam: [heroConfig],
        completedWaves: [],
        progression: { state: { settings: { keyBindings: {} } } },
        replaySystem: { record: (...args) => calls.push(['replay', ...args]) },
        spawnHero(config, x, y) {
            const hero = { id: config.id, name: config.name, x, y, config };
            deployed.push(hero);
            this.heroes.push(hero);
            return hero;
        },
        waveManager: { refreshWaveIntel: () => calls.push(['refresh']) },
        tacticalActions: null
    };
    const ui = {
        setSelectionStatus: (message) => calls.push(['status', message]),
        showToast: (message, type) => calls.push(['toast', message, type]),
        renderHeroRoster: () => calls.push(['roster'])
    };
    const canvas = { addEventListener: () => {} };

    try {
        const input = new InputManager(canvas, game, ui, resources);
        input.setPlacementMode(heroConfig);
        const suggestion = input.suggestedPlacement;
        let prevented = false;

        keydownHandler({ key: 'Enter', target: { tagName: 'BODY' }, preventDefault: () => { prevented = true; } });

        assert.equal(prevented, true);
        assert.equal(resources.credits, 650);
        assert.equal(deployed.length, 1);
        assert.equal(deployed[0].x, suggestion.centerX);
        assert.equal(deployed[0].y, suggestion.centerY);
        assert.equal(input.placingHero, null);
        assert.ok(calls.some((call) => call[0] === 'toast' && /celda sugerida/.test(call[1])));
    } finally {
        globalThis.window = previousWindow;
    }
});

test('InputManager no consume atajo de mejora sin heroe desplegado seleccionado', () => {
    const previousWindow = globalThis.window;
    let keydownHandler = null;
    globalThis.window = {
        addEventListener(type, handler) {
            if (type === 'keydown') keydownHandler = handler;
        }
    };

    const calls = [];
    const game = {
        selectedUnit: null,
        heroes: [],
        activeTeam: [],
        progression: { state: { settings: { keyBindings: { upgrade: 'u' } } } },
        tacticalActions: null
    };
    const ui = {
        quickUpgradeHero: () => calls.push('upgrade'),
        setSelectionStatus: () => {}
    };
    const canvas = { addEventListener: () => {} };
    try {
        new InputManager(canvas, game, ui, {});
        let prevented = false;

        keydownHandler({ key: 'u', target: { tagName: 'BODY' }, preventDefault: () => { prevented = true; } });

        assert.equal(prevented, false);
        assert.deepEqual(calls, []);
    } finally {
        globalThis.window = previousWindow;
    }
});

function roundPoint(point) {
    return { x: Math.round(point.x), y: Math.round(point.y) };
}

function createInputForSelection() {
    const previousWindow = globalThis.window;
    globalThis.window = { addEventListener: () => {} };
    const game = {
        selectedUnit: null,
        heroes: [],
        enemies: [],
        path: [{ x: 0, y: 100 }, { x: 240, y: 100 }],
        showHeroRanges: true,
        progression: { state: { settings: { keyBindings: {} } } },
        tacticalActions: null
    };
    const input = new InputManager({ addEventListener: () => {} }, game, { setSelectionStatus: () => {}, inspectUnit: () => {} }, {});
    globalThis.window = previousWindow;
    return input;
}

function createCanvasContextSpy() {
    const calls = { arc: 0 };
    const ctx = {
        calls,
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        arc: () => { calls.arc++; },
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        setLineDash: () => {},
        fillText: () => {}
    };
    return ctx;
}

function placementGame() {
    return {
        gridSize: 40,
        terrainMap: [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 2, 1, 1],
            [1, 1, 1, 1, 1]
        ],
        path: [{ x: 0, y: 100 }, { x: 200, y: 100 }],
        heroes: [],
        missionSystem: null
    };
}

function terrainPlacementGame() {
    return {
        gridSize: 40,
        terrainMap: [
            [TERRAIN.grass, TERRAIN.blocked, TERRAIN.mountain, TERRAIN.mountain, TERRAIN.grass],
            [TERRAIN.water, TERRAIN.water, TERRAIN.path, TERRAIN.grass, TERRAIN.blocked],
            [TERRAIN.grass, TERRAIN.grass, TERRAIN.path, TERRAIN.mountain, TERRAIN.grass],
            [TERRAIN.grass, TERRAIN.blocked, TERRAIN.grass, TERRAIN.grass, TERRAIN.grass]
        ],
        path: [{ x: 80, y: 0 }, { x: 80, y: 160 }],
        heroes: [],
        missionSystem: null
    };
}
