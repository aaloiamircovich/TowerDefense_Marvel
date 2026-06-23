import { normalizePath } from '../utils/PathUtils.js';

const DEFAULT_METRICS = {
    kills: 0,
    bosses: 0,
    leaks: 0,
    noLeakWaves: 0,
    civiliansSaved: 0,
    mechanicUses: 0
};

export class MissionSystem {
    constructor(game) {
        this.game = game;
        this.level = null;
        this.state = null;
        this.lastPublishSecond = -1;
    }

    loadLevel(level) {
        this.level = level;
        this.state = {
            wave: 0,
            message: level.mission?.mechanic?.status || 'Sistemas de defensa preparados.',
            metrics: { ...DEFAULT_METRICS },
            completed: new Set(this.game.progression?.getMapProgress(level.id).missionObjectives || []),
            waveStartLives: this.game.resourceManager?.lives || 0,
            civilianActive: false,
            civilianProgress: 0,
            barricadeActive: false,
            doorReady: false,
            blackout: 0,
            turretCooldown: 0,
            vibranium: 0,
            shieldCharges: level.mission?.mechanic?.type === 'vibranium' ? 1 : 0,
            cycleTimer: level.mission?.mechanic?.cycle || 6,
            inverted: false,
            vegetation: level.mission?.mechanic?.vegetation || 0,
            breachedCells: new Set(),
            affectedEnemies: new Set(),
            activeLandmarks: new Set()
        };
        this.publish();
    }

    onWaveStart(waveNumber) {
        if (!this.state) return;
        const type = this.level.mission?.mechanic?.type;
        this.state.wave = waveNumber;
        this.state.waveStartLives = this.game.resourceManager.lives;
        this.state.affectedEnemies.clear();
        this.state.activeLandmarks.clear();

        if (type === 'streets') {
            const sewerWave = waveNumber % 5 === 0;
            this.switchRoute(sewerWave ? 1 : 0);
            this.state.civilianActive = waveNumber % 3 === 0;
            this.state.civilianProgress = 0;
            this.state.barricadeActive = true;
            this.state.message = this.state.civilianActive
                ? 'Convoy civil en tránsito. Evita cualquier fuga.'
                : sewerWave ? 'Calles bloqueadas: Hydra emerge por las alcantarillas.' : 'Barricada Stark ralentizando la avenida.';
        } else if (type === 'security') {
            this.state.doorReady = true;
            this.state.blackout = waveNumber % 4 === 0 ? 8 : 0;
            this.state.message = this.state.blackout > 0
                ? 'Corte de energía: defensas auxiliares reiniciándose.'
                : 'Puerta de seguridad y torreta auxiliares operativas.';
        } else if (type === 'vibranium') {
            this.switchReactiveRoute(waveNumber);
            this.state.message = `Ruta cinética ${waveNumber % 2 === 0 ? 'Dorada' : 'Pantera'} activa.`;
        } else if (type === 'bifrost') {
            this.switchReactiveRoute(waveNumber);
            this.state.message = `Ancla ${waveNumber % 2 === 0 ? 'Vanaheim' : 'Asgard'} conectada al Bifrost.`;
        } else if (type === 'inversion') {
            this.state.cycleTimer = this.level.mission.mechanic.cycle || 6;
            this.state.inverted = false;
            this.state.message = 'Realidad estable: las runas ralentizan invasores.';
        } else if (type === 'jungle') {
            const routes = this.level.alternatePaths || [];
            if (routes.length) this.switchRoute(Math.floor((waveNumber - 1) / 3) % routes.length);
            this.state.vegetation = this.level.mission.mechanic.vegetation || 5;
            this.state.message = waveNumber % 3 === 1 ? 'La selva reveló un sendero oculto.' : 'La vegetación contiene el avance.';
        } else if (type === 'raft') {
            this.state.breachedCells.clear();
            this.state.message = 'Bloques de contención reiniciados para la oleada.';
        } else {
            this.state.message = this.level.mission?.mechanic?.status || 'Objetivo táctico activo.';
        }

        this.publish();
    }

    update(dt) {
        if (!this.state) return;
        const type = this.level.mission?.mechanic?.type;
        if (type === 'streets') this.updateStreets(dt);
        if (type === 'security') this.updateSecurity(dt);
        if (type === 'ward' || type === 'academy') this.updateLandmarks(type);
        if (type === 'bifrost') this.updateBifrost();
        if (type === 'inversion') this.updateInversion(dt);
        if (type === 'jungle') this.updateJungle();
        if (type === 'raft') this.updateRaft();
    }

