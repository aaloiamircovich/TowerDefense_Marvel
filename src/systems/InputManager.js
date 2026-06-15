export class InputManager {
    constructor(game) {
        this.game = game;
        this.placementMode = null;
        this.mouseX = 0; 
        this.mouseY = 0;
        
        this.hasMoved = false; // Solución Opción 3: Evitar parpadeo en (0,0)
        this.game.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.game.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
    }

    setPlacementMode(heroConfig) {
        this.placementMode = heroConfig;
    }

    getCanvasCoordinates(e) {
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        
        // Resolución lógica del juego vs tamaño físico del elemento
        const cw = canvas.width;
        const ch = canvas.height;
        const rw = rect.width;
        const rh = rect.height;
        
        const canvasRatio = cw / ch;
        const rectRatio = rw / rh;
        
        let displayW, displayH, offsetX = 0, offsetY = 0;
        
        // Cálculo de barras negras (letterboxing/pillarboxing) por object-fit: contain
        if (rectRatio > canvasRatio) {
            displayH = rh;
            displayW = displayH * canvasRatio;
            offsetX = (rw - displayW) / 2;
        } else {
            displayW = rw;
            displayH = displayW / canvasRatio;
            offsetY = (rh - displayH) / 2;
        }
        
        // Coordenadas finales escaladas con precisión decimal
        const x = (e.clientX - rect.left - offsetX) * (cw / displayW);
        const y = (e.clientY - rect.top - offsetY) * (ch / displayH);

        return { x, y };
    }

    handleMove(e) {
        this.hasMoved = true;
        const coords = this.getCanvasCoordinates(e);
        this.mouseX = coords.x;
        this.mouseY = coords.y;
    }

    isPlacementValid(x, y, heroConfig) {
        const gridX = Math.floor(x / this.game.gridSize);
        const gridY = Math.floor(y / this.game.gridSize);
        
        const terrain = (this.game.terrainMap[gridY] && this.game.terrainMap[gridY][gridX] !== undefined) 
            ? this.game.terrainMap[gridY][gridX] 
            : null;
        
        if (terrain === null) return false;

        let allowed = [...(heroConfig.allowedTerrains || [1])];
        if (heroConfig.items && heroConfig.items.some(it => it.id === 'aerodeslizador')) {
            if (!allowed.includes(0)) allowed.push(0); // Permitir agua
        }
        if (heroConfig.items && heroConfig.items.some(it => it.id === 'jetpack_harness')) {
            return true; // Arnés permite colocar en CUALQUIER sitio
        }

        // Verificar si el terreno es válido
        if (!allowed.includes(terrain)) return false;

        // Verificar si la celda ya está ocupada por otro héroe
        const centerX = gridX * this.game.gridSize + this.game.gridSize / 2;
        const centerY = gridY * this.game.gridSize + this.game.gridSize / 2;
        const isOccupied = this.game.heroes.some(h => h.x === centerX && h.y === centerY);

        return !isOccupied;
    }

    handleClick(e) {
        const coords = this.getCanvasCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        if (this.placementMode) {
            if (this.isPlacementValid(x, y, this.placementMode)) {
                const gridX = Math.floor(x / this.game.gridSize);
                const gridY = Math.floor(y / this.game.gridSize);
                const centerX = gridX * this.game.gridSize + this.game.gridSize / 2;
                const centerY = gridY * this.game.gridSize + this.game.gridSize / 2;
                this.game.spawnHero(this.placementMode, centerX, centerY);
                this.placementMode = null; 
            } else {
                alert("Terreno inválido para este héroe.");
            }
        } else {
            // Primero verificar si tocamos a un héroe para inspeccionarlo/gestionarlo
            let clickedHero = this.game.heroes.find(h => Math.hypot(h.x - x, h.y - y) <= h.size / 2);
            
            if (clickedHero) {
                this.game.uiManager.inspectUnit(clickedHero);
            } else {
                // Si no hay héroe, buscar enemigos
                let clickedEnemy = this.game.enemies.find(en => Math.hypot(en.x - x, en.y - y) <= en.size / 2);
                if (clickedEnemy) this.game.uiManager.inspectUnit(clickedEnemy, true);
            }
        }
    }

    draw(ctx) {
        // Solo dibujar si estamos en placementMode Y el mouse ya entró al canvas (hasMoved)
        if (this.placementMode && this.hasMoved) {
            const isValid = this.isPlacementValid(this.mouseX, this.mouseY, this.placementMode);
            
            ctx.fillStyle = isValid ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.4)';
            const gridX = Math.floor(this.mouseX / this.game.gridSize) * this.game.gridSize;
            const gridY = Math.floor(this.mouseY / this.game.gridSize) * this.game.gridSize;
            ctx.fillRect(gridX, gridY, this.game.gridSize, this.game.gridSize);
            
            ctx.beginPath();
            ctx.arc(gridX + this.game.gridSize/2, gridY + this.game.gridSize/2, this.placementMode.range || 100, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();
            ctx.strokeStyle = isValid ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 0, 0, 0.5)';
            ctx.stroke();
        }
    }
}