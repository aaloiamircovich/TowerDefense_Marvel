import { getHeroUpgradeTree } from '../data/HeroUpgradeCatalog.js';
import { CampaignPanel } from '../ui/CampaignPanel.js';
import { ProfilePanel } from '../ui/ProfilePanel.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';
import { TooltipController } from '../ui/TooltipController.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { TeamBuilderPanel } from '../ui/TeamBuilderPanel.js';
import { getActiveSets, ITEM_SLOTS, SET_BONUSES, SLOT_LABELS } from './ItemEffectSystem.js';

export function buildWaveLaunchState(enabled, summary = null) {
    if (!enabled) {
        return {
            tier: 'active',
            primary: 'OLEADA EN CURSO',
            secondary: 'Defensa activa',
            ariaLabel: 'Oleada en curso',
            tooltip: 'La oleada actual sigue activa'
        };
    }

    const tier = summary?.threatTier?.id || 'low';
    const tierLabel = summary?.threatTier?.label || 'Amenaza baja';
    const score = summary?.pressureScore ?? 0;
    const primary = tier === 'critical'
        ? 'INICIAR CON RIESGO'
        : tier === 'high'
            ? 'INICIAR ALERTA'
            : 'INICIAR OLEADA';

    return {
        tier,
        primary,
        secondary: `${tierLabel} · ${score}`,
        ariaLabel: `${primary}. ${tierLabel}. Puntaje ${score}.`,
        tooltip: summary?.threatTier?.advice || 'Iniciar siguiente oleada'
    };
}

const PIERCING_HERO_IDS = new Set(['iron_man', 'vision', 'hawkeye', 'winter_soldier', 'cyclops', 'silver_surfer']);

function hasTextMatch(config, patterns) {
    const text = [
        config.niche,
        config.ability,
        config.abilityDesc,
        ...(config.tags || [])
    ].filter(Boolean).join(' ').toLowerCase();
    return patterns.some((pattern) => text.includes(pattern));
}

export function evaluateHeroWaveFit(hero, summary = null, credits = 0) {
    const config = hero?.config || hero || {};
    if (!summary || !config.id) {
        return { id: 'neutral', label: 'Sin lectura', score: 0, reasons: [] };
    }

    const metrics = config.teamMetrics || {};
    const roles = new Set(summary.roles || []);
    const reasons = [];
    let score = 0;
    const damage = Number(config.damage || 0);
    const fireRate = Number(config.fireRate || 1);
    const range = Number(config.range || 0);
    const dps = damage * fireRate;

    const detectsStealth = Boolean(config.canSeeStealth)
        || Number(metrics.detection || 0) >= 4
        || hasTextMatch(config, ['sigilo', 'deteccion', 'rastreo', 'edith']);
    const piercesArmor = PIERCING_HERO_IDS.has(config.id)
        || hasTextMatch(config, ['armadura', 'perfor', 'atraviesa', 'antiarmadura', 'laser']);
    const controlsCrowd = Number(metrics.control || 0) >= 4
        || hasTextMatch(config, ['ralent', 'inmovil', 'aturd', 'control', 'red']);
    const hasReach = range >= 150;
    const affordable = Number(config.cost || 0) <= Number(credits || 0);

    if ((summary.stealthCount > 0 || roles.has('stealth') || roles.has('phaser')) && detectsStealth) {
        score += 5;
        reasons.push('detecta sigilo');
    }

    if ((summary.armoredCount > 0 || summary.barrierCount > 0 || roles.has('tank') || roles.has('shield')) && piercesArmor) {
        score += 4;
        reasons.push('rompe armadura');
    }

    if ((roles.has('runner') || Number(summary.fastest || 0) >= 95) && controlsCrowd) {
        score += 4;
        reasons.push('frena corredores');
    }

    if ((roles.has('flying') || Number(summary.fastest || 0) >= 110) && hasReach) {
        score += 2;
        reasons.push('cubre distancia');
    }

    if (summary.hasBoss && dps >= 42) {
        score += 4;
        reasons.push('DPS de jefe');
    } else if (Number(summary.pressureScore || 0) >= 12 && dps >= 34) {
        score += 2;
        reasons.push('dano sostenido');
    }

    if (!reasons.length && dps >= 38 && hasReach) {
        score += 1;
        reasons.push('perfil versatil');
    }

    if (affordable && score > 0) {
        score += 1;
        reasons.push('asequible ahora');
    }

    if (score >= 6) return { id: 'prime', label: 'Counter ideal', score, reasons: reasons.slice(0, 3) };
    if (score >= 3) return { id: 'good', label: 'Buen ajuste', score, reasons: reasons.slice(0, 3) };
    return { id: 'neutral', label: 'Neutro', score, reasons: reasons.slice(0, 2) };
}

