export class Hero {
    constructor(config, x, y, game) {
        this.game = game;
        this.config = { ...config };
        this.id = config.id;
        this.name = config.name;
        this.x = x;
        this.y = y;

        this.level = config.level || 1;
        this.rarity = config.rarity || "Common";
        this.evolutionTier = Math.floor(this.level / 30);
        this.damage = config.damage || 10;
        this.range = config.range || 120;
        this.fireRate = config.fireRate || 1; 
        this.stars = config.stars || 1; // Rango de estrellas
        this.energy = 0;
        this.maxEnergy = 100;
        this.critChance = config.critChance || 5; 
        this.attackType = config.attackType || "Único"; 
        this.allowedTerrains = config.allowedTerrains || [1]; 
        this.targetingPriority = config.targetingPriority || "Primero"; 
        
        this.timer = 0;
        this.items = config.items ? [...config.items] : []; 
        this.activeBuffs = []; // Array para mejoras temporales (ej: Nick Fury)
        this.ability = config.ability;
        this.abilityDesc = config.abilityDesc;
        this.consecutiveHits = 0;
        this.lastTargetId = null;
        this.killCount = 0;
        this.animationTimer = Math.random() * Math.PI * 2; // Offset aleatorio para variedad
        this.activeShot = null; // Almacena el disparo visual
        this.shootAnimTimer = 0; // Temporizador para el cambio de sprite
        this.shootFrame = 0; // Cuadro actual de la animación de disparo
        this.shootDuration = 0.2; // Duración de la animación (200ms)
        this.recoil = 0;
        this.recoilAngle = 0;
        this.rotation = 0;

        // Diccionario de Sprites por dirección
        this.sprites = {};
        this.directions = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
        
        // Puntos de salida del láser ajustados para un sprite de 60px
        this.laserOffsets = {
            'east':       { x: 22,  y: -5 },
            'south-east': { x: 18,  y: 8  },
            'south':      { x: 0,   y: 18 },
            'south-west': { x: -18, y: 8  },
            'west':       { x: -22, y: -5 },
            'north-west': { x: -15, y: -15},
            'north':      { x: 0,   y: -22},
            'north-east': { x: 15,  y: -15}
        };

        this.totalShootFrames = config.shootFrames || 9;
        this.initSprites();
        this.size = 60; // Aumentado para que no se vea tan pequeño
    }

    initSprites() {
        // Si es Tier 0, usamos la raíz de la carpeta del héroe. Si no, la subcarpeta tierX.
        const basePath = this.evolutionTier === 0 
            ? `assets/images/heroes/${this.id}` 
            : `assets/images/heroes/${this.id}/tier${this.evolutionTier}`;

        // Cargar Sprites direccionales (8 rotaciones)
        this.directions.forEach(dir => {
            const img = new Image();
            img.src = `${basePath}/sprites/${dir}.png`;
            img.onerror = () => {}; 
            this.sprites[dir] = img;
        });

        // Cargar Animación de Disparo
        this.shootSprites = [];
        for (let i = 0; i < this.totalShootFrames; i++) {
            const img = new Image();
            img.src = `${basePath}/shoot/${i}.png`;
            img.onerror = () => {};
            this.shootSprites.push(img);
        }

        // El sprite por defecto (Idle) ahora intenta cargar el 'south' de las rotaciones
        this.defaultSprite = new Image();
        this.defaultSprite.src = `${basePath}/sprites/south.png`;
        this.defaultSprite.onerror = () => {
            // Fallback al sprite base definido en el JSON si el sistema de carpetas falla
            if (this.config.sprite) this.defaultSprite.src = this.config.sprite;
        };
    }

