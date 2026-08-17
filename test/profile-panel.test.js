import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfilePanel } from '../src/ui/ProfilePanel.js';

test('ProfilePanel muestra racha y emblemas de contrato', () => {
    const panelContent = {
        innerHTML: '',
        querySelector: () => null,
        querySelectorAll: () => []
    };
    const progression = {
        state: {
            mapProgress: {},
            statistics: { missions: 0, victories: 0, waves: 0, enemiesDefeated: 0, damageDealt: 0 },
            achievements: []
        },
        getCodexSnapshot: () => ({
            heroes: { found: 0, total: 1 },
            enemies: { found: 0, total: 1 },
            items: { found: 0, total: 1 },
            factions: { found: 0, total: 1 },
            mechanics: { found: 0, total: 1 }
        }),
        getWeeklyContractSnapshot: () => ({
            completed: 4,
            total: 4,
            streak: 2,
            bestStreak: 2,
            perfectWeeks: 2,
            contracts: []
        }),
        getContractEmblemSnapshot: () => ({
            unlocked: 2,
            total: 4,
            emblems: [
                {
                    id: 'weekly_streak_1',
                    label: 'Operador semanal',
                    description: 'Completa todos los contratos de una semana.',
                    icon: 'fa-medal',
                    progress: 1,
                    required: 1,
                    unlocked: true
                }
            ]
        }),
        getSynergyChallengeSnapshot: () => ({ completed: 0, total: 0, challenges: [] }),
        getCredits: () => 1200,
        getHeroMastery: () => ({ completed: [] }),
        exportBuildCode: () => 'BUILD'
    };
    const ui = {
        panelContent,
        showToast: () => {},
        game: {
            progression,
            levelsData: [{ id: 'level_1' }],
            waveManager: { maxWaves: 100 },
            stars: 0,
            unlockedHeroes: [],
            activeTeam: [],
            currentLevel: { theme: { label: 'Base Avengers', brief: 'Defensa tactica' } },
            teamSynergy: { getSnapshot: () => ({ families: [], pairs: [], distinctTags: 0 }) },
            replaySystem: { exportReplayCode: () => 'REPLAY' }
        }
    };

    const panel = new ProfilePanel(ui);
    panel.render();

    assert.match(panelContent.innerHTML, /profile-tabs/);
    assert.match(panelContent.innerHTML, /data-profile-view="summary" role="tab" aria-selected="true"/);
    assert.match(panelContent.innerHTML, /Maestria heroica/);
    assert.match(panelContent.innerHTML, /Codice descubierto/);
    assert.doesNotMatch(panelContent.innerHTML, /Contratos semanales/);

    panel.render('Perfil', 'contracts');
    assert.match(panelContent.innerHTML, /Contratos semanales/);
    assert.match(panelContent.innerHTML, /racha 2/);
    assert.match(panelContent.innerHTML, /Emblemas de contrato/);
    assert.match(panelContent.innerHTML, /Operador semanal/);
    assert.match(panelContent.innerHTML, /Retos de agrupacion/);
});
