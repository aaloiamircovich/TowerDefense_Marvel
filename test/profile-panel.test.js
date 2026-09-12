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
        getSynergyChallengeSnapshot: () => ({ completed: 0, total: 10, challenges: Array.from({ length: 10 }, (_, index) => ({ title: `Reto ${index + 1}`, goal: 'Completar agrupacion', type: 'family', reward: 100 })) }),
        getCredits: () => 1200,
        getTotalStars: () => 25,
        getHeroMastery: (heroId) => ({ completed: heroId === 'hero_1' ? ['waves', 'kills'] : [] }),
        exportBuildCode: () => 'BUILD'
    };
    const unlockedHeroes = Array.from({ length: 8 }, (_item, index) => ({
        id: `hero_${index + 1}`,
        name: `Hero ${index + 1}`
    }));
    const navigation = [];
    const ui = {
        panelContent,
        renderPanelNavigation: (type) => navigation.push(type),
        showToast: () => {},
        game: {
            progression,
            levelsData: [
                { id: 'level_1', name: 'Base de los Vengadores' },
                { id: 'level_2', name: 'Calles de Nueva York' },
                { id: 'level_3', name: 'Reino de Wakanda' }
            ],
            waveManager: { maxWaves: 100 },
            stars: 25,
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
    assert.match(panelContent.innerHTML, /Resumen: 8% completado/);
    assert.match(panelContent.innerHTML, /title="Resumen: 8% completado" data-tooltip="Resumen: 8% completado"/);
    assert.match(panelContent.innerHTML, /profile-next-unlock/);
    assert.match(panelContent.innerHTML, /--profile-next-progress:50%/);
    assert.match(panelContent.innerHTML, /Proxima operacion/);
    assert.match(panelContent.innerHTML, /Reino de Wakanda/);
    assert.match(panelContent.innerHTML, /25 estrellas para desbloquear/);
    assert.match(panelContent.innerHTML, /Contratos: 4 de 4 contratos/);
    assert.match(panelContent.innerHTML, /Códice: 0 de 5 entradas/);
    assert.match(panelContent.innerHTML, /Maestria heroica/);
    assert.match(panelContent.innerHTML, /Codice descubierto/);
    assert.match(panelContent.innerHTML, /profile-summary-grid/);
    assert.match(panelContent.innerHTML, /profile-mini-masteries/);
    assert.match(panelContent.innerHTML, /profile-grid profile-grid--primary/);
    assert.match(panelContent.innerHTML, /<details class="profile-ops-details">/);
    assert.match(panelContent.innerHTML, /Lectura operativa/);
    assert.match(panelContent.innerHTML, /2 paneles/);
    assert.match(panelContent.innerHTML, /Zona Marvel/);
    assert.doesNotMatch(panelContent.innerHTML, /profile-ops-details" open/);
    assert.match(panelContent.innerHTML, /Ver detalle completo/);
    assert.match(panelContent.innerHTML, /data-tooltip="Ver detalle completo del codice"/);
    assert.match(panelContent.innerHTML, /data-tooltip="Abrir codice descubierto"/);
    assert.doesNotMatch(panelContent.innerHTML, /Hero 8/);
    assert.doesNotMatch(panelContent.innerHTML, /Contratos semanales/);
    assert.ok(panelContent.innerHTML.indexOf('class="profile-tabs"') < panelContent.innerHTML.indexOf('profile-grid--primary'));

    panel.render('Perfil', 'codex');
    assert.match(panelContent.innerHTML, /Hero 8/);
    assert.doesNotMatch(panelContent.innerHTML, /profile-grid--primary/);
    assert.match(panelContent.innerHTML, /<details class="profile-meta-section profile-disclosure"><summary>Maestria heroica/);

    panel.render('Perfil', 'contracts');
    assert.match(panelContent.innerHTML, /Contratos semanales/);
    assert.match(panelContent.innerHTML, /racha 2/);
    assert.match(panelContent.innerHTML, /Emblemas de contrato/);
    assert.match(panelContent.innerHTML, /Operador semanal/);
    assert.match(panelContent.innerHTML, /Retos de agrupacion/);
    assert.match(panelContent.innerHTML, /Reto 10/);
    assert.doesNotMatch(panelContent.innerHTML, /profile-ops-details/);

    panel.render('Perfil', 'history');
    assert.match(panelContent.innerHTML, /id="copy-build-code" type="button" aria-label="Copiar codigo de build" title="Copiar codigo de build" data-tooltip="Copiar build al portapapeles"/);
    assert.match(panelContent.innerHTML, /id="copy-replay-code" type="button" aria-label="Copiar codigo de replay" title="Copiar codigo de replay" data-tooltip="Copiar replay al portapapeles"/);
    assert.deepEqual(navigation, ['profile', 'profile', 'profile', 'profile']);
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

test('ProfilePanel escapa textos dinamicos del perfil', () => {
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
            heroes: { found: 1, total: 1 },
            enemies: { found: 0, total: 1 },
            items: { found: 0, total: 1 },
            factions: { found: 0, total: 1 },
            mechanics: { found: 0, total: 1 }
        }),
        getWeeklyContractSnapshot: () => ({
            completed: 0,
            total: 1,
            streak: 0,
            bestStreak: 0,
            perfectWeeks: 0,
            contracts: [
                {
                    title: '<img src=x onerror=alert(1)>',
                    group: 'Semanal<script>',
                    goal: 'Completa <b>oleadas</b>',
                    reward: '500"><script>'
                }
            ]
        }),
        getContractEmblemSnapshot: () => ({
            unlocked: 0,
            total: 1,
            emblems: [
                {
                    label: '<script>emblema()</script>',
                    description: 'Descripcion <img src=x>',
                    icon: 'fa-medal" onclick="alert(1)',
                    progress: 0,
                    required: 1,
                    unlocked: false
                }
            ]
        }),
        getSynergyChallengeSnapshot: () => ({
            completed: 0,
            total: 1,
            challenges: [
                {
                    title: 'Grupo <img src=x>',
                    type: 'family',
                    goal: 'Activa <script>bad()</script>',
                    reward: '700<script>',
                    completed: false,
                    active: false
                }
            ]
        }),
        getCredits: () => '1200<script>',
        getTotalStars: () => 0,
        getHeroMastery: () => ({ completed: [] }),
        exportBuildCode: () => 'BUILD'
    };
    const ui = {
        panelContent,
        showToast: () => {},
        game: {
            progression,
            levelsData: [{ id: 'level_1', name: '<img src=x onerror=alert(1)>' }],
            waveManager: { maxWaves: 100 },
            stars: 0,
            unlockedHeroes: [{ id: 'hero_1', name: '<script>Hero</script>' }],
            activeTeam: [],
            currentLevel: { theme: { label: 'Mapa <script>', brief: 'Brief <img src=x>' } },
            teamSynergy: { getSnapshot: () => ({ families: [], pairs: [], distinctTags: 0 }) },
            replaySystem: { exportReplayCode: () => 'REPLAY' }
        }
    };

    const panel = new ProfilePanel(ui);
    panel.render('<img src=x onerror=alert(1)>');
    assert.doesNotMatch(panelContent.innerHTML, /<img\s/i);
    assert.doesNotMatch(panelContent.innerHTML, /<script/i);
    assert.match(panelContent.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(panelContent.innerHTML, /Mapa &lt;script&gt;/);

    panel.render('Perfil', 'contracts');
    assert.doesNotMatch(panelContent.innerHTML, /<img\s/i);
    assert.doesNotMatch(panelContent.innerHTML, /<script/i);
    assert.doesNotMatch(panelContent.innerHTML, /onclick=/i);
    assert.match(panelContent.innerHTML, /&lt;b&gt;oleadas&lt;\/b&gt;/);
    assert.match(panelContent.innerHTML, /class="fas fa-circle-info"/);

    panel.render('Perfil', 'codex');
    assert.doesNotMatch(panelContent.innerHTML, /<script/i);
    assert.match(panelContent.innerHTML, /&lt;script&gt;Hero&lt;\/script&gt;/);
});
