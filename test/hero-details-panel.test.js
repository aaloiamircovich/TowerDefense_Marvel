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
