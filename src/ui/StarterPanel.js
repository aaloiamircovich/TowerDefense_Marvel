import { getRarityClass, normalizeRarity } from '../utils/Rarity.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

const METRIC_LABELS = {
    damage: { label: 'Daño', icon: 'fa-bolt' },
    control: { label: 'Control', icon: 'fa-hand' },
    support: { label: 'Soporte', icon: 'fa-shield-alt' },
    detection: { label: 'Radar', icon: 'fa-satellite-dish' }
};

export class StarterPanel {
    constructor(ui) {
        this.ui = ui;
    }

    render(starters, onSelect) {
        this.ui.game.pause();
        this.ui.showPanelOverlay(false);

        this.ui.panelContent.innerHTML = `
            <section class="starter-panel">
                <div class="starter-header">
                    <span class="briefing-kicker">PRIMER DESPLIEGUE</span>
                    <h2>Elige tu héroe inicial</h2>
                    <p>Tu primera defensa define el ritmo de las primeras oleadas.</p>
                </div>
                <div class="starter-grid">
                    ${starters.map((hero) => this.renderCard(hero)).join('')}
                </div>
            </section>
        `;

        this.ui.panelContent.querySelectorAll('.starter-card').forEach((card) => {
            card.addEventListener('click', () => {
                const selected = starters.find((hero) => hero.id === card.dataset.id);
                if (!selected) return;
                document.getElementById('close-panel-btn')?.classList.remove('hidden');
                this.ui.closePanel();
                onSelect(selected);
            });
        });
    }

    renderCard(hero) {
        const rarity = normalizeRarity(hero.rarity);
        const rarityClass = getRarityClass(rarity);
        return `
            <button class="starter-card starter-card-upgraded ${rarityClass}" data-id="${escapeHtml(hero.id)}" data-testid="starter-${escapeHtml(hero.id)}" data-rarity="${rarity}">
                <div class="starter-sprite-frame">
                    ${this.ui.renderSprite(this.ui.getHeroDisplaySprite(hero), hero.name)}
                </div>
                <div class="starter-card-copy">
                    <strong>${escapeHtml(hero.name)}</strong>
                    <span class="starter-rarity-line">
                        <b class="rarity-badge ${rarityClass}">${rarity}</b>
                        <small>${escapeHtml(hero.category || 'Héroe')}</small>
                    </span>
                    <em>${escapeHtml(this.getNicheText(hero))}</em>
                </div>
                <div class="starter-stat-strip" aria-label="${escapeHtml(hero.name)}: ${escapeHtml(this.getMetrics(hero).map((metric) => `${metric.label} ${metric.value}`).join(', '))}">
                    ${this.getMetrics(hero).map((metric) => `
                        <span>
                            <i class="fas ${metric.icon}"></i>
                            <b>${metric.value}</b>
                            <small>${metric.label}</small>
                        </span>
                    `).join('')}
                </div>
            </button>
        `;
    }

    getNicheText(hero) {
        return hero.niche || hero.ability || hero.category || 'defensa equilibrada';
    }

    getMetrics(hero) {
        const metrics = hero.teamMetrics || {};
        const ranked = Object.entries(METRIC_LABELS)
            .map(([key, meta]) => ({ ...meta, value: Number(metrics[key]) || 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 2);

        if (ranked.some((metric) => metric.value > 0)) return ranked;

        return [
            { ...METRIC_LABELS.damage, value: Math.max(1, Math.round((Number(hero.damage) || 0) / 10)) },
            { ...METRIC_LABELS.control, value: Math.max(1, Math.round((Number(hero.range) || 0) / 50)) }
        ];
    }
}
