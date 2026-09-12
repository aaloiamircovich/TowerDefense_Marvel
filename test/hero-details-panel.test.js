import test from 'node:test';
import assert from 'node:assert/strict';
import { HeroDetailsPanel } from '../src/ui/HeroDetailsPanel.js';

test('HeroDetailsPanel renderiza identidad tactica y escapa contenido dinamico', () => {
    const panel = new HeroDetailsPanel({}, {
        buildHeroCombatIdentity: () => [
            { label: 'Impacto', value: '<AoE>', icon: 'fa-bolt', tone: 'prime' },
            { label: 'Rol', value: 'Soporte', icon: 'fa-id-badge', tone: 'support' }
        ]
    });

    const html = panel.renderHeroQuickIdentityStrip({ id: 'test' });

    assert.match(html, /hero-detail-quick-strip/);
    assert.match(html, /Impacto/);
    assert.match(html, /&lt;AoE&gt;/);
    assert.doesNotMatch(html, /<AoE>/);
});

test('HeroDetailsPanel renderiza leyenda de targeting desde prioridades tacticas', () => {
    const panel = new HeroDetailsPanel({}, {
        targetingPriorities: ['Primero', 'Jefe']
    });

    const html = panel.renderTargetingPriorityLegend('Jefe');

    assert.match(html, /targeting-priority-legend/);
    assert.match(html, /1ro/);
    assert.match(html, /Jfe/);
    assert.match(html, /class="active"/);
});

test('HeroDetailsPanel muestra preview numerico de mejora con signos', () => {
    const panel = new HeroDetailsPanel({
        getHeroLevelPreviewRows: () => [
            { label: 'Dano', value: 14 },
            { label: 'Aura', value: 2.5, suffix: '%', precision: 1 }
        ],
        formatSignedPreviewValue(value, suffix = '', precision = 0) {
            const amount = Number(value) || 0;
            const fixed = Math.abs(amount).toFixed(precision);
            const clean = precision > 0 ? fixed.replace(/\.0$/, '') : fixed;
            return `${amount >= 0 ? '+' : '-'}${clean}${suffix}`;
        }
    });

    const html = panel.renderHeroLevelPreview({ id: 'test' }, 5);

    assert.match(html, /upgrade-preview/);
    assert.match(html, /Dano \+14/);
    assert.match(html, /Aura \+2\.5%/);
});

test('HeroDetailsPanel tolera modelos parciales de detalles', () => {
    const previousDocument = globalThis.document;
    globalThis.document = { getElementById: () => null };
    const hero = {
        id: 'partial',
        name: 'Partial',
        damage: 10,
        range: 100,
        fireRate: 1,
        config: {
            id: 'partial',
            name: 'Partial',
            rarity: 'Common',
            tags: 'no-array',
            formationRole: 'support'
        },
        items: 'bad',
        abilitySystem: {
            getControlState: () => ({ label: 'Modo', value: 'a', options: null })
        }
    };
    const ui = {
        game: {
            heroes: null,
            progression: {
                state: { equippedItems: {}, unlockedHeroIds: ['partial'] },
                getHeroBonuses: () => ({})
            },
            itemDatabase: {},
            waveManager: {}
        },
        nextWaveSummary: null,
        panelContent: {
            innerHTML: '',
            querySelectorAll: () => [],
            querySelector: () => null
        },
        inventoryPanel: {},
        getHeroLevel: () => 1,
        getHeroUpgradeCost: () => 10,
        getHeroLevelPreviewLabel: () => '',
        getHeroLevelPreviewRows: () => null,
        formatSignedPreviewValue: (value) => `+${value}`,
        getTerrainText: () => 'Pasto',
        getMissionCredits: () => 0,
        getHeroDisplaySprite: () => null,
        renderSprite: () => '<span class="sprite-fallback">?</span>',
        bindHeroDetailTabs: () => {},
        renderPanel: () => {}
    };
    const panel = new HeroDetailsPanel(ui, {
        targetingPriorities: [null],
        buildHeroCombatIdentity: () => null
    });

    try {
        assert.equal(panel.renderHeroLevelPreview(hero, 1), '');
        assert.doesNotThrow(() => panel.renderHeroQuickIdentityStrip(hero));
        assert.doesNotThrow(() => panel.render(hero));
        assert.match(ui.panelContent.innerHTML, /hero-detail/);
        assert.doesNotMatch(ui.panelContent.innerHTML, /no-array/);
        assert.doesNotMatch(ui.panelContent.innerHTML, /kit-mode-btn/);
        assert.match(ui.panelContent.innerHTML, /targeting-select/);
        hero.getEffectiveStats = () => ({ damage: 15, range: 90, fireRate: 0, critChance: 0 });
        panel.render(hero);
        assert.match(ui.panelContent.innerHTML, /class="stat-delta positive">\+5<\/small>/);
        assert.match(ui.panelContent.innerHTML, /class="stat-delta negative">-10<\/small>/);
        assert.match(ui.panelContent.innerHTML, /<strong>0\.0\/s/);
        assert.match(ui.panelContent.innerHTML, /<strong>0%/);
        assert.doesNotMatch(ui.panelContent.innerHTML, /&lt;small class=/);
    } finally {
        globalThis.document = previousDocument;
    }
});

