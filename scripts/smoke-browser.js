import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = await getFreePort();
const server = spawn(process.execPath, ['dev-server.js'], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
});

let browser;
const consoleErrors = [];
const pageErrors = [];

try {
    await waitForServer(port);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    page.on('console', (message) => {
        if (message.type() !== 'error') return;
        const text = message.text();
        if (text.includes('Failed to load resource')) return;
        consoleErrors.push(text);
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.addInitScript(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('boot-screen').waitFor({ state: 'hidden', timeout: 20000 });

    const starterCards = page.locator('[data-testid^="starter-"]');
    if (await starterCards.first().isVisible().catch(() => false)) {
        await starterCards.first().click();
    }

    const placeButtons = page.locator('[data-testid^="hero-place-"]');
    await placeButtons.first().waitFor({ state: 'visible', timeout: 10000 });
    await placeButtons.first().click();

    const placement = await page.evaluate(findPlacementPoint);
    await page.getByTestId('game-canvas').click({ position: { x: placement.cssX, y: placement.cssY } });
    await page.waitForFunction(() => window.__SUPER_HERO_TD_GAME__?.heroes?.length === 1, null, { timeout: 5000 });

    await page.evaluate(() => { window.__SUPER_HERO_TD_GAME__.gameSpeed = 4; });
    await page.getByTestId('next-wave-btn').click();
    await page.waitForFunction(trackWaveAndPath, null, { timeout: 45000 });

    const summary = await page.evaluate(() => {
        const game = window.__SUPER_HERO_TD_GAME__;
        game?.waveManager?.announceSpawn?.(
            { name: 'Centinela', x: game.path?.[0]?.x || 0, y: game.path?.[0]?.y || 0, threat: 5 },
            { name: 'Centinela', threat: 5 }
        );
        const toastText = document.querySelector('[data-testid="toast"]')?.textContent || '';
        const effects = game?.vfx?.effects || [];
        const enemyIntelCards = [...document.querySelectorAll('[data-testid="wave-enemy-card"]')].map((card) => card.textContent || '');
        return {
            appState: document.body.dataset.appState,
            fatalVisible: Boolean(document.querySelector('.error-state')),
            heroes: game?.heroes?.length || 0,
            lives: game?.resourceManager?.lives || 0,
            credits: game?.resourceManager?.credits || 0,
            wave: game?.waveManager?.currentWave || 0,
            maxEnemyPathDistance: Math.round(window.__SMOKE_MAX_OFF_PATH || 0),
            floatingTextSeen: Number(window.__SMOKE_FLOATING_TEXT_COUNT || 0),
            threatToastVisible: toastText.includes('Elite en ruta: Centinela'),
            threatRingVisible: effects.some((effect) => effect.type === 'ring' && effect.radius === 58),
            threatTextVisible: effects.some((effect) => effect.type === 'floatingText' && effect.text === 'ELITE'),
            enemyIntelCards: enemyIntelCards.length,
            enemyIntelCounterSeen: enemyIntelCards.some((text) => /Perforacion|Deteccion|Control|Dano estable|Foco al soporte|Corta invocador/.test(text))
        };
    });

    const failures = [];
    if (summary.appState !== 'ready') failures.push(`estado de app inesperado: ${summary.appState}`);
    if (summary.fatalVisible) failures.push('modal fatal visible');
    if (summary.heroes !== 1) failures.push(`heroes desplegados esperados 1, recibidos ${summary.heroes}`);
    if (summary.wave < 2) failures.push(`la primera oleada no finalizo, oleada actual ${summary.wave}`);
    if (summary.lives <= 0) failures.push('la base quedo sin vidas durante smoke');
    if (summary.maxEnemyPathDistance > 38) failures.push(`enemigo fuera de ruta: ${summary.maxEnemyPathDistance}px`);
    if (summary.floatingTextSeen <= 0) failures.push('no se observaron textos flotantes de dano durante la oleada');
    if (!summary.threatToastVisible) failures.push('no se observo toast de amenaza elite');
    if (!summary.threatRingVisible) failures.push('no se observo anillo de amenaza elite');
    if (!summary.threatTextVisible) failures.push('no se observo texto flotante de amenaza elite');
    if (summary.enemyIntelCards <= 0) failures.push('no se observaron tarjetas de intel enemiga');
    if (!summary.enemyIntelCounterSeen) failures.push('no se observaron counters en tarjetas de intel enemiga');
    if (pageErrors.length) failures.push(`page errors: ${pageErrors.join(' | ')}`);
    if (consoleErrors.length) failures.push(`console errors: ${consoleErrors.join(' | ')}`);

    if (failures.length) {
        console.error('Smoke browser fallo:');
        failures.forEach((failure) => console.error(`- ${failure}`));
        process.exitCode = 1;
    } else {
        console.log(`Smoke browser OK: wave ${summary.wave}, vidas ${summary.lives}, desvio maximo ${summary.maxEnemyPathDistance}px, textos flotantes ${summary.floatingTextSeen}, alerta elite OK, intel enemiga ${summary.enemyIntelCards}.`);
    }
} finally {
    await browser?.close().catch(() => {});
    server.kill();
}

async function getFreePort() {
    return new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.once('error', reject);
        probe.listen(0, '127.0.0.1', () => {
            const address = probe.address();
            probe.close(() => resolve(address.port));
        });
    });
}

async function waitForServer(targetPort) {
    const started = Date.now();
    while (Date.now() - started < 10000) {
        const ready = await new Promise((resolve) => {
            const request = http.get(`http://127.0.0.1:${targetPort}/`, (response) => {
                response.resume();
                resolve(response.statusCode === 200);
            });
            request.on('error', () => resolve(false));
            request.setTimeout(400, () => {
                request.destroy();
                resolve(false);
            });
        });
        if (ready) return;
        await new Promise((resolve) => setTimeout(resolve, 120));
    }
    throw new Error('El servidor local no respondio para smoke browser.');
}

function findPlacementPoint() {
    const game = window.__SUPER_HERO_TD_GAME__;
    const hero = game?.inputManager?.placingHero || game?.activeTeam?.[0];
    if (!game || !hero) throw new Error('Juego no listo para ubicar heroe.');
    const distanceToCurrentPath = (point) => {
        let best = Infinity;
        for (let index = 0; index < game.path.length - 1; index++) {
            const start = game.path[index];
            const end = game.path[index + 1];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const lengthSquared = dx * dx + dy * dy || 1;
            const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
            const closestX = start.x + dx * t;
            const closestY = start.y + dy * t;
            best = Math.min(best, Math.hypot(point.x - closestX, point.y - closestY));
        }
        return best;
    };

    const allowed = new Set(hero.allowedTerrains || [1]);
    const range = hero.range || 120;
    for (let y = 1; y < game.terrainMap.length - 1; y++) {
        for (let x = 1; x < game.terrainMap[y].length - 1; x++) {
            const terrain = game.terrainMap[y][x];
            const placementTerrain = terrain === 4 || terrain === 11 || terrain === 12 ? 1 : terrain;
            if (!allowed.has(placementTerrain) || terrain === 2 || terrain === 5) continue;
            const centerX = x * game.gridSize + game.gridSize / 2;
            const centerY = y * game.gridSize + game.gridSize / 2;
            const distance = distanceToCurrentPath({ x: centerX, y: centerY });
            if (distance <= range && distance >= game.gridSize * 0.65) {
                const rect = game.canvas.getBoundingClientRect();
                return {
                    cssX: centerX * (rect.width / game.canvas.width),
                    cssY: centerY * (rect.height / game.canvas.height)
                };
            }
        }
    }
    throw new Error('No se encontro una celda valida para colocar heroe.');
}

function trackWaveAndPath() {
    const game = window.__SUPER_HERO_TD_GAME__;
    if (!game?.waveManager) return false;
    const distanceToCurrentPath = (point) => {
        let best = Infinity;
        for (let index = 0; index < game.path.length - 1; index++) {
            const start = game.path[index];
            const end = game.path[index + 1];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const lengthSquared = dx * dx + dy * dy || 1;
            const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
            const closestX = start.x + dx * t;
            const closestY = start.y + dy * t;
            best = Math.min(best, Math.hypot(point.x - closestX, point.y - closestY));
        }
        return best;
    };
    const distances = (game.enemies || []).map((enemy) => distanceToCurrentPath(enemy));
    const maxDistance = distances.length ? Math.max(...distances) : 0;
    window.__SMOKE_MAX_OFF_PATH = Math.max(window.__SMOKE_MAX_OFF_PATH || 0, maxDistance);
    const floatingTextCount = (game.vfx?.effects || []).filter((effect) => effect.type === 'floatingText').length;
    window.__SMOKE_FLOATING_TEXT_COUNT = Math.max(window.__SMOKE_FLOATING_TEXT_COUNT || 0, floatingTextCount);
    if (window.__SMOKE_MAX_OFF_PATH > 38) throw new Error(`Enemigo fuera de ruta: ${window.__SMOKE_MAX_OFF_PATH}px`);
    return game.waveManager.currentWave >= 2 && !game.waveManager.isWaveActive;
}

function distanceToPath(point, path) {
    if (!path || path.length < 2) return Infinity;
    let best = Infinity;
    for (let index = 0; index < path.length - 1; index++) {
        const start = path[index];
        const end = path[index + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
        const closestX = start.x + dx * t;
        const closestY = start.y + dy * t;
        best = Math.min(best, Math.hypot(point.x - closestX, point.y - closestY));
    }
    return best;
}
