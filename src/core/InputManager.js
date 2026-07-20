import { getSpriteFrame } from '../rendering/ImageCache.js';
import { TacticalActionSystem } from '../systems/TacticalActionSystem.js';
import { getNextTargetingPriority } from '../systems/UIManager.js';
import { getClosestPointOnPath } from '../utils/PathUtils.js';
import { buildHeroTargetIntent } from '../entities/Hero.js';
import {
    canPlaceOnTerrain,
    getAllowedTerrainLabels,
    getPlacementTerrain,
    getPlacementTerrainLabel,
    getTerrainLabel,
    getTerrainPlacementTone,
    isBlockedPlacementTerrain,
    TERRAIN
} from '../utils/TerrainRules.js';

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

export function findBestPlacementCell(heroConfig, game, movingHero = null) {
    if (!heroConfig || !game?.terrainMap?.length || !game?.path?.length) return null;

    const gridSize = game.gridSize || 40;
    const range = movingHero?.getEffectiveStats?.().range || heroConfig.range || 100;
    const allowedTerrains = heroConfig.allowedTerrains || [TERRAIN.grass];
    const qualityWeight = { excellent: 220, strong: 140, solid: 70, minimal: 0 };
    let best = null;

    for (let y = 0; y < game.terrainMap.length; y++) {
        for (let x = 0; x < game.terrainMap[y].length; x++) {
            const terrainType = game.terrainMap[y][x];
            if (isBlockedPlacementTerrain(terrainType)) continue;
            const placementTerrain = getPlacementTerrain(terrainType);
            if (!allowedTerrains.includes(placementTerrain)) continue;
            if (game.missionSystem?.getPlacementBlock?.(x, y)) continue;

            const center = { x: x * gridSize + gridSize / 2, y: y * gridSize + gridSize / 2 };
            const occupied = game.heroes?.some((hero) => {
                if (hero === movingHero) return false;
                return Math.hypot(hero.x - center.x, hero.y - center.y) < gridSize * 0.8;
            });
            if (occupied) continue;

            const pathPoint = getClosestPointOnPath(center, game.path);
            const pathDistance = pathPoint?.distance ?? Infinity;
            if (pathDistance > range) continue;

            const coverage = measurePathCoverage(center, range, game.path);
            if (coverage.coveredLength <= 0) continue;

            const score = coverage.coveredLength
                + (qualityWeight[coverage.quality.id] || 0)
                - pathDistance * 0.22
                - Math.abs(x - (game.terrainMap[y].length - 1) / 2) * 1.5;

            if (!best || score > best.score) {
                best = { x, y, centerX: center.x, centerY: center.y, score, pathDistance, coverage, terrainType, placementTerrain };
            }
        }
    }

    return best;
}

export function buildPlacementSuggestionState(suggestion = null, heroConfig = null) {
    if (!suggestion || !heroConfig) return null;
    const quality = suggestion.coverage?.quality || { id: 'solid', label: 'Cobertura solida' };
    const coveredLength = Math.max(0, Math.round(Number(suggestion.coverage?.coveredLength || 0)));
    const pathDistance = Math.max(0, Math.round(Number(suggestion.pathDistance || 0)));
    const terrain = getPlacementTerrainLabel(suggestion.terrainType);
    return {
        heroId: heroConfig.id || '',
        label: `Celda ${suggestion.x + 1},${suggestion.y + 1}`,
        detail: `${terrain} | ${quality.label} | ${coveredLength}px de ruta | camino a ${pathDistance}px`,
        qualityId: quality.id,
        actionLabel: 'Colocar aqui',
        x: suggestion.x,
        y: suggestion.y,
        centerX: suggestion.centerX,
        centerY: suggestion.centerY
    };
}

export function buildHeroCoverageState(hero, path = []) {
    if (!hero) return null;
    const range = hero.getEffectiveStats?.().range || hero.range || hero.config?.range || 100;
    const coverage = measurePathCoverage({ x: hero.x || 0, y: hero.y || 0 }, range, path);
    return {
        range,
        coverage,
        quality: coverage.quality,
        coveredLength: Math.round(coverage.coveredLength),
        label: `${coverage.quality.label}: ${Math.round(coverage.coveredLength)} px de ruta`
    };
}

