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

    panel.render('Mapa y modos');

    assert.match(ui.panelContent.innerHTML, /campaign-ops-strip/);
    assert.match(ui.panelContent.innerHTML, /campaign-unlock-track/);
    assert.match(ui.panelContent.innerHTML, /campaign-progress-readout/);
    assert.match(ui.panelContent.innerHTML, /Reino de Wakanda/);
    assert.match(ui.panelContent.innerHTML, /50 estrellas restantes/);
    assert.match(ui.panelContent.innerHTML, /<b>2\/3<\/b>/);
    assert.match(ui.panelContent.innerHTML, /map-card--compact/);
    assert.match(ui.panelContent.innerHTML, /Mapa 01/);
    assert.match(ui.panelContent.innerHTML, /Acceso principal/);
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