export class UIManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.overlay = document.getElementById('panel-overlay');
        this.panelContent = document.getElementById('panel-content');
        this.heroGrid = document.querySelector('.hero-grid');
        this.selectionStatus = document.getElementById('selection-status');
        this.toastEl = document.getElementById('toast');

        this.livesEl = document.getElementById('ui-lives');
        this.creditsEl = document.getElementById('ui-credits');
        this.waveEl = document.getElementById('ui-wave');
        this.levelNameEl = document.getElementById('ui-level-name');
        this.fpsEl = document.getElementById('fps-display');
        this.starsEl = document.getElementById('ui-stars');
        this.operationTitleEl = document.getElementById('operation-title');
        this.operationCopyEl = document.getElementById('operation-copy');
        this.operationKickerEl = document.getElementById('operation-kicker');

        this.shopInitialized = false;
        this.shopSlots = [null, null, null];
        this.itemPool = [];
        this.toastTimer = null;
        this.lastFocusedElement = null;
        this.nextWaveSummary = null;
        this.profilePanel = new ProfilePanel(this);
        this.campaignPanel = new CampaignPanel(this);
        this.settingsPanel = new SettingsPanel(this);
        this.inventoryPanel = new InventoryPanel(this);
        this.teamBuilderPanel = new TeamBuilderPanel(this);
        this.tooltipController = new TooltipController();

        this.initListeners();
    }

    initListeners() {
        document.querySelectorAll('.hub-btn').forEach((button) => {
            button.addEventListener('click', () => this.openPanel(button.dataset.panel));
        });

        document.getElementById('close-panel-btn')?.addEventListener('click', () => this.closePanel());
        document.getElementById('next-wave-btn')?.addEventListener('click', () => {
            if (this.game.waveManager && !this.game.waveManager.isWaveActive) this.game.waveManager.startNextWave();
        });

        const btnPause = document.getElementById('btn-pause');
        const btnAuto = document.getElementById('btn-auto');
        const btnSpeed = document.getElementById('btn-speed');

        btnPause?.addEventListener('click', () => {
            this.setManualPause(!this.game.isManuallyPaused);
        });

        btnAuto?.addEventListener('click', () => {
            if (!this.game.waveManager) return;
            this.game.waveManager.autoWave = !this.game.waveManager.autoWave;
            btnAuto.classList.toggle('active', this.game.waveManager.autoWave);
            btnAuto.classList.toggle('muted', !this.game.waveManager.autoWave);
            btnAuto.setAttribute('aria-pressed', String(this.game.waveManager.autoWave));
            if (this.game.waveManager.autoWave && !this.game.waveManager.isWaveActive) this.game.waveManager.startNextWave();
        });

        btnSpeed?.addEventListener('click', () => {
            const speeds = [1, 2, 3, 4];
            const nextIndex = (speeds.indexOf(this.game.gameSpeed) + 1) % speeds.length;
            this.game.gameSpeed = speeds[nextIndex];
            btnSpeed.innerHTML = `x${this.game.gameSpeed} <i class="fas fa-rocket"></i>`;
        });

        window.addEventListener('pointerdown', () => this.game.audio?.unlock(), { once: true });
        window.addEventListener('keydown', () => this.game.audio?.unlock(), { once: true });
        window.addEventListener('keydown', (event) => this.handleDialogKeydown(event));
    }

    openPanel(type) {
        this.tooltipController.hide();
        this.lastFocusedElement = document.activeElement;
        this.game.pause();
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn').classList.remove('hidden');
        this.game.audio?.play('ui');
        this.renderPanel(type);
        window.requestAnimationFrame(() => document.getElementById('close-panel-btn')?.focus());
    }

    closePanel() {
        this.overlay.classList.add('hidden');
        if (!this.game.isManuallyPaused && !this.game.isGameOver) this.game.start();
        this.lastFocusedElement?.focus?.();
    }

    handleDialogKeydown(event) {
        if (this.overlay.classList.contains('hidden')) return;
        if (event.key === 'Escape' && !document.getElementById('close-panel-btn')?.classList.contains('hidden')) {
            event.preventDefault();
            this.closePanel();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [...this.overlay.querySelectorAll('button:not([disabled]), select, input, [tabindex="0"]')]
            .filter((element) => !element.classList.contains('hidden'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    setSelectionStatus(text) {
        if (this.selectionStatus) this.selectionStatus.textContent = text;
    }

    setManualPause(paused, announce = true) {
        this.game.isManuallyPaused = Boolean(paused);
        if (this.game.isManuallyPaused) this.game.pause();
        else this.game.start();

        const button = document.getElementById('btn-pause');
        if (button) {
            button.innerHTML = this.game.isManuallyPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
            button.classList.toggle('active', this.game.isManuallyPaused);
            button.setAttribute('aria-pressed', String(this.game.isManuallyPaused));
            button.setAttribute('aria-label', this.game.isManuallyPaused ? 'Reanudar' : 'Pausar');
            button.dataset.tooltip = this.game.isManuallyPaused ? 'Reanudar partida' : 'Entrar en pausa táctica';
        }
        document.body.classList.toggle('tactical-paused', this.game.isManuallyPaused);
        if (announce) this.showToast(this.game.isManuallyPaused ? 'Pausa táctica: inspecciona y reorganiza' : 'Partida reanudada', 'info');
        return this.game.isManuallyPaused;
    }

    setNextWaveEnabled(enabled, summary = null) {
        const button = document.getElementById('next-wave-btn');
        if (!button) return;
        if (summary) this.nextWaveSummary = summary;
        const state = buildWaveLaunchState(enabled, summary || this.nextWaveSummary);
        button.disabled = !enabled;
        button.className = `btn-primary next-wave-cta threat-${state.tier}`;
        button.dataset.threatTier = state.tier;
        button.dataset.tooltip = state.tooltip;
        button.title = state.tooltip;
        button.setAttribute('aria-label', state.ariaLabel);

        const primary = document.createElement('strong');
        const secondary = document.createElement('small');
        primary.textContent = state.primary;
        secondary.textContent = state.secondary;
        button.replaceChildren(primary, secondary);
    }

    updateUI(lives, credits, wave, fps, stars) {
        if (this.livesEl) this.livesEl.textContent = lives;
        if (this.creditsEl) this.creditsEl.textContent = Math.floor(credits);
        if (this.waveEl) this.waveEl.textContent = wave;
        if (this.fpsEl) this.fpsEl.textContent = `${Math.round(fps || 0)} FPS`;
        if (this.starsEl && stars !== undefined) this.starsEl.textContent = stars;
    }

    updatePerformance(snapshot, poolStats = {}) {
        if (!this.fpsEl) return;
        this.fpsEl.textContent = `${Math.round(snapshot.fps)} FPS`;
        this.fpsEl.classList.toggle('performance-warning', snapshot.p95Ms > 16.67);
        this.fpsEl.title = `Frame promedio ${snapshot.averageMs.toFixed(2)} ms · p95 ${snapshot.p95Ms.toFixed(2)} ms · pico ${snapshot.peakEntities} entidades · ${poolStats.reused || 0} proyectiles reutilizados`;
    }

    updateLevelTheme(levelConfig) {
        if (this.levelNameEl) this.levelNameEl.textContent = levelConfig.theme?.label || levelConfig.name || 'Mapa';
        document.documentElement.style.setProperty('--level-accent', levelConfig.theme?.accent || '#40c9ff');
        if (this.operationKickerEl) this.operationKickerEl.textContent = levelConfig.theme?.label || 'Operacion';
        if (this.operationTitleEl) this.operationTitleEl.textContent = levelConfig.mission?.operation || levelConfig.name || 'Mision tactica';
        if (this.operationCopyEl) {
            const speaker = levelConfig.mission?.speaker ? `${levelConfig.mission.speaker}: ` : '';
            this.operationCopyEl.textContent = `${speaker}${levelConfig.theme?.brief || levelConfig.description || 'Defiende la ruta principal.'}`;
        }
        this.game.audio?.setTheme(levelConfig.theme?.id || 'new-york');
    }

    updateMissionStatus(snapshot) {
        const container = document.getElementById('mission-status');
        if (!container || !snapshot) return;
        const specialStatus = snapshot.blackout > 0
            ? `<b>Corte: ${snapshot.blackout}s</b>`
            : snapshot.shieldCharges > 0
                ? `<b>Escudo: ${snapshot.shieldCharges} · Vibranium ${snapshot.vibranium}/6</b>`
                : '';
        container.innerHTML = `
            <div class="mission-heading"><strong>${snapshot.operation}</strong><span>${snapshot.mechanicLabel}</span></div>
            <p>${snapshot.message}</p>
            ${specialStatus}
            <div class="mission-objectives-mini">
                ${snapshot.objectives.map((objective) => `<span class="${objective.complete ? 'done' : ''}">${objective.complete ? '✓' : `${objective.value}/${objective.target}`} ${objective.label}</span>`).join('')}
            </div>
        `;
    }

    updateModeStatus(snapshot) {
        const container = document.getElementById('mode-status');
        if (!container) return;
        if (!snapshot) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return;
        }
        container.classList.remove('hidden');
        container.innerHTML = `<div><strong>${snapshot.name}</strong><span>${snapshot.detail}</span></div><b>${snapshot.score} pts</b>${snapshot.canExtract ? '<button id="extract-mode" class="btn-mode-action">Extraer</button>' : ''}${snapshot.canRepair ? '<button id="repair-mode" class="btn-mode-action">Reparar +2 · $120</button>' : ''}`;
        document.getElementById('extract-mode')?.addEventListener('click', () => this.game.modeSystem.extract());
        document.getElementById('repair-mode')?.addEventListener('click', () => this.game.modeSystem.repair());
    }

    showDraftChoice(heroes, onChoose) {
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.add('hidden');
        this.panelContent.innerHTML = `<div class="draft-choice"><span class="briefing-kicker">DRAFT HEROICO</span><h2>Elige un refuerzo</h2><div>${heroes.map((hero) => `<button data-draft="${hero.id}">${this.renderSprite(hero.visual?.portrait || hero.sprite, hero.name)}<strong>${hero.name}</strong><small>${hero.niche || hero.ability}</small></button>`).join('')}</div></div>`;
        this.panelContent.querySelectorAll('[data-draft]').forEach((button) => button.addEventListener('click', () => onChoose(button.dataset.draft)));
    }

    showModeResult(title, snapshot) {
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.add('hidden');
        this.panelContent.innerHTML = `<div class="end-state"><h2>${title}</h2><p>${snapshot.score} puntos · oleada ${snapshot.wave} · récord ${snapshot.best}</p>${this.renderMissionSummary(this.game.progression?.state.lastMissionSummary)}<button class="btn-primary" id="mode-result-map">Volver a modos</button></div>`;
        document.getElementById('mode-result-map')?.addEventListener('click', () => {
            document.getElementById('close-panel-btn')?.classList.remove('hidden');
            this.renderMap('Mapa y modos');
        });
    }

    showToast(message, type = 'info') {
        if (!this.toastEl) return;
        window.clearTimeout(this.toastTimer);
        this.toastEl.textContent = message;
        this.toastEl.className = `toast ${type}`;
        if (type === 'success') this.game.audio?.play('confirm');
        if (type === 'warning') this.game.audio?.play('warning');
        if (type === 'reward') this.game.audio?.play('reward');
        this.toastTimer = window.setTimeout(() => this.toastEl.classList.add('hidden'), 2200);
    }

    renderWavePreview(uniqueEnemies, modifier = null, faction = null, waveNumber = 1, summary = null) {
        const container = document.getElementById('wave-preview');
        const numberEl = document.getElementById('next-wave-number');
        const intelEl = document.getElementById('wave-intel');
        if (!container) return;

        if (numberEl) numberEl.textContent = waveNumber;
        if (intelEl) {
            intelEl.innerHTML = `
                <strong>${faction?.label || 'Amenaza desconocida'}</strong>
                <span>${modifier?.label || 'Oleada estándar'}: ${modifier?.description || ''}</span>
                ${summary ? `
                    <div class="wave-threat ${summary.threatTier?.id || 'low'}" aria-label="${summary.threatTier?.label || 'Amenaza baja'}: ${summary.threatTier?.advice || 'Buen momento para ahorrar.'} Puntaje ${summary.pressureScore || 0}">
                        <div><strong>${summary.threatTier?.label || 'Amenaza baja'}</strong><span>${summary.threatTier?.advice || 'Buen momento para ahorrar.'}</span></div>
                        <b>${summary.pressureScore || 0}</b>
                    </div>
                    <div class="wave-readiness ${summary.readiness?.id || 'empty'}" aria-label="${summary.readiness?.label || 'Sin defensa'}: ${summary.readiness?.advice || 'Despliega al menos un heroe antes de iniciar.'}">
                        <div><strong>${summary.readiness?.label || 'Sin defensa'}</strong><span>${summary.readiness?.advice || 'Despliega al menos un heroe antes de iniciar.'}</span></div>
                        <b>${summary.readiness?.score || 0}</b>
                    </div>
                    <div class="wave-summary">
                        <span><b>${summary.total}</b> enemigos</span>
                        <span><b>$${summary.reward}</b> botín</span>
                        <span><b>${summary.fastest}</b> vel. máx.</span>
                        <span><b>${summary.maxThreat}/5</b> amenaza</span>
                    </div>
                    <small class="wave-counter"><i class="fas fa-crosshairs"></i> Respuesta: ${summary.counter}</small>
                    ${summary.branchOptions?.length ? `<div class="wave-branches" aria-label="Ruta de encuentro">
                        ${summary.branchOptions.map((option) => `<button type="button" data-branch="${option.id}" class="${summary.selectedBranch === option.id ? 'active' : ''}" title="${option.description}">${option.label}</button>`).join('')}
                    </div>` : ''}
                ` : ''}
            `;
            intelEl.querySelectorAll('[data-branch]').forEach((button) => button.addEventListener('click', () => {
                const changed = this.game.waveManager?.chooseBranch(button.dataset.branch);
                if (changed) this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
                this.game.audio?.play('ui');
            }));
        }
        document.getElementById('enemy-info-empty')?.classList.remove('hidden');
        document.getElementById('enemy-info-content')?.classList.add('hidden');
        container.innerHTML = '';

        const roles = {
            runner: 'Corredor', tank: 'Tanque', shield: 'Escudo', stealth: 'Sigilo',
            flying: 'Volador', summoner: 'Invocador', support: 'Soporte', commander: 'Comandante', phaser: 'Faseador', boss: 'Jefe', soldier: 'Soldado'
        };
        const categoryColors = {
            Tecnológico: '#40c9ff', Místico: '#b865ff', Urbano: '#e63946',
            Cósmico: '#ff8bd1', Mutante: '#c7f464'
        };

        uniqueEnemies.forEach((enemy) => {
            const card = document.createElement('button');
            card.className = 'wave-enemy-card';
            card.style.setProperty('--enemy-color', categoryColors[enemy.category] || '#fca311');
            card.title = `${enemy.name} | ${roles[enemy.archetype] || 'Soldado'} | Amenaza ${enemy.threat || 1}/5`;
            card.innerHTML = `
                <span class="enemy-token">${enemy.name.charAt(0)}</span>
                <span class="enemy-count">x${enemy.previewCount || 1}</span>
                <strong>${roles[enemy.archetype] || (enemy.isBoss ? 'Jefe' : 'Soldado')}</strong>
                <small>${enemy.affix?.label ? `${enemy.affix.label} · ` : ''}${enemy.stealth ? 'Sigilo · ' : ''}${'◆'.repeat(Math.max(1, enemy.threat || 1))}</small>
            `;
            card.addEventListener('click', () => this.inspectUnit(enemy, true));
            container.appendChild(card);
        });
    }

    inspectUnit(unit, isEnemyFlag = false) {
        if (!unit) return;
        this.tooltipController.hide();

        const isEnemy = isEnemyFlag || (unit.hp !== undefined && unit.takeDamage !== undefined);
        if (isEnemy) {
            document.getElementById('enemy-info-empty')?.classList.add('hidden');
            document.getElementById('enemy-info-content')?.classList.remove('hidden');
            document.getElementById('en-info-name').textContent = (unit.name || 'Enemigo').toUpperCase();
            document.getElementById('en-info-hp').textContent = `${Math.ceil(unit.hp || 0)} / ${Math.ceil(unit.maxHp || unit.hp || 0)}`;
            document.getElementById('en-info-speed').textContent = Math.round(unit.speed || 0);
            document.getElementById('en-info-armor').textContent = `${Math.round((unit.armor || 0) * 100)}%`;
            document.getElementById('en-info-reward').textContent = `$${unit.reward ?? 10}`;
            document.getElementById('en-info-faction').textContent = unit.faction || 'Independiente';
            document.getElementById('en-info-role').textContent = this.getEnemyRole(unit.archetype, unit.isBoss);
            document.getElementById('en-info-resists').textContent = this.getResistanceText(unit);
            document.getElementById('en-info-threat').textContent = `${unit.threat || 1} / 5`;
            document.getElementById('en-info-phase').textContent = unit.currentPhase || (unit.phases?.length ? `${unit.phases.length} fases` : '-');
            return;
        }

        this.game.pause();
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.remove('hidden');
        this.renderHeroDetails(unit);
    }

    renderHeroDetails(hero) {
        const config = hero.config || hero;
        const level = hero.level || config.level || 1;
        const bonuses = this.game.progression?.getHeroBonuses(config.id) || {};
        const effectiveStats = hero.getEffectiveStats?.();
        const baseDamage = Math.round(hero.damage || config.damage || 0);
        const baseRange = Math.round(hero.range || config.range || 0);
        const baseFireRate = Number(hero.fireRate || config.fireRate || 1);
        const baseCritChance = Math.round(hero.critChance || config.critChance || 5);
        const damage = Math.round(effectiveStats?.damage || (hero.damage || config.damage || 0) * (1 + (bonuses.damage || 0)));
        const range = Math.round(effectiveStats?.range || (hero.range || config.range || 0) * (1 + (bonuses.range || 0)));
        const fireRate = Number(effectiveStats?.fireRate || (hero.fireRate || config.fireRate || 1) * (1 + (bonuses.fireRate || 0))).toFixed(1);
        const critChance = Math.round(effectiveStats?.critChance || (hero.critChance || config.critChance || 5) + (bonuses.critChance || 0));
        const terrains = this.getTerrainText(hero.allowedTerrains || config.allowedTerrains || [1]);
        const equippedSlots = this.game.progression?.state.equippedItems[config.id] || {};
        const items = hero.items?.length
            ? hero.items
            : Object.values(equippedSlots).map((itemId) => this.game.itemDatabase?.[itemId]).filter(Boolean);
        const itemBySlot = Object.fromEntries(items.map((item) => [item.slot, item]));
        const activeSets = getActiveSets(items);
        const combat = hero.combatStats || {};
        const abilityState = hero.abilitySystem?.getDisplayState?.() || null;
        const kitControl = hero.abilitySystem?.getControlState?.() || null;
        const isUnlocked = this.game.progression?.state.unlockedHeroIds.includes(config.id) ?? true;
        const isDeployed = this.game.heroes.includes(hero);
        const repositionPermission = isDeployed ? this.game.tacticalActions?.canReposition(hero) : null;
        const sellPermission = isDeployed ? this.game.tacticalActions?.canSell(hero) : null;
        const sellRefund = isDeployed ? this.game.tacticalActions?.getSellRefund(hero) || 0 : 0;
        const formationStatus = isDeployed ? this.game.teamSynergy?.getFormationStatus(hero) : null;

        this.panelContent.innerHTML = `
            <div class="hero-detail">
                <section class="hero-portrait">
                    <h2>${hero.name}</h2>
                    <div class="portrait-frame">${this.renderSprite(config.visual?.portrait || config.sprite, hero.name)}</div>
                    <div class="level-chip">Nivel ${level}</div>
                    ${isUnlocked ? `<div class="upgrade-list">
                        ${[1, 5, 10].map((amount) => {
                            const cost = this.calculateLevelCost(level, amount);
                            return `<button class="modal-btn-upgrade btn-primary ghost" data-amt="${amount}" data-cost="${cost}">+${amount} $${cost}</button>`;
                        }).join('')}
                    </div>` : '<div class="locked-hero-note"><i class="fas fa-lock"></i> Recluta al héroe para mejorarlo</div>'}
                    ${isDeployed ? `
                        <div class="tactical-actions">
                            <button id="reposition-hero" class="btn-primary ghost" ${repositionPermission?.ok ? '' : 'disabled'} title="${repositionPermission?.reason || 'Mover una vez por oleada'}"><i class="fas fa-arrows-alt"></i> Reposicionar</button>
                            <button id="sell-hero" class="btn-primary danger" ${sellPermission?.ok ? '' : 'disabled'} title="${sellPermission?.reason || 'Retirar héroe'}"><i class="fas fa-coins"></i> Vender $${sellRefund}</button>
                        </div>
                    ` : ''}
                </section>

                <section class="detail-stack">
                    <div class="stats-grid">
                        <div class="detail-card">
                            <h3>Estadísticas</h3>
                            <p data-tooltip="Daño por impacto antes de armadura y resistencias"><span>Daño</span><strong>${damage}${this.formatStatDelta(damage, baseDamage)}</strong></p>
                            <p data-tooltip="Ataques realizados por segundo"><span>Recarga</span><strong>${fireRate}/s${this.formatStatDelta(Number(fireRate), baseFireRate, '', 1)}</strong></p>
                            <p data-tooltip="Probabilidad de infligir daño crítico"><span>Crítico</span><strong>${critChance}%${this.formatStatDelta(critChance, baseCritChance, '%')}</strong></p>
                            <p data-tooltip="Distancia máxima de adquisición de objetivos"><span>Alcance</span><strong>${range}${this.formatStatDelta(range, baseRange)}</strong></p>
                        </div>
                        <div class="detail-card">
                            <h3>Táctica</h3>
                            <p><span>Terreno</span><strong>${terrains}</strong></p>
                            ${formationStatus ? `<p><span>Formación</span><strong class="formation-state ${formationStatus.active ? 'active' : ''}">${formationStatus.label} · ${formationStatus.active ? 'Activa' : 'En espera'}</strong></p>` : ''}
                            <label class="field-label" for="targeting-select">Apuntar a</label>
                            <select id="targeting-select">
                                ${['Primero', 'Último', 'Fuerte', 'Débil', 'Rápido', 'Sigilo', 'Jefe'].map((priority) => `<option value="${priority}" ${hero.targetingPriority === priority ? 'selected' : ''}>${priority}</option>`).join('')}
                            </select>
                        </div>
                        <div class="detail-card">
                            <h3>Combate</h3>
                            <p><span>Daño total</span><strong>${Math.round(combat.damageDealt || 0)}</strong></p>
                            <p><span>Bajas</span><strong>${combat.kills || 0}</strong></p>
                            <p><span>Disparos</span><strong>${combat.shots || 0}</strong></p>
                            <p><span>Críticos</span><strong>${combat.crits || 0}</strong></p>
                            <p><span>Habilidades</span><strong>${combat.abilityActivations || 0}</strong></p>
                        </div>
                    </div>

                    <div class="ability-card">
                        <h3>${config.ability || 'Ataque básico'}</h3>
                        <p>${config.abilityDesc || 'Ataca al enemigo objetivo con su daño base.'}</p>
                        ${config.niche ? `<div class="ability-niche">Rol táctico: <strong>${config.niche}</strong></div>` : ''}
                        ${abilityState ? `
                            <div class="ability-status ${abilityState.ready ? 'ready' : ''}">
                                <span>${abilityState.label}</span>
                                ${abilityState.progress === null ? '' : `<div class="ability-meter"><i style="width:${Math.round(abilityState.progress * 100)}%"></i></div>`}
                            </div>
                        ` : ''}
                        ${kitControl ? `
                            <div class="kit-mode-control" role="group" aria-label="${kitControl.label}">
                                <span>${kitControl.label}</span>
                                <div>
                                    ${kitControl.options.map((option) => `<button class="kit-mode-btn ${option.id === kitControl.value ? 'active' : ''}" data-mode="${option.id}" aria-pressed="${option.id === kitControl.value}">${option.label}</button>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    ${this.renderUpgradeTree(config, isUnlocked)}

                    <div class="equipment-card">
                        <h3>Equipamiento</h3>
                        <div class="hero-equipment-slots">
                            ${ITEM_SLOTS.map((slot) => {
                                const item = itemBySlot[slot];
                                return `<div class="item-slot ${item ? 'filled' : ''}">
                                    <span>${SLOT_LABELS[slot]}</span>
                                    <strong>${item?.name || 'Ranura libre'}</strong>
                                    ${item ? `<small>Nivel ${item.forgeLevel || 1}</small><button class="btn-unequip-modal icon-command" data-slot="${slot}" title="Desequipar"><i class="fas fa-eject"></i></button>` : ''}
                                </div>`;
                            }).join('')}
                        </div>
                        <div class="set-status ${activeSets.length ? 'active' : ''}">${activeSets.length ? activeSets.map((set) => set.description).join(' · ') : 'Sin bonus de set activo'}</div>
                        <button id="open-inventory-panel" class="btn-primary ghost" ${isUnlocked ? '' : 'disabled'}><i class="fas fa-box-open"></i> ${isUnlocked ? 'Gestionar inventario' : 'Recluta para equipar'}</button>
                    </div>
                </section>
            </div>
        `;

        document.getElementById('targeting-select')?.addEventListener('change', (event) => {
            hero.targetingPriority = event.target.value;
            if (hero.config) hero.config.targetingPriority = event.target.value;
        });

        this.panelContent.querySelectorAll('.modal-btn-upgrade').forEach((button) => {
            button.addEventListener('click', () => {
                this.processUpgrade(hero, Number(button.dataset.amt), Number(button.dataset.cost));
            });
        });

        this.panelContent.querySelectorAll('.kit-mode-btn').forEach((button) => button.addEventListener('click', () => {
            if (!hero.abilitySystem?.setCombatMode?.(button.dataset.mode)) return;
            this.showToast(`${kitControl.label}: ${button.textContent}`, 'success');
            this.renderHeroRoster(this.game.activeTeam, (config) => this.game.inputManager.setPlacementMode(config));
            this.renderHeroDetails(hero);
        }));

        document.getElementById('reposition-hero')?.addEventListener('click', () => {
            if (this.game.inputManager.setRepositionMode(hero)) this.closePanel();
        });

        document.getElementById('sell-hero')?.addEventListener('click', () => {
            const result = this.game.inputManager.sellHero(hero);
            if (result.ok) this.closePanel();
        });

        this.panelContent.querySelectorAll('.skill-node').forEach((button) => {
            button.addEventListener('click', () => this.purchaseMetaUpgrade(config, button.dataset.node));
        });

        this.panelContent.querySelectorAll('.btn-unequip-modal').forEach((button) => button.addEventListener('click', () => {
            this.game.progression.unequipItem(config.id, button.dataset.slot);
            this.showToast('Objeto devuelto al inventario', 'success');
            const deployed = this.game.heroes.find((unit) => unit.id === config.id);
            this.renderHeroDetails(deployed || config);
        }));
        document.getElementById('open-inventory-panel')?.addEventListener('click', () => {
            this.inventoryPanel.heroId = config.id;
            this.renderPanel('inventory');
        });
    }

    renderUpgradeTree(hero, isUnlocked = true) {
        if (!this.game.progression) return '';
        const purchased = new Set(this.game.progression.state.heroUpgrades[hero.id] || []);
        return `
            <section class="upgrade-tree">
                <div class="tree-heading">
                    <h3>Árbol de mejora</h3>
                    <span>${this.game.progression.state.metaCredits} Fondos S.H.I.E.L.D.</span>
                </div>
                <div class="tree-branches">
                    ${getHeroUpgradeTree(hero).map((branch) => `
                        <div class="tree-branch">
                            <strong>${branch.name}</strong>
                            ${branch.nodes.map((node) => {
                                const owned = purchased.has(node.id);
                                const locked = node.requires && !purchased.has(node.requires);
                                return `<button class="skill-node ${owned ? 'owned' : ''}" data-node="${node.id}" ${owned || locked || !isUnlocked ? 'disabled' : ''}>
                                    <span>${node.name}</span><small>${node.desc}</small><b>${!isUnlocked ? 'Recluta primero' : owned ? 'Adquirida' : locked ? 'Bloqueada' : `${node.cost} F`}</b>
                                </button>`;
                            }).join('')}
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    purchaseMetaUpgrade(hero, nodeId) {
        const result = this.game.progression.purchaseUpgrade(hero, nodeId);
        if (!result.ok) {
            this.showToast(result.reason, 'warning');
            return;
        }
        this.showToast(`${result.node.name} adquirida`, 'success');
        const deployed = this.game.heroes.find((unit) => unit.id === hero.id);
        this.renderHeroDetails(deployed || hero);
    }

    calculateLevelCost(currentLevel, amount) {
        let total = 0;
        for (let i = 0; i < amount; i++) total += (currentLevel + i) * 120;
        return total;
    }

    processUpgrade(unit, amount, cost) {
        if (!this.game.resourceManager.removeCredits(cost)) {
            this.showToast('Créditos insuficientes para esta mejora', 'warning');
            return;
        }

        this.applyHeroLevelUpgrade(unit, amount);
        this.game.replaySystem?.record('upgrade', { heroId: unit.id, level: unit.level, cost });
        this.showToast(`${unit.name} subió a nivel ${unit.level}`, 'success');
        this.renderHeroDetails(unit);
    }

    quickUpgradeHero(unit) {
        if (!unit) return false;
        const cost = this.calculateLevelCost(unit.level || 1, 1);
        if (!this.game.resourceManager.removeCredits(cost)) {
            this.showToast('Creditos insuficientes para mejora de campo', 'warning');
            this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
            return false;
        }

        this.applyHeroLevelUpgrade(unit, 1);
        this.game.replaySystem?.record('upgrade', { heroId: unit.id, level: unit.level, cost, quick: true });
        this.showToast(`${unit.name} nivel ${unit.level} listo para combate`, 'success');
        this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
        this.updateUI(
            this.game.resourceManager.lives,
            this.game.resourceManager.credits,
            this.game.waveManager?.currentWave || 1,
            this.game.fps,
            this.game.stars
        );
        this.game.waveManager?.refreshWaveIntel?.();
        return true;
    }

    applyHeroLevelUpgrade(unit, amount) {
        const targetData = unit.config || unit;
        targetData.level = (targetData.level || unit.level || 1) + amount;
        targetData.baseDamage = targetData.baseDamage || targetData.damage || unit.damage || 10;
        targetData.baseRange = targetData.baseRange || targetData.range || unit.range || 100;
        targetData.damage = Math.floor(targetData.baseDamage * Math.pow(1.18, targetData.level - 1));
        targetData.range = targetData.baseRange + targetData.level * 3;

        unit.level = targetData.level;
        unit.damage = targetData.damage;
        unit.range = targetData.range;
    }

    refillShop() {
        for (let i = 0; i < 3; i++) {
            if (!this.shopSlots[i] && this.itemPool.length > 0) this.shopSlots[i] = this.itemPool.shift();
        }
    }

    renderPanel(type) {
        const title = {
            profile: 'Perfil',
            collection: 'Colección',
            inventory: 'Inventario',
            shop: 'Tienda',
            map: 'Mapa',
            settings: 'Ajustes'
        }[type] || type;

        if (type === 'shop') return this.renderShop(title);
        if (type === 'collection') return this.teamBuilderPanel.render('Constructor de equipo');
        if (type === 'inventory') return this.inventoryPanel.render(title);
        if (type === 'map') return this.renderMap(title);
        if (type === 'settings') return this.renderSettings(title);
        return this.renderProfile(title);
    }

    renderShop(title) {
        const rotation = this.game.shopSystem.getRotation();
        const funds = this.game.progression.state.metaCredits;

        this.panelContent.innerHTML = `
            <div class="panel-title-row"><h2>${title}</h2><strong>${funds} Fondos S.H.I.E.L.D.</strong></div>
            <div class="shop-layout">
                <section class="shop-feature">
                    <h3>Caja S.H.I.E.L.D.</h3>
                    <p>Recluta un héroe sin duplicados. Tras cuatro aperturas comunes, la siguiente garantiza Rare o Legendary.</p>
                    <div class="pity-track">Garantía: ${Math.min(4, this.game.progression.state.shop.heroPity)}/4</div>
                    <button class="btn-primary" id="gacha-btn">RECLUTAR POR 500 F</button>
                    <div id="gacha-res" class="result-copy"></div>
                </section>
                <section>
                    <h3>Rotación diaria · ${this.game.shopSystem.getRotationKey()}</h3>
                    <div class="shop-grid">
                        ${rotation.map((slot) => this.renderShopItem(slot.item, slot.purchased)).join('') || '<p class="empty-copy">Arsenal completado.</p>'}
                    </div>
                </section>
            </div>
        `;

        document.getElementById('gacha-btn')?.addEventListener('click', () => this.handleGacha());
        this.panelContent.querySelectorAll('.btn-buy-item').forEach((button) => {
            button.addEventListener('click', () => this.buyItem(button.dataset.id));
        });
    }

    formatStatDelta(current, base, suffix = '', decimals = 0) {
        const difference = current - base;
        if (Math.abs(difference) < 0.001) return '';
        const value = Math.abs(difference).toFixed(decimals);
        return `<small class="stat-delta ${difference < 0 ? 'negative' : ''}">${difference > 0 ? '+' : '-'}${value}${suffix}</small>`;
    }

    renderShopItem(item, purchased = false) {
        if (!item) return '<div class="shop-card empty-copy">Agotado</div>';
        const owned = this.game.progression.getOwnedQuantity(item.id);
        return `
            <div class="shop-card ${purchased ? 'purchased' : ''}">
                <div class="item-badge">T${item.tier || 1}</div>
                <div class="shop-item-heading">
                    ${this.renderSprite(item.icon, item.name)}
                    <div><small>${SLOT_LABELS[item.slot]} · ${SET_BONUSES[item.set]?.name || item.set}</small><h4>${item.name}</h4></div>
                </div>
                <p>${item.desc}</p>
                <small>Copias disponibles: ${owned}</small>
                <button class="btn-buy-item btn-primary ghost" data-id="${item.id}" ${purchased ? 'disabled' : ''}>${purchased ? 'ADQUIRIDO' : `${item.price} F`}</button>
            </div>
        `;
    }

    buyItem(itemId) {
        const result = this.game.shopSystem.purchaseItem(itemId);
        if (!result.ok) {
            this.showToast(result.reason, 'warning');
            return;
        }
        this.showToast(`${result.item.name} comprado`, 'success');
        this.renderShop('Tienda');
    }

    renderProfile(title) {
        this.profilePanel.render(title);
    }

    renderMap(title) {
        this.campaignPanel.render(title);
    }

    renderMissionBriefing(level) {
        this.campaignPanel.renderBriefing(level);
    }

    renderSettings(title) {
        this.settingsPanel.render(title);
    }

    renderStarterSelector(starters, onSelect) {
        this.game.pause();
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.add('hidden');

        this.panelContent.innerHTML = `
            <div class="starter-header">
                <h2>Elige tu héroe inicial</h2>
                <p>Tu primera defensa define el ritmo de las primeras oleadas.</p>
            </div>
            <div class="starter-grid">
                ${starters.map((hero) => `
                    <button class="starter-card" data-id="${hero.id}" data-testid="starter-${hero.id}">
                        ${this.renderSprite(hero.visual?.portrait || hero.sprite, hero.name)}
                        <strong>${hero.name}</strong>
                        <span>${hero.category} | $${hero.cost}</span>
                    </button>
                `).join('')}
            </div>
        `;

        this.panelContent.querySelectorAll('.starter-card').forEach((card) => {
            card.addEventListener('click', () => {
                const selected = starters.find((hero) => hero.id === card.dataset.id);
                document.getElementById('close-panel-btn')?.classList.remove('hidden');
                this.closePanel();
                onSelect(selected);
            });
        });
    }

    renderHeroRoster(activeTeam, onSelect) {
        if (!this.heroGrid) return;
        this.heroGrid.innerHTML = '';
        const waveSummary = this.nextWaveSummary || (!this.game.waveManager?.isWaveActive ? this.game.waveManager?.buildPreparedSummary?.() : null);
        const credits = this.game.resourceManager?.credits || 0;

        activeTeam.forEach((hero) => {
            const deployedHero = this.game.heroes.find((unit) => unit.id === hero.id);
            const deployed = Boolean(deployedHero);
            const fit = evaluateHeroWaveFit(deployedHero || hero, waveSummary, credits);
            const abilityState = deployedHero?.abilitySystem?.getDisplayState?.();
            const quickUpgradeCost = deployedHero ? this.calculateLevelCost(deployedHero.level || hero.level || 1, 1) : 0;
            const canQuickUpgrade = deployedHero && (this.game.resourceManager?.credits || 0) >= quickUpgradeCost;
            const rosterMeta = deployedHero
                ? `Nv.${deployedHero.level || hero.level || 1} | Mejora $${quickUpgradeCost}`
                : `$${hero.cost || 0} | ${hero.rarity || 'Common'}`;
            const card = document.createElement('article');
            card.className = `hero-card ${deployed ? 'deployed' : ''} wave-fit-${fit.id}`;
            card.dataset.testid = `hero-card-${hero.id}`;
            card.dataset.waveFit = fit.id;
            card.innerHTML = `
                ${this.renderSprite(hero.visual?.portrait || hero.sprite, hero.name)}
                <div>
                    <strong>${hero.name}</strong>
                    <span class="${deployedHero ? 'field-upgrade-meta' : ''}">${rosterMeta}</span>
                    ${fit.id !== 'neutral' ? `<small class="roster-wave-fit ${fit.id}" data-tooltip="${fit.reasons.join(' | ')}"><i class="fas fa-crosshairs"></i> ${fit.label}</small>` : ''}
                    ${abilityState ? `<small class="roster-ability ${abilityState.ready ? 'ready' : ''}">${abilityState.label}</small>` : ''}
                </div>
                <div class="hero-actions">
                    <button class="btn-action place-btn" data-testid="hero-place-${hero.id}" title="${deployed ? 'Reposicionar' : 'Colocar'}" aria-label="${deployed ? 'Reposicionar' : 'Colocar'}" data-tooltip="${deployed ? 'Mover una vez por oleada' : 'Colocar héroe'}"><i class="fas ${deployed ? 'fa-arrows-alt' : 'fa-map-marker-alt'}"></i></button>
                    ${deployedHero ? `<button class="btn-action upgrade-btn" data-testid="hero-upgrade-${hero.id}" title="Mejorar en campo" aria-label="Mejorar ${hero.name}" data-tooltip="Mejora rapida $${quickUpgradeCost}" ${canQuickUpgrade ? '' : 'disabled'}><i class="fas fa-arrow-up"></i></button>` : ''}
                    <button class="btn-action stats-btn" title="Mejoras" aria-label="Mejoras" data-tooltip="Estadísticas y mejoras"><i class="fas fa-chart-bar"></i></button>
                </div>
            `;
            card.querySelector('.place-btn').addEventListener('click', (event) => {
                event.stopPropagation();
                if (deployedHero) this.game.inputManager.setRepositionMode(deployedHero);
                else onSelect(hero);
            });
            card.querySelector('.stats-btn').addEventListener('click', (event) => {
                event.stopPropagation();
                const deployedHero = this.game.heroes.find((unit) => unit.id === hero.id);
                this.inspectUnit(deployedHero || hero);
            });
            card.querySelector('.upgrade-btn')?.addEventListener('click', (event) => {
                event.stopPropagation();
                this.quickUpgradeHero(deployedHero);
            });
            this.heroGrid.appendChild(card);
        });
    }

    handleGacha() {
        const result = this.game.shopSystem.recruitHero();
        if (!result.ok) {
            this.showToast(result.reason, 'warning');
            return;
        }
        this.showToast(`${result.hero.name} se unió a la plantilla`, 'success');
        this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
        this.renderShop('Tienda');
        document.getElementById('gacha-res').innerHTML = `Reclutado: <strong>${result.hero.name}</strong>${result.guaranteed ? ' · Garantía activada' : ''}`;
    }

    showGameOver() {
        this.game.audio?.play('warning');
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.add('hidden');
        const modeSnapshot = this.game.modeSystem?.getSnapshot();
        this.panelContent.innerHTML = `
            <div class="end-state">
                <h2>${modeSnapshot ? `${modeSnapshot.name}: finalizada` : 'Base destruida'}</h2>
                <p>Llegaste hasta la oleada ${this.game.waveManager?.currentWave || 1}.${modeSnapshot ? ` Puntuación ${modeSnapshot.score}.` : ' Ajusta el equipo y vuelve a intentarlo.'}</p>
                ${this.renderMissionSummary(this.game.progression?.state.lastMissionSummary)}
                <button class="btn-primary" id="retry-run">Reintentar</button>
            </div>
        `;
        document.getElementById('retry-run')?.addEventListener('click', () => {
            this.game.isGameOver = false;
            if (modeSnapshot) this.game.modeSystem.start(modeSnapshot.id);
            else this.game.loadLevel(this.game.currentLevel);
            this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
            this.closePanel();
            this.game.start();
        });
    }

    showVictory() {
        this.game.audio?.play('victory');
        const modeSnapshot = this.game.modeSystem?.getSnapshot();
        if (modeSnapshot) {
            this.showModeResult(`${modeSnapshot.name}: completado`, modeSnapshot);
            return;
        }
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.add('hidden');
        this.panelContent.innerHTML = `
            <div class="end-state">
                <h2>Victoria</h2>
                <p>Completaste el mapa con ${this.game.stars} estrellas.</p>
                ${this.renderMissionSummary(this.game.progression?.state.lastMissionSummary)}
                <button class="btn-primary" id="victory-close">Volver al mapa</button>
            </div>
        `;
        document.getElementById('victory-close')?.addEventListener('click', () => {
            document.getElementById('close-panel-btn')?.classList.remove('hidden');
            this.closePanel();
        });
    }

    renderMissionSummary(summary) {
        if (!summary) return '';
        return `<div class="mission-summary"><strong>Informe de mision</strong><span><b>${Math.round(summary.totals.damage)}</b> dano</span><span><b>${summary.totals.kills}</b> bajas</span><span><b>${summary.totals.abilities}</b> habilidades</span><span><b>$${Math.round(summary.totals.credits)}</b> generados</span><small>Destacado: ${summary.bestHero} · ${summary.lives} vidas restantes</small></div>`;
    }

    showFatalError(error) {
        this.game?.pause?.();
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.add('hidden');
        this.panelContent.innerHTML = `
            <div class="end-state error-state" role="alert">
                <i class="fas fa-triangle-exclamation"></i>
                <h2>No se pudo iniciar la misión</h2>
                <p id="fatal-error-copy"></p>
                <button class="btn-primary" id="reload-game">Reintentar carga</button>
            </div>
        `;
        document.getElementById('fatal-error-copy').textContent = error?.message || 'Revisa los datos del juego e inténtalo nuevamente.';
        document.getElementById('reload-game')?.addEventListener('click', () => window.location.reload());
    }

    getTerrainText(terrains) {
        const names = { 0: 'Agua', 1: 'Hierba', 2: 'Camino', 3: 'Montaña', 4: 'Arbusto', 11: 'Hierba', 12: 'Hierba alta' };
        return terrains.map((terrain) => names[terrain] || terrain).join(', ');
    }

    getEnemyRole(archetype, isBoss = false) {
        const roles = {
            runner: 'Corredor', tank: 'Tanque', shield: 'Escudo', stealth: 'Sigilo',
            flying: 'Volador', summoner: 'Invocador', support: 'Soporte', commander: 'Comandante', phaser: 'Faseador', boss: 'Jefe', soldier: 'Soldado'
        };
        return roles[archetype] || (isBoss ? 'Jefe' : 'Soldado');
    }

    getResistanceText(unit) {
        const labels = Object.entries(unit.resistances || {})
            .filter(([, value]) => value > 0)
            .map(([type, value]) => `${type} ${Math.round(value * 100)}%`);
        if (unit.statusResistance > 0) labels.push(`Estados ${Math.round(unit.statusResistance * 100)}%`);
        if (unit.stealth) labels.push('Detección requerida');
        return labels.join(', ') || 'Ninguna';
    }

    renderSprite(src, name) {
        if (!src) return `<span class="sprite-fallback">${name.charAt(0)}</span>`;
        return `<img src="${src}" alt="${name}" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'sprite-fallback', textContent: '${name.charAt(0)}' }))">`;
    }
}
