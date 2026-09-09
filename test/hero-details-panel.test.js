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
