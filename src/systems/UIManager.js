import { getHeroUpgradeTree } from '../data/HeroUpgradeCatalog.js';
import { CampaignPanel } from '../ui/CampaignPanel.js';
import { ProfilePanel } from '../ui/ProfilePanel.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';
import { TooltipController } from '../ui/TooltipController.js';

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

        this.shopInitialized = false;
        this.shopSlots = [null, null, null];
        this.itemPool = [];
        this.inventoryFilter = 0;
        this.inventoryHeroId = null;
        this.toastTimer = null;
        this.lastFocusedElement = null;
        this.profilePanel = new ProfilePanel(this);
        this.campaignPanel = new CampaignPanel(this);
        this.settingsPanel = new SettingsPanel(this);
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

    setNextWaveEnabled(enabled) {
        const button = document.getElementById('next-wave-btn');
        if (!button) return;
        button.disabled = !enabled;
        button.textContent = enabled ? 'INICIAR OLEADA' : 'OLEADA EN CURSO';
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
                    <div class="wave-summary">
                        <span><b>${summary.total}</b> enemigos</span>
                        <span><b>$${summary.reward}</b> botín</span>
                        <span><b>${summary.fastest}</b> vel. máx.</span>
                        <span><b>${summary.maxThreat}/5</b> amenaza</span>
                    </div>
                    <small class="wave-counter"><i class="fas fa-crosshairs"></i> Respuesta: ${summary.counter}</small>
                ` : ''}
            `;
        }
        document.getElementById('enemy-info-empty')?.classList.remove('hidden');
        document.getElementById('enemy-info-content')?.classList.add('hidden');
        container.innerHTML = '';

        const roles = {
            runner: 'Corredor', tank: 'Tanque', shield: 'Escudo', stealth: 'Sigilo',
            flying: 'Volador', summoner: 'Invocador', support: 'Soporte', boss: 'Jefe', soldier: 'Soldado'
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
                <small>${enemy.stealth ? 'Sigilo · ' : ''}${'◆'.repeat(Math.max(1, enemy.threat || 1))}</small>
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
        const equippedItemId = this.game.progression?.state.equippedItems[config.id];
        const items = hero.items?.length
            ? hero.items
            : [this.game.itemDatabase?.[equippedItemId]].filter(Boolean);
        const combat = hero.combatStats || {};
        const abilityState = hero.abilitySystem?.getDisplayState?.() || null;
        const isDeployed = this.game.heroes.includes(hero);
        const repositionPermission = isDeployed ? this.game.tacticalActions?.canReposition(hero) : null;
        const sellPermission = isDeployed ? this.game.tacticalActions?.canSell(hero) : null;
        const sellRefund = isDeployed ? this.game.tacticalActions?.getSellRefund(hero) || 0 : 0;

        this.panelContent.innerHTML = `
            <div class="hero-detail">
                <section class="hero-portrait">
                    <h2>${hero.name}</h2>
                    <div class="portrait-frame">${this.renderSprite(config.visual?.portrait || config.sprite, hero.name)}</div>
                    <div class="level-chip">Nivel ${level}</div>
                    <div class="upgrade-list">
                        ${[1, 5, 10].map((amount) => {
                            const cost = this.calculateLevelCost(level, amount);
                            return `<button class="modal-btn-upgrade btn-primary ghost" data-amt="${amount}" data-cost="${cost}">+${amount} $${cost}</button>`;
                        }).join('')}
                    </div>
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
                            <p data-tooltip="Daño por impacto antes de armadura y resistencias"><span>Daño</span><strong>${damage}${damage !== baseDamage ? `<small class="stat-delta">+${damage - baseDamage}</small>` : ''}</strong></p>
                            <p data-tooltip="Ataques realizados por segundo"><span>Recarga</span><strong>${fireRate}/s${Number(fireRate) !== baseFireRate ? `<small class="stat-delta">+${(Number(fireRate) - baseFireRate).toFixed(1)}</small>` : ''}</strong></p>
                            <p data-tooltip="Probabilidad de infligir daño crítico"><span>Crítico</span><strong>${critChance}%${critChance !== baseCritChance ? `<small class="stat-delta">+${critChance - baseCritChance}%</small>` : ''}</strong></p>
                            <p data-tooltip="Distancia máxima de adquisición de objetivos"><span>Alcance</span><strong>${range}${range !== baseRange ? `<small class="stat-delta">+${range - baseRange}</small>` : ''}</strong></p>
                        </div>
                        <div class="detail-card">
                            <h3>Táctica</h3>
                            <p><span>Terreno</span><strong>${terrains}</strong></p>
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
                    </div>

                    ${this.renderUpgradeTree(config)}

                    <div class="equipment-card">
                        <h3>Equipamiento</h3>
                        <div id="modal-item-slot-1" class="item-slot ${items[0] ? 'filled' : ''}">
                            ${items[0] ? `<strong>${items[0].name}</strong><span>${items[0].desc}</span><button class="btn-unequip-modal btn-primary ghost">Desequipar</button>` : '<strong>Ranura libre</strong><span>Equipa un objeto desde el inventario.</span>'}
                        </div>
                        <div id="modal-inventory-list" class="inventory-strip"></div>
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

        this.panelContent.querySelector('.btn-unequip-modal')?.addEventListener('click', () => {
            this.game.progression.unequipItem(config.id);
            this.showToast('Objeto devuelto al inventario', 'success');
            const deployed = this.game.heroes.find((unit) => unit.id === config.id);
            this.renderHeroDetails(deployed || config);
        });

        this.setupInventoryDrag(hero);
    }

    setupInventoryDrag(hero) {
        const slot = document.getElementById('modal-item-slot-1');
        const inventory = document.getElementById('modal-inventory-list');
        if (!slot || !inventory) return;

        if (!hero.items) hero.items = [];

        if (!hero.items[0]) {
            slot.addEventListener('dragover', (event) => event.preventDefault());
            slot.addEventListener('drop', (event) => {
                const index = Number(event.dataTransfer.getData('item-index'));
                const item = this.game.ownedItems[index];
                if (!item) return;
                if (this.game.progression.equipItem(hero.id, item.id)) {
                    this.showToast(`${item.name} equipado`, 'success');
                    const deployed = this.game.heroes.find((unit) => unit.id === hero.id);
                    this.renderHeroDetails(deployed || hero);
                }
            });
        }

        if (!this.game.ownedItems.length) {
            inventory.innerHTML = '<span class="empty-copy">Inventario vacío.</span>';
            return;
        }

        this.game.ownedItems.forEach((item, index) => {
            const element = document.createElement('div');
            element.className = 'inventory-pill';
            element.draggable = true;
            element.textContent = item.name;
            element.addEventListener('dragstart', (event) => event.dataTransfer.setData('item-index', index));
            inventory.appendChild(element);
        });
    }

    renderUpgradeTree(hero) {
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
                                return `<button class="skill-node ${owned ? 'owned' : ''}" data-node="${node.id}" ${owned || locked ? 'disabled' : ''}>
                                    <span>${node.name}</span><small>${node.desc}</small><b>${owned ? 'Adquirida' : locked ? 'Bloqueada' : `${node.cost} F`}</b>
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

        const targetData = unit.config || unit;
        targetData.level = (targetData.level || unit.level || 1) + amount;
        targetData.baseDamage = targetData.baseDamage || targetData.damage || unit.damage || 10;
        targetData.baseRange = targetData.baseRange || targetData.range || unit.range || 100;
        targetData.damage = Math.floor(targetData.baseDamage * Math.pow(1.18, targetData.level - 1));
        targetData.range = targetData.baseRange + targetData.level * 3;

        unit.level = targetData.level;
        unit.damage = targetData.damage;
        unit.range = targetData.range;

        this.showToast(`${unit.name} subió a nivel ${unit.level}`, 'success');
        this.renderHeroDetails(unit);
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
        if (type === 'collection') return this.renderCollection(title);
        if (type === 'inventory') return this.renderInventory(title);
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

    renderShopItem(item, purchased = false) {
        if (!item) return '<div class="shop-card empty-copy">Agotado</div>';
        return `
            <div class="shop-card ${purchased ? 'purchased' : ''}">
                <div class="item-badge">T${item.tier || 1}</div>
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
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

    renderCollection(title) {
        this.panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="collection-grid">
                ${this.game.unlockedHeroes.map((hero) => {
                    const equipped = this.game.activeTeam.some((active) => active.id === hero.id);
                    return `
                        <article class="collection-card">
                            ${this.renderSprite(hero.visual?.portrait || hero.sprite, hero.name)}
                            <h3>${hero.name}</h3>
                            <small>${hero.rarity || 'Common'} | $${hero.cost || 0}</small>
                            <button class="btn-equip btn-primary ${equipped ? 'danger' : 'ghost'}" data-id="${hero.id}">
                                ${equipped ? 'Desequipar' : 'Equipar'}
                            </button>
                        </article>
                    `;
                }).join('')}
            </div>
        `;

        this.panelContent.querySelectorAll('.btn-equip').forEach((button) => {
            button.addEventListener('click', () => this.toggleHeroEquip(button.dataset.id));
        });
    }

    toggleHeroEquip(id) {
        const equipped = this.game.activeTeam.some((hero) => hero.id === id);
        let teamIds = this.game.activeTeam.map((hero) => hero.id);

        if (equipped) {
            teamIds = teamIds.filter((heroId) => heroId !== id);
        } else {
            if (this.game.activeTeam.length >= 6) {
                this.showToast('Tu equipo activo está lleno', 'warning');
                return;
            }
            teamIds.push(id);
        }

        this.game.progression.setActiveTeam(teamIds);

        this.renderPanel('collection');
        this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
    }

    renderInventory(title) {
        this.inventoryHeroId ||= this.game.activeTeam[0]?.id || this.game.unlockedHeroes[0]?.id || null;
        const targetHero = this.game.heroDatabase[this.inventoryHeroId];
        const equippedId = this.game.progression.state.equippedItems[this.inventoryHeroId];
        const equipped = equippedId ? this.game.itemDatabase[equippedId] : null;
        const visibleItems = this.game.ownedItems.filter((item) => this.inventoryFilter === 0 || item.tier === this.inventoryFilter);
        this.panelContent.innerHTML = `
            <div class="panel-title-row"><h2>${title}</h2><strong>${this.game.ownedItems.length} disponibles</strong></div>
            <div class="inventory-toolbar">
                <label>Héroe
                    <select id="inventory-hero-select">
                        ${this.game.unlockedHeroes.map((hero) => `<option value="${hero.id}" ${hero.id === this.inventoryHeroId ? 'selected' : ''}>${hero.name}</option>`).join('')}
                    </select>
                </label>
                <div class="tier-filters" aria-label="Filtrar por tier">
                    ${[0, 1, 2, 3, 4].map((tier) => `<button class="tier-filter ${this.inventoryFilter === tier ? 'active' : ''}" data-tier="${tier}">${tier === 0 ? 'Todos' : `T${tier}`}</button>`).join('')}
                </div>
            </div>
            <section class="equipped-summary">
                <span>Equipado en ${targetHero?.name || 'héroe'}</span>
                <strong>${equipped?.name || 'Ninguno'}</strong>
                ${equipped ? `<button class="btn-unequip-item btn-primary ghost">Desequipar</button>` : ''}
            </section>
            <div class="inventory-grid">
                ${visibleItems.length
                    ? visibleItems.map((item) => `<article class="inventory-card">
                        <div class="item-badge">T${item.tier}</div><h3>${item.name}</h3><p>${item.desc}</p>
                        <small>${this.getItemImpact(item)}${equipped ? ` · reemplaza ${equipped.name}` : ''}</small>
                        <button class="btn-equip-item btn-primary ghost" data-id="${item.id}">Equipar</button>
                    </article>`).join('')
                    : '<p class="empty-copy">No tienes objetos todavía.</p>'}
            </div>
        `;

        document.getElementById('inventory-hero-select')?.addEventListener('change', (event) => {
            this.inventoryHeroId = event.target.value;
            this.renderInventory(title);
        });
        this.panelContent.querySelectorAll('.tier-filter').forEach((button) => {
            button.addEventListener('click', () => {
                this.inventoryFilter = Number(button.dataset.tier);
                this.renderInventory(title);
            });
        });
        this.panelContent.querySelectorAll('.btn-equip-item').forEach((button) => {
            button.addEventListener('click', () => {
                const item = this.game.itemDatabase[button.dataset.id];
                if (this.game.progression.equipItem(this.inventoryHeroId, item.id)) {
                    this.showToast(`${item.name} equipado`, 'success');
                    this.renderInventory(title);
                }
            });
        });
        this.panelContent.querySelector('.btn-unequip-item')?.addEventListener('click', () => {
            this.game.progression.unequipItem(this.inventoryHeroId);
            this.showToast('Objeto desequipado', 'success');
            this.renderInventory(title);
        });
    }

    getItemImpact(item) {
        const impacts = {
            telarana_sintetica: 'Control adicional', aerodeslizador: 'Habilita agua', lentes_edith: 'Detecta sigilo',
            reactor_arc: '+25% cadencia', suero_supersoldado: '+30% daño en emergencia', contrato_stark: '+1 crédito por impacto',
            particulas_pym: '+50% cadencia', simbionte: 'Daño acumulativo', protocolo_extremis: '+1 vida cada 15 bajas', gema_poder: '+50% daño'
        };
        return impacts[item.id] || 'Mejora táctica';
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
                    <button class="starter-card" data-id="${hero.id}">
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

        activeTeam.forEach((hero) => {
            const deployedHero = this.game.heroes.find((unit) => unit.id === hero.id);
            const deployed = Boolean(deployedHero);
            const abilityState = deployedHero?.abilitySystem?.getDisplayState?.();
            const card = document.createElement('article');
            card.className = `hero-card ${deployed ? 'deployed' : ''}`;
            card.innerHTML = `
                ${this.renderSprite(hero.visual?.portrait || hero.sprite, hero.name)}
                <div>
                    <strong>${hero.name}</strong>
                    <span>$${hero.cost || 0} | ${hero.rarity || 'Common'}</span>
                    ${abilityState ? `<small class="roster-ability ${abilityState.ready ? 'ready' : ''}">${abilityState.label}</small>` : ''}
                </div>
                <div class="hero-actions">
                    <button class="btn-action place-btn" title="${deployed ? 'Reposicionar' : 'Colocar'}" aria-label="${deployed ? 'Reposicionar' : 'Colocar'}" data-tooltip="${deployed ? 'Mover una vez por oleada' : 'Colocar héroe'}"><i class="fas ${deployed ? 'fa-arrows-alt' : 'fa-map-marker-alt'}"></i></button>
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
            this.heroGrid.appendChild(card);
        });
    }

    handleGacha() {
        const result = this.game.shopSystem.recruitHero();
        if (!result.ok) {
            this.showToast(result.reason, 'warning');
            return;
        }
        document.getElementById('gacha-res').innerHTML = `Reclutado: <strong>${result.hero.name}</strong>${result.guaranteed ? ' · Garantía activada' : ''}`;
        this.showToast(`${result.hero.name} se unió a la plantilla`, 'success');
        this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
        window.setTimeout(() => this.renderShop('Tienda'), 900);
    }

    showGameOver() {
        this.game.audio?.play('warning');
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.add('hidden');
        this.panelContent.innerHTML = `
            <div class="end-state">
                <h2>Base destruida</h2>
                <p>Llegaste hasta la oleada ${this.game.waveManager?.currentWave || 1}. Ajusta el equipo y vuelve a intentarlo.</p>
                <button class="btn-primary" id="retry-run">Reintentar</button>
            </div>
        `;
        document.getElementById('retry-run')?.addEventListener('click', () => {
            this.game.isGameOver = false;
            this.game.loadLevel(this.game.currentLevel);
            this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
            this.closePanel();
            this.game.start();
        });
    }

    showVictory() {
        this.game.audio?.play('victory');
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.add('hidden');
        this.panelContent.innerHTML = `
            <div class="end-state">
                <h2>Victoria</h2>
                <p>Completaste el mapa con ${this.game.stars} estrellas.</p>
                <button class="btn-primary" id="victory-close">Volver al mapa</button>
            </div>
        `;
        document.getElementById('victory-close')?.addEventListener('click', () => {
            document.getElementById('close-panel-btn')?.classList.remove('hidden');
            this.closePanel();
        });
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
            flying: 'Volador', summoner: 'Invocador', support: 'Soporte', boss: 'Jefe', soldier: 'Soldado'
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