export class InputManager {
    constructor(canvas, gameInstance, uiManager, resourceManager) {
        this.canvas = canvas;
        this.game = gameInstance;
        this.uiManager = uiManager;
        this.resources = resourceManager;
        this.placingHero = null;
        this.movingHero = null;
        this.suggestedPlacement = null;
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
            if (event.key === 'Enter' && this.confirmSuggestedPlacement(event)) return;
            if (event.key.toLowerCase() === bindings.pause?.toLowerCase()) this.uiManager.setManualPause?.(!this.game.isManuallyPaused);
            if (event.key.toLowerCase() === bindings.speed?.toLowerCase()) document.getElementById('btn-speed')?.click();
            if (event.key.toLowerCase() === bindings.nextWave?.toLowerCase()) this.game.waveManager?.startNextWave();
            if (event.key.toLowerCase() === (bindings.targeting || 't').toLowerCase()) this.cycleSelectedTargetingPriority(event);
            if (event.key.toLowerCase() === (bindings.upgrade || 'u').toLowerCase()) this.quickUpgradeSelectedHero(event);
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
        this.suggestedPlacement = findBestPlacementCell(heroConfig, this.game);
        const suggestionState = buildPlacementSuggestionState(this.suggestedPlacement, heroConfig);
        const suggestion = suggestionState ? ` Sugerencia: ${suggestionState.label}; ${suggestionState.detail}.` : '';
        const terrainText = getAllowedTerrainLabels(heroConfig.allowedTerrains || [TERRAIN.grass]);
        this.uiManager.setSelectionStatus(`Colocando ${heroConfig.name}. Terreno: ${terrainText}. Despliegue libre.${suggestion} Esc para cancelar.`);
        this.uiManager.updatePlacementSuggestion?.(suggestionState);
    }

    setRepositionMode(hero) {
        const permission = this.game.tacticalActions.canReposition(hero);
        if (!permission.ok) {
            this.uiManager.showToast(permission.reason, 'warning');
            return false;
        }

        this.placingHero = hero.config;
        this.movingHero = hero;
        this.suggestedPlacement = findBestPlacementCell(hero.config, this.game, hero);
        this.uiManager.updatePlacementSuggestion?.(buildPlacementSuggestionState(this.suggestedPlacement, hero.config));
        this.game.selectedUnit = hero;
        this.uiManager.setManualPause?.(true, false);
        this.uiManager.setSelectionStatus(`Reposicionando ${hero.name}. Un movimiento por oleada · Esc para cancelar.`);
        return true;
    }

