import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CampaignPanel } from '../src/ui/CampaignPanel.js';

const levels = JSON.parse(fs.readFileSync(new URL('../data/levels.json', import.meta.url), 'utf8'));

test('CampaignPanel compacta operaciones y resume desbloqueos por estrellas', () => {
    const ui = createCampaignUi({ stars: 50 });
    const panel = new CampaignPanel(ui);

    const summary = panel.buildCampaignSummary();
    assert.equal(summary.totalStars, 50);
    assert.equal(summary.unlockedCount, 2);
    assert.equal(summary.totalMaps, 3);
    assert.equal(summary.nextUnlock, 'Siguiente mapa: 100 estrellas');
    assert.equal(summary.nextMapName, 'Reino de Wakanda');
    assert.equal(summary.starsRemaining, 50);
    assert.equal(summary.nextProgress, 0);
    assert.deepEqual(summary.milestones.map((milestone) => [milestone.index, milestone.requirement, milestone.state]), [
        [1, 0, 'active'],
        [2, 50, 'unlocked'],
        [3, 100, 'locked']
    ]);

    panel.render('Mapa y modos');

    assert.match(ui.panelContent.innerHTML, /campaign-ops-strip/);
    assert.match(ui.panelContent.innerHTML, /campaign-unlock-track/);
    assert.match(ui.panelContent.innerHTML, /campaign-unlock-track" role="meter"/);
    assert.match(ui.panelContent.innerHTML, /aria-label="Progreso hacia Reino de Wakanda: 0%"/);
    assert.match(ui.panelContent.innerHTML, /aria-valuenow="0"/);
    assert.match(ui.panelContent.innerHTML, /campaign-progress-readout/);
    assert.match(ui.panelContent.innerHTML, /campaign-milestone-strip/);
    assert.match(ui.panelContent.innerHTML, /Ruta de desbloqueo de mapas/);
    assert.match(ui.panelContent.innerHTML, /Base de los Vengadores\. Activo\. Requiere 0 estrellas/);
    assert.match(ui.panelContent.innerHTML, /Calles de Nueva York\. Desbloqueado\. Requiere 50 estrellas/);
    assert.match(ui.panelContent.innerHTML, /Reino de Wakanda\. Bloqueado\. Requiere 100 estrellas/);
    assert.match(ui.panelContent.innerHTML, /Reino de Wakanda/);
    assert.match(ui.panelContent.innerHTML, /50 estrellas restantes/);
    assert.match(ui.panelContent.innerHTML, /<b>2\/3<\/b>/);
    assert.match(ui.panelContent.innerHTML, /map-card--compact/);
    assert.match(ui.panelContent.innerHTML, /data-unlock-state="unlocked" aria-label="Base de los Vengadores. Desbloqueado"/);
    assert.match(ui.panelContent.innerHTML, /class="btn-start-mode btn-primary ghost" type="button" data-mode="survival" aria-label="Jugar modo Supervivencia" title="Jugar modo Supervivencia" data-tooltip="Jugar modo Supervivencia"/);
    assert.match(ui.panelContent.innerHTML, /class="btn-load-map btn-primary ghost" type="button" data-index="0" aria-label="Jugar Base de los Vengadores" title="Jugar Base de los Vengadores" data-tooltip="Jugar Base de los Vengadores" aria-disabled="false"/);
    assert.match(ui.panelContent.innerHTML, /data-unlock-state="locked" aria-label="Reino de Wakanda. Bloqueado, requiere 100 estrellas"/);
    assert.match(ui.panelContent.innerHTML, /type="button" data-index="2" aria-label="Bloqueado. Requiere 100 estrellas" title="Bloqueado. Requiere 100 estrellas" data-tooltip="Bloqueado. Requiere 100 estrellas" aria-disabled="true" disabled/);
    assert.match(ui.panelContent.innerHTML, /map-unlock-progress/);
    assert.match(ui.panelContent.innerHTML, /--map-unlock-progress:50%/);
    assert.match(ui.panelContent.innerHTML, /map-unlock-progress" role="meter"/);
    assert.match(ui.panelContent.innerHTML, /aria-label="Progreso de desbloqueo 50 de 100 estrellas"/);
    assert.match(ui.panelContent.innerHTML, /aria-valuemax="100" aria-valuenow="50"/);
    assert.match(ui.panelContent.innerHTML, /50\/100/);
    assert.match(ui.panelContent.innerHTML, /Mapa 01/);
    assert.match(ui.panelContent.innerHTML, /Acceso principal/);

    assert.deepEqual(panel.buildMapUnlockProgress(2, 75), {
        current: 75,
        required: 100,
        remaining: 25,
        percent: 75
    });
});

function createCampaignUi({ stars = 0 } = {}) {
    const visibleLevels = levels.slice(0, 3);
    return {
        panelContent: {
            innerHTML: '',
            querySelectorAll: () => []
        },
        closePanel: () => {},
        renderHeroRoster: () => {},
        game: {
            levelsData: visibleLevels,
            currentLevel: visibleLevels[0],
            stars,
            activeTeam: [],
            inputManager: { setPlacementMode: () => {} },
            modeSystem: { start: () => false },
            progression: {
                getTotalStars: () => stars,
                getModeRecord: () => ({ bestScore: 0, bestWave: 0 }),
                getMapProgress: (levelId) => ({
                    bestWave: levelId === 'level_1' ? 25 : 0,
                    stars: levelId === 'level_1' ? 25 : 0,
                    challenges: [],
                    missionObjectives: []
                })
            }
        }
    };
}