test('HeroDetailsPanel muestra familia del objeto equipado en tab de equipamiento', () => {
    const previousDocument = globalThis.document;
    const ui = {
        game: {
            progression: {
                state: {
                    equippedItems: { iron_man: { weapon: 'reactor_arc' } },
                    unlockedHeroIds: ['iron_man']
                },
                getHeroBonuses: () => ({})
            },
            itemDatabase: {
                reactor_arc: {
                    id: 'reactor_arc',
                    name: 'REACTOR ARC',
                    slot: 'weapon',
                    set: 'stark',
                    desc: 'Tecnologia Stark compacta.'
                }
            },
            heroes: [],
            waveManager: {}
        },
        panelContent: {
            innerHTML: '',
            querySelectorAll: () => []
        },
        inventoryPanel: {},
        getHeroLevel: () => 12,
        getHeroUpgradeCost: () => 450,
        getHeroLevelPreviewLabel: () => 'Dano +5',
        getHeroLevelPreviewRows: () => [{ label: 'Dano', value: 5 }],
        formatSignedPreviewValue: (value) => `+${value}`,
        getTerrainText: () => 'Pasto',
        getMissionCredits: () => 650,
        getHeroDisplaySprite: () => 'iron-man.png',
        renderSprite: (source, name) => `<img src="${source}" alt="${name}">`,
        bindHeroDetailTabs: () => {},
        renderPanel: () => {}
    };
    globalThis.document = { getElementById: () => null };

    try {
        const panel = new HeroDetailsPanel(ui);
        panel.render({
            id: 'iron_man',
            name: 'Iron Man',
            damage: 24,
            range: 128,
            fireRate: 1.2,
            critChance: 8,
            config: {
                id: 'iron_man',
                name: 'Iron Man',
                rarity: 'Rare',
                damage: 24,
                range: 128,
                fireRate: 1.2,
                critChance: 8,
                allowedTerrains: [1]
            }
        }, 'equipment');

        assert.match(ui.panelContent.innerHTML, /Arma \| Familia Stark/);
        assert.doesNotMatch(ui.panelContent.innerHTML, /Arma \| Stark/);
    } finally {
        globalThis.document = previousDocument;
    }
});

