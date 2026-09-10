import { escapeHtml, normalizeClassToken } from './HtmlSanitizer.js';

export class EnemyInfoPanel {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.buildEnemyIntel = builders.buildEnemyIntel || (() => ({ danger: 'low', counter: '', counterDetail: '', traits: [] }));
    }

    render(unit) {
        document.getElementById('enemy-info-empty')?.classList.add('hidden');
        document.getElementById('enemy-info-content')?.classList.remove('hidden');
        document.getElementById('en-info-name').textContent = (unit.name || 'Enemigo').toUpperCase();
        document.getElementById('en-info-hp').textContent = `${Math.ceil(unit.hp || 0)} / ${Math.ceil(unit.maxHp || unit.hp || 0)}`;
        document.getElementById('en-info-speed').textContent = Math.round(unit.speed || 0);
        document.getElementById('en-info-armor').textContent = `${Math.round((unit.armor || 0) * 100)}%`;
        document.getElementById('en-info-reward').textContent = `$${unit.reward ?? 10}`;
        document.getElementById('en-info-faction').textContent = unit.faction || 'Independiente';
        document.getElementById('en-info-role').textContent = this.ui.getEnemyRole(unit.archetype, unit.isBoss);
        document.getElementById('en-info-resists').textContent = this.ui.getResistanceText(unit);
        document.getElementById('en-info-threat').textContent = `${unit.threat || 1} / 5`;
        document.getElementById('en-info-phase').textContent = unit.currentPhase || (unit.phases?.length ? `${unit.phases.length} fases` : '-');

        const intel = this.buildEnemyIntel(unit);
        const content = document.getElementById('enemy-info-content');
        content?.querySelector('.enemy-tactical-brief')?.remove();
        content?.insertAdjacentHTML('beforeend', `
            <div class="enemy-tactical-brief ${normalizeClassToken(intel.danger, 'low')}">
                <strong><i class="fas fa-crosshairs"></i>${escapeHtml(intel.counter)}</strong>
                <span>${escapeHtml(intel.counterDetail)}</span>
                ${intel.traits.length ? `<small>${intel.traits.map((trait) => escapeHtml(trait)).join(' | ')}</small>` : ''}
            </div>
        `);
    }
}