    updateStreets(dt) {
        if (this.state.civilianActive) this.state.civilianProgress = Math.min(1, this.state.civilianProgress + dt / 12);
        if (!this.state.barricadeActive) return;
        const zone = this.level.mission.mechanic.zone;
        this.game.enemies.forEach((enemy) => {
            if (!enemy.isAlive || distanceTo(enemy, zone) > (zone.radius || 72)) return;
            enemy.applyStatus({ type: 'slow', duration: 0.35, power: 0.18 });
            if (!this.state.affectedEnemies.has(enemy.uid)) {
                this.state.affectedEnemies.add(enemy.uid);
                this.state.metrics.mechanicUses++;
            }
        });
    }

    updateSecurity(dt) {
        if (this.state.blackout > 0) {
            this.state.blackout = Math.max(0, this.state.blackout - dt);
            const second = Math.ceil(this.state.blackout);
            if (second !== this.lastPublishSecond) {
                this.lastPublishSecond = second;
                if (second === 0) this.state.message = 'Energía restaurada. Defensas auxiliares en línea.';
                this.publish();
            }
            return;
        }

        const mechanic = this.level.mission.mechanic;
        if (this.state.doorReady) {
            const targets = this.game.enemies.filter((enemy) => enemy.isAlive && distanceTo(enemy, mechanic.door) <= 42).slice(0, 3);
            if (targets.length > 0) {
                targets.forEach((enemy) => enemy.applyStatus({ type: 'stun', duration: 1.4, power: 1 }));
                this.state.doorReady = false;
                this.state.metrics.mechanicUses++;
                this.state.message = `Puerta cerrada: ${targets.length} objetivos contenidos.`;
                this.publish();
            }
        }

        this.state.turretCooldown -= dt;
        if (this.state.turretCooldown > 0) return;
        const target = nearestEnemy(this.game.enemies, mechanic.turret, mechanic.turret.range || 175);
        if (!target) return;
        target.takeDamage(18 + this.state.wave * 1.5, { armorPenetration: 0.2 });
        this.game.vfx?.addImpact?.(target.x, target.y, '#40c9ff');
        this.state.turretCooldown = 0.75;
    }

    updateLandmarks(type) {
        const landmarks = this.level.mission.mechanic.landmarks || [];
        landmarks.forEach((landmark, index) => {
            const targets = this.game.enemies
                .filter((enemy) => enemy.isAlive && distanceTo(enemy, landmark) <= (landmark.radius || 54))
                .slice(0, type === 'academy' ? 2 : 4);
            if (targets.length === 0) return;
            if (type === 'ward') {
                targets.forEach((enemy) => enemy.applyStatus({ type: 'mark', duration: 0.4, power: 0.12 }));
            } else if (!this.state.activeLandmarks.has(index)) {
                targets.forEach((enemy) => enemy.applyStatus({ type: 'stun', duration: 0.8, power: 1 }));
                this.state.activeLandmarks.add(index);
                this.state.metrics.mechanicUses++;
                this.state.message = `Baliza ${index + 1} de la Sala de Peligro activada.`;
                this.publish();
            }
        });
    }

    updateBifrost() {
        const mechanic = this.level.mission.mechanic;
        for (const portal of mechanic.portals || []) {
            const targets = this.game.enemies.filter((enemy) => enemy.isAlive && !this.state.affectedEnemies.has(enemy.uid) && distanceTo(enemy, portal) <= (portal.radius || 42));
            targets.forEach((enemy) => {
                const moved = enemy.moveForward?.(mechanic.jumpDistance || 140) || 0;
                this.state.affectedEnemies.add(enemy.uid);
                if (moved !== false) {
                    this.state.metrics.mechanicUses++;
                    this.game.vfx?.addRing?.(enemy.x, enemy.y, { color: '#65cdff', radius: 38, duration: 0.35 });
                }
            });
        }
    }

    updateInversion(dt) {
        const mechanic = this.level.mission.mechanic;
        this.state.cycleTimer -= dt;
        if (this.state.cycleTimer <= 0) {
            this.state.inverted = !this.state.inverted;
            this.state.cycleTimer += mechanic.cycle || 6;
            this.state.metrics.mechanicUses++;
            this.state.message = this.state.inverted ? 'Paradoja activa: las runas aceleran invasores.' : 'Realidad estable: las runas vuelven a ralentizar.';
            this.publish();
        }
        for (const landmark of mechanic.landmarks || []) {
            this.game.enemies.filter((enemy) => enemy.isAlive && distanceTo(enemy, landmark) <= (landmark.radius || 70))
                .forEach((enemy) => enemy.applyStatus(this.state.inverted
                    ? { type: 'haste', duration: 0.45, power: 0.24 }
                    : { type: 'slow', duration: 0.45, power: 0.42 }));
        }
    }