    clearPlacement() {
        this.placingHero = null;
        this.movingHero = null;
        this.suggestedPlacement = null;
        this.uiManager.updatePlacementSuggestion?.(null);
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

    cycleSelectedTargetingPriority(event = null) {
        const hero = this.game.selectedUnit;
        if (!hero || hero.takeDamage !== undefined || !this.game.heroes?.includes(hero)) return false;
        event?.preventDefault?.();
        const nextPriority = getNextTargetingPriority(hero.targetingPriority || hero.config?.targetingPriority);
        hero.targetingPriority = nextPriority;
        if (hero.config) hero.config.targetingPriority = nextPriority;
        this.uiManager.showToast?.(`${hero.name}: objetivo ${nextPriority}`, 'info');
        this.uiManager.setSelectionStatus?.(`${hero.name}: prioridad ${nextPriority}.`);
        this.uiManager.renderHeroRoster?.(this.game.activeTeam, (config) => this.setPlacementMode(config));
        return nextPriority;
    }

    quickUpgradeSelectedHero(event = null) {
        const hero = this.game.selectedUnit;
        if (!hero || hero.takeDamage !== undefined || !this.game.heroes?.includes(hero)) return false;
        event?.preventDefault?.();
        return Boolean(this.uiManager.quickUpgradeHero?.(hero));
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

    getCellCenter(x, y) {
        const snapX = x * this.game.gridSize + this.game.gridSize / 2;
        const snapY = y * this.game.gridSize + this.game.gridSize / 2;
        return { snapX, snapY };
    }

    getPlacementValidation(grid = this.getGridPosition()) {
        const { x, y } = grid;
        const { snapX, snapY } = this.getCellCenter(x, y);
        const row = this.game.terrainMap[y];
        const terrainType = row ? row[x] : undefined;
        const placementTerrain = getPlacementTerrain(terrainType);
        if (terrainType === undefined) return { valid: false, message: 'Fuera del mapa.' };

        const missionBlock = this.game.missionSystem?.getPlacementBlock?.(x, y);
        if (missionBlock) return { valid: false, message: missionBlock };

        const allowedTerrains = this.placingHero.allowedTerrains || [TERRAIN.grass];
        if (!canPlaceOnTerrain(this.placingHero, terrainType)) {
            const allowedText = getAllowedTerrainLabels(allowedTerrains);
            const terrainText = isBlockedPlacementTerrain(terrainType) ? getTerrainLabel(terrainType) : getPlacementTerrainLabel(terrainType);
            return { valid: false, terrainType, placementTerrain, message: `${this.placingHero.name} requiere ${allowedText}; esta celda es ${terrainText}.` };
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
            return { valid: false, terrainType, placementTerrain, pathDistance, pathPoint, coverage, message: `Fuera de alcance: el camino está a ${Math.round(pathDistance)} px.` };
        }

        if (this.movingHero) {
            const permission = this.game.tacticalActions.canReposition(this.movingHero);
            if (!permission.ok) return { valid: false, terrainType, placementTerrain, pathDistance, pathPoint, coverage, message: permission.reason };
            return { valid: true, terrainType, placementTerrain, pathDistance, pathPoint, coverage, message: `${getPlacementTerrainLabel(terrainType)} · ${coverage.quality.label}: ${Math.round(coverage.coveredLength)} px de ruta. Clic para mover.` };
        }

        return { valid: true, terrainType, placementTerrain, pathDistance, pathPoint, coverage, message: `${getPlacementTerrainLabel(terrainType)} · ${coverage.quality.label}: ${Math.round(coverage.coveredLength)} px de ruta. Clic para colocar.` };
    }

    confirmSuggestedPlacement(event = null) {
        if (!this.placingHero || !this.suggestedPlacement) return false;
        event?.preventDefault?.();
        const previousMouse = { ...this.mousePos };
        this.mousePos = { x: this.suggestedPlacement.centerX, y: this.suggestedPlacement.centerY };
        this.placeHero({ fromSuggestion: true });
        const confirmed = !this.placingHero;
        if (!confirmed) this.mousePos = previousMouse;
        return confirmed;
    }

    placeHero(options = {}) {
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
            this.uiManager.showToast(`${this.movingHero.name} reposicionado${options.fromSuggestion ? ' en celda sugerida' : ''}`, 'success');
            this.uiManager.renderHeroRoster(this.game.activeTeam, (hero) => this.setPlacementMode(hero));
            this.game.waveManager?.refreshWaveIntel?.();
            this.clearPlacement();
            return;
        }

        const deployed = this.game.spawnHero(this.placingHero, snapX, snapY);
        this.game.replaySystem?.record('deploy', { heroId: this.placingHero.id, x: snapX, y: snapY });
        this.game.selectedUnit = deployed;
        this.uiManager.showToast(`${this.placingHero.name} desplegado${options.fromSuggestion ? ' en celda sugerida' : ''}`, 'success');
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
        this.uiManager.showToast(`${hero.name} retirado`, 'info');
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
        } else {
            this.game.selectedUnit = null;
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
        this.drawTerrainCompatibilityOverlay(ctx, range);
        this.drawSuggestedPlacement(ctx, x, y, range);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = validation.valid ? getTerrainPlacementTone(validation.terrainType) : '#e63946';
        ctx.fillRect(px, py, this.game.gridSize, this.game.gridSize);

        ctx.globalAlpha = 1;
        ctx.strokeStyle = validation.valid ? getTerrainPlacementTone(validation.terrainType) : 'rgba(230, 57, 70, 0.9)';
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
            ctx.strokeStyle = validation.valid ? getTerrainPlacementTone(validation.terrainType) : '#e63946';
            ctx.stroke();
            ctx.setLineDash([]);
        }
        this.drawHeroGhost(ctx, centerX, centerY, validation.valid);
        ctx.restore();
    }