    getEffectiveStats() {
        let stats = {
            damage: this.damage,
            fireRate: this.fireRate,
            range: this.range,
            critChance: this.critChance,
            canSeeStealth: this.config.canSeeStealth || false,
            areaDamageMult: 0.5 // Por defecto el daño de área es 50%
        };

        // Resetear habilidad a la base (por si se quitó un objeto exclusivo)
        this.ability = this.config.ability;

        // Sinergia de Categoría: Bono si hay 3 o más héroes del mismo tipo en el mapa
        const synergyCount = this.game.heroes.filter(h => h.config.category === this.config.category).length;
        if (synergyCount >= 3) {
            stats.damage *= 1.25; // +25% Daño por sinergia de equipo
        }

        // Sinergias por Objetos (Nuevos)
        if (this.items.some(i => i.id === 'x_gene_booster') && synergyCount >= 3 && this.config.category === "Mutante") {
            stats.damage *= 1.15;
        }
        if (this.items.some(i => i.id === 'stark_server_link') && this.config.category === "Tecnológico") {
            stats.fireRate *= 1.20;
        }
        if (this.items.some(i => i.id === 'ancient_scroll') && this.config.category === "Místico") {
            stats.range *= 1.25;
        }
        if (this.items.some(i => i.id === 'infinity_gauntlet_shard')) {
            const godCount = this.game.heroes.filter(h => h.rarity === "Legendary" || h.rarity === "Cosmic").length;
            stats.damage *= (1 + (godCount * 0.10));
        }

        // Auras de Villanos: Debuffs por proximidad
        const hasAntiDebuff = this.items.some(i => i.id === 'invisible_cloak');
        
        this.game.enemies.forEach(en => {
            if (!en.isAlive || en.hasReachedEnd || hasAntiDebuff) return;
            const dist = Math.hypot(en.x - this.x, en.y - this.y);
            const auraRadius = 160; // Radio de efecto del jefe

            if (dist <= auraRadius) {
                switch(en.config.id) {
                    case 'magneto':
                        // Magneto interfiere con el metal/tecnología: -50% cadencia
                        if (this.config.category === "Tecnológico") stats.fireRate *= 0.5;
                        break;
                    case 'red_skull':
                        // Red Skull desmoraliza a los héroes locales: -30% daño
                        if (this.config.category === "Urbano") stats.damage *= 0.7;
                        break;
                    case 'ultron':
                        // Virus Ultron debilita sistemas: -20% daño a Tech
                        if (this.config.category === "Tecnológico") stats.damage *= 0.8;
                        break;
                    case 'galactus':
                        // Presencia Cósmica: Reduce el alcance de todos un 20%
                        stats.range *= 0.8;
                        break;
                    case 'thanos':
                        // El Titán Loco anula la suerte: -50% Prob. Crítico
                        stats.critChance *= 0.5;
                        break;
                }
            }
        });

        // Multiplicador por Estrellas (10% extra por estrella extra)
        const starMult = 1 + (this.stars - 1) * 0.1;
        stats.damage *= starMult;

        this.items.forEach(item => {
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
            if (item.id === 'kimoyo_beads') stats.critChance += 30;
            if (item.id === 'ninja_sai_master') stats.critChance += 10; // Daño crítico se maneja en shoot
            if (item.id === 'loki_scepter') stats.critChance += 40;
            if (item.id === 'mercury_boots') stats.fireRate *= 1.35;
            if (item.id === 'cosmic_cube') stats.damage *= 2.0;
            if (item.id === 'hydra_dagger') stats.damage *= 1.15;
            if (item.id === 'kevlar_punisher') { stats.range *= 1.4; stats.damage *= 1.2; }
            if (item.id === 'magneto_helmet') { stats.range *= 1.3; if(this.config.category === "Tecnológico") stats.damage *= 1.5; }
            if (item.id === 'war_machine_ammo') stats.fireRate *= 1.5;
            if (item.id === 'vision_processor') stats.fireRate *= 1.4;
            if (item.id === 'silver_wax') stats.range += 100;
            if (item.id === 'pym_particle_vial') { stats.range *= 1.4; stats.damage *= 0.85; }
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

            // Mejoras Exclusivas
            if (this.id === 'iron_man' && item.id === 'nanobots_stark') stats.damage *= 2.0;
            if (this.id === 'spiderman' && item.id === 'web_shooters_upgraded') stats.fireRate *= 1.6;
            if (this.id === 'capitan_america' && item.id === 'proton_shield') { stats.damage *= 1.5; stats.critChance += 20; }
            if (this.id === 'hulk' && item.id === 'gladiator_gauntlets') { stats.range *= 1.4; stats.damage *= 1.3; }
            if (this.id === 'dr_strange' && item.id === 'book_vishanti') { stats.range *= 1.5; stats.canSeeStealth = true; }
            if (this.id === 'black_panther' && item.id === 'vibranium_daggers') stats.fireRate *= 1.4;
            if (this.id === 'hawkeye' && item.id === 'chitauri_scepter') { stats.damage *= 1.5; this.ability = "PENTAFLECHA"; }
            if (this.id === 'scarlet_witch' && item.id === 'darkhold_fragment') { stats.damage *= 1.8; stats.fireRate *= 0.9; }
            if (this.id === 'thor' && item.id === 'stormbreaker') stats.areaDamageMult = 1.0;
        });

        if (this.items.some(i => i.id === 'suero_supersoldado') && this.game.resourceManager.lives <= 10) {
            stats.damage *= 1.30;
            stats.fireRate *= 1.30;
        }

        return stats;
    }

