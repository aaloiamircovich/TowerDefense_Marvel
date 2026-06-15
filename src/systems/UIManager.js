export class UIManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.overlay = document.getElementById('panel-overlay');
        this.panelContent = document.getElementById('panel-content');
        this.heroGrid = document.querySelector('.hero-grid');

        this.livesEl = document.getElementById('ui-lives');
        this.creditsEl = document.getElementById('ui-credits');
        this.waveEl = document.getElementById('ui-wave');
        this.fpsEl = document.getElementById('fps-display');
        this.starsEl = document.getElementById('ui-stars'); 

        this.shopInitialized = false;
        this.shopSlots = [null, null, null]; 
        this.itemPool = []; 

        this.retryActive = false;
        this.restartActive = false;
        
        this.tutorialSteps = [
            { elementId: 'top-bar', title: 'ESTADO DE OPERACIÓN', text: 'Monitorea tus recursos críticos. Las VIDAS indican cuántos enemigos pueden escapar. Los CRÉDITOS se usan para mejoras en combate. Las GEMAS sirven para reclutar nuevos héroes en el Gacha y las ESTRELLAS desbloquean nuevos mapas del Multiverso.' },
            { elementId: 'left-panel', title: 'RESERVA DE HÉROES', text: 'Aquí ves a tu equipo activo de 6 héroes. Usa el botón de la MIRILLA para entrar en modo de despliegue. El botón de BARRAS muestra el Dossier con las estadísticas actuales y evoluciones de ese héroe.' },
            { elementId: 'gameCanvas', title: 'ZONA DE DESPLIEGUE', text: 'Haz clic en una casilla válida para situar a tu héroe. El color VERDE indica posición permitida, el ROJO terreno bloqueado (como agua o montañas para algunos) o ya ocupado. ¡El círculo muestra su radio de ataque!' },
            { elementId: 'side-panel', title: 'RADAR Y CONTROL TEMPORAL', text: 'Supervisa a los enemigos que se aproximan. Usa el botón de PLAY para iniciar la oleada, el COHETE para acelerar el tiempo hasta x4, y el botón SYNC para activar el despliegue automático de misiones.' },
            { elementId: 'enemy-info-panel', title: 'DATOS DE OBJETIVO', text: 'Haz clic en cualquier unidad enemiga o héroe en el mapa. Podrás SUBIR DE NIVEL a tus héroes para aumentar su daño exponencialmente o RETIRARLOS para reubicarlos sin perder su nivel alcanzado.' },
            { elementId: 'btn-profile', title: 'PERFIL DE AGENTE', text: 'Accede a tu Dossier de S.H.I.E.L.D. Aquí puedes cambiar tu Título de prestigio, revisar tu nivel de cuenta y consultar tus estadísticas globales y trofeos.' },
            { elementId: 'btn-quests', title: 'SISTEMA DE OBJETIVOS', text: 'Consulta tus misiones tácticas. Cumplir estos hitos es la forma principal de obtener GEMAS gratuitas para invocar nuevos héroes.' },
            { elementId: 'btn-wiki', title: 'GUÍA DEL MULTIVERSO', text: 'La base de datos definitiva. Consulta estadísticas, rarezas, habilidades y evoluciones de todos los héroes y objetos, incluso los que aún no has desbloqueado.' },
            { elementId: 'btn-shop', title: 'CENTRO LOGÍSTICO', text: 'Recluta nuevos aliados mediante el SUMMON PREMIUM o adquiere equipamiento avanzado en el MERCADO NEGRO. ¡El precio del Gacha aumenta con cada compra!' },
            { elementId: 'btn-levels', title: 'OPERACIONES GLOBALES', text: 'Viaja entre los diferentes campos de batalla. Cada mapa requiere un número de estrellas para ser desbloqueado y presenta desafíos únicos.' },
            { elementId: 'btn-collection', title: 'EQUIPO ACTIVO', text: 'Gestiona tu escuadrón de 6 héroes para la misión actual. Solo los héroes que equipes aquí aparecerán en el panel de despliegue izquierdo.' },
            { elementId: 'btn-inventory', title: 'GESTIÓN DE MOCHILA', text: 'Administra tus objetos. Arrástralos sobre los héroes de tu equipo para potenciar sus capacidades con tecnología Stark o reliquias místicas.' },
            { elementId: 'btn-settings', title: 'CONFIGURACIÓN DE SISTEMA', text: 'Ajusta los parámetros de audio, gráficos y calidad. También es el lugar para introducir códigos de acceso de Director S.H.I.E.L.D.' }
        ];
        this.currentTutorialIndex = 0;

        this.initListeners();
    }

    initListeners() {
        document.querySelectorAll('.hub-btn').forEach(btn => {
            btn.onclick = () => this.openPanel(btn.getAttribute('data-panel'));
        });
        
        const closeBtn = document.getElementById('close-panel-btn');
        if(closeBtn) closeBtn.onclick = () => this.closePanel();

        const btnNext = document.getElementById('next-wave-btn');
        const btnPause = document.getElementById('btn-pause');
        const btnAuto = document.getElementById('btn-auto');
        const btnSpeed = document.getElementById('btn-speed');

        if (btnNext) btnNext.onclick = () => { if (this.game.waveManager && !this.game.waveManager.isWaveActive) this.game.waveManager.startNextWave(); };
        if (btnPause) {
            btnPause.onclick = () => {
                const isPaused = this.game.togglePause();
                btnPause.innerHTML = isPaused ? '<i class="fas fa-play" style="color:var(--bright-yellow);"></i>' : '<i class="fas fa-pause"></i>';
            };
        }
        if (btnAuto) {
            btnAuto.onclick = () => {
                if(!this.game.waveManager) return;
                const newState = !this.game.waveManager.autoWave;
                this.game.waveManager.autoWave = newState;
                this.game.settings.gameplay.autoWave = newState;
                this.updateManagementButtons();
                if (newState && !this.game.waveManager.isWaveActive) this.game.waveManager.startNextWave();
                this.game.savePersistence();
            };
        }
        if (btnSpeed) {
            btnSpeed.onclick = () => {
                this.game.gameSpeed++;
                if (this.game.gameSpeed > 4) this.game.gameSpeed = 1;
                btnSpeed.innerHTML = `x${this.game.gameSpeed} <i class="fas fa-rocket"></i>`;
            };
        }

        // Botones laterales de gestión de misión
        const btnRetry = document.getElementById('btn-sidebar-retry');
        const btnRestart = document.getElementById('btn-sidebar-restart');

        if (btnRetry) btnRetry.onclick = () => {
            this.retryActive = !this.retryActive;
            this.game.settings.gameplay.autoRetry = this.retryActive;
            if (this.retryActive) {
                this.restartActive = false;
                this.game.settings.gameplay.autoRestart = false;
            }
            this.updateManagementButtons();
            this.game.savePersistence();
        };
        if (btnRestart) btnRestart.onclick = () => {
            this.restartActive = !this.restartActive;
            this.game.settings.gameplay.autoRestart = this.restartActive;
            if (this.restartActive) {
                this.retryActive = false;
                this.game.settings.gameplay.autoRetry = false;
            }
            this.updateManagementButtons();
            this.game.savePersistence();
        };
    }

    updateManagementButtons() {
        const btnRetry = document.getElementById('btn-sidebar-retry');
        const btnRestart = document.getElementById('btn-sidebar-restart');
        const btnAuto = document.getElementById('btn-auto');

        if (btnAuto) {
            btnAuto.style.filter = this.game.waveManager?.autoWave ? 'none' : 'grayscale(100%)';
            btnAuto.style.color = this.game.waveManager?.autoWave ? 'var(--bright-yellow)' : 'inherit';
        }

        if (btnRetry) btnRetry.style.border = this.retryActive ? '2px solid gold' : 'none';
        if (btnRetry) btnRetry.style.filter = this.retryActive ? 'brightness(1.5)' : 'brightness(0.7)';
        if (btnRestart) btnRestart.style.border = this.restartActive ? '2px solid gold' : 'none';
        if (btnRestart) btnRestart.style.filter = this.restartActive ? 'brightness(1.5)' : 'brightness(0.7)';
    }

    openPanel(type) {
        this.game.pause();
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn').classList.remove('hidden');
        this.renderPanel(type);
    }

    closePanel() {
        this.overlay.classList.add('hidden');
        this.game.start();
    }

    updateUI(l, c, w, f, s) {
        if(this.livesEl) this.livesEl.innerText = l > 0 ? l : 0;
        if(this.creditsEl) this.creditsEl.innerText = Math.floor(c);
        // Mostrar gemas en la UI superior si existe el elemento
        const gemEl = document.getElementById('ui-gems');
        if(gemEl) gemEl.innerText = this.game.playerProfile.gems;
        if(this.waveEl) this.waveEl.innerText = `${w}/100`;
        if(this.fpsEl) this.fpsEl.innerText = `${Math.round(f)} FPS`;
        if(this.starsEl && s !== undefined) this.starsEl.innerText = s;

        // --- Sinergia y Efectos de UI en Roster ---
        const categoryCounts = {};
        this.game.heroes.forEach(h => {
            const cat = h.config.category;
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const catColors = { "Urbano": "#888", "Tecnológico": "#00d4ff", "Místico": "#a335ee", "Mutante": "#f3d403", "Cósmico": "#fff" };

        const heroCards = document.querySelectorAll('.hero-card-equipped');
        heroCards.forEach(card => {
            const heroId = card.getAttribute('data-id');
            const heroInstance = this.game.heroes.find(h => h.id === heroId);
            const heroConfig = this.game.activeTeam.find(h => h.id === heroId);
            
            // Actualizar indicador de despliegue
            const statusBadge = card.querySelector('.deployment-status');
            if (statusBadge) {
                const isDeployed = !!heroInstance;
                statusBadge.innerText = isDeployed ? 'EN MAPA' : 'RESERVA';
                statusBadge.style.background = isDeployed ? '#00ff00' : 'rgba(0,0,0,0.5)';
                statusBadge.style.color = isDeployed ? 'black' : '#666';
                statusBadge.style.boxShadow = isDeployed ? '0 0 10px #00ff00' : 'none';
            }

            // Brillo de Sinergia (3+ héroes del mismo tipo desplegados)
            if (heroConfig && categoryCounts[heroConfig.category] >= 3) {
                const color = catColors[heroConfig.category] || "#fff";
                card.style.borderColor = color;
                card.style.boxShadow = `0 0 20px ${color}66`;
            } else {
                card.style.borderColor = '#444';
                card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
            }

            // Efecto Neón para Habilidad Súper Lista
            const container = card.querySelector('.hero-icon-container');
            if (container) {
                if (heroInstance && heroInstance.energy >= heroInstance.maxEnergy) {
                    container.style.boxShadow = '0 0 20px #00d4ff, inset 0 0 10px #00d4ff';
                    container.style.borderColor = '#ffffff';
                } else {
                    container.style.boxShadow = 'inset 0 0 10px rgba(0, 212, 255, 0.2)';
                    container.style.borderColor = '#00d4ff';
                }
            }
        });
    }

    showGameOver(isVictory) {
        if (isVictory) {
            console.log("MISIÓN COMPLETADA");
            return;
        }

        // Protocolo de Derrota: Mostrar opciones de recuperación
        this.game.pause();
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn').classList.add('hidden'); // Forzar decisión

        let html = `
            <div style="text-align:center; padding: 20px; font-family: 'Segoe UI', sans-serif; color: white;">
                <h1 style="color:var(--accent-red); font-size: 36px; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px; text-transform: uppercase; text-shadow: 0 0 15px rgba(211, 47, 47, 0.6);">Misión Fallida</h1>
                <p style="color: #aaa; margin-bottom: 40px; letter-spacing: 1px;">LA BASE HA SIDO COMPROMETIDA. SELECCIONE PROTOCOLO DE EMERGENCIA.</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
                    <!-- REINTENTAR OLEADA -->
                    <div id="btn-loss-retry" style="background: linear-gradient(180deg, #b91d1d 0%, #7f1d1d 100%); border: 2px solid #f3d403; border-radius: 8px; padding: 30px; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(243, 212, 3, 0.2);">
                        <i class="fas fa-undo fa-3x" style="color: #f3d403; margin-bottom: 15px;"></i>
                        <h2 style="margin: 10px 0; font-size: 18px; color: white; letter-spacing: 1px;">REINTENTAR OLEADA</h2>
                        <p style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 5px; line-height: 1.4;">Vuelve a intentar la oleada actual con salud completa.</p>
                    </div>

                    <!-- REINICIAR NIVEL -->
                    <div id="btn-loss-restart" style="background: #222; border: 2px solid #444; border-radius: 8px; padding: 30px; cursor: pointer; transition: 0.3s;">
                        <i class="fas fa-trash-alt fa-3x" style="color: #888; margin-bottom: 15px;"></i>
                        <h2 style="margin: 10px 0; font-size: 18px; color: white; letter-spacing: 1px;">REINICIAR NIVEL</h2>
                        <p style="font-size: 11px; color: #666; margin-top: 5px; line-height: 1.4;">Abandona la operación actual y regresa a la oleada 1.</p>
                    </div>
                </div>
            </div>
        `;
        this.panelContent.innerHTML = html;

        document.getElementById('btn-loss-retry').onclick = () => {
            this.closePanel();
            this.game.repeatWave();
        };

        document.getElementById('btn-loss-restart').onclick = () => {
            this.closePanel();
            this.game.restartLevel();
        };
    }

    renderWavePreview(uniqueEnemies) {
        const container = document.getElementById('wave-preview');
        const numberEl = document.getElementById('next-wave-number');
        if (!container) return;

        numberEl.innerText = this.game.waveManager ? this.game.waveManager.currentWave : 1;
        container.innerHTML = '';
        uniqueEnemies.forEach(enemy => {
            const card = document.createElement('div');
            card.style = "background:#1a1a1a; border:1px solid #333; border-radius:8px; padding:8px; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:0.2s;";
            card.onmouseover = () => card.style.borderColor = "var(--accent-red)";
            card.onmouseout = () => card.style.borderColor = "#333";

            const spriteHtml = enemy.sprite 
                ? `<img src="${enemy.sprite}" title="${enemy.name}" style="width:35px; height:35px; object-fit:contain;">` 
                : `<div title="${enemy.name}" style="width:30px; height:30px; background:#8b0000; border-radius:50%;"></div>`;
            
            card.innerHTML = spriteHtml;
            card.onclick = () => this.inspectUnit(enemy, true);
            container.appendChild(card);
        });
    }

    inspectUnit(unit, isEnemyFlag = false) {
        if (!unit) return;
        const isDeployedOnMap = this.game.heroes.includes(unit);
        const isEnemyOnMap = unit.hp !== undefined && typeof unit.takeDamage === 'function' && !unit.id;
        
        if (isEnemyFlag || isEnemyOnMap) {
            const emptyEl = document.getElementById('enemy-info-empty');
            const contentEl = document.getElementById('enemy-info-content');
            if (emptyEl) emptyEl.classList.add('hidden');
            if (contentEl) contentEl.classList.remove('hidden');

            document.getElementById('en-info-name').innerText = unit.name ? unit.name.toUpperCase() : 'ENEMIGO';
            document.getElementById('en-info-hp').innerText = Math.floor(unit.hp);
            document.getElementById('en-info-speed').innerText = unit.speed || 0;
            document.getElementById('en-info-armor').innerText = unit.armor || 0;
            document.getElementById('en-info-regen').innerText = Math.floor(unit.regeneration || 0);
            document.getElementById('en-info-reward').innerText = `$${unit.reward || 10}`;
            
            const stealthRow = document.getElementById('en-stealth-row');
            if (stealthRow) stealthRow.style.display = unit.stealth ? 'block' : 'none';
            
            const flyingRow = document.getElementById('en-flying-row');
            if (flyingRow) flyingRow.style.display = unit.isFlying ? 'block' : 'none';
            
            const clonerRow = document.getElementById('en-cloner-row');
            if (clonerRow) clonerRow.style.display = (unit.config && unit.config.splitInto) ? 'block' : 'none';

            return; 
        }

        this.game.pause();
        this.panelContent.innerHTML = ''; // Limpiar contenido previo para evitar "fantasmas"
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn').classList.remove('hidden');

        const h = unit; 
        const terrainNames = { 0: "Agua", 1: "Hierba", 2: "Camino", 3: "Montaña", 4: "Arbusto" };
        const configRef = h.config || h;

        // Valores base para detectar mejoras (Nivel/Tier incluidos como base del personaje)
        const baseDmg = h.damage || configRef.damage || 0;
        const baseRng = h.range || configRef.range || 0;
        const baseFR = h.fireRate || configRef.fireRate || 1;
        const baseCrit = h.critChance || configRef.critChance || 5;
        const baseStealth = configRef.canSeeStealth || false;
        
        let stats = { damage: baseDmg, range: baseRng, fireRate: baseFR, critChance: baseCrit, canSeeStealth: baseStealth, ability: h.ability || configRef.ability, abilityDesc: h.abilityDesc || configRef.abilityDesc };
        const activeBonuses = [];

        if (isDeployedOnMap) {
            // Si está en el mapa, usamos sus estadísticas calculadas en tiempo real (incluye sinergias y debuffs)
            const effective = h.getEffectiveStats();
            stats.damage = effective.damage;
            stats.fireRate = effective.fireRate;
            stats.range = effective.range;
            stats.critChance = effective.critChance;
            stats.canSeeStealth = effective.canSeeStealth;
            stats.ability = h.ability;

            // Detectar bonos de estado en el mapa
            if (this.game.isAdmin) activeBonuses.push("Director S.H.I.E.L.D.");
            const sameCategoryCount = this.game.heroes.filter(her => her.config.category === configRef.category).length;
            if (sameCategoryCount >= 3) activeBonuses.push(`Sinergia ${configRef.category}`);
            if (h.stars && h.stars > 1) activeBonuses.push(`Rango Estelar (${h.stars}★)`);
        } else {
            // Si está en la colección, aplicamos los multiplicadores de items de forma manual para la vista previa
            const items = h.items || [];
            items.forEach(item => {
                if (!activeBonuses.includes(item.name)) activeBonuses.push(item.name);
                if (item.id === 'reactor_arc') stats.fireRate *= 1.25;
                if (item.id === 'particulas_pym') stats.fireRate *= 1.50;
                if (item.id === 'gema_poder') stats.damage *= 1.50;
                if (item.id === 'lentes_edith' || item.id === 'eye_agamotto') stats.canSeeStealth = true;
                if (item.id === 'capa_levitacion') stats.range *= 1.20;
                if (item.id === 'vibranium_shield') stats.damage *= 1.30;
                if (item.id === 'widow_bite') stats.fireRate *= 1.15;
                if (item.id === 'mjolnir_fragment') stats.damage *= 1.40;
                if (item.id === 'stark_nano') { stats.damage *= 1.20; stats.fireRate *= 1.10; }
                if (item.id === 'mandarin_ring') { stats.damage *= 1.40; stats.range *= 1.10; }
                if (item.id === 'quad_blasters') stats.fireRate *= 1.20;
                if (item.id === 'antman_helmet') stats.range *= 1.15;
                if (item.id === 'kimoyo_beads') stats.critChance += 20;
                if (item.id === 'loki_scepter') stats.critChance += 40;
                if (item.id === 'mercury_boots') stats.fireRate *= 1.35;
                if (item.id === 'cosmic_cube') stats.damage *= 2.0;
                if (item.id === 'hydra_dagger') stats.damage *= 1.15;
                if (item.id === 'hover_boots') { stats.damage *= 1.10; stats.fireRate *= 1.10; }
                if (item.id === 'infinity_gauntlet_replica') {
                    stats.damage *= 1.3; stats.range *= 1.3; stats.fireRate *= 1.3; stats.critChance += 10;
                }
                if (item.id === 'space_stone_shard') stats.range *= 1.50;
                if (item.id === 'cerebro_link') stats.range *= 1.35;
                if (item.id === 'ten_rings') stats.fireRate *= 1.40;
                if (item.id === 'utility_belt') stats.critChance += 5;
                if (item.id === 'hydra_serum') { stats.damage *= 1.25; stats.fireRate *= 0.90; }
                if (item.id === 'ebony_blade') { stats.damage *= 1.20; stats.critChance += 5; }
                if (item.id === 'sling_ring') stats.range *= 1.25;
                if (item.id === 'wakanda_armor') { stats.damage *= 1.15; stats.range *= 1.15; }

                // Bonos Exclusivos
                if (h.id === 'iron_man' && item.id === 'nanobots_stark') stats.damage *= 2.0;
                if (h.id === 'spiderman' && item.id === 'web_shooters_upgraded') stats.fireRate *= 1.6;
                if (h.id === 'capitan_america' && item.id === 'proton_shield') { stats.damage *= 1.5; stats.critChance += 20; }
                if (h.id === 'hulk' && item.id === 'gladiator_gauntlets') { stats.range *= 1.4; stats.damage *= 1.3; }
                if (h.id === 'dr_strange' && item.id === 'book_vishanti') { stats.range *= 1.5; stats.canSeeStealth = true; }
                if (h.id === 'black_panther' && item.id === 'vibranium_daggers') stats.fireRate *= 1.4;
                if (h.id === 'hawkeye' && item.id === 'chitauri_scepter') { stats.damage *= 1.5; stats.ability = "PENTAFLECHA"; }
                if (h.id === 'scarlet_witch' && item.id === 'darkhold_fragment') { stats.damage *= 1.8; stats.fireRate *= 0.9; }
            });
        }

        // Añadir items a la lista de bonos si el héroe está en el mapa
        if (isDeployedOnMap && h.items) {
            h.items.forEach(it => { if(!activeBonuses.includes(it.name)) activeBonuses.push(it.name); });
        }

        // Añadir buffs temporales a la lista de bonificaciones visuales
        if (isDeployedOnMap && h.activeBuffs) {
            h.activeBuffs.forEach(b => { if(!activeBonuses.includes(b.name)) activeBonuses.push(b.name); });
        }

        // Determinar si hay bonos activos para colorear
        const isDmgBoosted = Math.floor(stats.damage) > Math.floor(baseDmg);
        const isRngBoosted = Math.floor(stats.range) > Math.floor(baseRng);
        const isFRBoosted = parseFloat(stats.fireRate) > parseFloat(baseFR);
        const isCritBoosted = stats.critChance > baseCrit;
        const isStealthBoosted = stats.canSeeStealth && !baseStealth;

        const currentLevel = h.level || 1;
        const rarity = h.rarity || configRef.rarity || "Common";
        const rarityStyles = { 'Cosmic': '#fff', 'Legendary': '#f3d403', 'Epic': '#a335ee', 'Rare': '#00d4ff', 'Common': '#888' };
        const rarityColor = rarityStyles[rarity] || '#aaa';

        const currentDmg = Math.floor(stats.damage);
        const currentRng = Math.floor(stats.range);
        const fireRate = parseFloat(stats.fireRate).toFixed(1);
        const critChance = stats.critChance;
        const canSeeStealth = stats.canSeeStealth;

        const priority = h.targetingPriority || configRef.targetingPriority || "Primero";
        const allowedTerrains = h.allowedTerrains || configRef.allowedTerrains || [1];
        const terrainsText = allowedTerrains.map(t => terrainNames[t]).join(", ");
        
        const abilityName = stats.ability || configRef.ability || "Ataque Básico";
        const abilityDesc = stats.abilityDesc || configRef.abilityDesc || "Daña al enemigo objetivo.";
        if (!h.items) h.items = [];

        let html = `
            <div style="display:grid; grid-template-columns: 220px 1fr; gap: 20px; color: white; height: 100%;">
                <div class="${rarity === 'Cosmic' ? 'rarity-cosmic' : ''}" style="text-align:center; background: ${rarity === 'Cosmic' ? '#000' : 'var(--bg-dark)'}; padding: 15px; border-radius: 10px; border: 1px solid ${rarityColor}; display:flex; flex-direction:column;">
                    <h2 class="text-yellow" style="margin-bottom:10px; font-size:18px;">${h.name}</h2>
                    <div style="font-size:11px; font-weight:900; color:${rarityColor}; letter-spacing:2px; margin-bottom:10px; text-transform:uppercase;">RAREZA: ${rarity}</div>
                    <div style="background:#000; border:2px solid var(--primary-blue); border-radius:10px; padding:10px; margin-bottom:15px;">
                        <img src="${configRef.portrait || configRef.sprite}" style="width:100px; height:100px; object-fit:contain;">
                    </div>
                    <p style="font-size: 18px; margin-bottom: 10px; letter-spacing:1px;">RANGO: <strong style="color:#00d4ff;">LVL ${currentLevel}</strong></p>
                    <div style="display:flex; flex-direction:column; gap:8px; margin-top:auto;">
                        ${[1, 5, 10].map(amt => {
                            if (currentLevel + amt > 100) return '';
                            const cost = this.calculateLevelCost(h, amt);
                            return `<button class="modal-btn-upgrade" data-amt="${amt}" data-cost="${cost}" style="padding:10px; background:var(--bright-yellow); color:black; border:none; border-radius:5px; font-weight:bold; cursor:pointer;">SUBIR +${amt} ($${cost})</button>`;
                        }).join('')}
                    </div>
                    <!-- Botón Retirar: visible solo si el héroe está físicamente en el mapa -->
                    ${isDeployedOnMap ? `<button id="btn-remove-hero" style="margin-top:15px; padding:10px; background:rgba(226, 54, 54, 0.2); color:#ff4b4b; border:1px solid #ff4b4b; border-radius:2px; font-size:11px; font-weight:900; cursor:pointer; text-transform:uppercase; letter-spacing:1px; transition: 0.3s;">✖ Retirar de Misión</button>` : ''}
                </div>

                <div style="display:flex; flex-direction:column; gap: 15px;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div style="background: var(--bg-dark); border: 1px solid var(--border-color); padding: 15px; border-radius: 8px;">
                            <h3 style="color:var(--text-light); margin-bottom:10px; font-size:14px; border-bottom:1px solid #444; padding-bottom:5px;">Estadísticas</h3>
                            <p style="margin:5px 0;">⚔️ Daño: <strong style="color:${isDmgBoosted ? '#00ff00' : 'white'};">${currentDmg}</strong></p>
                            <p style="margin:5px 0;">⏱️ Recarga: <strong style="color:${isFRBoosted ? '#00ff00' : 'white'};">${fireRate}/s</strong></p>
                            <p style="margin:5px 0;">🎯 Crítico: <strong style="color:${isCritBoosted ? '#00ff00' : 'white'};">${critChance}%</strong></p>
                            <p style="margin:5px 0;">🔭 Alcance: <strong style="color:${isRngBoosted ? '#00ff00' : 'white'};">${currentRng}</strong></p>
                            <p style="margin:5px 0; font-size:12px;">👻 Anti-Sigilo: <strong style="color:${isStealthBoosted ? '#00ff00' : (canSeeStealth ? 'var(--bright-yellow)' : '#777')};">${canSeeStealth ? 'SÍ' : 'NO'}</strong></p>
                        </div>

                        <div style="background: var(--bg-dark); border: 1px solid var(--border-color); padding: 15px; border-radius: 8px;">
                            <h3 style="color:var(--text-light); margin-bottom:10px; font-size:14px; border-bottom:1px solid #444; padding-bottom:5px;">Táctica</h3>
                            <p style="margin:5px 0;">🌍 Terreno: <span style="font-size:12px; color:gold;">${terrainsText}</span></p>
                            <div style="margin-top:10px;">
                                <label style="font-size:11px; color:#aaa; display:block; margin-bottom:3px;">APUNTAR A:</label>
                                <select id="targeting-select" style="width:100%; background:#111; color:var(--bright-yellow); font-weight:bold; border:1px solid #555; padding:6px; border-radius:4px;">
                                    ${["Primero", "Último", "Fuerte", "Débil"].map(p => `<option value="${p}" ${priority === p ? 'selected' : ''}>${p}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Análisis de Sinergia -->
                    <div style="background: rgba(0, 212, 255, 0.05); padding: 12px; border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 4px;">
                        <h4 style="margin:0 0 8px 0; color:#00d4ff; text-transform:uppercase; font-size:11px; letter-spacing:1px;"><i class="fas fa-users-cog"></i> Análisis de Sinergia</h4>
                        <p style="font-size:10px; color:#ccc; margin:0; line-height:1.4;">
                            <strong style="color:#00d4ff;">BONO DE GRUPO:</strong> Desplegar 3+ unidades de tipo <span style="color:var(--bright-yellow);">${configRef.category}</span> otorga <strong style="color:#00ff00;">+25% DAÑO</strong> global a la categoría.
                        </p>
                        <div style="margin-top:8px; border-top:1px solid rgba(0,212,255,0.1); padding-top:8px;">
                            <div style="font-size:9px; color:#888; text-transform:uppercase; margin-bottom:4px;">Módulos de Sinergia Compatibles:</div>
                            <div style="font-size:10px; color:#aaa;">
                                ${configRef.category === 'Mutante' ? '• <span style="color:#a335ee;">POTENCIADOR GEN-X</span> (+15% Daño en grupo)' : ''}
                                ${configRef.category === 'Tecnológico' ? '• <span style="color:#a335ee;">ENLACE STARK</span> (+20% Cadencia)' : ''}
                                ${configRef.category === 'Místico' ? '• <span style="color:#a335ee;">PERGAMINO ANCESTRAL</span> (+25% Alcance)' : ''}
                                ${configRef.category === 'Cósmico' ? '• <span style="color:#f3d403;">CATALIZADOR CÓSMICO</span> (+20% Daño Crítico)' : ''}
                                ${configRef.category === 'Urbano' ? '• <span style="color:#888;">Actualmente sin hardware de sinergia específico.</span>' : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Bonificaciones Activas -->
                    <div style="background: rgba(0, 255, 0, 0.05); padding: 12px; border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 4px;">
                        <h4 style="margin:0 0 8px 0; color:#00ff00; text-transform:uppercase; font-size:11px; letter-spacing:1px;"><i class="fas fa-chart-line"></i> Bonificaciones Activas</h4>
                        ${activeBonuses.length > 0 
                            ? `<div style="display:flex; flex-wrap:wrap; gap:5px;">
                                ${activeBonuses.map(b => `<span style="background:rgba(0,255,0,0.1); color:#00ff00; padding:2px 8px; border-radius:4px; font-size:9px; border:1px solid rgba(0,255,0,0.2); font-weight:bold;">${b.toUpperCase()}</span>`).join('')}
                               </div>`
                            : `<p style="color:#666; font-size:10px; margin:0; font-style:italic;">SISTEMAS OPERANDO A CAPACIDAD NOMINAL.</p>`
                        }
                    </div>

                    <div style="background: rgba(0, 212, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #00d4ff;">
                        <h4 style="margin:0 0 5px 0; color:#00d4ff; text-transform:uppercase;"><i class="fas fa-bolt"></i> ${abilityName}</h4>
                        <p style="font-size:13px; line-height:1.4; margin:0; color:#eee;">${abilityDesc}</p>
                    </div>

                    <div style="background: rgba(0,0,0,0.2); border: 1px solid #333; padding: 15px; border-radius: 8px; flex:1; display:flex; flex-direction:column; gap:10px;">
                        <h3 style="color:#aaa; margin-bottom:5px; font-size:11px; border-bottom:1px solid #333; padding-bottom:5px; letter-spacing:2px; text-transform:uppercase;">Módulos de Mejora Stark</h3>
                        
                        <div style="display:flex; gap:15px; align-items:center; background:rgba(0,0,0,0.3); padding:12px; border-radius:6px; border:1px solid #444; box-shadow: inset 0 0 15px rgba(0,0,0,0.5);">
                            <div id="modal-item-slot-1" style="min-width:64px; height:64px; border:2px dashed #f3d403; border-radius:6px; display:flex; justify-content:center; align-items:center; background:#000; position:relative;">
                                ${h.items[0] ? `<img src="${h.items[0].icon}" style="width:45px; height:45px; object-fit:contain;">` : '<i class="fas fa-microchip" style="color:#222; font-size:24px;"></i>'}
                            </div>
                            <div style="flex:1;">
                                ${h.items[0] ? `
                                    <strong style="color:#f3d403; display:block; font-size:13px; letter-spacing:1px;">${h.items[0].name.toUpperCase()}</strong>
                                    <p style="color:#aaa; font-size:11px; margin:3px 0; line-height:1.3;">${h.items[0].desc}</p>
                                    <button class="btn-modal-unequip" style="background:rgba(211,47,47,0.15); color:#ff4b4b; border:1px solid #ff4b4b; padding:3px 10px; border-radius:3px; font-size:9px; cursor:pointer; font-weight:900; margin-top:5px; text-transform:uppercase; transition:0.2s;">Desinstalar</button>
                                ` : `<span style="color:#555; font-size:11px; font-style:italic;">SIN MÓDULO DETECTADO. SELECCIONA UN OBJETO DEL INVENTARIO PARA INSTALARLO.</span>`}
                            </div>
                        </div>

                        <div style="margin-top:5px;">
                            <h4 style="color:#666; font-size:9px; margin-bottom:10px; letter-spacing:1px; text-transform:uppercase;">Inventario Disponible</h4>
                            <div id="modal-inventory-list" style="display:flex; gap:12px; overflow-x:auto; padding-bottom:8px; min-height:60px; scrollbar-width: thin;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.panelContent.innerHTML = html;

        // Lógica del botón Retirar con Sincronización de Nivel
        const removeBtn = document.getElementById('btn-remove-hero');
        if (removeBtn && isDeployedOnMap) {
            removeBtn.onmouseover = () => removeBtn.style.background = 'rgba(226, 54, 54, 0.4)';
            removeBtn.onmouseout = () => removeBtn.style.background = 'rgba(226, 54, 54, 0.2)';
            
            removeBtn.onclick = () => {
                const idx = this.game.heroes.indexOf(unit);
                if (idx > -1) {
                    this.game.heroes.splice(idx, 1);
                    this.closePanel();
                    console.log(`Unidad ${h.name} retirada. Nivel maestro: ${h.level}`);
                }
            };
        }

        const targetSelect = document.getElementById('targeting-select');
        if (targetSelect) targetSelect.onchange = (e) => { h.targetingPriority = e.target.value; if (h.config) h.config.targetingPriority = e.target.value; };

        this.panelContent.querySelectorAll('.modal-btn-upgrade').forEach(btn => {
            btn.onclick = () => {
                const amount = parseInt(btn.getAttribute('data-amt'));
                const cost = parseInt(btn.getAttribute('data-cost'));
                this.processUpgrade(h, amount, cost);
            };
        });

        // --- Lógica Avanzada de Equipamiento ---
        
        // 1. Desequipar
        const dossierUnequipBtn = this.panelContent.querySelector('.btn-modal-unequip');
        if (dossierUnequipBtn) {
            dossierUnequipBtn.onclick = () => {
                const item = h.items.pop();
                this.game.ownedItems.push(item);
                const heroOnMap = this.game.heroes.find(her => her.id === h.id);
                if (heroOnMap) heroOnMap.items = [...h.items];
                this.inspectUnit(unit); // Refresh instantáneo
            };
        }

        // 2. Drag & Drop y Click-to-Equip
        const slot = document.getElementById('modal-item-slot-1');
        const handleEquip = (idx) => {
            const item = this.game.ownedItems[idx];
            if (!item) return;

            if (item.exclusive && item.exclusive !== h.id) {
                alert(`INCOMPATIBLE: Este hardware es exclusivo para ${item.exclusive.toUpperCase()}.`);
                return;
            }
            if (h.items.length >= 1) {
                alert("ERROR DE SISTEMA: Todas las ranuras de equipamiento están ocupadas.");
                return;
            }

            this.game.ownedItems.splice(idx, 1);
            h.items.push(item);
            if (item.exclusive && item.exclusive === h.id) {
                this.game.unlockAchievement('tactician');
            }
            const heroOnMap = this.game.heroes.find(her => her.id === h.id);
            if (heroOnMap) heroOnMap.items = [...h.items];
            this.inspectUnit(unit); // Refresh para ver el cambio de stats
        };

        if (!h.items[0] && slot) {
            slot.ondragover = (e) => e.preventDefault();
            slot.ondrop = (e) => {
                const idx = e.dataTransfer.getData('idx');
                if (idx !== "") handleEquip(parseInt(idx));
            };
        }

        const dossierInvList = document.getElementById('modal-inventory-list');
        if (this.game.ownedItems && this.game.ownedItems.length > 0) {
            this.game.ownedItems.forEach((it, idx) => {
                const itemCard = document.createElement('div');
                const colorMap = { 1: '#888', 2: '#00d4ff', 3: '#a335ee', 4: '#f3d403', 5: '#fff' };
                const rarityColor = colorMap[it.tier] || '#aaa';

                itemCard.style = `
                    min-width: 52px; height: 52px; background: #111; 
                    border: 1px solid ${rarityColor}66; border-radius: 4px; 
                    display: flex; justify-content: center; align-items: center; 
                    cursor: pointer; position: relative; transition: 0.2s;
                `;
                itemCard.title = `${it.name}\n${it.desc}`;
                itemCard.draggable = true;
                itemCard.innerHTML = `<img src="${it.icon}" style="width:34px; height:34px; object-fit:contain;">`;
                
                itemCard.onclick = () => handleEquip(idx);
                itemCard.ondragstart = (e) => e.dataTransfer.setData('idx', idx);
                itemCard.onmouseover = () => { itemCard.style.background = '#222'; itemCard.style.borderColor = rarityColor; };
                itemCard.onmouseout = () => { itemCard.style.background = '#111'; itemCard.style.borderColor = rarityColor + '66'; };
                
                dossierInvList.appendChild(itemCard);
            });
        }
    }

    calculateLevelCost(unit, amount) {
        const config = unit.config || unit;
        const rarity = config.rarity || "Common";
        const currentLevel = unit.level || 1;
        
        // Multiplicador de costo según rareza
        const rarityMultiplier = { "Common": 1, "Rare": 2, "Epic": 3, "Legendary": 5, "Cosmic": 10 };
        const baseCost = 150 * (rarityMultiplier[rarity] || 1);

        let total = 0;
        for(let i=0; i<amount; i++) total += (currentLevel + i) * baseCost;
        return total;
    }

    processUpgrade(unit, amount, cost) {
        if (this.game.resourceManager.credits >= cost) {
            const targetData = unit.config ? unit.config : unit; 
            const oldLevel = targetData.level || 1;
            const newLevel = oldLevel + amount;

            if (newLevel > 100) return alert("¡Nivel máximo alcanzado (100)!");

            this.game.resourceManager.removeCredits(cost);
            targetData.level = newLevel;
            
            // Inicializar bases para escalado si no existen
            if (!targetData.baseDamage) targetData.baseDamage = targetData.damage || 10;
            if (!targetData.baseRange) targetData.baseRange = targetData.range || 100;

            // Lógica de Evolución (cada 30 niveles: 30, 60, 90)
            const oldTier = Math.floor(oldLevel / 30);
            const newTier = Math.floor(newLevel / 30);

            if (newTier > oldTier) {
                console.log(`¡EVOLUCIÓN! ${targetData.name} ha alcanzado el Rango ${newTier}`);
                this.game.checkQuestProgress('totalEvolution', 1);
                
                if (targetData.id === 'thor' && newLevel === 100) {
                    this.game.unlockAchievement('god');
                }
                this.game.resourceManager.addGems(25 * newTier); // ¡Bono especial de Gemas por Evolución!

                // Actualización de habilidad (nombre/descripción)
                if (targetData.evolutionAbilities && targetData.evolutionAbilities[newTier]) {
                    const evo = targetData.evolutionAbilities[newTier];
                    targetData.ability = evo.name;
                    targetData.abilityDesc = evo.desc;
                } else {
                    targetData.ability = `ULTRA ${targetData.ability}`;
                    targetData.abilityDesc = `${targetData.abilityDesc} (Potenciado por Evolución R${newTier})`;
                }

                // Actualizar rutas de imágenes en los datos para reflejar la evolución visual
                const evolvedPath = `assets/images/heroes/${targetData.id}/tier${newTier}`;
                targetData.portrait = `${evolvedPath}/portrait.png`;
                targetData.sprite = `${evolvedPath}/sprites/south.png`;
            }

            // Escalado considerable: Aumento base por nivel + multiplicador por evolución (50% daño, 10% rango por tier)
            const evoMultDmg = 1 + (newTier * 0.5);
            const evoMultRng = 1 + (newTier * 0.1);
            targetData.damage = Math.floor(targetData.baseDamage * Math.pow(1.25, targetData.level - 1) * evoMultDmg);
            targetData.range = Math.floor((targetData.baseRange + (targetData.level * 2)) * evoMultRng);

            // SINCRONIZACIÓN MAESTRA: Guardar el progreso en la colección permanente
            const masterHero = this.game.unlockedHeroes.find(h => h.id === targetData.id);
            if (masterHero) {
                masterHero.level = targetData.level;
                masterHero.damage = targetData.damage;
                masterHero.range = targetData.range;
                masterHero.ability = targetData.ability;
                masterHero.abilityDesc = targetData.abilityDesc;
                masterHero.portrait = targetData.portrait;
                masterHero.sprite = targetData.sprite;
            }

            const sync = (h) => {
                h.level = targetData.level; h.damage = targetData.damage; h.range = targetData.range;
                h.evolutionTier = newTier; h.ability = targetData.ability; h.abilityDesc = targetData.abilityDesc;
                if (typeof h.initSprites === 'function') h.initSprites(); // Recargar imágenes físicamente
            };

            if (typeof unit.takeDamage !== 'function' && typeof unit.shoot === 'function') {
                sync(unit);
            } else {
                const heroOnMap = this.game.heroes.find(h => h.id === targetData.id);
                if (heroOnMap) sync(heroOnMap);
            }

            const currentWave = this.game.waveManager ? this.game.waveManager.currentWave : 1;
            this.updateUI(this.game.resourceManager.lives, this.game.resourceManager.credits, currentWave, this.game.fps, this.game.stars);
            this.inspectUnit(unit); 
        } else {
            alert("¡Créditos insuficientes para esta mejora!");
        }
    }

    refillShop() {
        for (let i = 0; i < 3; i++) {
            if (!this.shopSlots[i] && this.itemPool.length > 0) {
                this.shopSlots[i] = this.itemPool.shift();
            }
        }
    }

    renderPanel(type) {
        let html = `<h2 class="text-yellow" style="margin-bottom:15px;">${type.toUpperCase()}</h2>`;
        
        if (type === 'shop') {
            this.renderShopPanel();
        }
        else if (type === 'profile') {
            this.renderProfilePanel();
        }
        else if (type === 'levels') {
            this.renderLevelsPanel();
        }
        else if (type === 'settings') {
            this.renderSettingsPanel();
        }
        else if (type === 'quests') {
            this.renderQuestsPanel();
        }
        else if (type === 'collection') {
            this.renderCollectionPanel();
        }
        else if (type === 'inventory') {
            this.renderInventoryPanel();
        }
        else if (type === 'wiki') {
            this.renderWikiPanel();
        }
    }

    // --- Métodos de Renderizado de Paneles Específicos ---

    renderShopPanel() {
        if (!this.shopInitialized) {
            const db = this.game.itemDatabase || {}; 
            this.itemPool = Object.values(db).sort((a, b) => {
                if (a.tier !== b.tier) return (a.tier || 1) - (b.tier || 1);
                return (a.price || 0) - (b.price || 0);
            });
            const ownedIds = this.game.ownedItems.map(i => i.id);
            this.itemPool = this.itemPool.filter(item => !ownedIds.includes(item.id));
            this.refillShop();
            this.shopInitialized = true;
        }

        let html = `
            <div style="display:grid; grid-template-columns:1fr; gap:20px; padding:10px;">
                <div style="border:2px solid var(--primary-blue); padding:15px; border-radius:10px; background:rgba(0, 150, 255, 0.1); text-align:center;">
                    <h3 style="color:#00d4ff; margin-bottom:5px;">SUMMON PREMIUM</h3>
                    <button class="btn-primary" id="gacha-btn" style="padding:10px 20px; font-weight:bold; cursor:pointer; background:#8a2be2;">INVOCAR (${this.game.playerProfile.gachaPrice} GEMAS)</button>
                    <div id="gacha-res" style="margin-top:10px; font-size:14px; font-weight:bold;"></div>
                </div>
                <div style="border:2px solid var(--bright-yellow); padding:15px; border-radius:10px; background:rgba(255, 215, 0, 0.05);">
                    <h3 style="color:var(--bright-yellow); text-align:center; margin-bottom:10px;">MERCADO NEGRO S.H.I.E.L.D.</h3>
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
        `;
        this.shopSlots.forEach((item, idx) => {
            if (item) {
                html += `
                    <div style="background:var(--bg-dark); border:1px solid #444; border-radius:8px; padding:10px; display:flex; flex-direction:column; align-items:center; text-align:center;">
                        <strong style="font-size:12px; color:white; min-height:30px;">${item.name}</strong>
                        <p style="font-size:10px; color:#aaa; flex:1; margin:5px 0;">${item.desc}</p>
                        <span style="font-size:10px; color:gold; margin-bottom:5px;">Tier ${item.tier}</span>
                        <button class="btn-buy-item" data-idx="${idx}" data-price="${item.price}" style="width:100%; padding:8px; background:gold; color:black; font-weight:bold; border:none; border-radius:4px; cursor:pointer; margin-top:auto;">
                            $${item.price}
                        </button>
                    </div>
                `;
            } else {
                html += `<div style="background:rgba(0,0,0,0.5); border:1px dashed #444; border-radius:8px; padding:10px; display:flex; justify-content:center; align-items:center; opacity:0.5; min-height:160px;"><span style="font-size:12px; color:#666;">Agotado</span></div>`;
            }
        });

        html += `</div></div></div>`;
        this.panelContent.innerHTML = html;

        const gachaBtn = document.getElementById('gacha-btn');
        if (gachaBtn) gachaBtn.onclick = () => this.handleGacha();

        this.panelContent.querySelectorAll('.btn-buy-item').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                const price = parseInt(btn.getAttribute('data-price'));
                const item = this.shopSlots[idx];
                if (this.game.resourceManager.credits >= price) {
                    this.game.resourceManager.removeCredits(price);
                    this.game.ownedItems.push(item);
                    this.game.checkQuestProgress('itemsOwned', 1);
                    this.shopSlots[idx] = null;
                    this.refillShop();
                    this.updateUI(this.game.resourceManager.lives, this.game.resourceManager.credits, 1, this.game.fps, this.game.stars);
                    this.renderPanel('shop'); 
                } else { alert("¡Créditos insuficientes!"); }
            };
        });
    }

    renderQuestsPanel() {
        const qs = this.game.playerProfile.quests;
        let html = `<div style="display:flex; flex-direction:column; gap:15px; color:white;">`;
        Object.entries(qs).forEach(([id, q]) => {
            const percent = Math.min(100, (q.current / q.goal) * 100);
            html += `
                <div style="background: linear-gradient(90deg, #1a1a1b 0%, #2d2d2e 100%); border: 1px solid #444; border-left: 4px solid #e23636; padding:15px; border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items: center;">
                        <strong style="color:#f3d403; letter-spacing: 1px; text-transform: uppercase; font-size: 13px;">${q.title}</strong>
                        <span style="color:#e9d5ff; font-weight: bold; font-size: 12px;"><i class="fas fa-gem"></i> +${q.reward}</span>
                    </div>
                    <div style="width:100%; height:8px; background:#111; border-radius:2px; overflow:hidden; border:1px solid #333;">
                        <div style="width:${percent}%; height:100%; background: linear-gradient(90deg, #e23636, #ff4b4b); box-shadow: 0 0 10px rgba(226, 54, 54, 0.4);"></div>
                    </div>
                    <div style="text-align:right; font-size:10px; margin-top:5px; color:#888; font-family: monospace;">STATUS: ${q.current} / ${q.goal}</div>
                </div>
            `;
        });
        html += `</div>`;
        this.panelContent.innerHTML = html;
    }

    renderProfilePanel() {
        const p = this.game.playerProfile;
        const stats = p.stats;
        const xpToNext = p.level * 1000;
        const xpPercent = (p.xp / xpToNext) * 100;

        let html = `
            <div style="display:flex; flex-direction:column; gap:20px; color:white; height: 100%; overflow:hidden;">
                <!-- HEADER FIJO: IDENTIDAD -->
                <div style="background:${p.banner}; border:2px solid var(--border-color); border-radius:12px; padding:20px; display:flex; align-items:center; gap:25px; position:relative; box-shadow: inset 0 0 30px rgba(0,0,0,0.5); flex-shrink:0;">
                    <div style="position:relative;">
                        <img src="${p.avatar}" style="width:80px; height:80px; border-radius:50%; border:3px solid var(--bright-yellow); background:#000;">
                        <div style="position:absolute; bottom:-5px; right:-5px; background:var(--bright-yellow); color:black; font-weight:900; padding:2px 6px; border-radius:4px; font-size:11px;">LVL ${p.level}</div>
                    </div>
                    <div style="flex:1;">
                        <h1 style="margin:0; font-size:22px; color:var(--bright-yellow); text-transform:uppercase;">${p.username}</h1>
                        <select id="title-selector" style="background:transparent; border:none; color:var(--primary-blue); font-weight:bold; font-size:12px; text-transform:uppercase; cursor:pointer;">
                            ${p.unlockedTitles.map(t => `<option value="${t}" ${p.title === t ? 'selected' : ''} style="background:#222; color:white;">${t}</option>`).join('')}
                        </select>
                        <div style="width:100%; height:8px; background:#333; border-radius:4px; margin-top:10px; border:1px solid #555; overflow:hidden;">
                            <div style="width:${xpPercent}%; height:100%; background:linear-gradient(90deg, #0078d7, #00d4ff);"></div>
                        </div>
                    </div>
                </div>

                <!-- NAVEGACIÓN DE PESTAÑAS -->
                <div style="display:flex; gap:10px; flex-shrink:0;">
                    <button id="profile-tab-stats" class="btn-primary" style="flex:1; background:var(--primary-blue);">ESTADÍSTICAS</button>
                    <button id="profile-tab-achievements" class="btn-primary" style="flex:1; background:#333;">LOGROS</button>
                </div>

                <!-- ÁREA DINÁMICA CON SCROLL -->
                <div id="profile-dynamic-content" style="flex:1; overflow-y:auto; padding-right:10px; scrollbar-width: thin;">
                </div>
            </div>
        `;
        this.panelContent.innerHTML = html;

        const dynamicArea = document.getElementById('profile-dynamic-content');

        const renderStats = () => {
            let statsHtml = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <div style="background:rgba(0,0,0,0.3); border:1px solid #444; padding:15px; border-radius:8px;">
                        <h3 style="color:var(--bright-yellow); font-size:14px; margin-bottom:12px; text-transform:uppercase;"><i class="fas fa-chart-line"></i> Historial Global</h3>
                        <div style="display:flex; flex-direction:column; gap:8px; font-size:12px;">
                            <div style="display:flex; justify-content:space-between;"><span>Oleadas Totales:</span> <strong>${stats.totalWavesCleared}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Récord:</span> <strong class="text-blue">#${stats.highestWaveReached}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Jefes Derrotados:</span> <strong class="text-red">${stats.bossesDefeated}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Colección:</span> <strong>${this.game.unlockedHeroes.length} / 22</strong></div>
                        </div>
                    </div>
                    <div style="background:rgba(0,0,0,0.3); border:1px solid #444; padding:15px; border-radius:8px;">
                        <h3 style="color:var(--primary-blue); font-size:14px; margin-bottom:12px; text-transform:uppercase;"><i class="fas fa-map-marked-alt"></i> Campaña</h3>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${Object.entries(this.game.levelDatabase).map(([id, lvl]) => {
                                const waves = this.game.completedWavesByLevel[id] || 0;
                                const pcent = Math.min(100, (waves / 100) * 100);
                                return `
                                    <div>
                                        <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:3px;">
                                            <span>${lvl.name}</span>
                                            <span style="color:gold;">${waves}/100</span>
                                        </div>
                                        <div style="width:100%; height:4px; background:#222; border-radius:2px; overflow:hidden;">
                                            <div style="width:${pcent}%; height:100%; background:var(--primary-blue);"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
            dynamicArea.innerHTML = statsHtml;
            document.getElementById('profile-tab-stats').style.background = 'var(--primary-blue)';
            document.getElementById('profile-tab-achievements').style.background = '#333';
        };

        const renderAchievs = () => {
            this.renderAchievementsPanel(dynamicArea);
            document.getElementById('profile-tab-stats').style.background = '#333';
            document.getElementById('profile-tab-achievements').style.background = 'var(--primary-blue)';
        };

        document.getElementById('profile-tab-stats').onclick = renderStats;
        document.getElementById('profile-tab-achievements').onclick = renderAchievs;

        renderStats(); // Carga inicial

        // Listener del selector de títulos
        const titleSel = document.getElementById('title-selector');
        if (titleSel) titleSel.onchange = (e) => {
            this.game.playerProfile.title = e.target.value;
            this.game.savePersistence();
            console.log(`Título actualizado a: ${e.target.value}`);
        };
    }

    renderAchievementsPanel(container) {
        const achievements = Object.values(this.game.hiddenAchievements);
        const unlockedTitles = new Set(this.game.playerProfile.unlockedTitles);

        let html = `
            <div style="display:flex; flex-direction:column; gap:15px; padding-top:10px;">
                ${achievements.map(ach => {
                    const isUnlocked = unlockedTitles.has(ach.title);
                    const borderColor = isUnlocked ? 'var(--bright-yellow)' : '#444';
                    const bgColor = isUnlocked ? 'rgba(255,215,0,0.05)' : 'rgba(0,0,0,0.3)';
                    const textColor = isUnlocked ? 'white' : '#888';
                    const iconColor = isUnlocked ? 'var(--bright-yellow)' : '#666';
                    const descColor = isUnlocked ? '#ccc' : '#666';
                    const rewardColor = isUnlocked ? '#00ff00' : '#666';

                    return `
                        <div style="background:${bgColor}; border:1px solid ${borderColor}; border-left:4px solid ${borderColor}; border-radius:8px; padding:15px; display:flex; gap:15px; align-items:center; box-shadow: 0 0 10px ${isUnlocked ? 'rgba(255,215,0,0.3)' : 'transparent'};">
                            <i class="fas ${isUnlocked ? 'fa-check-circle' : 'fa-lock'} fa-2x" style="color:${iconColor};"></i>
                            <div style="flex:1;">
                                <strong style="color:${textColor}; font-size:14px; letter-spacing:1px;">${isUnlocked ? ach.title.toUpperCase() : 'LOGRO CLASIFICADO'}</strong>
                                <p style="font-size:11px; color:${descColor}; margin:5px 0;">${isUnlocked ? ach.desc : 'Desbloquea este logro para revelar sus detalles.'}</p>
                                <span style="font-size:10px; color:${rewardColor}; font-weight:bold;"><i class="fas fa-gem"></i> +${ach.rewardGems} Gemas</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        container.innerHTML = html;
    }

    renderLevelsPanel() {
        let html = `<div style="display:flex; flex-direction:column; gap:15px;">`;
        Object.entries(this.game.levelDatabase).forEach(([id, level]) => {
            const isUnlocked = this.game.stars >= level.starsRequired;
            const isCurrent = this.game.currentLevelId === id;
            
            html += `
                <div style="background:var(--bg-panel); padding:15px; border:1px solid ${isCurrent ? 'var(--bright-yellow)' : 'var(--border-color)'}; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="margin:0; color:${isUnlocked ? 'white' : '#666'};">${level.name}</h3>
                        <small style="color:#aaa;">${isUnlocked ? 'Desbloqueado' : `Requiere ${level.starsRequired} estrellas`}</small>
                    </div>
                    ${isCurrent ? '<span style="color:var(--bright-yellow); font-weight:bold;">ACTUAL</span>' : 
                      isUnlocked ? `<button class="btn-primary load-level-btn" data-id="${id}" style="padding:5px 15px;">JUGAR</button>` : 
                      '<i class="fas fa-lock" style="color:#666;"></i>'}
                </div>
            `;
        });
        html += `</div>`;
        this.panelContent.innerHTML = html;
        this.panelContent.querySelectorAll('.load-level-btn').forEach(btn => btn.onclick = () => this.game.loadLevel(btn.getAttribute('data-id')));
    }

    renderSettingsPanel() {
        let html = `
            <div style="color:white; height:100%; display:grid; grid-template-columns: 180px 1fr; gap:20px;">
                <div style="display:flex; flex-direction:column; gap:8px; border-right: 1px solid #333; padding-right:15px;">
                    ${['gameplay', 'audio', 'graphics', 'ui', 'data', 'qol'].map(cat => `
                        <button class="settings-tab-btn" data-cat="${cat}" style="padding:12px; background:#111; border:1px solid #444; color:white; border-radius:6px; cursor:pointer; text-align:left; font-size:11px; font-weight:bold; text-transform:uppercase; transition:0.2s;">
                            ${cat === 'qol' ? 'C. Vida' : cat.toUpperCase()}
                        </button>
                    `).join('')}
                </div>
                <div id="settings-category-panel" style="overflow-y:auto; padding-right:10px;"></div>
            </div>
        `;
        this.panelContent.innerHTML = html;

        const contentPanel = document.getElementById('settings-category-panel');
        const tabBtns = this.panelContent.querySelectorAll('.settings-tab-btn');
        
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                tabBtns.forEach(b => { b.style.borderColor = "#444"; b.style.color = "white"; });
                btn.style.borderColor = "var(--bright-yellow)";
                btn.style.color = "var(--bright-yellow)";
                this.renderSettingsCategory(btn.getAttribute('data-cat'), contentPanel);
            };
        });
        tabBtns[0].click();
    }

    renderCollectionPanel(filterText = "") {
        let html = `
            <div style="margin-bottom:15px;">
                <input type="text" id="collection-search-input" placeholder="Buscar héroe por nombre..." value="${filterText}" style="width:100%; padding:10px; background:#111; border:1px solid #444; color:white; border-radius:6px; outline:none; font-size:13px;">
            </div>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:15px; max-height: 55vh; overflow-y:auto; padding-right:5px;">
        `;
        const heroes = this.game.unlockedHeroes.filter(h => h.name.toLowerCase().includes(filterText.toLowerCase()));
        
        heroes.forEach(hero => {
            const isEquipped = this.game.activeTeam.some(h => h.id === hero.id);
            const btnText = isEquipped ? 'Desequipar' : 'Equipar';
            const btnColor = isEquipped ? 'var(--accent-red)' : 'var(--primary-blue)';

            const rarityStyles = { 'Cosmic': '#fff', 'Legendary': '#f3d403', 'Epic': '#a335ee', 'Rare': '#00d4ff', 'Common': '#888' };
            const rarityColor = rarityStyles[hero.rarity] || '#aaa';
            const isCosmic = hero.rarity === 'Cosmic';

            html += `
            <div class="${isCosmic ? 'rarity-cosmic' : ''}" style="background:${isCosmic ? '#000' : 'rgba(255,255,255,0.03)'}; border:1px solid ${rarityColor}; padding:15px; border-radius:8px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                <div style="font-weight:900; color:#f3d403; text-transform:uppercase; letter-spacing:1px; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${hero.name}</div>
                <div style="font-size:9px; font-weight:900; color:${rarityColor}; letter-spacing:2px; text-transform:uppercase; margin-top:-4px;">${hero.rarity}</div>
                <div style="background:#000; border:1px solid #444; border-radius:4px; padding:5px; width:70px; height:70px; display:flex; align-items:center; justify-content:center; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                    <img src="${hero.portrait || hero.sprite}" style="max-width:100%; max-height:100%; object-fit:contain;">
                </div>
                <button class="btn-equip" data-id="${hero.id}" style="background:${btnColor}; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer; width:100%; font-weight:900; text-transform:uppercase; letter-spacing:1px; font-size:10px; transition:0.2s;">${btnText}</button>
            </div>`;
        });
        html += `</div>`;
        this.panelContent.innerHTML = html;

        const searchInput = document.getElementById('collection-search-input');
        searchInput.focus();
        // Colocar el cursor al final para permitir escritura fluida
        searchInput.setSelectionRange(filterText.length, filterText.length);
        
        searchInput.oninput = () => {
            this.renderCollectionPanel(searchInput.value);
        };

        this.panelContent.querySelectorAll('.btn-equip').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const heroConfig = this.game.unlockedHeroes.find(h => h.id === id);
                const isEquipped = this.game.activeTeam.some(h => h.id === id);

                if (isEquipped) this.game.activeTeam = this.game.activeTeam.filter(h => h.id !== id);
                else {
                    if (this.game.activeTeam.length >= 6) return alert("Tu equipo activo está lleno (Máx 6).");
                    this.game.activeTeam.push(heroConfig);
                }
                this.renderPanel('collection'); 
                this.renderHeroRoster(this.game.activeTeam, (h) => this.game.inputManager.setPlacementMode(h)); 
            };
        });
    }

    renderInventoryPanel(filterText = "") {
        let html = `
            <div style="display:flex; flex-direction:column; gap:20px;">
                <section>
                    <h3 style="color:var(--bright-yellow); border-bottom:1px solid #444; padding-bottom:5px; margin-bottom:10px; font-size:16px;">Mochila (Objetos sin asignar)</h3>
                    <input type="text" id="inventory-search-input" placeholder="Filtrar por nombre o efecto..." value="${filterText}" style="width:100%; padding:8px; background:#111; border:1px solid #444; color:white; border-radius:6px; outline:none; font-size:12px; margin-bottom:10px;">
                    <div style="display:grid; grid-template-columns:1fr; gap:10px; max-height:200px; overflow-y:auto; padding-right:5px;">
        `;

        const filteredItems = this.game.ownedItems.filter(it => 
            it.name.toLowerCase().includes(filterText.toLowerCase()) || 
            it.desc.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filteredItems.length === 0) {
            html += `<p style="color:#666; font-size:13px; text-align:center; padding: 20px;">No tienes objetos en la mochila.</p>`;
        }

        filteredItems.forEach((it) => {
            const realIdx = this.game.ownedItems.indexOf(it);
            html += `
                <div style="background:var(--bg-panel); border:1px solid gold; border-radius:8px; padding:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1;">
                        <strong style="color:white; font-size:13px;">${it.name}</strong>
                        <p style="color:#aaa; font-size:11px; margin:2px 0 0 0; line-height:1.2;">${it.desc}</p>
                    </div>
                    <div style="margin-left:10px;">
                        <select class="equip-select" data-idx="${realIdx}" style="background:#000; color:gold; border:1px solid #555; padding:4px; border-radius:4px; font-size:11px; cursor:pointer;">
                            <option value="">Equipar a...</option>
                            ${this.game.activeTeam.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                </section>
                <section>
                    <h3 style="color:var(--primary-blue); border-bottom:1px solid #444; padding-bottom:5px; margin-bottom:15px; font-size:16px;">Equipamiento del Equipo</h3>
                    <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
        `;

        this.game.activeTeam.forEach(hero => {
            if (!hero.items) hero.items = [];
            const item = hero.items[0];
            html += `
                <div style="background:rgba(0,0,0,0.4); border:1px solid #333; border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:5px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <img src="${hero.portrait || hero.sprite}" style="width:24px; height:24px; object-fit:contain; border-radius:4px; background:#000;">
                        <strong style="color:var(--bright-yellow); font-size:12px;">${hero.name}</strong>
                    </div>
                    <div style="background:#111; border:1px dashed #444; border-radius:6px; padding:6px; min-height:36px; display:flex; justify-content:space-between; align-items:center;">
                        ${item ? `
                            <div style="flex:1;">
                                <div style="color:white; font-size:11px; font-weight:bold;">${item.name}</div>
                            </div>
                            <button class="btn-unequip" data-hero-id="${hero.id}" style="background:var(--accent-red); color:white; border:none; padding:4px 6px; border-radius:4px; font-size:10px; cursor:pointer; margin-left:5px;">QUITAR</button>
                        ` : `<span style="color:#555; font-size:10px;">Vacío</span>`}
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                </section>
            </div>
        `;
        this.panelContent.innerHTML = html;

        const invSearch = document.getElementById('inventory-search-input');
        invSearch.focus();
        invSearch.setSelectionRange(filterText.length, filterText.length);
        invSearch.oninput = () => {
            this.renderInventoryPanel(invSearch.value);
        };

        // Lógica para Equipar mediante el selector
        this.panelContent.querySelectorAll('.equip-select').forEach(select => {
            select.onchange = (e) => {
                const itemIdx = parseInt(select.getAttribute('data-idx'));
                const heroId = e.target.value;
                if (!heroId) return;

                const heroConfig = this.game.activeTeam.find(h => h.id === heroId);
                if (heroConfig) {
                    if (!heroConfig.items) heroConfig.items = [];
                    const item = this.game.ownedItems[itemIdx];

                    if (item.exclusive && item.exclusive !== heroConfig.id) {
                        alert(`¡Incompatible! Este objeto solo puede ser equipado por ${item.exclusive.replace('_', ' ').toUpperCase()}.`);
                        e.target.value = "";
                        return;
                    }

                    if (heroConfig.items.length >= 1) {
                        alert(`${heroConfig.name} ya tiene un objeto. Desequípalo primero.`);
                        e.target.value = "";
                        return;
                    }
                    this.game.ownedItems.splice(itemIdx, 1);
                    heroConfig.items.push(item);
                    
                    // Sincronizar con el héroe en el mapa si ya está desplegado
                    const heroOnMap = this.game.heroes.find(h => h.id === heroConfig.id);
                    if (heroOnMap) heroOnMap.items = [...heroConfig.items];

                    this.renderPanel('inventory');
                }
            };
        });

        // Lógica para Desequipar
        this.panelContent.querySelectorAll('.btn-unequip').forEach(btn => {
            btn.onclick = () => {
                const heroId = btn.getAttribute('data-hero-id');
                const heroConfig = this.game.activeTeam.find(h => h.id === heroId);
                if (heroConfig && heroConfig.items && heroConfig.items.length > 0) {
                    // Mover item de héroe a mochila
                    const item = heroConfig.items.pop();
                    this.game.ownedItems.push(item);
                    
                    // Sincronizar con el héroe en el mapa
                    const heroOnMap = this.game.heroes.find(h => h.id === heroConfig.id);
                    if (heroOnMap) heroOnMap.items = [...heroConfig.items];

                    this.renderPanel('inventory');
                }
            };
        });
    }

    renderSettingsCategory(cat, container) {
        const s = this.game.settings;
        let html = `<h3 style="margin-top:0; color:var(--bright-yellow); text-transform:uppercase; font-size:16px; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:20px;">Ajustes de ${cat}</h3>`;
        
        const createToggle = (label, catKey, itemKey, desc) => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid #333; border-radius:8px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1;">
                    <div style="font-size:13px; font-weight:bold; color:white;">${label}</div>
                    <div style="font-size:10px; color:#888; margin-top:2px;">${desc}</div>
                </div>
                <input type="checkbox" class="setting-cb" data-cat="${catKey}" data-key="${itemKey}" ${s[catKey][itemKey] ? 'checked' : ''} style="width:22px; height:22px; cursor:pointer; accent-color:var(--bright-yellow);">
            </div>
        `;

        const createRange = (label, catKey, itemKey, desc, min=0, max=100, step=1) => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid #333; border-radius:8px; padding:12px; margin-bottom:10px; display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:13px; font-weight:bold; color:white;">${label}</div>
                    <div style="font-size:13px; color:var(--bright-yellow); font-weight:bold;"><span id="val-${itemKey}">${s[catKey][itemKey]}</span>${itemKey === 'transparency' ? '' : '%'}</div>
                </div>
                <input type="range" class="setting-range" data-cat="${catKey}" data-key="${itemKey}" min="${min}" max="${max}" step="${step}" value="${s[catKey][itemKey]}" style="width:100%; cursor:pointer; accent-color:var(--bright-yellow);">
                <div style="font-size:10px; color:#888;">${desc}</div>
            </div>
        `;

        if (cat === 'gameplay') {
            html += createToggle("Próxima Ola Auto", 'gameplay', 'autoWave', "Inicia la siguiente oleada automáticamente al terminar.");
            html += createToggle("Auto Reintentar", 'gameplay', 'autoRetry', "Repite la oleada actual si pierdes todas las vidas.");
            html += createToggle("Auto Reiniciar", 'gameplay', 'autoRestart', "Vuelve a la oleada 1 si pierdes todas las vidas.");
            html += createToggle("Confirmar Compras", 'gameplay', 'purchaseConfirm', "Muestra un mensaje antes de gastar créditos.");
            html += createToggle("Daño Flotante", 'gameplay', 'showDamage', "Muestra números de daño sobre los enemigos.");
            html += createToggle("VFX Pesados", 'gameplay', 'vfxHeavy', "Activa efectos visuales complejos y partículas.");
            html += createToggle("Tutoriales", 'gameplay', 'tutorials', "Muestra consejos y ayudas durante el juego.");
            
            html += `
                <div style="margin-top:20px; border-top:1px solid #444; padding-top:20px;">
                    <button id="btn-admin-mode" class="btn-primary" style="width:100%; background:linear-gradient(90deg, #222, #111); border:1px solid #f3d403; color:#f3d403; font-size:11px; letter-spacing:2px; font-weight:900;">DIRECTOR S.H.I.E.L.D. (RESTRICTED)</button>
                </div>
            `;
        } else if (cat === 'audio') {
            html += createRange("Volumen Maestro", 'audio', 'master', "Control de volumen global del juego.");
            html += createRange("Música", 'audio', 'music', "Volumen de la banda sonora.");
            html += createRange("Efectos (SFX)", 'audio', 'sfx', "Volumen de disparos, explosiones y habilidades.");
            html += createRange("Interfaz", 'audio', 'ui', "Volumen de botones y menús.");
            html += createRange("Alertas", 'audio', 'alerts', "Volumen de avisos de oleadas y jefes.");
        } else if (cat === 'graphics') {
            html += `
                <div style="background:rgba(255,255,255,0.03); border:1px solid #333; border-radius:8px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1;">
                        <div style="font-size:13px; font-weight:bold; color:white;">Calidad Gráfica</div>
                    </div>
                    <select class="setting-select" data-cat="graphics" data-key="quality" style="background:#000; color:var(--bright-yellow); border:1px solid #555; padding:5px; border-radius:4px; font-size:12px;">
                        ${['Low', 'Medium', 'High', 'Ultra'].map(q => `<option value="${q}" ${s.graphics.quality === q ? 'selected' : ''}>${q}</option>`).join('')}
                    </select>
                </div>
            `;
            html += createToggle("Sombras dinámicas", 'graphics', 'shadows', "Dibuja sombras bajo héroes y enemigos.");
            html += createToggle("Partículas", 'graphics', 'particles', "Efectos de chispas y humo.");
            html += createToggle("Efectos Reducidos", 'graphics', 'reducedEffects', "Optimiza el rendimiento visual.");
            html += createToggle("Modo Rendimiento", 'graphics', 'performanceMode', "Prioriza FPS sobre calidad visual.");
            html += createToggle("Animaciones Complejas", 'graphics', 'complexAnims', "Habilita animaciones fluidas en sprites.");
        } else if (cat === 'ui') {
            html += createRange("Escala de Interfaz", 'ui', 'scale', "Ajusta el tamaño de los elementos de UI.", 50, 150, 5);
            html += createRange("Transparencia", 'ui', 'transparency', "Nivel de opacidad de los paneles laterales.", 0, 1, 0.1);
            html += createToggle("Mostrar Daño", 'ui', 'showDamage', "Habilita indicadores de daño flotantes.");
            html += createToggle("Timers de Oleada", 'ui', 'timers', "Muestra contadores para el spawn de enemigos.");
            html += createToggle("Indicadores de Oleada", 'ui', 'waveIndicators', "Señales visuales de oleadas en curso.");
            html += createToggle("Nombres/HP Enemigos", 'ui', 'enemyInfo', "Muestra barras de vida detalladas.");
            html += createToggle("Interfaz Compacta", 'ui', 'compactUI', "Reduce el tamaño de las tarjetas de héroes.");
        } else if (cat === 'qol') {
            html += createToggle("Saltar Intros", 'qol', 'skipIntros', "Evita secuencias de inicio de nivel.");
            html += createToggle("Saltar Animaciones", 'qol', 'skipAnims', "Transiciones de menú instantáneas.");
            html += createToggle("Auto Reclamar", 'qol', 'autoClaim', "Recoge recompensas automáticamente.");
            html += createToggle("Ocultar Popups", 'qol', 'hidePopups', "Evita notificaciones intrusivas.");
            html += createToggle("Transiciones Rápidas", 'qol', 'fastTransitions', "Navegación veloz entre paneles.");
            html += createToggle("Notificaciones Reducidas", 'qol', 'reducedNotifs', "Muestra solo avisos críticos.");
        } else if (cat === 'data') {
            html += `
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button id="btn-save-manual" class="btn-primary" style="padding:12px; background:var(--primary-blue); font-size:12px;">GUARDAR PROGRESO MANUAL</button>
                    <button id="btn-hard-reset" class="btn-primary" style="padding:12px; background:var(--accent-red); font-size:12px;">WIPE: BORRAR TODOS LOS DATOS</button>
                    <p style="font-size:10px; color:#666; text-align:center;">El guardado automático ocurre al final de cada oleada.</p>
                </div>
            `;
        }

        container.innerHTML = html;

        // Lógica del Botón Administrador (Director S.H.I.E.L.D.)
        const btnAdmin = document.getElementById('btn-admin-mode');
        if (btnAdmin) {
            btnAdmin.onclick = () => {
                const pass = prompt("IDENTIFICACIÓN DE NIVEL 7 REQUERIDA:");
                if (pass === "1812") {
                    this.game.activateAdminMode();
                    window.location.reload(); 
                } else {
                    alert("ACCESO DENEGADO. Intento de intrusión detectado en el sistema.");
                }
            };
        }

        // Listeners
        container.querySelectorAll('.setting-cb').forEach(cb => {
            cb.onchange = (e) => {
                const cK = cb.getAttribute('data-cat');
                const iK = cb.getAttribute('data-key');
                s[cK][iK] = e.target.checked;
                if (iK === 'autoWave' && this.game.waveManager) this.game.waveManager.autoWave = s[cK][iK];
                if (iK === 'autoRetry') { 
                    this.retryActive = s[cK][iK]; 
                    if (this.retryActive) { s[cK].autoRestart = false; this.restartActive = false; }
                    this.renderSettingsCategory(cat, container);
                }
                if (iK === 'autoRestart') { 
                    this.restartActive = s[cK][iK]; 
                    if (this.restartActive) { s[cK].autoRetry = false; this.retryActive = false; }
                    this.renderSettingsCategory(cat, container);
                }
                this.updateManagementButtons();
                this.game.savePersistence();
            };
        });

        container.querySelectorAll('.setting-range').forEach(range => {
            range.oninput = (e) => {
                const cK = range.getAttribute('data-cat');
                const iK = range.getAttribute('data-key');
                const val = parseFloat(e.target.value);
                s[cK][iK] = val;
                const valDisplay = document.getElementById(`val-${iK}`);
                if (valDisplay) valDisplay.innerText = val;
            };
            range.onchange = () => this.game.savePersistence();
        });

        container.querySelectorAll('.setting-select').forEach(sel => {
            sel.onchange = (e) => {
                const cK = sel.getAttribute('data-cat');
                const iK = sel.getAttribute('data-key');
                s[cK][iK] = e.target.value;
                this.game.savePersistence();
            };
        });

        const btnSave = document.getElementById('btn-save-manual');
        if(btnSave) btnSave.onclick = () => { this.game.savePersistence(); alert("¡Sistema S.H.I.E.L.D. actualizado! Progreso guardado."); };
        
        const btnWipe = document.getElementById('btn-hard-reset');
        if(btnWipe) btnWipe.onclick = () => {
            if(confirm("¿Estás seguro de borrar todo tu perfil, héroes y estrellas? Esta acción no se puede deshacer.")) {
                localStorage.removeItem('marvel_td_save');
                window.location.reload();
            }
        };
    }

    renderMainMenu(onContinue, onNewGame, onLogout) {
        this.game.pause();
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn').classList.add('hidden');

        const stats = this.game.playerProfile.stats;
        const stars = this.game.stars;
        const hasProgress = this.game.unlockedHeroes.length > 0;

        let html = `
            <div style="text-align:center; padding: 20px; font-family: 'Segoe UI', sans-serif; color: white;">
                <h1 style="color:#f3d403; font-size: 32px; font-weight: 900; letter-spacing: 2px; margin-bottom: 30px; text-transform: uppercase; text-shadow: 0 0 10px rgba(243, 212, 3, 0.5);">Protocolo de Acceso S.H.I.E.L.D.</h1>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- CONTINUAR -->
                    <div id="btn-continue-game" style="background: linear-gradient(180deg, #1e3a8a 0%, #1e1b4b 100%); border: 2px solid #00d4ff; border-radius: 8px; padding: 25px; cursor: ${hasProgress ? 'pointer' : 'not-allowed'}; transition: 0.3s; box-shadow: 0 4px 15px rgba(0, 212, 255, 0.2); opacity: ${hasProgress ? '1' : '0.5'};">
                        <i class="fas fa-play-circle fa-3x" style="color: #00d4ff; margin-bottom: 15px;"></i>
                        <h2 style="margin: 10px 0; font-size: 18px; color: white; letter-spacing: 1px;">CONTINUAR OPERACIÓN</h2>
                        <div style="font-size: 12px; color: #aaa; margin-top: 10px; line-height: 1.6;">
                            OLEADA ACTUAL: <span style="color:white; font-weight:bold;">#${this.game.checkpointWave}</span><br>
                            ESTRELLAS: <span style="color:#f3d403; font-weight:bold;">${stars} ★</span><br>
                            HÉROES: <span style="color:white; font-weight:bold;">${this.game.unlockedHeroes.length}</span>
                        </div>
                    </div>

                    <!-- NUEVA PARTIDA -->
                    <div id="btn-new-game" style="background: linear-gradient(180deg, #b91d1d 0%, #7f1d1d 100%); border: 2px solid #f3d403; border-radius: 8px; padding: 25px; cursor: pointer; transition: 0.3s; opacity: 0.9;">
                        <i class="fas fa-redo-alt fa-3x" style="color: #f3d403; margin-bottom: 15px;"></i>
                        <h2 style="margin: 10px 0; font-size: 18px; color: white; letter-spacing: 1px;">NUEVA INICIATIVA</h2>
                        <p style="font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 10px; text-transform: uppercase;">Aviso: Se borrarán todos los datos actuales y gemas acumuladas.</p>
                    </div>
                </div>

                <!-- BOTÓN CERRAR SESIÓN -->
                <div id="btn-logout" style="margin-top: 25px; color: #aaa; cursor: pointer; font-size: 12px; text-decoration: underline; transition: 0.3s; letter-spacing: 1px; text-transform: uppercase;">
                    <i class="fas fa-sign-out-alt"></i> Cerrar Sesión (Volver a Selección)
                </div>
            </div>
        `;
        this.panelContent.innerHTML = html;

        document.getElementById('btn-continue-game').onclick = () => {
            if (!hasProgress) return;
            this.closePanel();
            onContinue();
        };

        document.getElementById('btn-new-game').onclick = () => {
            if (confirm("¿Confirmas el borrado de datos? Perderás todo el progreso y las gemas actuales.")) {
                this.closePanel();
                onNewGame();
            }
        };

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.onmouseover = () => logoutBtn.style.color = '#f3d403';
            logoutBtn.onmouseout = () => logoutBtn.style.color = '#aaa';
            logoutBtn.onclick = () => {
                this.closePanel();
                onLogout();
            };
        }
    }

    renderStarterSelector(starters, onSelect) {
        this.game.pause();
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn').classList.add('hidden');

        let html = `
            <h2 class="text-yellow" style="text-align:center;">ELIGE TU HÉROE INICIAL</h2>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin-top:20px;">
        `;
        starters.forEach(hero => {
            if (!hero) return;
            html += `
                <div class="starter-card" style="background:var(--bg-panel); padding:20px; border:2px solid var(--primary-blue); border-radius:15px; text-align:center; cursor:pointer;">
                    <div style="font-weight:bold; color:var(--bright-yellow);">${hero.name}</div>
                    <button class="btn-select" data-id="${hero.id}" style="margin-top:15px; background:var(--bright-yellow); border:none; padding:8px; border-radius:5px; width:100%; font-weight:bold; cursor:pointer;">ELEGIR</button>
                </div>
            `;
        });
        html += `</div>`;
        this.panelContent.innerHTML = html;

        this.panelContent.querySelectorAll('.starter-card').forEach(card => {
            card.onclick = () => {
                const id = card.querySelector('.btn-select').getAttribute('data-id');
                const selected = starters.find(h => h.id === id);
                document.getElementById('close-panel-btn').classList.remove('hidden');
                this.closePanel();
                onSelect(selected);
            };
        });
    }

    renderHeroRoster(activeTeam, onSelect) {
        if (!this.heroGrid) return;
        this.heroGrid.innerHTML = '';

        // Configuración de cuadrícula 3x2 para el panel izquierdo
        this.heroGrid.style.display = 'grid';
        this.heroGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        this.heroGrid.style.gap = '10px';

        activeTeam.forEach(hero => {
            if (!hero) return;
            const card = document.createElement('div');
            card.className = 'hero-card-equipped';
            card.setAttribute('data-id', hero.id);
            card.style = "background: linear-gradient(180deg, #1a1a1b 0%, #252526 100%); border:1px solid #444; border-bottom: 3px solid #e23636; border-radius:4px; padding:10px 5px; text-align:center; display:flex; flex-direction:column; justify-content:space-between; min-width: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.5);";
            
            const isDeployed = this.game.heroes.some(h => h.id === hero.id);

            card.innerHTML = `
                <div style="font-size:11px; font-weight:900; color:#f3d403; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow: ellipsis; letter-spacing:1px; text-transform:uppercase;">${hero.name}</div>
                <div class="hero-icon-container" data-id="${hero.id}" style="background:#000; border-radius:2px; padding:5px; margin-bottom:10px; border:1px solid #00d4ff; box-shadow: inset 0 0 10px rgba(0, 212, 255, 0.2); transition: all 0.3s ease; position:relative;">
                    <img src="${hero.portrait || hero.sprite}" style="width:55px; height:55px; object-fit:contain;">
                    <div class="deployment-status" style="position:absolute; top:2px; right:2px; font-size:8px; background:${isDeployed ? '#00ff00' : 'rgba(0,0,0,0.5)'}; color:${isDeployed ? 'black' : '#666'}; padding:2px 4px; border-radius:2px; font-weight:900; letter-spacing:0.5px; transition:0.3s;">
                        ${isDeployed ? 'EN MAPA' : 'RESERVA'}
                    </div>
                </div>
                <div class="hero-actions" style="display:flex; gap:5px; padding: 0 5px;">
                    <button class="btn-action place-btn" title="Desplegar" style="flex:1; background:var(--primary-blue); height: 32px;"><i class="fas fa-crosshairs"></i></button>
                    <button class="btn-action stats-btn" title="Estadísticas" style="flex:1; background:#333; height: 32px;"><i class="fas fa-chart-bar"></i></button>
                </div>
            `;
            card.querySelector('.place-btn').onclick = (e) => { e.stopPropagation(); onSelect(hero); };
            card.querySelector('.stats-btn').onclick = (e) => { e.stopPropagation(); this.inspectUnit(hero); };
            this.heroGrid.appendChild(card);
        });
    }

    handleGacha() {
        const gemCost = this.game.playerProfile.gachaPrice || 50;
        if (this.game.playerProfile.gems < gemCost) return alert("Gemas insuficientes.");

        const roll = Math.random();
        let rarity = "Common";
        if (roll < 0.01) rarity = "Cosmic";
        else if (roll < 0.06) rarity = "Legendary";
        else if (roll < 0.16) rarity = "Epic";
        else if (roll < 0.40) rarity = "Rare";

        let pool = Object.values(this.game.heroDatabase).filter(h => h.rarity === rarity);
        this.game.playerProfile.gems -= gemCost;
        this.game.playerProfile.gachaPrice = gemCost + 5; // El precio sube 5 gemas por cada compra
        this.game.checkQuestProgress('gachaSummons', 1);

        const hero = pool[Math.floor(Math.random() * pool.length)];
        const existing = this.game.unlockedHeroes.find(h => h.id === hero.id);
        
        const rarityStyles = { 'Cosmic': '#fff', 'Legendary': '#f3d403', 'Epic': '#a335ee', 'Rare': '#00d4ff', 'Common': '#888' };
        const rColor = rarityStyles[rarity];
        const resEl = document.getElementById('gacha-res');

        let msg = "";
        if (existing) {
            existing.stars = (existing.stars || 1) + 1;
            msg = `<div style="padding:10px; border:1px solid ${rColor}; border-radius:5px; background:rgba(0,0,0,0.5);">
                    ¡DUPLICADO! <span style="color:${rColor}; font-weight:bold;">${hero.name}</span> ahora tiene ${existing.stars} ★
                   </div>`;
            // Actualizar instancias en el mapa
            this.game.heroes.filter(h => h.id === hero.id).forEach(h => h.stars = existing.stars);
        } else {
            hero.stars = 1;
            this.game.unlockedHeroes.push(hero);
            
            if (this.game.unlockedHeroes.length >= 20) this.game.unlockAchievement('collector');
            if (hero.rarity === 'Cosmic') this.game.unlockAchievement('cosmic_luck');
            
            const totalAvailable = Object.keys(this.game.heroDatabase).length;
            if (this.game.unlockedHeroes.length >= totalAvailable) {
                this.game.unlockAchievement('full_roster');
            }

            this.game.checkQuestProgress('collector', 1);
            msg = `<div class="${rarity === 'Cosmic' ? 'rarity-cosmic' : ''}" style="padding:15px; border:2px solid ${rColor}; border-radius:8px; background:rgba(0,0,0,0.7); box-shadow: 0 0 15px ${rColor}55;">
                    <div style="font-size:10px; color:#aaa; margin-bottom:5px;">INCORPORACIÓN COMPLETADA</div>
                    <div style="color:${rColor}; font-size:18px; font-weight:bold; margin-bottom:5px;">${hero.name.toUpperCase()}</div>
                    <div style="color:${rColor}; font-size:11px; letter-spacing:2px; font-weight:900;">${rarity.toUpperCase()}</div>
                   </div>`;
        }
        resEl.innerHTML = msg;
        
        this.game.savePersistence();
        this.updateUI(this.game.resourceManager.lives, this.game.resourceManager.credits, 1, this.game.fps, this.game.stars);
        this.renderPanel('shop'); // Refrescar para mostrar nuevo precio
    }

    renderWikiPanel() {
        const totalHeroes = Object.keys(this.game.heroDatabase).length;
        const unlockedCount = this.game.unlockedHeroes.length;
        const progressPercent = (unlockedCount / totalHeroes) * 100;
        const barColor = progressPercent > 50 ? 'linear-gradient(90deg, #ffd700, #ff8c00)' : 'linear-gradient(90deg, #C0C0C0, #808080)';
        const shadowColor = progressPercent > 50 ? 'rgba(255,215,0,0.5)' : 'rgba(192,192,192,0.5)';
        const accentColor = progressPercent > 50 ? 'gold' : '#C0C0C0';
        const bannerBg = progressPercent > 50 ? 'rgba(255,215,0,0.1)' : 'rgba(192,192,192,0.1)';

        const categories = ["Urbano", "Tecnológico", "Místico", "Mutante", "Cósmico"];
        const catColors = { "Urbano": "#888", "Tecnológico": "#00d4ff", "Místico": "#a335ee", "Mutante": "#f3d403", "Cósmico": "#fff" };
        let catHtml = `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:15px; justify-content:center;">`;
        categories.forEach(cat => {
            const count = this.game.unlockedHeroes.filter(h => h.category === cat).length;
            const total = Object.values(this.game.heroDatabase).filter(h => h.category === cat).length;
            catHtml += `
                <div style="font-size:9px; background:rgba(0,0,0,0.3); padding:4px 8px; border-radius:4px; border:1px solid ${catColors[cat]}44; letter-spacing:1px;">
                    <span style="color:${catColors[cat]}; font-weight:900;">${cat.toUpperCase()}:</span> ${count}/${total}
                </div>
            `;
        });
        catHtml += `</div>`;

        let html = `
            <div style="display:flex; flex-direction:column; height:100%; color:white;">
                <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px; background:${bannerBg}; padding:10px; border-radius:8px; border:1px solid ${accentColor};">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold; color:${accentColor}; font-size:14px;"><i class="fas fa-trophy"></i> COLECCIÓN</span>
                        <span style="font-size:14px; font-weight:bold;">${unlockedCount} / ${totalHeroes} Héroes Desbloqueados</span>
                    </div>
                    <div style="width:100%; height:8px; background:#222; border-radius:4px; overflow:hidden; border:1px solid ${accentColor}44;">
                        <div style="width:${progressPercent}%; height:100%; background:${barColor}; box-shadow: 0 0 10px ${shadowColor}; transition: width 0.5s ease-out;"></div>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
                    <button id="wiki-tab-heroes" class="btn-primary" style="flex:1; background:var(--primary-blue);">HÉROES</button>
                    <button id="wiki-tab-items" class="btn-primary" style="flex:1; background:var(--bright-yellow); color:black;">OBJETOS</button>
                </div>
                ${catHtml}
                <div id="wiki-filter-bar" style="display:grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap:8px; margin-bottom: 15px;">
                    <input type="text" id="wiki-search-input" placeholder="Nombre..." style="padding:10px; background:#111; border:1px solid #444; color:white; border-radius:6px; outline:none; font-size:13px;">
                    <select id="wiki-filter-rarity" style="padding:10px; background:#111; border:1px solid #444; color:white; border-radius:6px; outline:none; font-size:13px; cursor:pointer;">
                        <option value="">Rareza...</option>
                        <option value="Common">Common</option>
                        <option value="Rare">Rare</option>
                        <option value="Epic">Epic</option>
                        <option value="Legendary">Legendary</option>
                        <option value="Cosmic">Cosmic</option>
                    </select>
                    <select id="wiki-filter-category" style="padding:10px; background:#111; border:1px solid #444; color:white; border-radius:6px; outline:none; font-size:13px; cursor:pointer;">
                        <option value="">Categoría...</option>
                        <option value="Urbano">Urbano</option>
                        <option value="Tecnológico">Tecnológico</option>
                        <option value="Místico">Místico</option>
                        <option value="Mutante">Mutante</option>
                        <option value="Cósmico">Cósmico</option>
                    </select>
                    <select id="wiki-filter-status" style="padding:10px; background:#111; border:1px solid #444; color:white; border-radius:6px; outline:none; font-size:13px; cursor:pointer;">
                        <option value="">Estado...</option>
                        <option value="unlocked">Desbloqueado</option>
                        <option value="locked">Bloqueado</option>
                    </select>
                </div>
                <div id="wiki-scroll-container" style="flex:1; overflow-y:auto; padding-right:10px;"></div>
            </div>
        `;
        this.panelContent.innerHTML = html;

        const container = document.getElementById('wiki-scroll-container');
        const searchInput = document.getElementById('wiki-search-input');
        const rarityFilter = document.getElementById('wiki-filter-rarity');
        const categoryFilter = document.getElementById('wiki-filter-category');
        const statusFilter = document.getElementById('wiki-filter-status');

        let currentTab = 'heroes';

        const refresh = () => {
            const filters = {
                text: searchInput.value.toLowerCase(),
                rarity: rarityFilter.value,
                category: categoryFilter.value,
                status: statusFilter.value
            };
            if (currentTab === 'heroes') this.renderWikiHeroes(container, filters);
            else this.renderWikiItems(container, filters);
        };

        document.getElementById('wiki-tab-heroes').onclick = () => { currentTab = 'heroes'; categoryFilter.style.display = 'block'; statusFilter.style.display = 'block'; refresh(); };
        document.getElementById('wiki-tab-items').onclick = () => { currentTab = 'items'; categoryFilter.style.display = 'none'; statusFilter.style.display = 'none'; refresh(); };
        
        searchInput.oninput = refresh;
        rarityFilter.onchange = refresh;
        categoryFilter.onchange = refresh;
        statusFilter.onchange = refresh;

        refresh();
    }

    renderWikiHeroes(container, filters) {
        const unlockedIds = new Set(this.game.unlockedHeroes.map(h => h.id));
        const heroes = Object.values(this.game.heroDatabase).filter(h => {
            const matchesText = h.name.toLowerCase().includes(filters.text) || h.category.toLowerCase().includes(filters.text);
            const matchesRarity = !filters.rarity || h.rarity === filters.rarity;
            const matchesCategory = !filters.category || h.category === filters.category;
            const isUnlocked = unlockedIds.has(h.id);
            const matchesStatus = !filters.status || (filters.status === 'unlocked' ? isUnlocked : !isUnlocked);
            return matchesText && matchesRarity && matchesCategory && matchesStatus;
        });

        let html = `<div style="display:grid; grid-template-columns: 1fr; gap:20px;">`;

        heroes.forEach(h => {
            const rarityStyles = { 'Cosmic': '#fff', 'Legendary': '#f3d403', 'Epic': '#a335ee', 'Rare': '#00d4ff', 'Common': '#888' };
            const rarityColor = rarityStyles[h.rarity] || '#aaa';
            const isUnlocked = unlockedIds.has(h.id);
            const imgFilter = isUnlocked ? "" : "filter: brightness(0);";

            html += `
                <div class="${h.rarity === 'Cosmic' ? 'rarity-cosmic' : ''}" style="background:${h.rarity === 'Cosmic' ? '#000' : 'rgba(0,0,0,0.4)'}; border:1px solid ${rarityColor}; border-radius:12px; padding:15px; display:grid; grid-template-columns: 100px 1fr; gap:20px;">
                    <div style="text-align:center;">
                        <img src="${h.portrait || h.sprite}" style="width:80px; height:80px; object-fit:contain; background:#000; border-radius:10px; border:1px solid #444; ${imgFilter}">
                        <div style="font-size:10px; margin-top:5px; color:${rarityColor}; font-weight:bold;">${h.rarity.toUpperCase()}</div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <h3 style="margin:0; color:var(--bright-yellow);">${isUnlocked ? h.name.toUpperCase() : "???"}</h3>
                            <span style="font-size:11px; background:#222; padding:2px 8px; border-radius:4px; color:#aaa;">${h.category}</span>
                        </div>
                        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; font-size:11px; margin-bottom:10px; background:rgba(255,255,255,0.05); padding:8px; border-radius:6px;">
                            <span>⚔️ ${h.damage}</span>
                            <span>🔭 ${h.range}</span>
                            <span>⏱️ ${h.fireRate}/s</span>
                            <span>🎯 ${h.critChance || 5}%</span>
                        </div>
                        <div style="font-size:10px; color:#00d4ff; margin-bottom:10px; border:1px solid #00d4ff44; padding:5px; border-radius:4px; background:rgba(0,212,255,0.05);">
                            <i class="fas fa-layer-group"></i> <strong>SINERGIA:</strong> 3+ ${h.category} = <span style="color:#00ff00;">+25% DAÑO</span>
                        </div>
                        <div style="border-top:1px solid #333; padding-top:10px;">
                            <strong style="color:var(--primary-blue); font-size:12px;">HABILIDAD: ${isUnlocked ? h.ability : "???"}</strong>
                            <p style="font-size:11px; color:#ccc; margin:3px 0 10px 0;">${isUnlocked ? h.abilityDesc : "Desbloquea este héroe para ver los detalles de su poder."}</p>
                            <div style="display:flex; flex-direction:column; gap:5px;">
                                <small style="color:gold; font-size:10px; text-transform:uppercase;">Evoluciones:</small>
                                ${isUnlocked ? Object.entries(h.evolutionAbilities || {}).map(([tier, evo]) => `
                                    <div style="font-size:10px; color:#888; padding-left:10px; border-left:2px solid #444;">
                                        <span style="color:white;">R${tier}: ${evo.name}</span> - ${evo.desc}
                                    </div>
                                `).join('') : `<div style="font-size:10px; color:#555; padding-left:10px; border-left:2px solid #444;">Datos de evolución encriptados...</div>`}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    }

    renderWikiItems(container, filters) {
        const tierMap = { 1: 'Common', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Cosmic' };
        const tierReverseMap = { 'Common': 1, 'Rare': 2, 'Epic': 3, 'Legendary': 4, 'Cosmic': 5 };
        const colorMap = { 1: '#888', 2: '#00d4ff', 3: '#a335ee', 4: '#f3d403', 5: '#fff' };

        const items = Object.values(this.game.itemDatabase).filter(it => {
            const matchesText = it.name.toLowerCase().includes(filters.text) || it.desc.toLowerCase().includes(filters.text);
            const matchesRarity = !filters.rarity || it.tier === tierReverseMap[filters.rarity];
            return matchesText && matchesRarity;
        });

        let html = `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">`;

        items.forEach(it => {
            const tierColor = colorMap[it.tier] || '#aaa';
            const isCosmic = it.tier === 5;
            html += `
                <div class="${isCosmic ? 'rarity-cosmic' : ''}" style="background:${isCosmic ? '#000' : 'rgba(255,255,255,0.03)'}; border:1px solid ${tierColor}44; border-left:4px solid ${tierColor}; border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:5px;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <strong style="color:white; font-size:13px;">${it.name}</strong>
                        <span style="font-size:10px; color:${tierColor}; font-weight:bold;">${tierMap[it.tier].toUpperCase()}</span>
                    </div>
                    <p style="color:#aaa; font-size:11px; margin:0; line-height:1.3; flex:1;">${it.desc}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px; border-top:1px solid #222; padding-top:5px;">
                        <span style="color:gold; font-size:11px;">$${it.price}</span>
                        ${it.exclusive ? `<span style="font-size:9px; background:#442200; color:gold; padding:1px 5px; border-radius:3px; border:1px solid gold;">EXCLUSIVO: ${it.exclusive.replace('_', ' ').toUpperCase()}</span>` : ''}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    }

    showLoadingScreen(levelName, artPath, callback) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-screen';
        loadingDiv.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #000; z-index: 10000; display: flex; flex-direction: column;
            justify-content: center; align-items: center; color: white;
            font-family: 'Segoe UI', sans-serif; transition: opacity 0.5s ease;
        `;

        loadingDiv.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                        background: url('${artPath}') no-repeat center center; 
                        background-size: cover; opacity: 0.6; filter: blur(3px);"></div>
            <div style="position: relative; text-align: center; z-index: 1;">
                <h1 style="font-size: 42px; color: #f3d403; text-transform: uppercase; letter-spacing: 5px; margin-bottom: 20px; text-shadow: 0 0 20px rgba(243, 212, 3, 0.8); font-weight: 900;">${levelName}</h1>
                <p style="font-size: 14px; letter-spacing: 2px; color: #aaa; font-weight: bold;">INICIANDO PROTOCOLO DE DESPLIEGUE...</p>
                <div style="width: 350px; height: 6px; background: rgba(255,255,255,0.1); margin: 30px auto; border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                    <div id="loading-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #e23636, #ff4b4b); box-shadow: 0 0 15px #e23636; transition: width 2s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                </div>
            </div>
        `;

        document.body.appendChild(loadingDiv);

        // Iniciar animación de la barra
        setTimeout(() => {
            const bar = document.getElementById('loading-bar');
            if (bar) bar.style.width = '100%';
        }, 100);

        // Finalizar carga y ejecutar callback
        setTimeout(() => {
            loadingDiv.style.opacity = '0';
            setTimeout(() => {
                loadingDiv.remove();
                if (callback) callback();
            }, 500);
        }, 2500);
    }

    showBossWarning(type) {
        const warning = document.createElement('div');
        const isFinal = type === 'BOSS';
        warning.style = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(226, 54, 54, 0.9); color: white; padding: 20px 60px;
            border: 4px solid #f3d403; border-radius: 4px; z-index: 10000;
            font-family: 'Segoe UI', sans-serif; text-align: center;
            box-shadow: 0 0 50px rgba(226, 54, 54, 0.8); pointer-events: none;
            animation: warning-pulse 0.5s infinite alternate;
        `;
        
        warning.innerHTML = `
            <div style="font-size: 14px; letter-spacing: 3px; font-weight: bold; margin-bottom: 5px;">⚠️ ALERTA DE NIVEL ${isFinal ? 'OMEGA' : '7'} ⚠️</div>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 5px;">${isFinal ? 'BOSS' : 'MINIBOSS'} SE ACERCA</div>
            <div style="font-size: 10px; color: #f3d403; margin-top: 5px; text-transform: uppercase;">Protocolo de defensa requerido inmediatamente</div>
        `;

        document.body.appendChild(warning);

        // Añadir animación mediante JS si no está en el CSS
        const style = document.createElement('style');
        style.innerHTML = `@keyframes warning-pulse { from { opacity: 0.7; transform: translate(-50%, -50%) scale(1); } to { opacity: 1; transform: translate(-50%, -50%) scale(1.05); } }`;
        document.head.appendChild(style);

        setTimeout(() => {
            warning.style.transition = "opacity 1s ease";
            warning.style.opacity = "0";
            setTimeout(() => warning.remove(), 1000);
        }, 3000);
    }

    showTutorial(stepIndex = 0) {
        if (!this.game.settings.gameplay.tutorials) return;
        this.game.pause();
        this.currentTutorialIndex = stepIndex;
        const step = this.tutorialSteps[this.currentTutorialIndex];

        // Limpiar resaltado previo de todos los posibles elementos
        this.tutorialSteps.forEach(s => {
            const el = document.getElementById(s.elementId);
            if (el) { el.style.zIndex = ''; el.style.boxShadow = ''; el.style.position = ''; el.style.pointerEvents = ''; }
        });

        // Backdrop para oscurecer el fondo (Capa 11000)
        let backdrop = document.getElementById('tutorial-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'tutorial-backdrop';
            backdrop.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:11000; pointer-events:all; backdrop-filter:blur(2px);";
            document.body.appendChild(backdrop);
        }

        let overlay = document.getElementById('tutorial-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'tutorial-overlay';
            overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; z-index:11010; display:flex; justify-content:center; align-items:center; pointer-events:none; font-family:'Segoe UI',sans-serif;";
            document.body.appendChild(overlay);
        }

        const target = document.getElementById(step.elementId);
        if (target) {
            target.style.position = 'relative';
            target.style.zIndex = '11001';
            target.style.boxShadow = '0 0 40px #f3d403';
            target.style.pointerEvents = 'none'; // Evita que el mapa bloquee los clics del tutorial

            // --- Lógica de la Flecha de Guía Animada ---
            let arrow = document.getElementById('tutorial-arrow');
            if (!arrow) {
                arrow = document.createElement('div');
                arrow.id = 'tutorial-arrow';
                arrow.style = "position:fixed; z-index:11005; pointer-events:none; transition: all 0.3s ease;";
                document.body.appendChild(arrow);
                if (!document.getElementById('tut-arrow-style')) {
                    const s = document.createElement('style');
                    s.id = 'tut-arrow-style';
                    s.innerHTML = `
                        @keyframes arrow-point-right { 0% { transform: translateX(0); } 100% { transform: translateX(15px); } }
                        @keyframes arrow-point-left { 0% { transform: translateX(0); } 100% { transform: translateX(-15px); } }
                        @keyframes arrow-point-up { 0% { transform: translateY(0); } 100% { transform: translateY(-15px); } }
                    `;
                    document.head.appendChild(s);
                }
            }

            const rect = target.getBoundingClientRect();
            let icon = 'fa-long-arrow-alt-right', anim = 'arrow-point-right', t = rect.top + rect.height/2 - 20, l = rect.left - 60;
            
            if (step.elementId === 'left-panel') { icon = 'fa-long-arrow-alt-left'; anim = 'arrow-point-left'; l = rect.right + 20; }
            else if (step.elementId === 'top-bar' || step.elementId.startsWith('btn-')) { icon = 'fa-long-arrow-alt-up'; anim = 'arrow-point-up'; t = rect.bottom + 20; l = rect.left + rect.width/2 - 20; }
            
            arrow.innerHTML = `<i class="fas ${icon} fa-3x" style="color:#f3d403; filter: drop-shadow(0 0 10px rgba(243,212,3,0.8)); animation: ${anim} 0.5s infinite alternate ease-in-out;"></i>`;
            arrow.style.top = `${t}px`; arrow.style.left = `${l}px`;
        }

        overlay.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a1b 0%, #2d2d2e 100%); border:2px solid #f3d403; border-left:6px solid #e23636; padding:30px; border-radius:4px; max-width:400px; box-shadow:0 10px 50px rgba(0,0,0,0.9); text-align:center; position:relative; pointer-events:all;">
                <div style="font-size:10px; color:#aaa; margin-bottom:10px; letter-spacing:2px;">PROTOCOLO DE INDUCCIÓN: PASO ${this.currentTutorialIndex + 1}/${this.tutorialSteps.length}</div>
                <h3 style="color:#f3d403; margin-top:0; letter-spacing:2px; text-transform:uppercase; font-size:18px;">${step.title}</h3>
                <p style="color:white; font-size:14px; line-height:1.6; margin:15px 0; font-weight:500;">${step.text}</p>
                <div style="display:flex; justify-content:space-between; gap:10px; margin-top:25px;">
                    <button id="tut-skip" style="background:transparent; border:none; color:#888; cursor:pointer; font-size:11px; text-decoration:underline;">SALTAR</button>
                    <button id="tut-next" style="background:#f3d403; color:black; border:none; padding:10px 25px; font-weight:900; cursor:pointer; border-radius:2px; text-transform:uppercase; letter-spacing:1px;">
                        ${this.currentTutorialIndex < this.tutorialSteps.length - 1 ? 'SIGUIENTE' : '¡ENTENDIDO!'}
                    </button>
                </div>
            </div>
        `;

        document.getElementById('tut-next').onclick = () => {
            if (this.currentTutorialIndex < this.tutorialSteps.length - 1) this.showTutorial(this.currentTutorialIndex + 1);
            else this.closeTutorial();
        };
        document.getElementById('tut-skip').onclick = () => this.closeTutorial();
    }

    closeTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.remove();
        const backdrop = document.getElementById('tutorial-backdrop');
        if (backdrop) backdrop.remove();
        const arrow = document.getElementById('tutorial-arrow');
        if (arrow) arrow.remove();
        this.tutorialSteps.forEach(s => {
            const el = document.getElementById(s.elementId);
            if (el) { el.style.zIndex = ''; el.style.boxShadow = ''; el.style.position = ''; el.style.pointerEvents = ''; }
        });
        this.game.start();
    }
}