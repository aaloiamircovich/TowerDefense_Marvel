import { getHeroUpgradeTree } from '../data/HeroUpgradeCatalog.js';

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
            const isPaused = this.game.togglePause();
            btnPause.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
            this.showToast(isPaused ? 'Pausa' : 'Partida reanudada', 'info');
        });

        btnAuto?.addEventListener('click', () => {
            if (!this.game.waveManager) return;
            this.game.waveManager.autoWave = !this.game.waveManager.autoWave;
            btnAuto.classList.toggle('active', this.game.waveManager.autoWave);
            btnAuto.classList.toggle('muted', !this.game.waveManager.autoWave);
            if (this.game.waveManager.autoWave && !this.game.waveManager.isWaveActive) this.game.waveManager.startNextWave();
        });

        btnSpeed?.addEventListener('click', () => {
            const speeds = [1, 2, 3, 4];
            const nextIndex = (speeds.indexOf(this.game.gameSpeed) + 1) % speeds.length;
            this.game.gameSpeed = speeds[nextIndex];
            btnSpeed.innerHTML = `x${this.game.gameSpeed} <i class="fas fa-rocket"></i>`;
        });
    }

    openPanel(type) {
        this.game.pause();
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn').classList.remove('hidden');
        this.renderPanel(type);
    }

    closePanel() {
        this.overlay.classList.add('hidden');
        if (!this.game.isManuallyPaused && !this.game.isGameOver) this.game.start();
    }

    setSelectionStatus(text) {
        if (this.selectionStatus) this.selectionStatus.textContent = text;
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

    updateLevelTheme(levelConfig) {
        if (this.levelNameEl) this.levelNameEl.textContent = levelConfig.theme?.label || levelConfig.name || 'Mapa';
        document.documentElement.style.setProperty('--level-accent', levelConfig.theme?.accent || '#40c9ff');
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
        this.toastTimer = window.setTimeout(() => this.toastEl.classList.add('hidden'), 2200);
    }

    renderWavePreview(uniqueEnemies, modifier = null, faction = null, waveNumber = 1) {
        const container = document.getElementById('wave-preview');
        const numberEl = document.getElementById('next-wave-number');
        const intelEl = document.getElementById('wave-intel');
        if (!container) return;

        if (numberEl) numberEl.textContent = waveNumber;
        if (intelEl) {
            intelEl.innerHTML = `
                <strong>${faction?.label || 'Amenaza desconocida'}</strong>
                <span>${modifier?.label || 'Oleada estándar'}: ${modifier?.description || ''}</span>
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
                </section>

                <section class="detail-stack">
                    <div class="stats-grid">
                        <div class="detail-card">
                            <h3>Estadísticas</h3>
                            <p><span>Daño</span><strong>${damage}</strong></p>
                            <p><span>Recarga</span><strong>${fireRate}/s</strong></p>
                            <p><span>Crítico</span><strong>${critChance}%</strong></p>
                            <p><span>Alcance</span><strong>${range}</strong></p>
                        </div>
                        <div class="detail-card">
                            <h3>Táctica</h3>
                            <p><span>Terreno</span><strong>${terrains}</strong></p>
                            <label class="field-label" for="targeting-select">Apuntar a</label>
                            <select id="targeting-select">
                                ${['Primero', 'Último', 'Fuerte', 'Débil'].map((priority) => `<option value="${priority}" ${hero.targetingPriority === priority ? 'selected' : ''}>${priority}</option>`).join('')}
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
        const progression = this.game.progression;
        const bestWaves = Object.values(progression.state.mapProgress).reduce((total, map) => total + (map.bestWave || 0), 0);
        const challenges = Object.values(progression.state.mapProgress).reduce((total, map) => total + (map.challenges?.length || 0), 0);
        this.panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="profile-grid">
                <div class="detail-card"><h3>Progreso</h3><p><span>Mejores oleadas</span><strong>${bestWaves}</strong></p><p><span>Estrellas</span><strong>${this.game.stars}/${this.game.levelsData.length * 3}</strong></p><p><span>Desafíos</span><strong>${challenges}/${this.game.levelsData.length * 2}</strong></p></div>
                <div class="detail-card"><h3>Plantilla</h3><p><span>Héroes</span><strong>${this.game.unlockedHeroes.length}</strong></p><p><span>Equipo activo</span><strong>${this.game.activeTeam.length}/6</strong></p></div>
                <div class="detail-card"><h3>Economía</h3><p><span>Fondos S.H.I.E.L.D.</span><strong>${progression.state.metaCredits} F</strong></p><p><span>Créditos de misión</span><strong>$${Math.floor(this.game.resourceManager.credits)}</strong></p></div>
                <div class="detail-card"><h3>Zona Marvel</h3><p><span>Mapa</span><strong>${this.game.currentLevel?.theme?.label || this.game.currentLevel?.name || 'Mapa'}</strong></p><p><span>Ambiente</span><strong>${this.game.currentLevel?.theme?.brief || 'Defensa táctica'}</strong></p></div>
            </div>
        `;
    }

    renderMap(title) {
        this.panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="map-list">
                ${this.game.levelsData.map((level, index) => {
                    const progress = this.game.progression.getMapProgress(level.id);
                    return `<article class="map-card ${this.game.currentLevel?.id === level.id ? 'active' : ''}">
                        <strong>${level.name}</strong>
                        <span>Mejor oleada ${progress.bestWave} · ${'★'.repeat(progress.stars)}${'☆'.repeat(3 - progress.stars)}</span>
                        <small>${level.description}</small>
                        <em>${level.theme?.brief || ''}</em>
                        <div class="map-mechanic"><b>${level.mission?.mechanic?.label || 'Defensa táctica'}</b><span>${level.mission?.mechanic?.description || ''}</span></div>
                        <div class="difficulty-switch" aria-label="Dificultad">
                            ${[['easy', 'Fácil'], ['normal', 'Normal'], ['hard', 'Difícil']].map(([value, label]) => `<button class="difficulty-btn ${progress.difficulty === value ? 'active' : ''}" data-level="${level.id}" data-value="${value}">${label}</button>`).join('')}
                        </div>
                        <div class="challenge-row"><span class="${progress.challenges.includes('sin_danos') ? 'done' : ''}">Sin daños</span><span class="${progress.challenges.includes('cazajefes') ? 'done' : ''}">Cazajefes</span>${(level.mission?.objectives || []).map((objective) => `<span class="${progress.missionObjectives.includes(objective.id) ? 'done' : ''}">${objective.label} · ${objective.reward} F</span>`).join('')}</div>
                        <button class="btn-load-map btn-primary ghost" data-index="${index}">Jugar</button>
                    </article>`;
                }).join('')}
            </div>
        `;

        this.panelContent.querySelectorAll('.difficulty-btn').forEach((button) => {
            button.addEventListener('click', () => {
                this.game.progression.setDifficulty(button.dataset.level, button.dataset.value);
                this.renderMap(title);
            });
        });
        this.panelContent.querySelectorAll('.btn-load-map').forEach((button) => {
            button.addEventListener('click', () => {
                const level = this.game.levelsData[Number(button.dataset.index)];
                this.game.loadLevel(level);
                this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
                this.renderMissionBriefing(level);
            });
        });
    }

    renderMissionBriefing(level) {
        const mission = level.mission || {};
        this.panelContent.innerHTML = `
            <section class="mission-briefing">
                <span class="briefing-kicker">${mission.operation || 'Operación táctica'}</span>
                <h2>${level.name}</h2>
                <p class="briefing-copy">${mission.briefing || level.description}</p>
                <blockquote><strong>${mission.speaker || 'S.H.I.E.L.D.'}</strong><span>${mission.dialogue || level.theme?.brief || ''}</span></blockquote>
                <div class="briefing-mechanic"><b>${mission.mechanic?.label || 'Defensa táctica'}</b><span>${mission.mechanic?.description || ''}</span></div>
                <div class="briefing-objectives">
                    ${(mission.objectives || []).map((objective) => `<div><span>${objective.label}</span><small>${objective.description}</small><b>+${objective.reward} F</b></div>`).join('')}
                </div>
                <button class="btn-primary" id="deploy-mission">DESPLEGAR EQUIPO</button>
            </section>
        `;
        document.getElementById('deploy-mission')?.addEventListener('click', () => this.closePanel());
    }

    renderSettings(title) {
        this.panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="settings-grid">
                <label class="setting-toggle">
                    <input type="checkbox" id="toggle-ranges" ${this.game.showHeroRanges ? 'checked' : ''}>
                    <span>Mostrar rangos de héroes</span>
                </label>
                <label class="setting-toggle">
                    <input type="checkbox" id="toggle-grid" ${this.game.showGrid ? 'checked' : ''}>
                    <span>Mostrar cuadrícula táctica</span>
                </label>
                <label class="setting-toggle">
                    <input type="checkbox" id="toggle-audio" ${this.game.audio?.enabled ? 'checked' : ''}>
                    <span>Audio de combate</span>
                </label>
                <button class="btn-primary ghost" id="reset-placement">Cancelar colocación</button>
                <button class="btn-primary danger" id="clear-run">Reiniciar nivel</button>
            </div>
        `;

        document.getElementById('toggle-ranges')?.addEventListener('change', (event) => {
            this.game.showHeroRanges = event.target.checked;
            this.game.progression.updateSetting('ranges', event.target.checked);
            this.showToast(event.target.checked ? 'Rangos visibles' : 'Rangos ocultos', 'info');
        });

        document.getElementById('toggle-grid')?.addEventListener('change', (event) => {
            this.game.showGrid = event.target.checked;
            this.game.progression.updateSetting('grid', event.target.checked);
            this.showToast(event.target.checked ? 'Cuadrícula visible' : 'Cuadrícula oculta', 'info');
        });

        document.getElementById('toggle-audio')?.addEventListener('change', (event) => {
            this.game.audio?.setEnabled(event.target.checked);
            this.game.progression.updateSetting('audio', event.target.checked);
            this.showToast(event.target.checked ? 'Audio activado' : 'Audio silenciado', 'info');
        });

        document.getElementById('reset-placement')?.addEventListener('click', () => {
            this.game.inputManager.clearPlacement();
            this.closePanel();
        });

        document.getElementById('clear-run')?.addEventListener('click', () => {
            this.game.loadLevel(this.game.currentLevel);
            this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
            this.closePanel();
        });
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
            const deployed = this.game.heroes.some((unit) => unit.id === hero.id);
            const card = document.createElement('article');
            card.className = `hero-card ${deployed ? 'deployed' : ''}`;
            card.innerHTML = `
                ${this.renderSprite(hero.visual?.portrait || hero.sprite, hero.name)}
                <div>
                    <strong>${hero.name}</strong>
                    <span>$${hero.cost || 0} | ${hero.rarity || 'Common'}</span>
                </div>
                <div class="hero-actions">
                    <button class="btn-action place-btn" title="Colocar" aria-label="Colocar"><i class="fas fa-map-marker-alt"></i></button>
                    <button class="btn-action stats-btn" title="Mejoras" aria-label="Mejoras"><i class="fas fa-chart-bar"></i></button>
                </div>
            `;
            card.querySelector('.place-btn').addEventListener('click', (event) => {
                event.stopPropagation();
                onSelect(hero);
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
