export class Enemy {
    constructor(config, path, game) {
        this.game = game;
        this.config = config;
        this.name = config.name || "Enemigo";
        this.hp = config.hp || 50;
        this.maxHp = this.hp;
        this.speed = config.speed || 50;
        this.reward = config.reward || 10;
        this.armor = config.armor || 0;
        this.stealth = config.stealth || false;
        this.isSwimmer = config.isSwimmer || false;
        this.isFlying = config.isFlying || false;
        this.regeneration = config.regeneration || 0;
        this.regenDisabled = false; // Flag para Dr. Strange
        this.bossType = config.bossType || null;

        // Sistema de estados alterados
        this.statuses = {
            slow: { active: false, timer: 0, power: 0 },
            burn: { active: false, timer: 0, damage: 0 },
            stun: { active: false, timer: 0 }
        };
        
        this.sprite = null;
        if (config.sprite) {
            this.sprite = new Image();
            this.sprite.src = config.sprite;
        }
        
        this.path = path;
        this.pathIndex = 0;
        
        if (path && path.length > 0) {
            this.x = path[0].x;
            this.y = path[0].y;
        } else {
            this.x = 0;
            this.y = 0;
        }
        
        this.size = 40; // Mismo tamaño base que los héroes
        this.isAlive = true;
        this.animationTimer = Math.random() * Math.PI * 2;
        this.hasReachedEnd = false;
        this.distanceTravelled = 0;
        this.processed = false; 
    }

    applyStatus(type, duration, value) {
        if (type === 'slow') {
            this.statuses.slow.active = true;
            this.statuses.slow.timer = Math.max(this.statuses.slow.timer, duration);
            this.statuses.slow.power = Math.max(this.statuses.slow.power, value);
        } else if (type === 'burn') {
            this.statuses.burn.active = true;
            this.statuses.burn.timer = Math.max(this.statuses.burn.timer, duration);
            this.statuses.burn.damage = Math.max(this.statuses.burn.damage, value);
        } else if (type === 'stun') {
            this.statuses.stun.active = true;
            this.statuses.stun.timer = Math.max(this.statuses.stun.timer, duration);
        }
    }

    pushBack(distance) {
        if (this.pathIndex <= 0) return;
        
        let remaining = distance;
        while (remaining > 0 && this.pathIndex >= 0) {
            const prevWaypoint = this.path[this.pathIndex];
            if (!prevWaypoint) break;

            const dx = this.x - prevWaypoint.x;
            const dy = this.y - prevWaypoint.y;
            const distToPrev = Math.hypot(dx, dy);

            if (remaining < distToPrev) {
                this.x -= (dx / distToPrev) * remaining;
                this.y -= (dy / distToPrev) * remaining;
                this.distanceTravelled -= remaining;
                remaining = 0;
            } else {
                this.x = prevWaypoint.x;
                this.y = prevWaypoint.y;
                this.distanceTravelled -= distToPrev;
                remaining -= distToPrev;
                this.pathIndex = Math.max(0, this.pathIndex - 1);
            }
        }
        this.hasReachedEnd = false; // Por si fue empujado justo al final
    }

    takeDamage(amount, isCrit = false, silent = false) {
        let finalDamage = amount - this.armor;
        if (finalDamage < 1) finalDamage = 1; 
        this.hp -= finalDamage;
        
        if (!silent && this.game.addDamagePopup) {
            const color = isCrit ? '#ffcc00' : 'white';
            this.game.addDamagePopup(this.x, this.y, Math.floor(finalDamage).toString(), color, isCrit);
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
        }
    }

