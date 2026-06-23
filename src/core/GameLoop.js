import { Hero } from '../entities/Hero.js';
import { Enemy } from '../entities/Enemy.js';
import { RandomSource } from '../utils/Random.js';
import { CombatVfx } from '../rendering/CombatVfx.js';
import { AudioManager } from '../audio/AudioManager.js';
import { Projectile } from '../entities/Projectile.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { PerformanceMonitor } from '../systems/PerformanceMonitor.js';
import { TeamSynergySystem } from '../systems/TeamSynergySystem.js';

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
        return hero;
    }

    spawnEnemy(config, source = null) {
        const enemy = new Enemy(config, this.path, this);
        if (source) enemy.copyPathPosition(source, 24);
        this.enemies.push(enemy);
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
            this.enemies.length + this.projectiles.length + this.vfx.effects.length
        );
        if (performanceSnapshot) this.uiManager?.updatePerformance(performanceSnapshot, this.projectilePool.getStats());

        this.render(this.ctx);
        requestAnimationFrame((time) => this.loop(time));
    }

    update(dt) {
        if (this.waveManager) this.waveManager.update(dt);
        this.missionSystem?.update(dt);
        this.modeSystem?.update(dt);

        this.enemies.forEach((enemy) => {
            enemy.update(dt);
            if (enemy.hasReachedEnd && !enemy.processed) {
                const missionAbsorbed = this.missionSystem?.handleLeak(enemy) || false;
                const modeAbsorbed = this.modeSystem?.handleLeak(enemy) || false;
                if (!missionAbsorbed && !modeAbsorbed) this.resourceManager.removeLife(enemy.isBoss ? 3 : 1);
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
        }
    }

    render(ctx) {
        ctx.fillStyle = this.theme.void;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.terrainMap.length; y++) {
            for (let x = 0; x < this.terrainMap[y].length; x++) {
                const terrainType = this.terrainMap[y][x];
                this.drawTerrainTile(ctx, x, y, terrainType);
            }
        }

        this.missionSystem?.render(ctx);
        this.modeSystem?.render(ctx);
        this.drawPathGuide(ctx);
        this.enemies.forEach((enemy) => enemy.render(ctx));
        this.vfx.render(ctx);
        this.heroes.forEach((hero) => hero.render(ctx));
        this.heroes.forEach((hero) => this.teamSynergy.renderFormationRadius(ctx, hero));
        this.projectiles.forEach((projectile) => projectile.render(ctx));
        if (this.inputManager) this.inputManager.draw(ctx);
    }

    drawPathGuide(ctx) {
        if (!this.path || this.path.length < 2) return;
        ctx.save();
        ctx.strokeStyle = this.theme.pathGlow;
        ctx.lineWidth = 7;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();

        ctx.strokeStyle = this.theme.pathStripe;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 12]);
        ctx.stroke();
        ctx.restore();
    }

    drawTerrainTile(ctx, x, y, terrainType) {
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
                gridLine: 'rgba(255, 255, 255, 0.055)',
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