    updateJungle() {
        if (this.state.vegetation <= 0) return;
        const mechanic = this.level.mission.mechanic;
        for (const landmark of mechanic.landmarks || []) {
            const target = this.game.enemies.find((enemy) => enemy.isAlive && !this.state.affectedEnemies.has(enemy.uid) && distanceTo(enemy, landmark) <= (landmark.radius || 54));
            if (!target) continue;
            target.applyStatus({ type: 'slow', duration: 3, power: 0.62 });
            this.state.affectedEnemies.add(target.uid);
            this.state.vegetation--;
            this.state.metrics.mechanicUses++;
            if (this.state.vegetation === 0) {
                this.state.message = 'La vegetación fue destruida: el sendero queda libre.';
                this.publish();
                return;
            }
        }
    }

    updateRaft() {
        const mechanic = this.level.mission.mechanic;
        (mechanic.landmarks || []).forEach((cell, index) => {
            if (this.state.breachedCells.has(index)) return;
            const source = this.game.enemies.find((enemy) => enemy.isAlive && enemy.hp < enemy.maxHp && distanceTo(enemy, cell) <= (cell.radius || 58));
            if (!source) return;
            this.state.breachedCells.add(index);
            this.state.metrics.mechanicUses++;
            this.game.spawnEnemy?.(mechanic.prisoner, source);
            this.state.message = `Brecha en celda ${cell.label}: prisionero liberado.`;
            this.game.audio?.play('warning');
            this.publish();
        });
    }

    onEnemyDefeated(enemy) {
        if (!this.state) return;
        this.state.metrics.kills++;
        if (enemy.isBoss) this.state.metrics.bosses++;

        if (this.level.mission?.mechanic?.type === 'vibranium') {
            this.state.vibranium++;
            if (this.state.vibranium >= 6) {
                this.state.vibranium = 0;
                this.state.shieldCharges = Math.min(3, this.state.shieldCharges + 1);
                this.state.metrics.mechanicUses++;
                this.game.enemies.forEach((target) => target.applyStatus({ type: 'armorBreak', duration: 4, power: 0.12 }));
                this.state.message = 'Pulso de Vibranium: armaduras fracturadas y escudo recargado.';
                this.publish();
            }
        }

        const type = this.level.mission?.mechanic?.type;
        if (type === 'salvage' && this.state.metrics.kills % 8 === 0) {
            this.game.resourceManager.addCredits(40);
            this.state.metrics.mechanicUses++;
            this.state.message = 'Carga recuperada: +$40 créditos de misión.';
            this.publish();
        }
        if (type === 'fortress' && this.state.metrics.kills % 10 === 0) {
            this.game.enemies.forEach((target) => target.applyStatus({ type: 'armorBreak', duration: 5, power: 0.16 }));
            this.state.metrics.mechanicUses++;
            this.state.message = 'Sabotaje S.H.I.E.L.D.: blindaje Doombot comprometido.';
            this.publish();
        }
    }

    handleLeak(enemy) {
        if (!this.state) return false;
        if (this.level.mission?.mechanic?.type === 'vibranium' && this.state.shieldCharges > 0) {
            this.state.shieldCharges--;
            this.state.metrics.mechanicUses++;
            this.state.message = `Escudo cinético absorbió a ${enemy.name}.`;
            this.publish();
            return true;
        }
        this.state.metrics.leaks++;
        return false;
    }

    onWaveFinished() {
        if (!this.state) return;
        const flawless = this.game.resourceManager.lives === this.state.waveStartLives;
        if (flawless) this.state.metrics.noLeakWaves++;
        if (this.state.civilianActive) {
            if (flawless) {
                this.state.metrics.civiliansSaved += 3;
                this.state.message = 'Convoy evacuado: 3 civiles a salvo.';
            } else {
                this.state.message = 'Evacuación interrumpida por una fuga enemiga.';
            }
            this.state.civilianActive = false;
        }
        this.evaluateObjectives();
        this.publish();
    }

    evaluateObjectives() {
        if (this.game.modeSystem?.modeId && this.game.modeSystem.modeId !== 'campaign') return;
        for (const objective of this.level.mission?.objectives || []) {
            if (this.state.completed.has(objective.id)) continue;
            if ((this.state.metrics[objective.metric] || 0) < objective.target) continue;
            this.state.completed.add(objective.id);
            const awarded = this.game.progression?.completeMissionObjective(this.level.id, objective.id, objective.reward);
            if (awarded) this.game.uiManager?.showToast(`${objective.label}: +${objective.reward} Fondos`, 'success');
        }
    }

