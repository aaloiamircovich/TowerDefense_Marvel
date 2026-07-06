import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameModeSystem, GAME_MODES } from '../src/systems/GameModeSystem.js';
import { RandomSource } from '../src/utils/Random.js';
import { WaveManager } from '../src/systems/WaveManager.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const enemies = JSON.parse(fs.readFileSync(new URL('../data/enemies.json', import.meta.url), 'utf8'));
const levels = JSON.parse(fs.readFileSync(new URL('../data/levels.json', import.meta.url), 'utf8'));

test('Operación diaria repite mapa y roster durante la misma fecha', () => {
    const first = createGame(); const second = createGame();
    const firstModes = attachModes(first); const secondModes = attachModes(second);
    firstModes.start('daily'); secondModes.start('daily');
    assert.equal(first.currentLevel.id, second.currentLevel.id);
    assert.deepEqual(first.activeTeam.map((hero) => hero.id), second.activeTeam.map((hero) => hero.id));
    assert.equal(first.activeTeam.length, 6);
});

test('Boss Rush prepara un jefe distinto por ronda y recompensa tienda breve', () => {
    const game = createGame(); const modes = attachModes(game); modes.modeId = 'boss_rush';
    game.modeSystem = modes;
    const manager = new WaveManager(game, enemies); game.waveManager = manager; manager.maxWaves = 10;
    assert.equal(manager.preparedQueue.length, 1);
    assert.equal(manager.preparedQueue[0].config.isBoss, true);
    const before = game.resourceManager.credits;
    modes.onWaveFinished(1);
    assert.ok(game.resourceManager.credits > before);
    game.resourceManager.maxLives = 30; game.resourceManager.lives = 25;
    const shopCredits = game.resourceManager.credits;
    assert.equal(modes.repair(), true);
    assert.equal(game.resourceManager.lives, 27);
    assert.equal(game.resourceManager.credits, shopCredits - 120);
});

test('Supervivencia entrega hitos y permite extracción entre oleadas', () => {
    const game = createGame(); const modes = attachModes(game); modes.modeId = 'survival'; game.waveManager = { currentWave: 6, isWaveActive: false };
    const credits = game.resourceManager.credits; modes.onWaveFinished(5);
    assert.equal(game.resourceManager.credits, credits + 300);
    assert.equal(modes.extract(), true);
    assert.equal(game.recorded.at(-1).result, 'extracted');
});

test('Draft heroico ofrece tres refuerzos y suma la elección', () => {
    const game = createGame(); const modes = attachModes(game); modes.modeId = 'draft';
    modes.prepareDraftRoster(new RandomSource('draft-test'));
    game.waveManager = { currentWave: 4, isWaveActive: false };
    const initial = game.activeTeam.length; modes.onWaveFinished(3);
    assert.equal(game.draftOffers.length, 3);
    assert.equal(modes.chooseDraft(game.draftOffers[0].id), true);
    assert.equal(game.activeTeam.length, initial + 1);
});

test('Draft registra la eleccion en el replay sin romper el reinicio', () => {
    const game = createGame();
    const actions = [];
    game.replaySystem = { record(type, payload) { actions.push({ type, payload }); } };
    const modes = attachModes(game);
    modes.modeId = 'draft';
    modes.pendingDraft = [game.heroDatabase.iron_man];

    assert.equal(modes.chooseDraft('iron_man'), true);
    assert.deepEqual(actions, [{ type: 'draft', payload: { heroId: 'iron_man' } }]);
    assert.doesNotThrow(() => modes.reset());
});

test('Defensa de convoy mueve el objetivo sobre la ruta y pierde integridad por fugas', () => {
    const game = createGame(); const modes = attachModes(game); modes.modeId = 'convoy'; game.waveManager = { currentWave: 2, isWaveActive: true };
    modes.update(9.5); assert.ok(modes.convoy.progress > 0);
    assert.equal(modes.handleLeak({ isBoss: false }), true); assert.equal(modes.convoy.integrity, 92);
    const calls = []; modes.render(createContext(calls));
    assert.ok(calls.some((call) => call === 'strokeRect'));
});

test('rankings de modo permanecen separados', () => {
    const game = createGame(); const modes = attachModes(game);
    modes.modeId = 'daily'; modes.score = 900; game.waveManager = { currentWave: 8, isWaveActive: false }; modes.finishRun('defeat');
    modes.reset(); modes.modeId = 'survival'; modes.score = 1500; game.waveManager.currentWave = 12; modes.finishRun('extracted');
    assert.deepEqual(game.recorded.map((entry) => entry.modeId), ['daily', 'survival']);
});

test('modos especiales bonifican racha de oleadas limpias', () => {
    const game = createGame(); const modes = attachModes(game); modes.modeId = 'survival';
    game.waveManager = { currentWave: 3, isWaveActive: false, waveStartSnapshot: { lives: 20 } };

    modes.onWaveFinished(1);
    modes.onWaveFinished(2);

    const snapshot = modes.getSnapshot();
    assert.equal(snapshot.cleanStreak, 2);
    assert.equal(snapshot.lastStreakBonus, 70);
    assert.match(snapshot.streakDetail, /Racha limpia x2/);
});

test('modos especiales reinician racha cuando hay fugas', () => {
    const game = createGame(); const modes = attachModes(game); modes.modeId = 'daily';
    game.waveManager = { currentWave: 2, isWaveActive: false, waveStartSnapshot: { lives: 20 } };
    modes.onWaveFinished(1);

    game.resourceManager.lives = 18;
    game.waveManager.waveStartSnapshot = { lives: 20 };
    modes.onWaveFinished(2);

    assert.equal(modes.cleanStreak, 0);
    assert.equal(modes.lastStreakBonus, 0);
    assert.equal(modes.getSnapshot().streakDetail, null);
});

function attachModes(game) { const modes = new GameModeSystem(game, game.progression); game.modeSystem = modes; return modes; }
function createGame() {
    const game = {
        heroDatabase: heroes, enemyDatabase: enemies, levelsData: levels, currentLevel: levels[0], activeTeam: Object.values(heroes).slice(0, 6), heroes: [], enemies: [], path: [{ x: 0, y: 100 }, { x: 400, y: 100 }, { x: 400, y: 500 }],
        resourceManager: { lives: 20, maxLives: 20, credits: 650, reset(lives, credits) { this.lives = this.maxLives = lives; this.credits = credits; }, addCredits(value) { this.credits += value; }, removeCredits(value) { if (this.credits < value) return false; this.credits -= value; return true; }, addLife(value) { this.lives = Math.min(this.maxLives, this.lives + value); } },
        recorded: [], draftOffers: [], pause() {}, start() {}, gameOver() { this.isGameOver = true; },
        uiManager: { showToast() {}, updateModeStatus() {}, showModeResult() {}, closePanel() {}, renderHeroRoster() {}, renderWavePreview() {}, setNextWaveEnabled() {}, showDraftChoice(options) { game.draftOffers = options; } }, inputManager: { setPlacementMode() {} }
    };
    game.progression = { recordModeScore(modeId, score, wave, result, seedKey) { game.recorded.push({ modeId, score, wave, result, seedKey }); }, getModeRecord() { return { bestScore: 0, bestWave: 0 }; } };
    game.loadLevel = (level) => { game.currentLevel = level; game.waveManager = { maxWaves: 50, currentWave: 1, isWaveActive: false }; };
    return game;
}
function createContext(calls) { return new Proxy({}, { get(_target, key) { if (['save', 'restore', 'fillRect', 'strokeRect', 'fillText'].includes(key)) return () => calls.push(key); return ''; }, set() { return true; } }); }