test('HeroDetailsPanel escapa textos dinamicos del render completo', () => {
    const previousDocument = globalThis.document;
    globalThis.document = { getElementById: () => null };
    const hero = {
        id: 'hero_bad',
        name: '<img src=x onerror=alert(1)>',
        rarity: 'Rare',
        category: 'Tecnologico <script>',
        level: 8,
        damage: 30,
        fireRate: 1.4,
        range: 165,
        critChance: 7,
        ability: 'Rayo <script>',
        abilityDesc: 'Dispara <b>fuerte</b>',
        niche: 'Nicho <img>',
        allowedTerrains: [1],
        targetPriority: 'Mal"><script>',
        items: [
            {
                id: 'bad_item',
                name: 'Objeto <script>',
                slot: 'weapon"><img',
                set: 'stark<script>',
                desc: 'Descripcion <img src=x>'
            }
        ],
        abilitySystem: {
            getDisplayState: () => ({ ready: true, label: 'Listo <img>', progress: 'bad<script>' }),
            getControlState: () => ({
                label: 'Modo <script>',
                value: 'a"><img',
                options: [
                    { id: 'a"><img', label: 'Opcion <b>' }
                ]
            })
        },
        config: {
            id: 'hero_bad',
            name: '<img src=x onerror=alert(1)>',
            rarity: 'Rare',
            category: 'Tecnologico <script>',
            damage: 30,
            range: 165,
            fireRate: 1.4,
            critChance: 7,
            ability: 'Rayo <script>',
            abilityDesc: 'Dispara <b>fuerte</b>',
            niche: 'Nicho <img>',
            tags: ['Avengers <script>'],
            allowedTerrains: [1],
            targetingPriority: 'Mal"><script>'
        }
    };
    const ui = {
        game: {
            heroes: [hero],
            tacticalActions: {
                canReposition: () => ({ ok: true, reason: 'Mover <img>' }),
                canSell: () => ({ ok: true, reason: 'Retirar <script>' })
            },
            progression: {
                state: { equippedItems: {}, unlockedHeroIds: ['hero_bad'] },
                getHeroBonuses: () => ({})
            },
            itemDatabase: {},
            resourceManager: { credits: 650 },
            waveManager: {}
        },
        nextWaveSummary: {},
        panelContent: {
            innerHTML: '',
            querySelectorAll: () => [],
            querySelector: () => null
        },
        inventoryPanel: {},
        getHeroLevel: () => 8,
        getHeroUpgradeCost: () => 120,
        getHeroLevelPreviewLabel: () => 'Dano <script>',
        getHeroLevelPreviewRows: () => [{ label: 'Dano <img>', value: 12 }],
        formatSignedPreviewValue: (value) => `+${value}`,
        getTerrainText: () => 'Pasto <script>',
        getMissionCredits: () => 650,
        getHeroDisplaySprite: () => null,
        renderSprite: () => '<span class="sprite-fallback">?</span>',
        bindHeroDetailTabs: () => {},
        renderPanel: () => {},
        showToast: () => {},
        renderHeroRoster: () => {},
        renderHeroDetails: () => {}
    };
    const panel = new HeroDetailsPanel(ui, {
        targetingPriorities: ['Primero', 'Mal"><script>'],
        evaluateHeroWaveFit: () => ({}),
        buildRosterWaveFitView: () => ({
            id: 'thin" onclick="x',
            ariaLabel: 'Lectura <script>',
            label: 'Respuesta <img>',
            scoreLabel: '6 <b>',
            reasonText: 'Motivo <script>'
        }),
        buildHeroCombatIdentity: () => [
            { label: 'Impacto <script>', value: '<AoE>', icon: 'fa-bolt" onclick="x', tone: 'prime" onclick="x' }
        ]
    });

    try {
        panel.render(hero);
        assert.doesNotMatch(ui.panelContent.innerHTML, /<img\s/i);
        assert.doesNotMatch(ui.panelContent.innerHTML, /<script/i);
        assert.doesNotMatch(ui.panelContent.innerHTML, /onclick=/i);
        assert.match(ui.panelContent.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
        assert.match(ui.panelContent.innerHTML, /Rayo &lt;script&gt;/);
        assert.match(ui.panelContent.innerHTML, /Pasto &lt;script&gt;/);
        assert.match(ui.panelContent.innerHTML, /hero-wave-fit-compact thin-onclick-x/);
        assert.match(ui.panelContent.innerHTML, /class="prime-onclick-x"/);
        assert.match(ui.panelContent.innerHTML, /class="fas fa-circle-info"/);
        assert.match(ui.panelContent.innerHTML, /style="width:0%"/);

        panel.render(hero, 'equipment');
        assert.doesNotMatch(ui.panelContent.innerHTML, /<img\s/i);
        assert.doesNotMatch(ui.panelContent.innerHTML, /<script/i);
        assert.match(ui.panelContent.innerHTML, /Objeto &lt;script&gt;/);
        assert.match(ui.panelContent.innerHTML, /Descripcion &lt;img src=x&gt;/);

        panel.render(hero, 'upgrade');
        assert.doesNotMatch(ui.panelContent.innerHTML, /<img\s/i);
        assert.doesNotMatch(ui.panelContent.innerHTML, /<script/i);
        assert.match(ui.panelContent.innerHTML, /Dano &lt;img&gt; \+12/);
        assert.match(ui.panelContent.innerHTML, /Cambios: Dano &lt;script&gt;/);
    } finally {
        globalThis.document = previousDocument;
    }
});