    switchReactiveRoute(waveNumber) {
        const routes = this.level.alternatePaths || [];
        if (routes.length === 0) return;
        this.switchRoute((waveNumber - 1) % routes.length);
    }

    switchRoute(index) {
        const routes = this.level.alternatePaths || [];
        const route = routes[index];
        if (!route) return;
        this.game.path = normalizePath(route, this.game.canvas.width, this.game.canvas.height);
        this.game.generateLevelMap();
    }

    getPlacementBlock(gridX, gridY) {
        const mechanic = this.level?.mission?.mechanic;
        if (!mechanic) return null;
        const point = {
            x: gridX * this.game.gridSize + this.game.gridSize / 2,
            y: gridY * this.game.gridSize + this.game.gridSize / 2
        };
        const reserved = [mechanic.zone, mechanic.door, mechanic.turret, ...(mechanic.nodes || []), ...(mechanic.landmarks || []), ...(mechanic.portals || [])].filter(Boolean);
        return reserved.some((zone) => distanceTo(point, zone) < (zone.radius || 34) + 16)
            ? 'Celda reservada para una defensa de la misión.'
            : null;
    }

    getSnapshot() {
        if (!this.state) return null;
        const mechanic = this.level.mission?.mechanic || {};
        return {
            operation: this.level.mission?.operation || this.level.name,
            mechanicLabel: mechanic.label || 'Defensa táctica',
            message: this.state.message,
            blackout: Math.ceil(this.state.blackout),
            shieldCharges: this.state.shieldCharges,
            vibranium: this.state.vibranium,
            objectives: (this.level.mission?.objectives || []).map((objective) => ({
                ...objective,
                value: Math.min(objective.target, this.state.metrics[objective.metric] || 0),
                complete: this.state.completed.has(objective.id)
            }))
        };
    }

    publish() {
        this.game.uiManager?.updateMissionStatus(this.getSnapshot());
    }

    render(ctx) {
        if (!this.state) return;
        const mechanic = this.level.mission?.mechanic || {};
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (mechanic.type === 'streets') {
            drawZone(ctx, mechanic.zone, '#fca311', 'BARRICADA');
            if (this.state.civilianActive) {
                const start = mechanic.convoyStart || { x: 80, y: 70 };
                const end = mechanic.convoyEnd || { x: 720, y: 70 };
                const x = start.x + (end.x - start.x) * this.state.civilianProgress;
                const y = start.y + (end.y - start.y) * this.state.civilianProgress;
                drawToken(ctx, x, y, '#69e58c', 'CIV');
            }
        }

        if (mechanic.type === 'security') {
            drawZone(ctx, mechanic.door, this.state.blackout > 0 ? '#e63946' : '#fca311', 'PUERTA');
            drawToken(ctx, mechanic.turret.x, mechanic.turret.y, this.state.blackout > 0 ? '#4b5567' : '#40c9ff', 'AUX');
        }

        if (mechanic.type === 'vibranium') {
            (mechanic.nodes || []).forEach((node) => drawToken(ctx, node.x, node.y, '#b865ff', 'V'));
            const exit = this.game.path.at(-2);
            if (exit) drawZone(ctx, { ...exit, radius: 34 }, '#d4af37', `ESC ${this.state.shieldCharges}`);
        }

        if (mechanic.type === 'bifrost') {
            (mechanic.portals || []).forEach((portal, index) => drawZone(ctx, portal, '#65cdff', `BIF ${index + 1}`));
        }

        for (const landmark of mechanic.landmarks || []) {
            drawToken(ctx, landmark.x, landmark.y, landmark.color || '#ffffff', landmark.label || 'OBJ');
        }
        ctx.restore();
    }
}

function distanceTo(entity, point) {
    return Math.hypot(entity.x - point.x, entity.y - point.y);
}

function nearestEnemy(enemies, origin, range) {
    return enemies
        .filter((enemy) => enemy.isAlive && distanceTo(enemy, origin) <= range)
        .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0] || null;
}

function drawZone(ctx, zone, color, label) {
    if (!zone) return;
    ctx.fillStyle = `${color}20`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius || 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 9px Segoe UI';
    ctx.fillText(label, zone.x, zone.y);
}

function drawToken(ctx, x, y, color, label) {
    ctx.fillStyle = '#071018';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 9px Segoe UI';
    ctx.fillText(label, x, y + 1);
}
