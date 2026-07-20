import { Hero } from '../entities/Hero.js';
import { Enemy } from '../entities/Enemy.js';
import { RandomSource } from '../utils/Random.js';
import { CombatVfx } from '../rendering/CombatVfx.js';
import { AudioManager } from '../audio/AudioManager.js';
import { Projectile } from '../entities/Projectile.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { PerformanceMonitor } from '../systems/PerformanceMonitor.js';
import { TeamSynergySystem } from '../systems/TeamSynergySystem.js';
import { buildPixelTerrainMap, drawPixelMapOverlays, drawPixelTerrainTile, isPixelMapLevel, usesManualManhattanMap } from '../rendering/PixelMapRenderer.js';

export class GameLoop {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = performance.now();
        this.deltaTime = 0;
        this.fps = 0;
        this.isRunning = false;
        this.isManuallyPaused = false;
        this.isGameOver = false;

        this.heroes = [];
        this.enemies = [];
        this.projectiles = [];
        this.path = [];
        this.stars = 0;
        this.random = new RandomSource(options.seed ?? Date.now());
        this.vfx = new CombatVfx();
        this.audio = new AudioManager();
        this.projectilePool = new ObjectPool(
            () => new Projectile(0, 0, null),
            (projectile) => projectile.deactivate(),
            768
        );
        this.performanceMonitor = new PerformanceMonitor();
        this.teamSynergy = new TeamSynergySystem(this);

        this.waveManager = null;
        this.uiManager = null;
        this.resourceManager = null;
        this.inputManager = null;
        this.selectedUnit = null;
        this.tacticalActions = null;

        this.gameSpeed = 1;
        this.gridSize = 40;
        this.terrainMap = [];
        this.showGrid = true;
        this.showHeroRanges = true;

        this.theme = this.getLevelTheme();