    drawTerrainCompatibilityOverlay(ctx, range) {
        if (!this.placingHero || !this.game.terrainMap?.length) return;
        const gridSize = this.game.gridSize;
        const rows = this.game.terrainMap.length;
        const cols = this.game.terrainMap[0]?.length || 0;
        ctx.save();
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const terrainType = this.game.terrainMap[y]?.[x];
                if (!canPlaceOnTerrain(this.placingHero, terrainType)) continue;
                const center = { x: x * gridSize + gridSize / 2, y: y * gridSize + gridSize / 2 };
                const pathPoint = getClosestPointOnPath(center, this.game.path);
                if ((pathPoint?.distance ?? Infinity) > range) continue;
                const color = getTerrainPlacementTone(terrainType);
                const px = x * gridSize;
                const py = y * gridSize;
                ctx.globalAlpha = 0.12;
                ctx.fillStyle = color;
                ctx.fillRect(px + 3, py + 3, gridSize - 6, gridSize - 6);
                ctx.globalAlpha = 0.38;
                ctx.strokeStyle = color;
                ctx.strokeRect(px + 4, py + 4, gridSize - 8, gridSize - 8);
            }
        }
        ctx.restore();
    }

    drawSuggestedPlacement(ctx, currentGridX, currentGridY, range) {
        if (!this.suggestedPlacement || (this.suggestedPlacement.x === currentGridX && this.suggestedPlacement.y === currentGridY)) return;
        const px = this.suggestedPlacement.x * this.game.gridSize;
        const py = this.suggestedPlacement.y * this.game.gridSize;
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.strokeStyle = '#fca311';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(px + 4, py + 4, this.game.gridSize - 8, this.game.gridSize - 8);
        ctx.beginPath();
        ctx.arc(this.suggestedPlacement.centerX, this.suggestedPlacement.centerY, range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(252, 163, 17, 0.42)';
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#fca311';
        ctx.font = '800 10px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SUG', this.suggestedPlacement.centerX, this.suggestedPlacement.centerY + 4);
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
        if (this.game.showHeroRanges === false) return;
        if (!hero || !this.game.heroes.includes(hero)) return;
        const state = buildHeroCoverageState(hero, this.game.path);
        const targetIntent = buildHeroTargetIntent(hero, this.game.enemies || []);
        const range = state.range;
        const colors = {
            excellent: '#46d369',
            strong: '#8be36c',
            solid: '#fca311',
            minimal: '#e63946'
        };
        const coverageColor = colors[state.quality.id] || '#40c9ff';
        ctx.save();
        this.drawCoveredPathSegments(ctx, state.coverage, state.coveredLength > 0);
        this.drawTargetIntent(ctx, hero, targetIntent);
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(64, 201, 255, 0.035)';
        ctx.fill();
        ctx.strokeStyle = coverageColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = coverageColor;
        ctx.font = '800 10px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(state.quality.label.replace('Cobertura ', '').toUpperCase(), hero.x, hero.y - 34);
        ctx.restore();
    }

    drawTargetIntent(ctx, hero, intent) {
        if (!intent?.target?.isAlive) return;
        const target = intent.target;
        ctx.save();
        ctx.strokeStyle = intent.color;
        ctx.lineWidth = intent.danger === 'critical' ? 3 : 2;
        ctx.globalAlpha = 0.78;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(hero.x, hero.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(5, 7, 11, 0.82)';
        ctx.strokeStyle = intent.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(target.x - 22, target.y - 35, 44, 15, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = intent.color;
        ctx.font = '800 8px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(intent.priority.toUpperCase().slice(0, 5), target.x, target.y - 27.5);
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
