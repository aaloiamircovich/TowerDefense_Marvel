import { formatHeroDetailMetric } from './HeroDetailViewModel.js';
import { buildWaveEnemyCardModel } from './WaveEnemyCardState.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatCompactMetric(value = 0) {
    return formatHeroDetailMetric(value);
}

function normalizeClassToken(value = '', fallback = 'neutral') {
    const token = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return token && /^[a-z][a-z0-9-]*$/.test(token) ? token : fallback;
}

function normalizeIconClass(value = '', fallback = 'fa-circle-info') {
    const tokens = String(value || '')
        .split(/\s+/)
        .filter((token) => /^(fa[srb]?|fa-[a-z0-9-]+)$/i.test(token));
    return tokens.length ? tokens.join(' ') : fallback;
}

function clampPercent(value = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeControlTag(value = 'div') {
    return value === 'button' ? 'button' : 'div';
}

export class WavePreviewPanel {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.buildBossMilestoneState = builders.buildBossMilestoneState || (() => null);
        this.buildCounterCoverageModel = builders.buildCounterCoverageModel || (() => null);
        this.buildEnemyIntel = builders.buildEnemyIntel || (() => ({}));
        this.buildEnemyTraitPreview = builders.buildEnemyTraitPreview || (() => ({ visible: [], overflow: 0, title: '' }));
        this.buildStatusLegendModel = builders.buildStatusLegendModel || (() => null);
        this.buildStealthCoverageState = builders.buildStealthCoverageState || (() => null);
        this.buildWaveCounterBrief = builders.buildWaveCounterBrief || (() => null);
        this.buildWaveDamageCheckMeter = builders.buildWaveDamageCheckMeter || (() => ({ fillPct: 0, label: '0% cubierto', ariaLabel: 'Daño estimado 0% del total requerido' }));
        this.buildWavePrepActionControl = builders.buildWavePrepActionControl || (() => ({ actionable: false, tag: 'div', ariaLabel: 'Preparacion recomendada', title: '', tooltip: '' }));
        this.buildWavePreparationPlan = builders.buildWavePreparationPlan || (() => []);
    }

    render(uniqueEnemies, modifier = null, faction = null, waveNumber = 1, summary = null) {
        const container = document.getElementById('wave-preview');
        const numberEl = document.getElementById('next-wave-number');
        const intelEl = document.getElementById('wave-intel');
        if (!container) return;
        const prepPlan = summary
            ? this.buildWavePreparationPlan(
                summary,
                this.ui.game.activeTeam || [],
                this.ui.game.heroes || [],
                this.ui.game.resourceManager?.credits || 0,
                (level, amount = 1) => this.ui.calculateLevelCost(level, amount)
            )
            : [];
        const stealthCoverage = summary
            ? this.buildStealthCoverageState(
                summary,
                this.ui.game.activeTeam || [],
                this.ui.game.heroes || [],
                this.ui.game.resourceManager?.credits || 0
            )
            : null;
        const statusLegend = this.buildStatusLegendModel(summary);
        const counterCoverage = summary
            ? this.buildCounterCoverageModel(
                summary,
                this.ui.game.activeTeam || [],
                this.ui.game.heroes || []
            )
            : null;
        const counterBrief = summary ? this.buildWaveCounterBrief(summary, counterCoverage) : null;
        const bossMilestone = this.buildBossMilestoneState(uniqueEnemies, waveNumber, summary);

        if (numberEl) numberEl.textContent = waveNumber;
        if (intelEl) {
            intelEl.innerHTML = `
                <strong>${escapeHtml(faction?.label || 'Amenaza desconocida')}</strong>
                <span>${escapeHtml(modifier?.label || 'Oleada estándar')}: ${escapeHtml(modifier?.description || '')}</span>
                ${summary ? `
                    <div class="wave-threat ${normalizeClassToken(summary.threatTier?.id, 'low')}" aria-label="${escapeHtml(summary.threatTier?.label || 'Amenaza baja')}: ${escapeHtml(summary.threatTier?.advice || 'Buen momento para ahorrar.')} Puntaje ${escapeHtml(summary.pressureScore || 0)}">
                        <div><strong>${escapeHtml(summary.threatTier?.label || 'Amenaza baja')}</strong><span>${escapeHtml(summary.threatTier?.advice || 'Buen momento para ahorrar.')}</span></div>
                        <b>${escapeHtml(summary.pressureScore || 0)}</b>
                    </div>
                    <div class="wave-readiness ${normalizeClassToken(summary.readiness?.id, 'empty')}" aria-label="${escapeHtml(summary.readiness?.label || 'Sin defensa')}: ${escapeHtml(summary.readiness?.advice || 'Despliega al menos un heroe antes de iniciar.')}">
                        <div><strong>${escapeHtml(summary.readiness?.label || 'Sin defensa')}</strong><span>${escapeHtml(summary.readiness?.advice || 'Despliega al menos un heroe antes de iniciar.')}</span></div>
                        <b>${escapeHtml(summary.readiness?.score || 0)}</b>
                    </div>
                    ${this.renderDamageCheck(summary.readiness?.damageCheck)}
                    ${bossMilestone ? `<div class="wave-boss-telegraph ${normalizeClassToken(bossMilestone.tone, 'warning')}" data-testid="wave-boss-telegraph" aria-label="${escapeHtml(`${bossMilestone.title}: ${bossMilestone.name}. ${bossMilestone.warning}`)}">
                        <div class="wave-boss-portrait">
                            ${bossMilestone.portrait
                                ? `<img src="${escapeHtml(bossMilestone.portrait)}" alt="" loading="lazy">`
                                : `<span>${escapeHtml(bossMilestone.name.charAt(0))}</span>`}
                        </div>
                        <div class="wave-boss-copy">
                            <span>${escapeHtml(bossMilestone.title)} · Oleada ${escapeHtml(bossMilestone.wave)}</span>
                            <strong>${escapeHtml(bossMilestone.name)}</strong>
                            <small><i class="fas fa-triangle-exclamation"></i>${escapeHtml(bossMilestone.warning)}</small>
                        </div>
                        <div class="wave-boss-stats">
                            ${bossMilestone.stats.map((stat) => `<span><b>${escapeHtml(stat.value)}</b><small>${escapeHtml(stat.label)}</small></span>`).join('')}
                        </div>
                        <div class="wave-boss-counters">
                            ${bossMilestone.counters.map((counter) => `<b>${escapeHtml(counter)}</b>`).join('')}
                        </div>
                    </div>` : ''}
                    <div class="wave-summary">
                        <span><b>${escapeHtml(summary.total)}</b> enemigos</span>
                        <span><b>$${escapeHtml(summary.reward)}</b> botín</span>
                        <span><b>${escapeHtml(summary.fastest)}</b> vel. máx.</span>
                        <span><b>${escapeHtml(summary.maxThreat)}/5</b> amenaza</span>
                    </div>
                    ${counterBrief ? `<div class="wave-counter wave-counter-brief ${normalizeClassToken(counterBrief.tone, 'neutral')}" aria-label="${escapeHtml(`Respuesta: ${counterBrief.label}. ${counterBrief.detail}`)}">
                        <i class="fas ${normalizeIconClass(counterBrief.icon)}"></i>
                        <div><strong>Respuesta: ${escapeHtml(counterBrief.label)}</strong><span>${escapeHtml(counterBrief.detail)}</span></div>
                    </div>` : ''}
                    ${stealthCoverage ? `<div class="wave-stealth-coverage ${normalizeClassToken(stealthCoverage.tone, 'neutral')}" aria-label="${escapeHtml(stealthCoverage.label)}: ${escapeHtml(stealthCoverage.detail)}">
                        <i class="fas fa-eye"></i>
                        <div><strong>${escapeHtml(stealthCoverage.label)}</strong><span>${escapeHtml(stealthCoverage.detail)}</span></div>
                    </div>` : ''}
                    ${statusLegend ? `<div class="wave-status-legend" aria-label="${escapeHtml(statusLegend.label)}">
                        <strong>${escapeHtml(statusLegend.label)}</strong>
                        <div>
                            ${statusLegend.entries.map((entry) => `<span title="${escapeHtml(entry.detail)}">
                                <i class="fas ${normalizeIconClass(entry.icon)}"></i>
                                <b>${escapeHtml(entry.label)}</b>
                            </span>`).join('')}
                        </div>
                    </div>` : ''}
                    ${counterCoverage ? `<div class="wave-counter-coverage ${counterCoverage.ready ? 'ready' : 'warning'}" aria-label="${escapeHtml(counterCoverage.label)}: ${escapeHtml(counterCoverage.covered)} de ${escapeHtml(counterCoverage.total)} respuestas cubiertas">
                        <strong>${escapeHtml(counterCoverage.label)} <b>${escapeHtml(counterCoverage.covered)}/${escapeHtml(counterCoverage.total)}</b></strong>
                        <div>
                            ${counterCoverage.entries.map((entry) => `<span class="${normalizeClassToken(entry.tone, 'neutral')}" data-tooltip="${escapeHtml(`${entry.counter}: ${entry.detail}`)}">
                                <i class="fas ${normalizeIconClass(entry.icon)}"></i>
                                <b>${escapeHtml(entry.counter)}</b>
                                <small>${escapeHtml(entry.label)}</small>
                            </span>`).join('')}
                        </div>
                    </div>` : ''}
                    ${summary.spawnTimeline?.entries?.length ? `<div class="wave-timeline" data-testid="wave-timeline" aria-label="Cadencia enemiga">
                        <strong>Llegada enemiga</strong>
                        <div>
                            ${summary.spawnTimeline.entries.map((entry) => `<span class="${normalizeClassToken(entry.danger, 'low')}">
                                <b>${escapeHtml(entry.etaLabel)}</b>
                                <em>${entry.count > 1 ? `x${escapeHtml(entry.count)} ` : ''}${escapeHtml(entry.name)}</em>
                            </span>`).join('')}
                            ${summary.spawnTimeline.overflow > 0 ? `<small>+${escapeHtml(summary.spawnTimeline.overflow)} entradas mas</small>` : ''}
                        </div>
                    </div>` : ''}
                    ${prepPlan.length ? `<div class="wave-prep-plan" data-testid="wave-prep-plan" aria-label="Preparacion recomendada">
                        <strong>Preparacion recomendada</strong>
                        ${prepPlan.map((item) => {
                            const control = this.buildWavePrepActionControl(item);
                            const tag = normalizeControlTag(control.tag);
                            const typeClass = normalizeClassToken(item.type, 'note');
                            const attrs = control.actionable
                                ? `type="button" data-prep-action="${escapeHtml(item.type)}" data-hero-id="${escapeHtml(item.heroId)}" aria-label="${escapeHtml(control.ariaLabel)}" title="${escapeHtml(control.title)}" data-tooltip="${escapeHtml(control.tooltip)}"`
                                : `role="note" aria-label="${escapeHtml(control.ariaLabel)}"`;
                            return `<${tag} class="wave-prep-item ${typeClass}" ${attrs}>
                            <span>${escapeHtml(item.label)}</span>
                            <small>${escapeHtml(item.reason)}${item.cost ? ` | $${escapeHtml(item.cost)}` : ''}</small>
                        </${tag}>`;
                        }).join('')}
                    </div>` : ''}
                    ${summary.branchOptions?.length ? `<div class="wave-branches" aria-label="Ruta de encuentro">
                        ${summary.branchOptions.map((option) => {
                            const branchLabel = `${option.label}: ${option.description}`;
                            return `<button type="button" data-branch="${escapeHtml(option.id)}" class="${summary.selectedBranch === option.id ? 'active' : ''}" aria-label="${escapeHtml(branchLabel)}" title="${escapeHtml(branchLabel)}" data-tooltip="${escapeHtml(branchLabel)}">${escapeHtml(option.label)}</button>`;
                        }).join('')}
                    </div>` : ''}
                ` : ''}
            `;
            intelEl.querySelectorAll('[data-prep-action]').forEach((button) => button.addEventListener('click', () => {
                const heroId = button.dataset.heroId;
                if (button.dataset.prepAction === 'deploy') {
                    const hero = this.ui.game.activeTeam?.find((candidate) => candidate.id === heroId);
                    if (!hero) return;
                    this.ui.game.inputManager?.setPlacementMode(hero);
                    this.ui.showToast(`${hero.name}: elige una posicion`, 'info');
                    this.ui.game.audio?.play('ui');
                }
                if (button.dataset.prepAction === 'upgrade') {
                    this.ui.quickUpgradeHeroById(heroId);
                }
            }));
            intelEl.querySelectorAll('[data-branch]').forEach((button) => button.addEventListener('click', () => {
                const changed = this.ui.game.waveManager?.chooseBranch(button.dataset.branch);
                if (changed) this.ui.renderHeroRoster(this.ui.game.activeTeam, (hero) => this.ui.game.inputManager.setPlacementMode(hero));
                this.ui.game.audio?.play('ui');
            }));
        }
        document.getElementById('enemy-info-empty')?.classList.remove('hidden');
        document.getElementById('enemy-info-content')?.classList.add('hidden');
        container.innerHTML = '';

        uniqueEnemies.forEach((enemy) => {
            const intel = this.buildEnemyIntel(enemy);
            const traitPreview = this.buildEnemyTraitPreview(intel.traits, 2);
            const model = buildWaveEnemyCardModel(enemy, intel, traitPreview);
            const card = document.createElement('button');
            card.className = `wave-enemy-card ${normalizeClassToken(model.danger, 'low')}`;
            card.dataset.testid = 'wave-enemy-card';
            card.style.setProperty('--enemy-color', model.color);
            card.dataset.tooltip = model.tooltip;
            card.title = model.title;
            card.setAttribute('aria-label', model.ariaLabel);
            const traitsMarkup = model.traits.map((trait) => {
                const className = String(trait).startsWith('+') ? ' class="trait-overflow"' : '';
                return `<b${className}>${escapeHtml(trait)}</b>`;
            }).join('');
            card.innerHTML = `
                ${model.portrait
                    ? `<span class="enemy-token enemy-token-sprite"><img src="${escapeHtml(model.portrait)}" alt="" loading="lazy"></span>`
                    : `<span class="enemy-token">${escapeHtml(model.initial)}</span>`}
                <span class="enemy-count">${escapeHtml(model.countLabel)}</span>
                <strong>${escapeHtml(model.name)}</strong>
                <span class="enemy-role">${escapeHtml(model.roleLine)}</span>
                <small class="enemy-traits" title="${escapeHtml(model.traitTitle)}">${traitsMarkup}</small>
                <em><i class="fas fa-crosshairs"></i>${escapeHtml(model.counter)}</em>
                <small>${escapeHtml(model.metaLine)}</small>
            `;
            card.addEventListener('click', () => this.ui.inspectUnit(enemy, true));
            container.appendChild(card);
        });
    }

    renderDamageCheck(check) {
        if (!check) return '';
        const meter = this.buildWaveDamageCheckMeter(check);
        const contributors = (check.contributors || [])
            .filter(Boolean)
            .slice(0, 3)
            .map((entry) => `${entry.name} ${entry.share}%`);
        const contributorCopy = contributors.length ? ` Aportes: ${contributors.join(', ')}.` : '';
        const contributorMarkup = contributors.length
            ? `<small class="wave-damage-contributors"><i class="fas fa-users-rays"></i>${contributors.map((entry) => `<span>${escapeHtml(entry)}</span>`).join('')}</small>`
            : '';
        const supports = (check.supports || [])
            .filter(Boolean)
            .slice(0, 4)
            .map((entry) => `${entry.name} ${entry.label}${entry.range ? ` r${entry.range}` : ''}${entry.detectStealth ? ' +vision' : ''}`);
        const supportCopy = supports.length ? ` Soportes: ${supports.join(', ')}.` : '';
        const supportMarkup = supports.length
            ? `<small class="wave-damage-supports"><i class="fas fa-broadcast-tower"></i>${supports.map((entry) => `<span>${escapeHtml(entry)}</span>`).join('')}</small>`
            : '';
        const warnings = (check.warnings || []).filter(Boolean).slice(0, 3);
        const warningCopy = warnings.length ? ` Alertas: ${warnings.map((entry) => `${entry.label}: ${entry.detail}`).join(', ')}.` : '';
        const warningMarkup = warnings.length
            ? `<small class="wave-damage-alerts">${warnings.map((entry) => `<span title="${escapeHtml(entry.detail)}" data-tooltip="${escapeHtml(entry.detail)}"><i class="fas ${normalizeIconClass(entry.icon)}"></i>${escapeHtml(entry.label)}</span>`).join('')}</small>`
            : '';
        return `<div class="wave-damage-check ${normalizeClassToken(check.tone, 'neutral')}" aria-label="${escapeHtml(`${check.label}: ${check.detail}. ${meter.ariaLabel}. DPS ${check.dps}.${contributorCopy}${supportCopy}${warningCopy}`)}" style="--damage-fill: ${clampPercent(meter.fillPct)}%">
            <i class="fas fa-chart-line"></i>
            <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.detail)}</span></div>
            <b>${formatCompactMetric(check.expectedDamage)}/${formatCompactMetric(check.requiredDamage)}</b>
            <small class="wave-damage-readout">DPS ${formatCompactMetric(check.dps)} <b class="wave-damage-gap ${normalizeClassToken(meter.gapTone, 'neutral')}">${escapeHtml(meter.gapLabel)}</b></small>
            ${warningMarkup}
            ${supportMarkup}
            ${contributorMarkup}
            <div class="wave-damage-meter" aria-hidden="true"><span></span><em>${escapeHtml(meter.label)}</em></div>
        </div>`;
    }
}