        requestAnimationFrame((time) => this.loop(time));
    }

    generateLevelMap() {
        const cols = Math.ceil(this.canvas.width / this.gridSize);
        const rows = Math.ceil(this.canvas.height / this.gridSize);
        this.terrainMap = [];
        this.theme = this.getLevelTheme();

        if (isPixelMapLevel(this.currentLevel)) {
            this.terrainMap = buildPixelTerrainMap(this.currentLevel, this.canvas, this.gridSize);
            this.paintPathTiles();
            return;
        }

        for (let y = 0; y < rows; y++) {
            this.terrainMap[y] = [];
            for (let x = 0; x < cols; x++) {
                const noise = this.seededNoise(x, y);
                let terrain = 1;

                if (noise < 0.05) terrain = 11;
                else if (noise < 0.13) terrain = 12;
                else if (noise < 0.18) terrain = 4;

                if (this.theme.waterBand && x > cols - 4 && y > 2) terrain = 0;
                if (y === 0 || y === rows - 1 || (x < 2 && y < 5)) terrain = 3;

                this.terrainMap[y][x] = terrain;
            }
        }

        this.paintPathTiles();
    }

    seededNoise(x, y) {
        const value = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453;
        return value - Math.floor(value);
    }

    paintPathTiles() {
        if (!this.path || this.path.length < 2) return;

        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            const startX = Math.floor(start.x / this.gridSize);
            const startY = Math.floor(start.y / this.gridSize);
            const endX = Math.floor(end.x / this.gridSize);
            const endY = Math.floor(end.y / this.gridSize);

            const minX = Math.max(0, Math.min(startX, endX));
            const maxX = Math.min(this.terrainMap[0].length - 1, Math.max(startX, endX));
            const minY = Math.max(0, Math.min(startY, endY));
            const maxY = Math.min(this.terrainMap.length - 1, Math.max(startY, endY));

            for (let x = minX; x <= maxX; x++) {
                if (this.terrainMap[startY]) this.terrainMap[startY][x] = 2;
            }

            for (let y = minY; y <= maxY; y++) {
                if (this.terrainMap[y] && this.terrainMap[y][endX] !== undefined) {
                    this.terrainMap[y][endX] = 2;
                }
            }
        }
    }

    spawnHero(config, x, y) {
        const hero = new Hero(config, x, y, this);
        this.progression?.applyEquippedItem(hero);
        this.heroes.push(hero);
        this.progression?.discoverCodex?.('heroes', config.id);
        return hero;
    }

    spawnEnemy(config, source = null) {
        const enemy = new Enemy(config, this.path, this);
        if (source) enemy.copyPathPosition(source, 24);
        this.enemies.push(enemy);
        this.progression?.discoverCodex?.('enemies', config.id);
        if (config.faction) this.progression?.discoverCodex?.('factions', config.faction);
        return enemy;
    }

    spawnProjectile(x, y, target, config = {}) {
        const projectile = this.projectilePool.acquire((item) => item.reset(x, y, target, config));
        this.projectiles.push(projectile);
        return projectile;
    }

    clearProjectiles() {
        this.projectiles.forEach((projectile) => this.projectilePool.release(projectile));
        this.projectiles.length = 0;
    }

    start() {
        if (this.isGameOver) return;
        this.isRunning = true;
        this.lastTime = performance.now();
    }

    pause() {
        this.isRunning = false;
    }

    togglePause() {
        this.isManuallyPaused = !this.isManuallyPaused;
        if (!this.isManuallyPaused) this.start();
        return this.isManuallyPaused;
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.modeSystem?.finishRun('defeat');
        this.progression?.recordMissionSummary?.(this, 'defeat');
        this.pause();
        if (this.uiManager) this.uiManager.showGameOver();
    }

    loop(timestamp) {
        const frameMs = timestamp - this.lastTime;
        this.deltaTime = frameMs / 1000;
        this.lastTime = timestamp;
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;

        if (this.isRunning && !this.isManuallyPaused && !this.isGameOver) {
            this.fps = 1 / this.deltaTime;
            this.update(this.deltaTime * this.gameSpeed);
        }

        const performanceSnapshot = this.performanceMonitor.record(
            frameMs,
            this.enemies.length + this.projectiles.length + this.vfx.effects.length,
            globalThis.performance?.memory?.usedJSHeapSize || 0
        );
        if (performanceSnapshot) this.uiManager?.updatePerformance(performanceSnapshot, this.projectilePool.getStats());

        this.render(this.ctx);
        requestAnimationFrame((time) => this.loop(time));
    }

    update(dt) {
        this.inputManager?.updateGamepad?.();
        if (this.waveManager) this.waveManager.update(dt);
        this.missionSystem?.update(dt);
        this.modeSystem?.update(dt);

        this.enemies.forEach((enemy) => {
            enemy.update(dt);
            if (enemy.hasReachedEnd && !enemy.processed) {
                const missionAbsorbed = this.missionSystem?.handleLeak(enemy) || false;
                const modeAbsorbed = this.modeSystem?.handleLeak(enemy) || false;
                const absorbed = missionAbsorbed || modeAbsorbed;
                const lifeLoss = absorbed ? 0 : (enemy.isBoss ? 3 : 1);
                this.waveManager?.recordLeak?.(enemy, { lifeLoss, absorbed });
                if (!absorbed) this.resourceManager.removeLife(lifeLoss);
                enemy.processed = true;
            }
        });

        this.heroes.forEach((hero) => hero.update(dt, this.enemies, this.projectiles));
        this.projectiles.forEach((projectile) => projectile.update(dt));
        this.vfx.update(dt);

        let enemyWriteIndex = 0;
        for (const enemy of this.enemies) {
            if (!enemy.isAlive && !enemy.hasReachedEnd && !enemy.rewarded) {
                this.resourceManager.addCredits(enemy.reward ?? enemy.config.reward ?? 10);
                this.missionSystem?.onEnemyDefeated(enemy);
                enemy.rewarded = true;
            }
            if (enemy.isAlive && !enemy.hasReachedEnd) this.enemies[enemyWriteIndex++] = enemy;
        }
        this.enemies.length = enemyWriteIndex;

        let projectileWriteIndex = 0;
        for (const projectile of this.projectiles) {
            if (projectile.isActive) this.projectiles[projectileWriteIndex++] = projectile;
            else this.projectilePool.release(projectile);
        }
        this.projectiles.length = projectileWriteIndex;

        if (this.uiManager && this.resourceManager) {
            const currentWave = this.waveManager ? this.waveManager.currentWave : 1;
            this.uiManager.updateUI(this.resourceManager.lives, this.resourceManager.credits, currentWave, this.fps, this.stars);
            this.uiManager.updateCombatPressure?.(this.enemies, this.path, Boolean(this.waveManager?.isWaveActive));
            this.uiManager.updateSpawnQueue?.(this.waveManager?.enemiesQueue || [], this.waveManager?.spawnTimer || 0, Boolean(this.waveManager?.isWaveActive));
            this.uiManager.updateBossHud?.(this.enemies, Boolean(this.waveManager?.isWaveActive));
        }
    }

    render(ctx) {
        const previousSmoothing = ctx.imageSmoothingEnabled;
        const previousCrispFlag = ctx.__pixelArtCrisp;
        ctx.__pixelArtCrisp = Boolean(this.pixelArtCrisp);
        ctx.imageSmoothingEnabled = !this.pixelArtCrisp;

        ctx.fillStyle = this.theme.void;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.terrainMap.length; y++) {
            for (let x = 0; x < this.terrainMap[y].length; x++) {
                const terrainType = this.terrainMap[y][x];
                this.drawTerrainTile(ctx, x, y, terrainType);
            }
        }

        this.drawLevelSetDressing(ctx);
        this.missionSystem?.render(ctx);
        this.modeSystem?.render(ctx);
        this.drawPathGuide(ctx);
        this.drawLevelPathDetails(ctx);
        this.enemies.forEach((enemy) => enemy.render(ctx));
        this.vfx.render(ctx);
        this.heroes.forEach((hero) => hero.render(ctx));
        this.heroes.forEach((hero) => this.teamSynergy.renderFormationRadius(ctx, hero));
        this.projectiles.forEach((projectile) => projectile.render(ctx));
        if (this.inputManager) this.inputManager.draw(ctx);
        ctx.imageSmoothingEnabled = previousSmoothing;
        ctx.__pixelArtCrisp = previousCrispFlag;
    }

    drawPathGuide(ctx) {
        if (!this.path || this.path.length < 2) return;
        if (usesManualManhattanMap(this.currentLevel)) return;
        ctx.save();
        ctx.strokeStyle = this.theme.pathGlow;
        ctx.lineWidth = isPixelMapLevel(this.currentLevel) ? 3 : 7;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();

        ctx.strokeStyle = this.theme.pathStripe;
        ctx.lineWidth = isPixelMapLevel(this.currentLevel) ? 1.5 : 2;
        ctx.setLineDash([10, 12]);
        ctx.stroke();
        ctx.restore();
    }

    drawLevelSetDressing(ctx) {
        const themeId = this.currentLevel?.theme?.id || 'new-york';
        if (isPixelMapLevel(this.currentLevel)) {
            drawPixelMapOverlays(ctx, this);
            this.drawMissionLandmarkBadges(ctx);
            return;
        }
        if (themeId === 'new-york') {
            this.drawManhattanSetDressing(ctx);
            return;
        }
        this.drawThemedSetDressing(ctx, themeId);
        this.drawMissionLandmarkBadges(ctx);
    }

    drawThemedSetDressing(ctx, themeId) {
        const accent = this.theme.decorLight || '#40c9ff';
        const shadow = this.theme.decorDark || '#1d2734';
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        this.drawMapVignette(ctx, accent, shadow);

        const drawers = {
            avengers: () => this.drawAvengersSetDressing(ctx, accent, shadow),
            wakanda: () => this.drawWakandaSetDressing(ctx, accent, shadow),
            sanctum: () => this.drawSanctumSetDressing(ctx, accent, shadow),
            'x-mansion': () => this.drawXMansionSetDressing(ctx, accent, shadow),
            knowhere: () => this.drawKnowhereSetDressing(ctx, accent, shadow),
            latveria: () => this.drawLatveriaSetDressing(ctx, accent, shadow),
            asgard: () => this.drawAsgardSetDressing(ctx, accent, shadow),
            'dark-dimension': () => this.drawDarkDimensionSetDressing(ctx, accent, shadow),
            'savage-land': () => this.drawSavageLandSetDressing(ctx, accent, shadow),
            'the-raft': () => this.drawRaftSetDressing(ctx, accent, shadow)
        };

        drawers[themeId]?.();
        ctx.restore();
    }

    drawMapVignette(ctx, accent, shadow) {
        const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, `${accent}18`);
        gradient.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `${shadow}30`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.strokeStyle = `${accent}2c`;
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
    }

    drawAvengersSetDressing(ctx, accent, shadow) {
        this.drawPanelArray(ctx, [[58, 58, 156, 82], [584, 66, 128, 92], [88, 430, 164, 76], [612, 386, 126, 110]], accent, shadow);
        this.drawConduit(ctx, [[96, 100], [278, 100], [278, 260], [506, 260], [506, 468], [700, 468]], accent);
        this.drawCanvasLabel(ctx, 'A', 374, 318, 82, accent, 0.2);
    }

    drawWakandaSetDressing(ctx, accent, shadow) {
        this.drawChevronField(ctx, 42, 56, 180, 120, accent);
        this.drawChevronField(ctx, 562, 362, 182, 142, accent);
        this.drawConduit(ctx, [[112, 500], [254, 438], [420, 438], [596, 308], [724, 308]], '#b865ff');
        this.drawCanvasLabel(ctx, 'W', 372, 310, 86, accent, 0.18);
    }

    drawSanctumSetDressing(ctx, accent, shadow) {
        this.drawMysticSeal(ctx, 178, 168, 58, accent);
        this.drawMysticSeal(ctx, 620, 440, 72, '#b865ff');
        this.drawConduit(ctx, [[54, 528], [202, 426], [330, 426], [520, 188], [742, 188]], accent);
        this.drawCanvasLabel(ctx, 'III', 380, 314, 46, '#ffcf7a', 0.16);
    }

    drawXMansionSetDressing(ctx, accent, shadow) {
        this.drawTrainingLanes(ctx, 58, 82, 258, 116, accent);
        this.drawTrainingLanes(ctx, 490, 386, 244, 116, '#245493');
        this.drawCanvasLabel(ctx, 'X', 382, 320, 92, '#f4d35e', 0.2);
    }

    drawKnowhereSetDressing(ctx, accent, shadow) {
        this.drawScrapPlates(ctx, [[50, 70, 138, 96], [570, 80, 160, 88], [82, 420, 190, 82], [546, 390, 154, 124]], accent);
        this.drawConduit(ctx, [[76, 224], [210, 182], [384, 224], [556, 176], [724, 216]], '#ff6bd6');
        this.drawCanvasLabel(ctx, 'K', 384, 320, 86, accent, 0.16);
    }

    drawLatveriaSetDressing(ctx, accent, shadow) {
        this.drawFortressPlates(ctx, [[54, 52, 168, 122], [584, 66, 136, 128], [92, 392, 146, 120], [556, 396, 172, 92]], accent);
        this.drawConduit(ctx, [[120, 116], [260, 116], [260, 330], [512, 330], [512, 500], [692, 500]], '#7be06d');
        this.drawCanvasLabel(ctx, 'LV', 360, 320, 58, '#7be06d', 0.17);
    }

    drawAsgardSetDressing(ctx, accent, shadow) {
        this.drawBridgeRails(ctx, accent);
        this.drawRunicSlabs(ctx, [[74, 80, 128, 56], [582, 78, 142, 58], [86, 456, 162, 58], [556, 430, 170, 72]], accent);
        this.drawCanvasLabel(ctx, 'A', 384, 310, 92, '#65cdff', 0.18);
    }

    drawDarkDimensionSetDressing(ctx, accent, shadow) {
        this.drawShardField(ctx, [[70, 76], [198, 468], [564, 120], [684, 428], [374, 78], [458, 512]], accent);
        this.drawConduit(ctx, [[44, 330], [210, 250], [370, 300], [528, 210], [754, 272]], '#8b5cff');
        this.drawCanvasLabel(ctx, 'VOID', 330, 324, 44, accent, 0.13);
    }

    drawSavageLandSetDressing(ctx, accent, shadow) {
        this.drawVines(ctx, '#7ee081');
        this.drawRockShelves(ctx, [[58, 74, 140, 70], [570, 88, 152, 82], [92, 408, 170, 72], [572, 420, 150, 88]], '#8a4f32');
        this.drawCanvasLabel(ctx, 'SL', 366, 322, 58, accent, 0.14);
    }

    drawRaftSetDressing(ctx, accent, shadow) {
        this.drawSecurityGrid(ctx, accent);
        this.drawSearchlightBands(ctx, '#dcecf5');
        this.drawPanelArray(ctx, [[54, 72, 154, 82], [584, 82, 128, 90], [70, 424, 170, 88], [570, 410, 146, 112]], '#ff6b6b', shadow);
        this.drawCanvasLabel(ctx, 'R', 386, 320, 86, accent, 0.16);
    }

    drawPanelArray(ctx, rects, accent, shadow) {
        rects.forEach(([x, y, width, height]) => {
            ctx.fillStyle = `${shadow}88`;
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = `${accent}55`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
            ctx.fillStyle = `${accent}22`;
            for (let cellX = x + 14; cellX < x + width - 14; cellX += 28) ctx.fillRect(cellX, y + 14, 10, height - 28);
        });
    }

    drawConduit(ctx, points, color) {
        if (!points.length) return;
        ctx.save();
        ctx.strokeStyle = `${color}44`;
        ctx.lineWidth = 8;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.stroke();
        ctx.strokeStyle = `${color}aa`;
        ctx.lineWidth = 2;
        ctx.setLineDash([16, 12]);
        ctx.stroke();
        ctx.restore();
    }

    drawCanvasLabel(ctx, text, x, y, size, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.font = `900 ${size}px Segoe UI, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    drawChevronField(ctx, x, y, width, height, color) {
        ctx.save();
        ctx.strokeStyle = `${color}72`;
        ctx.lineWidth = 3;
        for (let row = y; row < y + height; row += 24) {
            for (let col = x; col < x + width; col += 28) {
                ctx.beginPath();
                ctx.moveTo(col, row + 16);
                ctx.lineTo(col + 12, row + 4);
                ctx.lineTo(col + 24, row + 16);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawMysticSeal(ctx, x, y, radius, color) {
        ctx.save();
        ctx.strokeStyle = `${color}88`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.arc(x, y, radius * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        for (let index = 0; index < 8; index++) {
            const angle = (Math.PI * 2 * index) / 8;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * radius * 0.35, y + Math.sin(angle) * radius * 0.35);
            ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawTrainingLanes(ctx, x, y, width, height, color) {
        ctx.save();
        ctx.strokeStyle = `${color}66`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        for (let offset = 20; offset < height; offset += 20) {
            ctx.beginPath();
            ctx.moveTo(x + 8, y + offset);
            ctx.lineTo(x + width - 8, y + offset);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawScrapPlates(ctx, rects, color) {
        rects.forEach(([x, y, width, height], index) => {
            ctx.fillStyle = index % 2 ? 'rgba(42, 38, 50, 0.72)' : 'rgba(52, 52, 62, 0.72)';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = `${color}66`;
            ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);
            ctx.fillStyle = `${color}33`;
            ctx.fillRect(x + 16, y + 18, width - 32, 4);
            ctx.fillRect(x + 18, y + height - 24, width - 36, 3);
        });
    }

    drawFortressPlates(ctx, rects, color) {
        rects.forEach(([x, y, width, height]) => {
            ctx.fillStyle = 'rgba(14, 25, 16, 0.76)';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = `${color}55`;
            ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
            for (let notch = x + 12; notch < x + width - 8; notch += 22) {
                ctx.fillStyle = `${color}30`;
                ctx.fillRect(notch, y + 8, 10, 18);
            }
        });
    }

    drawBridgeRails(ctx, color) {
        ctx.save();
        ctx.strokeStyle = `${color}66`;
        ctx.lineWidth = 4;
        [[72, 142, 728, 142], [72, 466, 728, 466]].forEach(([x1, y1, x2, y2]) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });
        ctx.lineWidth = 1.5;
        for (let x = 88; x < 730; x += 36) {
            ctx.beginPath();
            ctx.moveTo(x, 128);
            ctx.lineTo(x + 20, 156);
            ctx.moveTo(x, 452);
            ctx.lineTo(x + 20, 480);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawRunicSlabs(ctx, rects, color) {
        rects.forEach(([x, y, width, height]) => {
            ctx.fillStyle = 'rgba(101, 81, 44, 0.68)';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = `${color}55`;
            ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
            ctx.fillStyle = `${color}55`;
            ctx.fillRect(x + 16, y + height / 2 - 2, width - 32, 4);
        });
    }

    drawShardField(ctx, points, color) {
        ctx.save();
        ctx.fillStyle = `${color}38`;
        points.forEach(([x, y], index) => {
            const size = 26 + (index % 3) * 12;
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size * 0.45, y + size * 0.15);
            ctx.lineTo(x - size * 0.24, y + size);
            ctx.lineTo(x - size * 0.52, y - size * 0.04);
            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();
    }

    drawVines(ctx, color) {
        ctx.save();
        ctx.strokeStyle = `${color}66`;
        ctx.lineWidth = 3;
        for (let index = 0; index < 6; index++) {
            const y = 54 + index * 92;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(180, y + 54, 300, y - 54, 480, y + 20);
            ctx.bezierCurveTo(600, y + 64, 690, y - 26, 800, y + 12);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawRockShelves(ctx, rects, color) {
        rects.forEach(([x, y, width, height]) => {
            ctx.fillStyle = `${color}88`;
            ctx.beginPath();
            ctx.moveTo(x + 8, y);
            ctx.lineTo(x + width - 12, y + 8);
            ctx.lineTo(x + width, y + height - 10);
            ctx.lineTo(x + 12, y + height);
            ctx.closePath();
            ctx.fill();
        });
    }

    drawSecurityGrid(ctx, color) {
        ctx.save();
        ctx.strokeStyle = `${color}2f`;
        ctx.lineWidth = 1;
        for (let x = 40; x < this.canvas.width; x += 80) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 40; y < this.canvas.height; y += 80) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawSearchlightBands(ctx, color) {
        ctx.save();
        ctx.fillStyle = `${color}12`;
        ctx.beginPath();
        ctx.moveTo(64, 0);
        ctx.lineTo(216, 0);
        ctx.lineTo(388, this.canvas.height);
        ctx.lineTo(250, this.canvas.height);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(614, 0);
        ctx.lineTo(764, 0);
        ctx.lineTo(548, this.canvas.height);
        ctx.lineTo(412, this.canvas.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawManhattanSetDressing(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = 'rgba(18, 30, 45, 0.86)';
        [
            [56, 212, 78, 76], [360, 198, 92, 90], [612, 82, 68, 94],
            [86, 402, 86, 92], [602, 392, 78, 72], [678, 242, 52, 110]
        ].forEach(([x, y, width, height]) => {
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = 'rgba(64, 201, 255, 0.14)';
            ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
        });

        ctx.fillStyle = 'rgba(64, 201, 255, 0.18)';
        for (let y = 250; y < 560; y += 34) {
            ctx.fillRect(714, y, 54, 3);
            ctx.fillRect(734, y + 14, 42, 2);
        }

        ctx.fillStyle = 'rgba(252, 163, 17, 0.22)';
        ctx.fillRect(340, 238, 86, 10);
        ctx.fillRect(344, 252, 62, 8);
        ctx.fillStyle = '#fca311';
        ctx.font = '700 10px Segoe UI, sans-serif';
        ctx.fillText('STARK', 357, 247);

        ctx.fillStyle = 'rgba(230, 57, 70, 0.25)';
        ctx.fillRect(240, 92, 44, 8);
        ctx.fillRect(500, 492, 44, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
        ctx.fillText('5TH AVE', 42, 108);
        ctx.fillText('HUDSON', 710, 226);
        ctx.restore();
    }

    drawMissionLandmarkBadges(ctx) {
        const landmarks = this.currentLevel?.mission?.mechanic?.landmarks || [];
        if (!landmarks.length) return;

        ctx.save();
        landmarks.forEach((landmark) => {
            ctx.fillStyle = `${landmark.color || this.theme.decorLight}33`;
            ctx.strokeStyle = landmark.color || this.theme.decorLight;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(landmark.x, landmark.y, landmark.radius || 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            if (landmark.label) {
                ctx.fillStyle = landmark.color || this.theme.decorLight;
                ctx.font = '800 11px Segoe UI, sans-serif';
                ctx.fillText(landmark.label, landmark.x - 18, landmark.y + 4);
            }
        });
        ctx.restore();
    }

    drawLevelPathDetails(ctx) {
        if ((this.currentLevel?.theme?.id || 'new-york') !== 'new-york' || !this.path || this.path.length < 2) return;
        if (isPixelMapLevel(this.currentLevel)) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([18, 16]);
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let index = 1; index < this.path.length; index++) ctx.lineTo(this.path[index].x, this.path[index].y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
        [
            [272, 98, 6, 46], [282, 98, 6, 46], [292, 98, 6, 46],
            [502, 338, 6, 46], [512, 338, 6, 46], [522, 338, 6, 46],
            [500, 488, 48, 5], [500, 502, 48, 5]
        ].forEach(([x, y, width, height]) => ctx.fillRect(x, y, width, height));

        ctx.fillStyle = '#fca311';
        ctx.fillRect(146, 103, 20, 10);
        ctx.fillRect(586, 482, 20, 10);
        ctx.fillStyle = '#071018';
        ctx.font = '800 7px Segoe UI, sans-serif';
        ctx.fillText('TAXI', 148, 111);
        ctx.fillText('TAXI', 588, 490);
        ctx.restore();
    }

    drawTerrainTile(ctx, x, y, terrainType) {
        if (isPixelMapLevel(this.currentLevel)) {
            drawPixelTerrainTile(ctx, x, y, terrainType, this);
            return;
        }

        const px = x * this.gridSize;
        const py = y * this.gridSize;
        const size = this.gridSize;
        const colors = this.theme.terrain;

        ctx.fillStyle = colors[terrainType] || colors[1];
        ctx.fillRect(px, py, size, size);

        if (this.showGrid) {
            ctx.strokeStyle = this.theme.gridLine;
            ctx.strokeRect(px, py, size, size);
        }

        if (terrainType === 2) {
            ctx.fillStyle = this.theme.pathCenter;
            const horizontal = this.terrainMap[y]?.[x - 1] === 2 || this.terrainMap[y]?.[x + 1] === 2;
            const vertical = this.terrainMap[y - 1]?.[x] === 2 || this.terrainMap[y + 1]?.[x] === 2;

            if (horizontal || !vertical) ctx.fillRect(px, py + size * 0.42, size, size * 0.16);
            if (vertical) ctx.fillRect(px + size * 0.42, py, size * 0.16, size);

            ctx.fillStyle = this.theme.pathEdge;
            if (horizontal || !vertical) {
                ctx.fillRect(px, py, size, 3);
                ctx.fillRect(px, py + size - 3, size, 3);
            }
            if (vertical) {
                ctx.fillRect(px, py, 3, size);
                ctx.fillRect(px + size - 3, py, 3, size);
            }
            return;
        }

        if (terrainType === 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
            ctx.beginPath();
            ctx.moveTo(px + 4, py + size * 0.35);
            ctx.quadraticCurveTo(px + size * 0.35, py + size * 0.22, px + size - 4, py + size * 0.35);
            ctx.moveTo(px + 4, py + size * 0.65);
            ctx.quadraticCurveTo(px + size * 0.35, py + size * 0.52, px + size - 4, py + size * 0.65);
            ctx.stroke();
            return;
        }

        if (terrainType === 3) {
            ctx.fillStyle = this.theme.mountainMark;
            ctx.beginPath();
            ctx.moveTo(px + size * 0.18, py + size * 0.78);
            ctx.lineTo(px + size * 0.48, py + size * 0.2);
            ctx.lineTo(px + size * 0.82, py + size * 0.78);
            ctx.closePath();
            ctx.fill();
            return;
        }

        if (terrainType === 4 || terrainType === 11 || terrainType === 12) {
            ctx.fillStyle = terrainType === 4 ? this.theme.decorDark : this.theme.decorLight;
            const radius = terrainType === 4 ? 7 : 3;
            const points = terrainType === 4
                ? [[0.35, 0.38], [0.55, 0.48], [0.42, 0.65]]
                : [[0.25, 0.35], [0.68, 0.42], [0.45, 0.72]];
            points.forEach(([dx, dy]) => {
                ctx.beginPath();
                ctx.arc(px + size * dx, py + size * dy, radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    getLevelTheme() {
        const id = this.currentLevel?.theme?.id || 'new-york';
        const themes = {
            'new-york': {
                void: '#070b12',
                waterBand: true,
                terrain: {
                    0: '#1b5f7e',
                    1: '#27313f',
                    11: '#303b4d',
                    12: '#354457',
                    2: '#606977',
                    3: '#191f2b',
                    4: '#202938'
                },
                gridLine: 'rgba(255, 255, 255, 0.022)',
                pathCenter: 'rgba(255, 214, 102, 0.22)',
                pathEdge: 'rgba(10, 14, 22, 0.38)',
                pathGlow: 'rgba(64, 201, 255, 0.28)',
                pathStripe: 'rgba(255, 255, 255, 0.28)',
                mountainMark: 'rgba(255, 255, 255, 0.12)',
                decorLight: '#fca311',
                decorDark: '#4b5567'
            },
            avengers: {
                void: '#070b12',
                waterBand: false,
                terrain: {
                    0: '#23384f',
                    1: '#14243a',
                    11: '#1b3150',
                    12: '#203a5c',
                    2: '#47576d',
                    3: '#0d1624',
                    4: '#2d4059'
                },
                gridLine: 'rgba(64, 201, 255, 0.08)',
                pathCenter: 'rgba(64, 201, 255, 0.24)',
                pathEdge: 'rgba(252, 163, 17, 0.38)',
                pathGlow: 'rgba(252, 163, 17, 0.30)',
                pathStripe: 'rgba(64, 201, 255, 0.40)',
                mountainMark: 'rgba(252, 163, 17, 0.18)',
                decorLight: '#40c9ff',
                decorDark: '#fca311'
            },
            wakanda: {
                void: '#090c0a',
                waterBand: true,
                terrain: {
                    0: '#226c89',
                    1: '#2e5f35',
                    11: '#3b7441',
                    12: '#4b7f3f',
                    2: '#9b7346',
                    3: '#3f2d57',
                    4: '#174424'
                },
                gridLine: 'rgba(240, 214, 124, 0.08)',
                pathCenter: 'rgba(212, 175, 55, 0.28)',
                pathEdge: 'rgba(98, 55, 130, 0.45)',
                pathGlow: 'rgba(184, 101, 255, 0.30)',
                pathStripe: 'rgba(255, 222, 115, 0.45)',
                mountainMark: 'rgba(184, 101, 255, 0.24)',
                decorLight: '#d4af37',
                decorDark: '#5bd16f'
            },
            sanctum: {
                void: '#0d0808',
                waterBand: false,
                terrain: { 0: '#24334a', 1: '#4a2924', 11: '#5b3328', 12: '#6b3d2b', 2: '#71513c', 3: '#24131e', 4: '#35202c' },
                gridLine: 'rgba(255, 143, 61, 0.08)',
                pathCenter: 'rgba(255, 193, 105, 0.24)',
                pathEdge: 'rgba(184, 101, 255, 0.42)',
                pathGlow: 'rgba(255, 143, 61, 0.34)',
                pathStripe: 'rgba(255, 220, 156, 0.42)',
                mountainMark: 'rgba(184, 101, 255, 0.24)',
                decorLight: '#ff8f3d',
                decorDark: '#6d3e76'
            },
            'x-mansion': {
                void: '#071015',
                waterBand: false,
                terrain: { 0: '#285f7a', 1: '#326c48', 11: '#3d7c52', 12: '#4b8c59', 2: '#8b8e91', 3: '#39424d', 4: '#235538' },
                gridLine: 'rgba(244, 211, 94, 0.08)',
                pathCenter: 'rgba(244, 211, 94, 0.24)',
                pathEdge: 'rgba(32, 76, 122, 0.48)',
                pathGlow: 'rgba(244, 211, 94, 0.28)',
                pathStripe: 'rgba(255, 255, 255, 0.34)',
                mountainMark: 'rgba(244, 211, 94, 0.22)',
                decorLight: '#f4d35e',
                decorDark: '#245493'
            },
            knowhere: {
                void: '#05080d',
                waterBand: false,
                terrain: { 0: '#183f5e', 1: '#34343e', 11: '#42414a', 12: '#4c4b55', 2: '#71636d', 3: '#161923', 4: '#2a2632' },
                gridLine: 'rgba(255, 107, 214, 0.08)',
                pathCenter: 'rgba(64, 201, 255, 0.22)',
                pathEdge: 'rgba(255, 107, 214, 0.42)',
                pathGlow: 'rgba(255, 107, 214, 0.30)',
                pathStripe: 'rgba(64, 201, 255, 0.42)',
                mountainMark: 'rgba(255, 107, 214, 0.20)',
                decorLight: '#ff6bd6',
                decorDark: '#40c9ff'
            },
            latveria: {
                void: '#070a08',
                waterBand: false,
                terrain: { 0: '#233d4d', 1: '#35413a', 11: '#414d45', 12: '#4a584e', 2: '#60645d', 3: '#202720', 4: '#29342c' },
                gridLine: 'rgba(123, 224, 109, 0.07)',
                pathCenter: 'rgba(252, 163, 17, 0.22)',
                pathEdge: 'rgba(123, 224, 109, 0.38)',
                pathGlow: 'rgba(123, 224, 109, 0.28)',
                pathStripe: 'rgba(216, 223, 216, 0.34)',
                mountainMark: 'rgba(123, 224, 109, 0.18)',
                decorLight: '#7be06d',
                decorDark: '#8d6e3f'
            },
            asgard: {
                void: '#08070d', waterBand: false,
                terrain: { 0: '#284b70', 1: '#65512c', 11: '#796132', 12: '#8d7238', 2: '#c3a24b', 3: '#241c30', 4: '#4d3d23' },
                gridLine: 'rgba(255, 209, 102, 0.09)', pathCenter: 'rgba(255, 226, 138, 0.3)', pathEdge: 'rgba(101, 205, 255, 0.42)',
                pathGlow: 'rgba(101, 205, 255, 0.38)', pathStripe: 'rgba(255, 255, 255, 0.48)', mountainMark: 'rgba(255, 209, 102, 0.25)',
                decorLight: '#ffd166', decorDark: '#65cdff'
            },
            'dark-dimension': {
                void: '#09030d', waterBand: false,
                terrain: { 0: '#45206a', 1: '#32143e', 11: '#431b52', 12: '#582366', 2: '#6d2c68', 3: '#120819', 4: '#271030' },
                gridLine: 'rgba(255, 79, 163, 0.1)', pathCenter: 'rgba(255, 79, 163, 0.24)', pathEdge: 'rgba(139, 92, 255, 0.48)',
                pathGlow: 'rgba(255, 79, 163, 0.38)', pathStripe: 'rgba(255, 190, 229, 0.42)', mountainMark: 'rgba(139, 92, 255, 0.3)',
                decorLight: '#ff4fa3', decorDark: '#8b5cff'
            },
            'savage-land': {
                void: '#071008', waterBand: true,
                terrain: { 0: '#286b72', 1: '#285a2e', 11: '#34703a', 12: '#438746', 2: '#8f7744', 3: '#18351e', 4: '#1b4825' },
                gridLine: 'rgba(126, 224, 129, 0.08)', pathCenter: 'rgba(219, 190, 101, 0.25)', pathEdge: 'rgba(61, 112, 54, 0.5)',
                pathGlow: 'rgba(126, 224, 129, 0.32)', pathStripe: 'rgba(255, 225, 141, 0.38)', mountainMark: 'rgba(255, 209, 102, 0.22)',
                decorLight: '#7ee081', decorDark: '#8a4f32'
            },
            'the-raft': {
                void: '#04090d', waterBand: true,
                terrain: { 0: '#153f5c', 1: '#263844', 11: '#304754', 12: '#395562', 2: '#65737b', 3: '#101a21', 4: '#1d2b34' },
                gridLine: 'rgba(88, 214, 255, 0.09)', pathCenter: 'rgba(88, 214, 255, 0.22)', pathEdge: 'rgba(255, 107, 107, 0.4)',
                pathGlow: 'rgba(88, 214, 255, 0.34)', pathStripe: 'rgba(220, 242, 250, 0.42)', mountainMark: 'rgba(255, 209, 102, 0.2)',
                decorLight: '#58d6ff', decorDark: '#ff6b6b'
            }
        };

        return themes[id] || themes['new-york'];
    }
}
