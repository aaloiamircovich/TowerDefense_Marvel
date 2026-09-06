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

    assert.match(source, /import \{ PanelDialogController \}/);
    assert.match(source, /new PanelDialogController\(this, \{ buildPanelNavigationMarkup \}\)/);
    assert.match(controller, /export class PanelDialogController\b/);
    assert.match(controller, /const PANEL_TITLES =/);
});
