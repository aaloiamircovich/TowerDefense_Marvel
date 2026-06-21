export class InputManager {
    constructor(canvas, gameInstance, uiManager, resourceManager) {
        this.canvas = canvas;
        this.game = gameInstance;
        this.uiManager = uiManager;
        this.resources = resourceManager;
        this.placingHero = null;
        this.mousePos = { x: 0, y: 0 };

        this.canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
        this.canvas.addEventListener('mousemove', (event) => this.updateMousePos(event));
        this.canvas.addEventListener('mouseleave', () => this.uiManager.setSelectionStatus('Elige un héroe y colócalo junto al camino.'));
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.clearPlacement();
        });
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
        this.placingHero = heroConfig;
        this.uiManager.setSelectionStatus(`Colocando ${heroConfig.name}. Coste: $${heroConfig.cost || 0}. Esc para cancelar.`);
    }

    clearPlacement() {
        this.placingHero = null;
        this.uiManager.setSelectionStatus('Elige un héroe y colócalo junto al camino.');
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

        const alreadyDeployed = this.game.heroes.some((hero) => hero.id === this.placingHero.id);
        if (alreadyDeployed) return { valid: false, message: `${this.placingHero.name} ya está desplegado.` };

        const occupied = this.game.heroes.some((hero) => {
            const dx = hero.x - (x * this.game.gridSize + this.game.gridSize / 2);
            const dy = hero.y - (y * this.game.gridSize + this.game.gridSize / 2);
            return Math.hypot(dx, dy) < this.game.gridSize * 0.8;
        });
        if (occupied) return { valid: false, message: 'Esa celda ya está ocupada.' };

        const cost = this.placingHero.cost || 0;
        if (this.resources.credits < cost) return { valid: false, message: `Créditos insuficientes. Necesitas $${cost}.` };

        return { valid: true, message: `${this.placingHero.name} listo. Clic para colocar por $${cost}.` };
    }

    placeHero() {
        if (!this.placingHero) return;

        const validation = this.getPlacementValidation();
        if (!validation.valid) {
            this.uiManager.showToast(validation.message, 'warning');
            this.clearPlacement();
            return;
        }

        const { x, y } = this.getGridPosition();
        const snapX = x * this.game.gridSize + this.game.gridSize / 2;
        const snapY = y * this.game.gridSize + this.game.gridSize / 2;
        const cost = this.placingHero.cost || 0;

        this.resources.removeCredits(cost);
        this.game.spawnHero(this.placingHero, snapX, snapY);
        this.uiManager.showToast(`${this.placingHero.name} desplegado`, 'success');
        this.uiManager.renderHeroRoster(this.game.activeTeam, (hero) => this.setPlacementMode(hero));
        this.clearPlacement();
    }

    checkUnitSelection(x, y) {
        const entities = [...this.game.enemies, ...this.game.heroes];
        const selectedUnit = entities.find((unit) => Math.hypot(x - unit.x, y - unit.y) <= 26);

        if (selectedUnit) {
            this.uiManager.inspectUnit(selectedUnit, selectedUnit.takeDamage !== undefined);
        }
    }

    draw(ctx) {
        if (!this.placingHero) return;

        const validation = this.getPlacementValidation();
        const { x, y } = this.getGridPosition();
        const px = x * this.game.gridSize;
        const py = y * this.game.gridSize;

        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = validation.valid ? '#46d369' : '#e63946';
        ctx.fillRect(px, py, this.game.gridSize, this.game.gridSize);

        ctx.globalAlpha = 1;
        ctx.strokeStyle = validation.valid ? 'rgba(70, 211, 105, 0.9)' : 'rgba(230, 57, 70, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, this.game.gridSize - 4, this.game.gridSize - 4);

        ctx.beginPath();
        ctx.arc(this.mousePos.x, this.mousePos.y, this.placingHero.range || 100, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.stroke();
        ctx.restore();
    }
}
