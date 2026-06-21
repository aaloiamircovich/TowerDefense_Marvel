import { Hero } from '../entities/Hero.js';
import { RandomSource } from '../utils/Random.js';

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

        this.waveManager = null;
        this.uiManager = null;
        this.resourceManager = null;
        this.inputManager = null;

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
        this.heroes.push(new Hero(config, x, y, this));
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
        this.pause();
        if (this.uiManager) this.uiManager.showGameOver();
    }

    loop(timestamp) {
        this.deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;

        if (this.isRunning && !this.isManuallyPaused && !this.isGameOver) {
            this.fps = 1 / this.deltaTime;
            this.update(this.deltaTime * this.gameSpeed);
        }

        this.render(this.ctx);
        requestAnimationFrame((time) => this.loop(time));
    }

    update(dt) {
        if (this.waveManager) this.waveManager.update(dt);

        this.enemies.forEach((enemy) => {
            enemy.update(dt);
            if (enemy.hasReachedEnd && !enemy.processed) {
                this.resourceManager.removeLife(enemy.isBoss ? 3 : 1);
                enemy.processed = true;
            }
        });

        this.heroes.forEach((hero) => hero.update(dt, this.enemies, this.projectiles));
        this.projectiles.forEach((projectile) => projectile.update(dt));

        this.enemies = this.enemies.filter((enemy) => {
            if (!enemy.isAlive && !enemy.hasReachedEnd && !enemy.rewarded) {
                this.resourceManager.addCredits(enemy.reward || enemy.config.reward || 10);
                enemy.rewarded = true;
            }
            return enemy.isAlive && !enemy.hasReachedEnd;
        });

        this.projectiles = this.projectiles.filter((projectile) => projectile.isActive);

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

        this.drawPathGuide(ctx);
        this.enemies.forEach((enemy) => enemy.render(ctx));
        this.heroes.forEach((hero) => hero.render(ctx));
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
            }
        };

        return themes[id] || themes['new-york'];
    }
}
