import { getSpriteFrame } from '../rendering/ImageCache.js';
import { TacticalActionSystem } from '../systems/TacticalActionSystem.js';
import { getClosestPointOnPath } from '../utils/PathUtils.js';

export function measurePathCoverage(origin, range, path = []) {
    const intervals = [];
    let coveredLength = 0;
    const radiusSquared = range * range;

    for (let index = 0; index < path.length - 1; index++) {
        const start = path[index];
        const end = path[index + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;
        if (lengthSquared === 0) continue;

        const fx = start.x - origin.x;
        const fy = start.y - origin.y;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - radiusSquared;
        const discriminant = b * b - 4 * lengthSquared * c;
        if (discriminant < 0) continue;

        const root = Math.sqrt(discriminant);
        const t1 = (-b - root) / (2 * lengthSquared);
        const t2 = (-b + root) / (2 * lengthSquared);
        const startT = Math.max(0, Math.min(t1, t2));
        const endT = Math.min(1, Math.max(t1, t2));
        if (endT <= 0 || startT >= 1 || endT <= startT) continue;

        const segmentLength = Math.sqrt(lengthSquared);
        const from = { x: start.x + dx * startT, y: start.y + dy * startT };
        const to = { x: start.x + dx * endT, y: start.y + dy * endT };
        coveredLength += (endT - startT) * segmentLength;
        intervals.push({ segmentIndex: index, startT, endT, from, to });
    }

    const ratio = coveredLength / Math.max(80, range);
    const quality = ratio >= 1.45
        ? { id: 'excellent', label: 'Cobertura excelente' }
        : ratio >= 0.95
            ? { id: 'strong', label: 'Cobertura fuerte' }
            : ratio >= 0.55
                ? { id: 'solid', label: 'Cobertura solida' }
                : { id: 'minimal', label: 'Cobertura minima' };

    return { coveredLength, intervals, quality };
}

export class InputManager {
    constructor(canvas, gameInstance, uiManager, resourceManager) {
        this.canvas = canvas;
        this.game = gameInstance;
        this.uiManager = uiManager;
        this.resources = resourceManager;
        this.placingHero = null;
        this.movingHero = null;
        this.mousePos = { x: 0, y: 0 };
        this.gamepadButtons = [];
        this.gamepadHeroIndex = 0;
        this.game.tacticalActions = this.game.tacticalActions || new TacticalActionSystem(this.game);

        this.canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
        this.canvas.addEventListener('mousemove', (event) => this.updateMousePos(event));
        this.canvas.addEventListener('mouseleave', () => this.uiManager.setSelectionStatus('Elige un héroe y colócalo junto al camino.'));
        window.addEventListener('keydown', (event) => {
            const bindings = this.game.progression?.state.settings.keyBindings || {};
            if (event.key === (bindings.cancel || 'Escape')) this.clearPlacement();
            if (/^[1-6]$/.test(event.key)) this.handleHeroShortcut(event);
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName)) return;
            if (event.key.toLowerCase() === bindings.pause?.toLowerCase()) this.uiManager.setManualPause?.(!this.game.isManuallyPaused);
            if (event.key.toLowerCase() === bindings.speed?.toLowerCase()) document.getElementById('btn-speed')?.click();
            if (event.key.toLowerCase() === bindings.nextWave?.toLowerCase()) this.game.waveManager?.startNextWave();
        });
    }

    updateGamepad() {
        const pad = globalThis.navigator?.getGamepads?.()[0];
        if (!pad) return;
        const pressed = pad.buttons.map((button) => button.pressed);
        const justPressed = (index) => pressed[index] && !this.gamepadButtons[index];
        if (justPressed(0)) this.game.waveManager?.startNextWave();
        if (justPressed(1)) this.clearPlacement();
        if (justPressed(9)) this.uiManager.setManualPause?.(!this.game.isManuallyPaused);
        if (justPressed(4) || justPressed(5)) {
            const direction = justPressed(5) ? 1 : -1;
            this.gamepadHeroIndex = (this.gamepadHeroIndex + direction + this.game.activeTeam.length) % Math.max(1, this.game.activeTeam.length);
            const hero = this.game.activeTeam[this.gamepadHeroIndex];
            if (hero) this.setPlacementMode(hero);
        }
        this.gamepadButtons = pressed;
    }

    updateMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        this.mousePos.y = (event.clientY - rect.top) * (this.canvas.height / rect.height);

        if (this.placingHero) {
            const validation = this.getPlacementValidation();
            this.uiManager.setSelectionStatus(validation.message);
        }
    }

    setPlacementMode(heroConfig) {
        this.movingHero = null;
        this.placingHero = heroConfig;
        this.uiManager.setSelectionStatus(`Colocando ${heroConfig.name}. Coste: $${heroConfig.cost || 0}. Esc para cancelar.`);
    }

    setRepositionMode(hero) {
        const permission = this.game.tacticalActions.canReposition(hero);
        if (!permission.ok) {
            this.uiManager.showToast(permission.reason, 'warning');
            return false;
        }

        this.placingHero = hero.config;
        this.movingHero = hero;
        this.game.selectedUnit = hero;
        this.uiManager.setManualPause?.(true, false);
        this.uiManager.setSelectionStatus(`Reposicionando ${hero.name}. Un movimiento por oleada · Esc para cancelar.`);
        return true;
    }

    clearPlacement() {
        this.placingHero = null;
        this.movingHero = null;
        this.uiManager.setSelectionStatus('Elige un héroe y colócalo junto al camino.');
    }

    handleHeroShortcut(event) {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName)) return;
        const config = this.game.activeTeam?.[Number(event.key) - 1];
        if (!config) return;
        event.preventDefault();
        const deployed = this.game.heroes.find((hero) => hero.id === config.id);
        if (deployed) {
            this.game.selectedUnit = deployed;
            this.uiManager.setSelectionStatus(`${event.key}: ${deployed.name} seleccionado · alcance ${Math.round(deployed.getEffectiveStats().range)}.`);
        } else {
            this.setPlacementMode(config);
        }
    }

    handleCanvasClick() {
        if (this.placingHero) {
            this.placeHero();
        } else {
            this.checkUnitSelection(this.mousePos.x, this.mousePos.y);
        }
    }

    getGridPosition() {
        return {
            x: Math.floor(this.mousePos.x / this.game.gridSize),
            y: Math.floor(this.mousePos.y / this.game.gridSize)
        };
    }

    getPlacementValidation() {
        const { x, y } = this.getGridPosition();
        const snapX = x * this.game.gridSize + this.game.gridSize / 2;
        const snapY = y * this.game.gridSize + this.game.gridSize / 2;
        const row = this.game.terrainMap[y];
        const terrainType = row ? row[x] : undefined;
        const placementTerrain = terrainType === 11 || terrainType === 12 ? 1 : terrainType;
        const terrainNames = { 0: 'agua', 1: 'hierba', 2: 'camino', 3: 'montaña', 4: 'arbusto', 11: 'hierba', 12: 'hierba alta' };

        if (terrainType === undefined) return { valid: false, message: 'Fuera del mapa.' };

        const missionBlock = this.game.missionSystem?.getPlacementBlock?.(x, y);
        if (missionBlock) return { valid: false, message: missionBlock };

        const allowedTerrains = this.placingHero.allowedTerrains || [1, 3, 11, 12];
        if (!allowedTerrains.includes(placementTerrain)) {
            return { valid: false, message: `${this.placingHero.name} no puede ir sobre ${terrainNames[terrainType] || 'ese terreno'}.` };
        }

        const alreadyDeployed = !this.movingHero && this.game.heroes.some((hero) => hero.id === this.placingHero.id);
        if (alreadyDeployed) return { valid: false, message: `${this.placingHero.name} ya está desplegado.` };

        const occupied = this.game.heroes.some((hero) => {
            if (hero === this.movingHero) return false;
            const dx = hero.x - snapX;
            const dy = hero.y - snapY;
            return Math.hypot(dx, dy) < this.game.gridSize * 0.8;
        });
        if (occupied) return { valid: false, message: 'Esa celda ya está ocupada.' };

        const pathPoint = getClosestPointOnPath({ x: snapX, y: snapY }, this.game.path);
        const pathDistance = pathPoint?.distance ?? Infinity;
        const range = this.movingHero?.getEffectiveStats?.().range || this.placingHero.range || 100;
        const coverage = measurePathCoverage({ x: snapX, y: snapY }, range, this.game.path);
        if (pathDistance > range) {
            return { valid: false, pathDistance, pathPoint, coverage, message: `Fuera de alcance: el camino está a ${Math.round(pathDistance)} px.` };
        }

        if (this.movingHero) {
            const permission = this.game.tacticalActions.canReposition(this.movingHero);
            if (!permission.ok) return { valid: false, pathDistance, pathPoint, coverage, message: permission.reason };
            return { valid: true, pathDistance, pathPoint, coverage, message: `${coverage.quality.label}: ${Math.round(coverage.coveredLength)} px de ruta. Clic para mover.` };
        }

        const cost = this.placingHero.cost || 0;
        if (this.resources.credits < cost) return { valid: false, message: `Créditos insuficientes. Necesitas $${cost}.` };

        return { valid: true, pathDistance, pathPoint, coverage, message: `${coverage.quality.label}: ${Math.round(coverage.coveredLength)} px de ruta. Clic para colocar por $${cost}.` };
    }

    placeHero() {
        if (!this.placingHero) return;

        const validation = this.getPlacementValidation();
        if (!validation.valid) {
            this.uiManager.showToast(validation.message, 'warning');
            return;
        }

        const { x, y } = this.getGridPosition();
        const snapX = x * this.game.gridSize + this.game.gridSize / 2;
        const snapY = y * this.game.gridSize + this.game.gridSize / 2;
        if (this.movingHero) {
            this.movingHero.x = snapX;
            this.movingHero.y = snapY;
            this.game.tacticalActions.markRepositioned(this.movingHero);
            this.game.selectedUnit = this.movingHero;
            this.uiManager.showToast(`${this.movingHero.name} reposicionado`, 'success');
            this.uiManager.renderHeroRoster(this.game.activeTeam, (hero) => this.setPlacementMode(hero));
            this.game.waveManager?.refreshWaveIntel?.();
            this.clearPlacement();
            return;
        }

        const cost = this.placingHero.cost || 0;

        if (!this.resources.removeCredits(cost)) {
            this.uiManager.showToast('Los créditos cambiaron antes de confirmar la colocación.', 'warning');
            return;
        }
        const deployed = this.game.spawnHero(this.placingHero, snapX, snapY);
        this.game.replaySystem?.record('deploy', { heroId: this.placingHero.id, x: snapX, y: snapY });
        this.game.selectedUnit = deployed;
        this.uiManager.showToast(`${this.placingHero.name} desplegado`, 'success');
        this.uiManager.renderHeroRoster(this.game.activeTeam, (hero) => this.setPlacementMode(hero));
        this.game.waveManager?.refreshWaveIntel?.();
        this.clearPlacement();
    }

    sellHero(hero) {
        const result = this.game.tacticalActions.sell(hero);
        if (!result.ok) {
            this.uiManager.showToast(result.reason, 'warning');
            return result;
        }
        this.uiManager.showToast(`${hero.name} retirado · +$${result.refund}`, 'reward');
        this.uiManager.renderHeroRoster(this.game.activeTeam, (config) => this.setPlacementMode(config));
        this.uiManager.updateUI(
            this.resources.lives,
            this.resources.credits,
            this.game.waveManager?.currentWave || 1,
            this.game.fps,
            this.game.stars
        );
        this.game.waveManager?.refreshWaveIntel?.();
        this.clearPlacement();
        return result;
    }

    checkUnitSelection(x, y) {
        const entities = [...this.game.enemies, ...this.game.heroes];
        const selectedUnit = entities.find((unit) => Math.hypot(x - unit.x, y - unit.y) <= 26);

        if (selectedUnit) {
            this.game.selectedUnit = selectedUnit;
            this.uiManager.inspectUnit(selectedUnit, selectedUnit.takeDamage !== undefined);
        }
    }

    draw(ctx) {
        this.drawSelectedHero(ctx);
        if (!this.placingHero) return;

        const validation = this.getPlacementValidation();
        const { x, y } = this.getGridPosition();
        const px = x * this.game.gridSize;
        const py = y * this.game.gridSize;
        const centerX = px + this.game.gridSize / 2;
        const centerY = py + this.game.gridSize / 2;
        const range = this.movingHero?.getEffectiveStats?.().range || this.placingHero.range || 100;

        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = validation.valid ? '#46d369' : '#e63946';
        ctx.fillRect(px, py, this.game.gridSize, this.game.gridSize);

        ctx.globalAlpha = 1;
        ctx.strokeStyle = validation.valid ? 'rgba(70, 211, 105, 0.9)' : 'rgba(230, 57, 70, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, this.game.gridSize - 4, this.game.gridSize - 4);

        ctx.beginPath();
        ctx.arc(centerX, centerY, range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.stroke();
        this.drawCoveredPathSegments(ctx, validation.coverage, validation.valid);
        if (validation.pathPoint) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(validation.pathPoint.x, validation.pathPoint.y);
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = validation.valid ? '#46d369' : '#e63946';
            ctx.stroke();
            ctx.setLineDash([]);
        }
        this.drawHeroGhost(ctx, centerX, centerY, validation.valid);
        ctx.restore();
    }

    drawCoveredPathSegments(ctx, coverage, valid) {
        if (!coverage?.intervals?.length) return;
        const colors = {
            excellent: '#46d369',
            strong: '#8be36c',
            solid: '#fca311',
            minimal: '#e63946'
        };
        ctx.save();
        ctx.globalAlpha = valid ? 0.9 : 0.45;
        ctx.lineCap = 'round';
        ctx.lineWidth = 8;
        ctx.strokeStyle = valid ? colors[coverage.quality.id] || '#46d369' : '#e63946';
        coverage.intervals.forEach((interval) => {
            ctx.beginPath();
            ctx.moveTo(interval.from.x, interval.from.y);
            ctx.lineTo(interval.to.x, interval.to.y);
            ctx.stroke();
        });
        ctx.restore();
    }

    drawSelectedHero(ctx) {
        const hero = this.game.selectedUnit;
        if (!hero || !this.game.heroes.includes(hero)) return;
        const range = hero.getEffectiveStats?.().range || hero.range || 100;
        ctx.save();
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(64, 201, 255, 0.035)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(64, 201, 255, 0.55)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    drawHeroGhost(ctx, x, y, valid) {
        const source = this.placingHero.visual?.idle?.south || this.placingHero.visual?.portrait || this.placingHero.sprite;
        const { image, frame } = getSpriteFrame(source);
        if (!image?.complete || image.naturalWidth <= 0) return;
        const size = Math.min(this.placingHero.visual?.size || 72, 86);
        ctx.globalAlpha = valid ? 0.78 : 0.42;
        if (frame) {
            ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height, x - size / 2, y - size / 2, size, size);
        } else {
            ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
        }
    }
}