    applyBuff(buff) {
        const existing = this.activeBuffs.find(b => b.id === buff.id);
        if (existing) {
            existing.timer = Math.max(existing.timer, buff.timer); // Refrescar duración
        } else {
            this.activeBuffs.push(buff);
        }
    }

    activateSupportAbility() {
        if (this.id === 'nick_fury') {
            const stats = this.getEffectiveStats();
            const duration = 8 + (this.evolutionTier * 4);
            const isGlobal = this.evolutionTier >= 3;

            this.game.heroes.forEach(h => {
                const dist = Math.hypot(h.x - this.x, h.y - this.y);
                if (isGlobal || dist <= stats.range) {
                    h.applyBuff({
                        id: 'fury_tactical',
                        name: 'Directiva S.H.I.E.L.D.',
                        damageMult: 1.4 + (this.evolutionTier * 0.1),
                        fireRateMult: 1.3 + (this.evolutionTier * 0.1),
                        rangeMult: this.evolutionTier >= 2 ? 1.2 : 1.0,
                        timer: duration
                    });
                }
            });

            if (this.game.addDamagePopup) {
                this.game.addDamagePopup(this.x, this.y - 40, "DIRECTIVA ALPHA!!", "#f3d403", true);
            }
            this.energy = 0;
        }
    }

    update(dt, enemies) {
        this.timer += dt;

        // Actualizar y limpiar buffs activos
        this.activeBuffs.forEach(b => b.timer -= dt);
        this.activeBuffs = this.activeBuffs.filter(b => b.timer > 0);

        // Manejar la duración visual del disparo
        if (this.shootAnimTimer > 0) {
            this.shootAnimTimer -= dt;
            // Calcular qué cuadro de la animación mostrar
            const progress = 1 - (this.shootAnimTimer / this.shootDuration);
            this.shootFrame = Math.max(0, Math.floor(progress * this.totalShootFrames));
        } else if (this.activeShot) {
            this.activeShot.life -= dt;
            if (this.activeShot.life <= 0) this.activeShot = null;
        }

        // Suavizar el retroceso (vuelve a 0)
        if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 40); // Decaimiento lineal más suave

        const stats = this.getEffectiveStats();
        
        // Lógica para Héroes de Apoyo (Daño 0)
        if (this.damage === 0) {
            this.energy = Math.min(this.maxEnergy, this.energy + dt * 12); // Gana energía pasivamente
            if (this.energy >= this.maxEnergy) this.activateSupportAbility();
            return; // Nick Fury no ataca directamente
        }

        const target = this.getBestTarget(enemies, stats);
        
