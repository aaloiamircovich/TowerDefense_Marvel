import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(file) {
    return fs.readFileSync(path.join(root, file), 'utf8');
}

test('InputManager no depende de UIManager para utilidades compartidas', () => {
    const source = read('src/core/InputManager.js');

    assert.doesNotMatch(source, /from ['"]\.\.\/systems\/UIManager\.js['"]/);
    assert.match(source, /from ['"]\.\.\/utils\/TargetingPriority\.js['"]/);
});

test('UIManager delega paneles visuales extraidos en componentes dedicados', () => {
    const source = read('src/systems/UIManager.js');
    const expectedPanels = [
        'CombatPressurePanel',
        'EnemyInfoPanel',
        'HeroDetailsPanel',
        'MissionStatusPanel',
        'PlacementSuggestionPanel',
        'ThreatHudPanel',
        'TopHudPanel',
        'ToastPanel',
        'WavePreviewPanel'
    ];

    expectedPanels.forEach((panelName) => {
        assert.match(source, new RegExp(`import \\{ ${panelName} \\}`), `${panelName} debe importarse como panel dedicado`);
        assert.match(source, new RegExp(`new ${panelName}\\(`), `${panelName} debe instanciarse desde UIManager`);
    });
});

test('paneles extraidos viven fuera de systems y exportan clases reutilizables', () => {
    const panels = [
        'src/ui/CombatPressurePanel.js',
        'src/ui/EnemyInfoPanel.js',
        'src/ui/HeroDetailsPanel.js',
        'src/ui/MissionStatusPanel.js',
        'src/ui/PlacementSuggestionPanel.js',
        'src/ui/ThreatHudPanel.js',
        'src/ui/TopHudPanel.js',
        'src/ui/ToastPanel.js',
        'src/ui/WavePreviewPanel.js'
    ];

    panels.forEach((file) => {
        const source = read(file);
        const className = path.basename(file, '.js');
        assert.match(source, new RegExp(`export class ${className}\\b`), `${file} debe exportar ${className}`);
    });
});

test('UIManager delega mejoras de heroe en controlador dedicado', () => {
    const source = read('src/systems/UIManager.js');
    const controller = read('src/ui/HeroUpgradeController.js');

    assert.match(source, /import \{ HeroUpgradeController \}/);
    assert.match(source, /new HeroUpgradeController\(this\)/);
    assert.match(controller, /export class HeroUpgradeController\b/);
    assert.doesNotMatch(source, /from ['"]\.\.\/utils\/HeroLevel\.js['"]/);
});

test('UIManager delega apertura y navegacion de paneles en controlador modal', () => {
    const source = read('src/systems/UIManager.js');
    const controller = read('src/ui/PanelDialogController.js');
    const navigation = read('src/ui/PanelNavigation.js');

    assert.match(source, /import \{ PanelDialogController \}/);
    assert.match(source, /new PanelDialogController\(this, \{ buildPanelNavigationMarkup \}\)/);
    assert.match(source, /from ['"]\.\.\/ui\/PanelNavigation\.js['"]/);
    assert.match(controller, /export class PanelDialogController\b/);
    assert.match(navigation, /export const PANEL_NAV_ITEMS =/);
    assert.match(navigation, /export function buildPanelNavigationMarkup\b/);
});

test('estados puros del HUD viven fuera de UIManager', () => {
    const source = read('src/systems/UIManager.js');
    const hudState = read('src/ui/HudState.js');

    assert.match(source, /from ['"]\.\.\/ui\/HudState\.js['"]/);
    assert.match(source, /export \{ buildBossCountdownState, buildWaveLaunchState, formatHudResource \}/);
    assert.match(hudState, /export function buildWaveLaunchState\b/);
    assert.match(hudState, /export function buildBossCountdownState\b/);
    assert.match(hudState, /export function formatHudResource\b/);
    assert.doesNotMatch(source, /from ['"]\.\.\/utils\/LevelProgression\.js['"]/);
});

test('inteligencia enemiga vive fuera de UIManager', () => {
    const source = read('src/systems/UIManager.js');
    const enemyIntel = read('src/ui/EnemyIntelState.js');

    assert.match(source, /from ['"]\.\.\/ui\/EnemyIntelState\.js['"]/);
    assert.match(source, /export \{ buildEnemyIntel, buildEnemyTraitPreview \}/);
    assert.match(enemyIntel, /export function buildEnemyIntel\b/);
    assert.match(enemyIntel, /export function buildEnemyTraitPreview\b/);
    assert.match(enemyIntel, /export function getEnemyRoleLabel\b/);
    assert.doesNotMatch(source, /const ENEMY_ROLE_COPY =/);
});

test('tactica de heroes vive fuera de UIManager', () => {
    const source = read('src/systems/UIManager.js');
    const heroTactics = read('src/ui/HeroTacticsState.js');

    assert.match(source, /from ['"]\.\.\/ui\/HeroTacticsState\.js['"]/);
    assert.match(source, /export \{ buildHeroCombatIdentity, evaluateHeroWaveFit \}/);
    assert.match(heroTactics, /export function evaluateHeroWaveFit\b/);
    assert.match(heroTactics, /export function buildHeroCombatIdentity\b/);
    assert.match(heroTactics, /export function heroCoversCounter\b/);
    assert.doesNotMatch(source, /const PIERCING_HERO_IDS =/);
});

test('tactica de oleadas vive fuera de UIManager', () => {
    const source = read('src/systems/UIManager.js');
    const waveTactics = read('src/ui/WaveTacticsState.js');

    assert.match(source, /from ['"]\.\.\/ui\/WaveTacticsState\.js['"]/);
    assert.match(source, /export \{[\s\S]*buildWavePreparationPlan[\s\S]*\} from ['"]\.\.\/ui\/WaveTacticsState\.js['"]/);
    assert.match(waveTactics, /export function buildCounterCoverageModel\b/);
    assert.match(waveTactics, /export function buildWavePreparationPlan\b/);
    assert.match(waveTactics, /export function buildRosterWaveFitView\b/);
    assert.doesNotMatch(source, /const COUNTER_COPY =/);
    assert.doesNotMatch(source, /function getRequiredCounterIds\b/);
});

test('estado de reporte de oleada vive fuera de UIManager', () => {
    const source = read('src/systems/UIManager.js');
    const waveReportState = read('src/ui/WaveReportState.js');

    assert.match(source, /from ['"]\.\.\/ui\/WaveReportState\.js['"]/);
    assert.match(source, /export \{[\s\S]*buildWaveReportState[\s\S]*\} from ['"]\.\.\/ui\/WaveReportState\.js['"]/);
    assert.match(waveReportState, /export function buildWaveReportState\b/);
    assert.match(waveReportState, /export function buildWaveReportActionState\b/);
    assert.match(waveReportState, /export function buildTacticalContributionModel\b/);
    assert.doesNotMatch(source, /export function buildWaveReportState\b/);
    assert.doesNotMatch(source, /export function buildLeakIntel\b/);
});

test('estado de amenaza de combate vive fuera de UIManager', () => {
    const source = read('src/systems/UIManager.js');
    const combatThreatState = read('src/ui/CombatThreatState.js');

    assert.match(source, /from ['"]\.\.\/ui\/CombatThreatState\.js['"]/);
    assert.match(source, /export \{[\s\S]*buildCombatPressureState[\s\S]*\} from ['"]\.\.\/ui\/CombatThreatState\.js['"]/);
    assert.match(combatThreatState, /export function buildCombatPressureState\b/);
    assert.match(combatThreatState, /export function buildBossHudState\b/);
    assert.match(combatThreatState, /export function buildPressureActionState\b/);
    assert.doesNotMatch(source, /function getPathLength\b/);
    assert.doesNotMatch(source, /export function buildCombatPressureState\b/);
});

test('lectura de objetos de tienda vive fuera de UIManager', () => {
    const source = read('src/systems/UIManager.js');
    const shopItemState = read('src/ui/ShopItemState.js');

    assert.match(source, /from ['"]\.\.\/ui\/ShopItemState\.js['"]/);
    assert.match(source, /export \{ buildShopItemInsight, buildShopSetProgress \} from ['"]\.\.\/ui\/ShopItemState\.js['"]/);
    assert.match(shopItemState, /from ['"]\.\.\/systems\/ItemEffectSystem\.js['"]/);
    assert.match(shopItemState, /export function buildShopItemInsight\b/);
    assert.doesNotMatch(source, /from ['"].*ItemEffectSystem\.js['"]/);
    assert.doesNotMatch(source, /export function buildShopItemInsight\b/);
});
