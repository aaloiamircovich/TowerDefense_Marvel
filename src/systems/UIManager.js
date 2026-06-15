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

    showToast(message, type = 'info') {
        if (!this.toastEl) return;
        window.clearTimeout(this.toastTimer);
        this.toastEl.textContent = message;
        this.toastEl.className = `toast ${type}`;
        this.toastTimer = window.setTimeout(() => this.toastEl.classList.add('hidden'), 2200);
    }

    renderWavePreview(uniqueEnemies) {
        const container = document.getElementById('wave-preview');
        const numberEl = document.getElementById('next-wave-number');
        if (!container) return;

        if (numberEl) numberEl.textContent = this.game.waveManager?.currentWave || 1;
        container.innerHTML = '';

        uniqueEnemies.forEach((enemy) => {
            const card = document.createElement('button');
            card.className = 'wave-enemy-card';
            card.title = enemy.name;
            card.innerHTML = `
                <span class="enemy-token">${enemy.name.charAt(0)}</span>
                <strong>x${enemy.previewCount || 1}</strong>
                <small>${enemy.isBoss ? 'Jefe' : enemy.category}</small>
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
            document.getElementById('en-info-reward').textContent = `$${unit.reward || 10}`;
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
        const damage = Math.round(hero.damage || config.damage || 0);
        const range = Math.round(hero.range || config.range || 0);
        const fireRate = Number(hero.fireRate || config.fireRate || 1).toFixed(1);
        const terrains = this.getTerrainText(hero.allowedTerrains || config.allowedTerrains || [1]);
        const items = hero.items || [];

        this.panelContent.innerHTML = `
            <div class="hero-detail">
                <section class="hero-portrait">
                    <h2>${hero.name}</h2>
                    <div class="portrait-frame">${this.renderSprite(config.sprite, hero.name)}</div>
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
                            <p><span>Crítico</span><strong>${hero.critChance || config.critChance || 5}%</strong></p>
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
                    </div>

                    <div class="ability-card">
                        <h3>${config.ability || 'Ataque básico'}</h3>
                        <p>${config.abilityDesc || 'Ataca al enemigo objetivo con su daño base.'}</p>
                    </div>

                    <div class="equipment-card">
                        <h3>Equipamiento</h3>
                        <div id="modal-item-slot-1" class="item-slot ${items[0] ? 'filled' : ''}">
                            ${items[0] ? `<strong>${items[0].name}</strong><span>${items[0].desc}</span>` : '<strong>Ranura libre</strong><span>Arrastra un objeto del inventario.</span>'}
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
                hero.items.push(item);
                this.game.ownedItems.splice(index, 1);
                this.showToast(`${item.name} equipado`, 'success');
                this.renderHeroDetails(hero);
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
        if (!this.shopInitialized) {
            const ownedIds = this.game.ownedItems.map((item) => item.id);
            this.itemPool = Object.values(this.game.itemDatabase || {})
                .filter((item) => !ownedIds.includes(item.id))
                .sort((a, b) => (a.tier || 1) - (b.tier || 1) || (a.price || 0) - (b.price || 0));
            this.refillShop();
            this.shopInitialized = true;
        }

        this.panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="shop-layout">
                <section class="shop-feature">
                    <h3>Caja S.H.I.E.L.D.</h3>
                    <p>Desbloquea un héroe aliado para reforzar la defensa multiversal.</p>
                    <button class="btn-primary" id="gacha-btn">ABRIR POR $500</button>
                    <div id="gacha-res" class="result-copy"></div>
                </section>
                <section>
                    <h3>Arsenal Stark / Wakanda</h3>
                    <div class="shop-grid">
                        ${this.shopSlots.map((item, index) => this.renderShopItem(item, index)).join('')}
                    </div>
                </section>
            </div>
        `;

        document.getElementById('gacha-btn')?.addEventListener('click', () => this.handleGacha());
        this.panelContent.querySelectorAll('.btn-buy-item').forEach((button) => {
            button.addEventListener('click', () => this.buyItem(Number(button.dataset.idx)));
        });
    }

    renderShopItem(item, index) {
        if (!item) return '<div class="shop-card empty-copy">Agotado</div>';
        return `
            <div class="shop-card">
                <div class="item-badge">T${item.tier || 1}</div>
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
                <button class="btn-buy-item btn-primary ghost" data-idx="${index}">$${item.price}</button>
            </div>
        `;
    }

    buyItem(index) {
        const item = this.shopSlots[index];
        if (!item) return;

        if (!this.game.resourceManager.removeCredits(item.price)) {
            this.showToast('Créditos insuficientes', 'warning');
            return;
        }

        this.game.ownedItems.push({ ...item });
        this.shopSlots[index] = null;
        this.refillShop();
        this.showToast(`${item.name} comprado`, 'success');
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
                            ${this.renderSprite(hero.sprite, hero.name)}
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
        const heroConfig = this.game.unlockedHeroes.find((hero) => hero.id === id);
        const equipped = this.game.activeTeam.some((hero) => hero.id === id);

        if (equipped) {
            this.game.activeTeam = this.game.activeTeam.filter((hero) => hero.id !== id);
        } else {
            if (this.game.activeTeam.length >= 6) {
                this.showToast('Tu equipo activo está lleno', 'warning');
                return;
            }
            this.game.activeTeam.push(heroConfig);
        }

        this.renderPanel('collection');
        this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
    }

    renderInventory(title) {
        this.panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="inventory-grid">
                ${this.game.ownedItems.length
                    ? this.game.ownedItems.map((item) => `<div class="inventory-card"><h3>${item.name}</h3><p>${item.desc}</p></div>`).join('')
                    : '<p class="empty-copy">No tienes objetos todavía.</p>'}
            </div>
        `;
    }

    renderProfile(title) {
        this.panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="profile-grid">
                <div class="detail-card"><h3>Progreso</h3><p><span>Oleadas superadas</span><strong>${this.game.completedWaves.length}</strong></p><p><span>Estrellas</span><strong>${this.game.stars}</strong></p></div>
                <div class="detail-card"><h3>Plantilla</h3><p><span>Héroes</span><strong>${this.game.unlockedHeroes.length}</strong></p><p><span>Equipo activo</span><strong>${this.game.activeTeam.length}/6</strong></p></div>
                <div class="detail-card"><h3>Base</h3><p><span>Vida</span><strong>${this.game.resourceManager.lives}/${this.game.resourceManager.maxLives}</strong></p><p><span>Créditos</span><strong>$${Math.floor(this.game.resourceManager.credits)}</strong></p></div>
                <div class="detail-card"><h3>Zona Marvel</h3><p><span>Mapa</span><strong>${this.game.currentLevel?.theme?.label || this.game.currentLevel?.name || 'Mapa'}</strong></p><p><span>Ambiente</span><strong>${this.game.currentLevel?.theme?.brief || 'Defensa táctica'}</strong></p></div>
            </div>
        `;
    }

    renderMap(title) {
        this.panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="map-list">
                ${this.game.levelsData.map((level, index) => `
                    <button class="map-card ${this.game.currentLevel?.id === level.id ? 'active' : ''}" data-index="${index}">
                        <strong>${level.name}</strong>
                        <span>${level.difficulty}</span>
                        <small>${level.description}</small>
                        <em>${level.theme?.brief || ''}</em>
                    </button>
                `).join('')}
            </div>
        `;

        this.panelContent.querySelectorAll('.map-card').forEach((button) => {
            button.addEventListener('click', () => {
                const level = this.game.levelsData[Number(button.dataset.index)];
                this.game.loadLevel(level);
                this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
                this.closePanel();
            });
        });
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
                <button class="btn-primary ghost" id="reset-placement">Cancelar colocación</button>
                <button class="btn-primary danger" id="clear-run">Reiniciar nivel</button>
            </div>
        `;

        document.getElementById('toggle-ranges')?.addEventListener('change', (event) => {
            this.game.showHeroRanges = event.target.checked;
            this.showToast(event.target.checked ? 'Rangos visibles' : 'Rangos ocultos', 'info');
        });

        document.getElementById('toggle-grid')?.addEventListener('change', (event) => {
            this.game.showGrid = event.target.checked;
            this.showToast(event.target.checked ? 'Cuadrícula visible' : 'Cuadrícula oculta', 'info');
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
                        ${this.renderSprite(hero.sprite, hero.name)}
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
                ${this.renderSprite(hero.sprite, hero.name)}
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
        const cost = 500;
        if (!this.game.resourceManager.removeCredits(cost)) {
            this.showToast('Créditos insuficientes', 'warning');
            return;
        }

        const ownedIds = this.game.unlockedHeroes.map((hero) => hero.id);
        const pool = Object.values(this.game.heroDatabase).filter((hero) => !ownedIds.includes(hero.id));

        if (pool.length === 0) {
            this.game.resourceManager.addCredits(cost);
            this.showToast('Ya tienes todos los héroes', 'info');
            return;
        }

        const weights = { Common: 60, Rare: 30, Legendary: 10 };
        const weightedPool = pool.flatMap((hero) => Array(weights[hero.rarity] || 20).fill(hero));
        const hero = weightedPool[Math.floor(Math.random() * weightedPool.length)];

        this.game.unlockedHeroes.push(hero);
        document.getElementById('gacha-res').innerHTML = `Desbloqueado: <strong>${hero.name}</strong>`;
        this.showToast(`${hero.name} desbloqueado`, 'success');
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

    renderSprite(src, name) {
        if (!src) return `<span class="sprite-fallback">${name.charAt(0)}</span>`;
        return `<img src="${src}" alt="${name}" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'sprite-fallback', textContent: '${name.charAt(0)}' }))">`;
    }
}
