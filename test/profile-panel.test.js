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
        getTotalStars: () => 75,
        getHeroMastery: (heroId) => ({ completed: heroId === 'hero_1' ? ['waves', 'kills'] : [] }),
        exportBuildCode: () => 'BUILD'
    };
    const unlockedHeroes = Array.from({ length: 8 }, (_item, index) => ({
        id: `hero_${index + 1}`,
        name: `Hero ${index + 1}`
    }));
    const ui = {
        panelContent,
        showToast: () => {},
        game: {
            progression,
            levelsData: [
                { id: 'level_1', name: 'Base de los Vengadores' },
                { id: 'level_2', name: 'Calles de Nueva York' },
                { id: 'level_3', name: 'Reino de Wakanda' }
            ],
            waveManager: { maxWaves: 100 },
            stars: 75,
            unlockedHeroes,
            activeTeam: [],
            currentLevel: { theme: { label: 'Base Avengers', brief: 'Defensa tactica' } },
            teamSynergy: { getSnapshot: () => ({ families: [], pairs: [], distinctTags: 0 }) },
            replaySystem: { exportReplayCode: () => 'REPLAY' }
        }
    };

    const panel = new ProfilePanel(ui);
    panel.render();

    assert.match(panelContent.innerHTML, /profile-tabs/);
    assert.match(panelContent.innerHTML, /id="profile-tab-summary"/);
    assert.match(panelContent.innerHTML, /aria-controls="profile-tab-panel"/);
    assert.match(panelContent.innerHTML, /id="profile-tab-panel" class="profile-tab-panel profile-view-summary" role="tabpanel" aria-labelledby="profile-tab-summary"/);
    assert.match(panelContent.innerHTML, /data-profile-view="summary" role="tab" aria-selected="true"/);
    assert.match(panelContent.innerHTML, /profile-tab-badge/);
    assert.match(panelContent.innerHTML, /Resumen: 25% completado/);
    assert.match(panelContent.innerHTML, /profile-next-unlock/);
    assert.match(panelContent.innerHTML, /--profile-next-progress:75%/);
    assert.match(panelContent.innerHTML, /Proxima operacion/);
    assert.match(panelContent.innerHTML, /Reino de Wakanda/);
    assert.match(panelContent.innerHTML, /25 estrellas para desbloquear/);
    assert.match(panelContent.innerHTML, /Contratos: 4 de 4 contratos/);
    assert.match(panelContent.innerHTML, /Códice: 0 de 5 entradas/);
    assert.match(panelContent.innerHTML, /Maestria heroica/);
    assert.match(panelContent.innerHTML, /Codice descubierto/);
    assert.match(panelContent.innerHTML, /profile-summary-grid/);
    assert.match(panelContent.innerHTML, /profile-mini-masteries/);
    assert.match(panelContent.innerHTML, /Ver detalle completo/);
    assert.doesNotMatch(panelContent.innerHTML, /Hero 8/);
    assert.doesNotMatch(panelContent.innerHTML, /Contratos semanales/);

    panel.render('Perfil', 'codex');
    assert.match(panelContent.innerHTML, /Hero 8/);

    panel.render('Perfil', 'contracts');
    assert.match(panelContent.innerHTML, /Contratos semanales/);
    assert.match(panelContent.innerHTML, /racha 2/);
    assert.match(panelContent.innerHTML, /Emblemas de contrato/);
    assert.match(panelContent.innerHTML, /Operador semanal/);
    assert.match(panelContent.innerHTML, /Retos de agrupacion/);
});
test('ProfilePanel navega tabs con teclado', () => {
    const calls = [];
    const makeTab = (view) => ({
        dataset: { profileView: view },
        listeners: {},
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        },
        focus() {
            calls.push(`focus:${view}`);
        }
    });
    const tabs = [makeTab('summary'), makeTab('contracts'), makeTab('codex'), makeTab('history')];
    const panel = Object.create(ProfilePanel.prototype);
    panel.title = 'Perfil';
    panel.ui = {
        panelContent: {
            querySelectorAll(selector) {
                if (selector === '.profile-tab') return tabs;
                if (selector === '.profile-open-tab') return [];
                return [];
            },
            querySelector(selector) {
                const match = selector.match(/data-profile-view="([^"]+)"/);
                return tabs.find((tab) => tab.dataset.profileView === match?.[1]) || null;
            }
        }
    };
    panel.render = (title, view) => calls.push(`render:${title}:${view}`);

    panel.bindProfileTabs();
    let prevented = 0;
    tabs[0].listeners.keydown({ key: 'ArrowRight', preventDefault: () => { prevented += 1; } });
    tabs[1].listeners.keydown({ key: 'End', preventDefault: () => { prevented += 1; } });

    assert.equal(prevented, 2);
    assert.ok(calls.includes('render:Perfil:contracts'));
    assert.ok(calls.includes('focus:contracts'));
    assert.ok(calls.includes('render:Perfil:history'));
    assert.ok(calls.includes('focus:history'));
});