    update(dt) {
        if (!this.isAlive || this.hasReachedEnd) return;

        // Procesar regeneración (si no está bloqueada)
        if (this.hp < this.maxHp && this.regeneration > 0 && !this.regenDisabled) {
            this.hp = Math.min(this.maxHp, this.hp + (this.regeneration * dt));
        }

        // Procesar estados
        if (this.statuses.burn.active) {
            this.takeDamage(this.statuses.burn.damage * dt, false, true);
            this.statuses.burn.timer -= dt;
            if (this.statuses.burn.timer <= 0) this.statuses.burn.active = false;
        }
        if (this.statuses.stun.active) {
            this.statuses.stun.timer -= dt;
            if (this.statuses.stun.timer <= 0) this.statuses.stun.active = false;
            return; // Si está aturdido, no procesamos movimiento
        }
        if (this.statuses.slow.active) {
            this.statuses.slow.timer -= dt;
            if (this.statuses.slow.timer <= 0) this.statuses.slow.active = false;
        }

        this.animationTimer += dt * 6; // Los enemigos se mueven un poco más rápido

        const target = this.path[this.pathIndex + 1];
        if (!target) {
            this.hasReachedEnd = true;
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);

        // Lógica de ralentización por terreno (Agua = 0)
        let currentSpeed = this.speed;
        if (this.statuses.slow.active) currentSpeed *= (1 - this.statuses.slow.power);
        const gridX = Math.floor(this.x / this.game.gridSize);
        const gridY = Math.floor(this.y / this.game.gridSize);
        const terrain = (this.game.terrainMap[gridY] && this.game.terrainMap[gridY][gridX]) || 1;
        if (terrain === 0 && !this.isSwimmer) currentSpeed *= 0.5;

        const moveDist = currentSpeed * dt;

        if (distance <= moveDist) {
            this.x = target.x;
            this.y = target.y;
            this.pathIndex++;
            this.distanceTravelled += distance;
        } else {
            this.x += (dx / distance) * moveDist;
            this.y += (dy / distance) * moveDist;
            this.distanceTravelled += moveDist;
        }
    }

    render(ctx) {
        if (!this.isAlive) return;
        // Si vuela, flota más alto y oscila más
        const hoverAmp = this.isFlying ? 10 : 3;
        const yOffset = Math.sin(this.animationTimer) * hoverAmp - (this.isFlying ? 15 : 0);

        // Sombra para voladores
        if (this.isFlying) {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 15, 15, 5, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fill();
        }

        // Dibujar Aura de Jefe si aplica
        const bossWithAura = ['magneto', 'red_skull', 'ultron', 'galactus', 'thanos'];
        if (bossWithAura.includes(this.config.id)) {
            ctx.beginPath();
            ctx.arc(this.x, this.y + yOffset, 160, 0, Math.PI * 2);
            ctx.strokeStyle = this.config.id === 'magneto' ? 'rgba(128, 0, 128, 0.2)' : 'rgba(255, 0, 0, 0.15)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 10]); // Línea discontinua para el aura
            ctx.stroke();
            ctx.setLineDash([]); // Reset
        }

        // Dibujar Nombre y Rango sobre la unidad
        if (this.bossType) {
            ctx.font = "bold 12px 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = this.bossType === 'BOSS' ? '#f3d403' : '#a335ee';
            ctx.fillText(this.bossType, this.x, (this.y + yOffset) - 45);
            ctx.fillStyle = "white";
            ctx.fillText(this.name, this.x, (this.y + yOffset) - 32);
        }

        if (this.sprite && this.sprite.complete) {
            ctx.save();
                if(this.stealth) ctx.globalAlpha = 0.5;
            ctx.drawImage(this.sprite, this.x - this.size / 2, (this.y + yOffset) - this.size / 2, this.size, this.size);
                ctx.globalAlpha = 1.0;
            ctx.restore();
        } else {
            ctx.fillStyle = this.stealth ? 'rgba(139,0,0,0.5)' : '#8b0000';
            ctx.fillRect(this.x - this.size / 2, (this.y + yOffset) - this.size / 2, this.size, this.size);
        }

        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 15, (this.y + yOffset) - 22, 30, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - 15, (this.y + yOffset) - 22, 30 * hpPercent, 4);

        // --- Medallas de Amenaza (Indicadores visuales en mapa) ---
        let badgeX = this.x - 15;
        let badgeY = (this.y + yOffset) - 28;

        if (this.isFlying) { this.drawBadge(ctx, badgeX, badgeY, '#ff8c00', 'F'); badgeX += 10; }
        if (this.regeneration > 0) { this.drawBadge(ctx, badgeX, badgeY, '#00ff00', 'R'); badgeX += 10; }
        if (this.config && this.config.splitInto) { this.drawBadge(ctx, badgeX, badgeY, '#a335ee', 'C'); badgeX += 10; }
        if (this.stealth) { this.drawBadge(ctx, badgeX, badgeY, '#00d4ff', 'S'); badgeX += 10; }
    }

    drawBadge(ctx, x, y, color, label) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        ctx.fillStyle = 'black';
        ctx.font = 'bold 6px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
        ctx.restore();
    }
}