        if (this.timer >= 1 / stats.fireRate && target) {
            this.shoot(target, stats);
            this.timer = 0; 
        }
    }

    getBestTarget(enemies, stats) {
        let inRange = enemies.filter(e => {
            if (!e.isAlive) return false;
            if (e.stealth && !stats.canSeeStealth) return false;

            // Lógica de enemigos voladores: solo atacables desde casillas de Montaña (3)
            if (e.isFlying) {
                const gridX = Math.floor(this.x / this.game.gridSize);
                const gridY = Math.floor(this.y / this.game.gridSize);
                const currentTerrain = (this.game.terrainMap[gridY] && this.game.terrainMap[gridY][gridX]) || 1;
                if (currentTerrain !== 3) return false;
            }

            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            return dist <= stats.range;
        });

        if (inRange.length === 0) return null;
        
        let target = inRange[0];

        switch (this.targetingPriority) {
            case "Primero": target = inRange.sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0]; break;
            case "Último":  target = inRange.sort((a, b) => a.distanceTravelled - b.distanceTravelled)[0]; break;
            case "Fuerte":  target = inRange.sort((a, b) => b.hp - a.hp)[0]; break;
            case "Débil":   target = inRange.sort((a, b) => a.hp - b.hp)[0]; break;
        }

        if (target) {
            this.rotation = Math.atan2(target.y - this.y, target.x - this.x);
        }
        return target;
    }

    getDirectionName(angle) {
        // Convierte el ángulo en radianes al nombre de la dirección correspondiente
        // Ajustamos el índice para que coincida con el array this.directions
        const index = Math.round(angle / (Math.PI / 4) + 8) % 8;
        return this.directions[index];
    }

    shoot(target, stats) {
        const isSuper = this.energy >= this.maxEnergy;
        const isCrit = (Math.random() * 100) < stats.critChance;
        
        if (isCrit) {
            this.game.checkQuestProgress('criticalHits', 1);
        }

        let critMult = 2;
        if (this.items.some(i => i.id === 'ninja_sai_master')) critMult += 1;
        if (this.items.some(i => i.id === 'reality_stone_shard')) critMult = 3;
        if (this.config.category === "Cósmico" && this.items.some(i => i.id === 'cosmic_catalyst')) critMult += 0.2;
        if (this.id === 'wolverine' && this.items.some(i => i.id === 'muramasa_blade')) critMult = 5;

        let finalDamage = isCrit ? stats.damage * critMult : stats.damage;
        
        if (isCrit && this.items.some(i => i.id === 'stark_hud')) {
            finalDamage *= 1.25; // Aumento de daño crítico x2.5 total aprox
        }

        // Feedback visual instantáneo para el Súper
        if (isSuper && this.game.addDamagePopup) {
            this.game.addDamagePopup(target.x, target.y - 40, "SUPER!!", "#00d4ff", true);
        }

        if (isSuper) {
            this.game.checkQuestProgress('superAttacks', 1);
            let superMult = this.items.some(i => i.id === 'mind_stone_shard') ? 3.75 : 2.5;
            finalDamage *= superMult;

            // Daño de área a enemigos cercanos al objetivo
            let superRadius = 70;
            if (this.id === 'jean_grey' && this.items.some(i => i.id === 'cerebro_module')) superRadius *= 1.5;

            this.game.enemies.forEach(en => {
                if (en !== target && en.isAlive) {
                    const dist = Math.hypot(en.x - target.x, en.y - target.y);
                    if (dist < superRadius) {
                        en.takeDamage(finalDamage * stats.areaDamageMult);
                        if (!en.isAlive) {
                            this.game.addXP(20); // Doble XP por baja con Súper (Área)
                            this.game.checkQuestProgress('enemiesKilled', 1);
                        }
                    }
                }
            });
            this.energy = 0;
        }

        // Aplicar Efectos de Estado (Status Effects)
        if (this.id === 'spiderman') {
            target.applyStatus('slow', 2, 0.4); // 40% slow
        } else if (this.id === 'human_torch') {
            let burnMult = this.items.some(i => i.id === 'hellfire_fuel') ? 0.6 : 0.3;
            target.applyStatus('burn', 3, stats.damage * burnMult);
        }

        // Lógica de Efectividad de Categoría (Estilo PokéPath)
        // Ejemplo: Tecnológico es fuerte contra Armadura
        if (this.config.category === "Tecnológico" && target.armor > 0) {
            finalDamage *= 1.25; // 25% extra contra enemigos acorazados
        }
        if (this.items.some(i => i.id === 'serum_daywalker') && target.config.id === "boss" && target.config.category === "Místico") {
            finalDamage *= 3.0;
        }
        // Ejemplo: Místico es fuerte contra jefes (Bosses)
        if (this.config.category === "Místico" && target.config.id === "boss") {
            finalDamage *= 1.50;
        }

        if (this.items.some(i => i.id === 'simbionte')) {
            if (this.lastTargetId === target) {
                this.consecutiveHits++;
                finalDamage *= (1 + (this.consecutiveHits * 0.02)); 
            } else {
                this.consecutiveHits = 0;
                this.lastTargetId = target;
            }
        }

        target.takeDamage(finalDamage, isCrit);

        if (!isSuper) {
            const prevEnergy = this.energy;
            let gain = 10 * (stats.energyGainMult || 1);
            this.energy = Math.min(this.maxEnergy, this.energy + gain);
            
            // Sonido de carga lista al llegar al 90%
            if (this.energy >= 90 && prevEnergy < 90) {
                const alertSound = new Audio('assets/sounds/super_ready.mp3');
                alertSound.volume = (this.game.settings.audio.sfx / 100) * (this.game.settings.audio.master / 100);
                alertSound.play().catch(() => {});
            }
        }

        this.shootAnimTimer = this.shootDuration; 
        this.recoil = 5; // Reducido de 8 a 5 para que sea menos brusco
        
        // Actualizar rotación y ángulo de retroceso al disparar
        this.rotation = Math.atan2(target.y - this.y, target.x - this.x);
        this.recoilAngle = this.rotation;

        // Guardamos el disparo para que el método render lo dibuje
        this.activeShot = {
            tx: target.x,
            ty: target.y,
            isCrit: isCrit,
            isSuper: isSuper,
            life: isSuper ? 0.25 : 0.1 // El súper disparo dura un poco más
        };

        if (this.items.some(i => i.id === 'contrato_stark')) {
            this.game.resourceManager.addCredits(1); 
        }

        if (!target.isAlive) {
            let xpGain = isSuper ? 20 : 10;
            if (this.items.some(i => i.id === 'shield_training_manual')) xpGain *= 2;
            this.game.addXP(xpGain);
            
            if (this.items.some(i => i.id === 'ultron_data_chip')) {
                this.game.resourceManager.addCredits(10);
            }
            if (this.items.some(i => i.id === 'gamma_battery')) {
                this.energy = Math.min(this.maxEnergy, this.energy + 5);
            }
            this.game.checkQuestProgress('enemiesKilled', 1);
            this.killCount++;
            if (this.items.some(i => i.id === 'protocolo_extremis') && this.killCount >= 15) {
                this.game.resourceManager.lives++;
                this.killCount = 0;
            }
        }
    }

    render(ctx) {
        const stats = this.getEffectiveStats();
        const dirName = this.getDirectionName(this.rotation);
        
        // Aplicar retroceso a la posición de dibujo
        let drawX = this.x;
        let drawY = this.y;

        const offset = this.laserOffsets[dirName] || { x: 0, y: 0 };

        if (this.recoil > 0.1) {
            drawX -= Math.cos(this.recoilAngle) * this.recoil;
            drawY -= Math.sin(this.recoilAngle) * this.recoil;
        }

        // Dibujar el disparo si está activo
        if (this.activeShot) {
            ctx.beginPath();
            ctx.moveTo(drawX + offset.x, drawY + offset.y);
            ctx.lineTo(this.activeShot.tx, this.activeShot.ty);
            
            // Efectos sutiles por personaje
            let color = this.activeShot.isCrit ? '#ffff00' : '#00ffff';
            let glow = this.activeShot.isCrit ? 'orange' : 'blue';

            if (this.id === 'spiderman') { color = '#ffffff'; glow = '#aaaaaa'; }
            else if (this.id === 'human_torch') { color = '#ff4500'; glow = '#ff0000'; }
            else if (this.id === 'scarlet_witch') { color = '#ff00ff'; glow = '#800080'; }
            else if (this.id === 'thor') { color = '#ffffff'; glow = '#00ffff'; }
            else if (this.id === 'black_widow') { color = '#ff3333'; glow = '#880000'; }
            else if (this.id === 'hawkeye') { color = '#dcdcdc'; glow = '#666666'; }

            if (this.activeShot.isSuper) {
                ctx.shadowBlur = 25;
                ctx.lineWidth = 6;
                ctx.strokeStyle = '#ffffff'; // Destello blanco para el súper
            } else {
                ctx.shadowBlur = 8;
                ctx.lineWidth = 2;
                ctx.strokeStyle = color;
            }
            
            ctx.shadowColor = glow;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, stats.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        // Barra de Energía
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x - 20, this.y + 35, 40, 4);

        if (this.energy >= this.maxEnergy) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#ffffff'; // Blanco brillante cuando está listo
        } else {
            ctx.fillStyle = '#00ffff';
        }
        
        ctx.fillRect(this.x - 20, this.y + 35, 40 * (this.energy / this.maxEnergy), 4);
        ctx.shadowBlur = 0;

        // Aura de Nick Fury (Directiva S.H.I.E.L.D. Activa)
        const furyBuff = this.activeBuffs.find(b => b.id === 'fury_tactical');
        if (furyBuff && this.id === 'nick_fury') {
            ctx.save();
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.size / 1.3, 0, Math.PI * 2);
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00d4ff';
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]); // Estética de radar táctico de S.H.I.E.L.D.
            ctx.stroke();
            ctx.restore();
        }

        // Evolución Visual: Aura por Tier (Funcionalidad 4)
        if (this.evolutionTier > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.size / 1.6, 0, Math.PI * 2);
            let auraColor = 'rgba(0, 212, 255, 0.3)'; // R1 (Nivel 30): Cian
            if (this.evolutionTier === 2) auraColor = 'rgba(255, 215, 0, 0.4)'; // R2 (Nivel 60): Oro
            if (this.evolutionTier >= 3) auraColor = 'rgba(226, 54, 54, 0.5)'; // R3 (Nivel 90): Rojo Escarlata
            ctx.shadowBlur = 15;
            ctx.shadowColor = auraColor;
            ctx.strokeStyle = auraColor;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }

        // Selección de Sprite
        const isImgValid = (img) => img && img.complete && img.naturalWidth > 0;
        let currentImg = this.sprites[dirName];

        if (this.shootAnimTimer > 0) {
            const frame = Math.max(0, Math.min(this.shootFrame, this.totalShootFrames - 1));
            if (isImgValid(this.shootSprites[frame])) {
                currentImg = this.shootSprites[frame];
            }
        }

        // Fallback: Si el sprite elegido no es válido, intentamos el direccional, y si no, el default
        if (!isImgValid(currentImg)) {
            currentImg = isImgValid(this.sprites[dirName]) ? this.sprites[dirName] : this.defaultSprite;
        }

        if (isImgValid(currentImg)) {
            // IMPORTANTE: Ya no rotamos el contexto con ctx.rotate porque el sprite 
            // ya viene dibujado en la dirección correcta (norte, sur, etc.)
            ctx.drawImage(currentImg, drawX - this.size / 2, drawY - this.size / 2, this.size, this.size);
        } else {
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        }
    }
}