import {
    MANHATTAN_MANUAL_BLOCKED_TILES,
    MANHATTAN_MANUAL_ROAD_TILES,
    MANHATTAN_MANUAL_ROWS,
    MANHATTAN_MANUAL_TILE_IMAGES
} from './ManhattanManualMap.js';
import { getCachedImage } from './ImageCache.js';
import { TERRAIN } from '../utils/TerrainRules.js';

export { TERRAIN };

const MANHATTAN_TILES = [
    'BBBBBBSSSSSSSSBBBWBBBBBB',
    'BTTTTBSSPPPPSSBBBWWBBBBB',
    'BTTTTBSSPSSPSSSSSWWSSSSB',
    'SSSSSSSSPSSPBBBBSSWSSSSB',
    'SPPPPPPPPPSSBBBBSSWSSSSB',
    'SPSSSSSSSSSSSSSSSSWSSSSB',
    'SPSSBBBGGGGGGBBBSSWSSSSB',
    'SPSSBBBGGGGGGBBBSSWSSSSB',
    'SPSSSSSSPPPPPPPPPPPPSSSB',
    'SPPPPPSSPSSSSSSSSWSPSSSB',
    'SSSSPSSSPSSBBBBSSWSPSSSB',
    'BBBBPSSSPSSBBBBSSWSPSSSB',
    'SSSSPPPPPPSSSSSSSSSPSSSB',
    'SSSSSSSSSSSSBBSSSSSPSSSB',
    'BBBBBBBBSSSSBBSSWWWPPPPB',
    'BTTTTTTBSSSSSSSSWWWWSSSB',
    'BTTTTTTBSSPPPPPPPPPPSSSB',
    'BBBBBBBBSSPSSSSSSSSSSSSB',
    'BBBBBBBBSSPBBBBBBBBBBBBB'
];

const MANHATTAN_LEGEND = {
    W: TERRAIN.water,
    B: TERRAIN.blocked,
    T: TERRAIN.park,
    S: TERRAIN.sidewalk,
    P: TERRAIN.path,
    G: TERRAIN.grass
};

const IMAGE_MAP_LEGEND = {
    W: TERRAIN.water,
    G: TERRAIN.grass,
    S: TERRAIN.sidewalk,
    P: TERRAIN.path,
    M: TERRAIN.mountain,
    B: TERRAIN.blocked,
    X: TERRAIN.blocked
};

const TILESET_SRC = 'assets/images/tiles/kenney-modern-city.png?v=2';
const SOURCE_TILE = 16;
const SOURCE_MARGIN = 1;
const tilesetImage = typeof Image !== 'undefined'
    ? new Image()
    : { complete: false, naturalWidth: 0 };
if (typeof Image !== 'undefined') tilesetImage.src = TILESET_SRC;

const manualTileImages = {};
if (typeof Image !== 'undefined') {
    for (const [key, src] of Object.entries(MANHATTAN_MANUAL_TILE_IMAGES)) {
        const image = new Image();
        image.src = src;
        manualTileImages[key] = image;
    }
}

const SHEET = {
    sidewalk: [[0, 20], [1, 20], [2, 20], [3, 20], [4, 20]],
    street: [[8, 19], [9, 19], [10, 19], [8, 20], [10, 20], [12, 20]],
    building: [[8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [17, 0], [18, 0], [19, 0], [20, 0], [21, 0], [22, 0], [24, 0], [25, 0]],
    park: [[0, 24], [1, 24], [2, 24], [3, 24], [0, 25], [1, 25], [2, 25], [3, 25]],
    grass: [[8, 25], [9, 25], [10, 25], [11, 25], [12, 25], [13, 25]],
    water: [[24, 4], [25, 4], [26, 4], [24, 5], [25, 5], [26, 5]]
};

const PROPS = {
    treeGreen: [32, 9],
    treeDark: [34, 9],
    lamp: [5, 16],
    taxi: [32, 25],
    carGreen: [32, 18],
    carGray: [32, 21],
    van: [35, 18],
    bench: [20, 13],
    cone: [18, 18],
    trash: [13, 14],
    hydrant: [22, 16],
    door: [25, 17],
    window: [25, 14]
};

export function isPixelMapLevel(level) {
    return level?.rendering?.style === 'pixelart';
}

export function isImageMapLevel(level) {
    return level?.rendering?.style === 'image-map' && typeof level?.rendering?.image === 'string';
}

export function usesManualManhattanMap(level) {
    return level?.theme?.id === 'new-york' && level?.rendering?.source === 'manual-grid';
}

export function getManhattanTileId(x, y, cols = 25) {
    return y * cols + x + 1;
}

export function buildPixelTerrainMap(level, canvas, tileSize) {
    if (isImageMapLevel(level)) return buildImageTerrainMap(level, canvas, tileSize);

    const cols = Math.ceil(canvas.width / tileSize);
    const rows = Math.ceil(canvas.height / tileSize);
    if (usesManualManhattanMap(level)) {
        return MANHATTAN_MANUAL_ROWS.map((row) => row.map((tileKey) => getTerrainForManualTile(tileKey)));
    }

    const source = level?.theme?.id === 'new-york' ? MANHATTAN_TILES : [];
    const terrainMap = [];

    for (let y = 0; y < rows; y++) {
        const row = source[y] || '';
        terrainMap[y] = [];
        for (let x = 0; x < cols; x++) {
            terrainMap[y][x] = MANHATTAN_LEGEND[row[x]] ?? TERRAIN.grass;
        }
    }

    return terrainMap;
}

export function drawImageMapBackground(ctx, game) {
    if (!isImageMapLevel(game.currentLevel)) return false;
    const image = getCachedImage(game.currentLevel.rendering.image);
    const drawWidth = (game.terrainMap?.[0]?.length || 25) * game.gridSize;
    const drawHeight = (game.terrainMap?.length || 19) * game.gridSize;
    if (image?.complete && image.naturalWidth > 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0, drawWidth, drawHeight);
        ctx.restore();
    } else {
        ctx.fillStyle = game.theme?.terrain?.[TERRAIN.grass] || '#284a35';
        ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }

    if (game.showGrid) drawImageMapGrid(ctx, game);
    return true;
}

export function drawPixelTerrainTile(ctx, x, y, terrainType, game) {
    const size = game.gridSize;
    const px = x * size;
    const py = y * size;
    const theme = game.theme;

    const key = `${x},${y}`;
    const variant = ((x * 31 + y * 17) % 7) / 7;
    const manualTileKey = getManualTileKey(game.currentLevel, x, y);

    if (manualTileKey && drawManualTile(ctx, manualTileKey, px, py, size)) {
        drawManualTilePolish(ctx, manualTileKey, px, py, size, x, y, game.terrainMap);
        if (game.showGrid) {
            ctx.strokeStyle = theme.gridLine;
            ctx.strokeRect(px, py, size, size);
        }
        return;
    }

    if (tilesetReady()) {
        drawKenneyBaseTile(ctx, px, py, size, terrainType, x, y, game.terrainMap);
    } else {
        ctx.fillStyle = theme.terrain[terrainType] || theme.terrain[TERRAIN.grass];
        ctx.fillRect(px, py, size, size);
    }

    if (!tilesetReady()) {
        if (terrainType === TERRAIN.water) drawWater(ctx, px, py, size, variant);
        else if (terrainType === TERRAIN.path) drawStreet(ctx, px, py, size, game.terrainMap, x, y);
        else if (terrainType === TERRAIN.sidewalk) drawSidewalk(ctx, px, py, size, variant);
        else if (terrainType === TERRAIN.blocked) drawBuilding(ctx, px, py, size, variant);
        else if (terrainType === TERRAIN.park) drawTreeCanopy(ctx, px, py, size, variant);
        else if (terrainType === TERRAIN.grass) drawGrassLot(ctx, px, py, size, variant);
        else if (terrainType === TERRAIN.detail) drawStreetDetail(ctx, px, py, size);
    }

    if (tilesetReady()) drawCellProp(ctx, key, px, py, size);

    if (game.showGrid) {
        ctx.strokeStyle = theme.gridLine;
        ctx.strokeRect(px, py, size, size);
    }
}

export function drawPixelMapOverlays(ctx, game) {
    if (!isPixelMapLevel(game.currentLevel)) return;
    if (usesManualManhattanMap(game.currentLevel)) {
        if (isTilePlanModeEnabled()) drawTilePlanOverlay(ctx, game);
        return;
    }
    if (tilesetReady()) drawMarvelCityOverlays(ctx);
    else {
        drawHudsonRail(ctx);
        drawStarkTower(ctx);
        drawRooftopBlocks(ctx);
    }
    drawStreetLabels(ctx);
    if (!tilesetReady()) drawTinyVehicles(ctx);
    if (isTilePlanModeEnabled()) drawTilePlanOverlay(ctx, game);
}

function tilesetReady() {
    return tilesetImage.complete && tilesetImage.naturalWidth > 0;
}

function buildImageTerrainMap(level, canvas, tileSize) {
    const cols = Math.ceil(canvas.width / tileSize);
    const rows = Math.ceil(canvas.height / tileSize);
    const sourceRows = level.rendering.terrainRows || [];
    const terrainMap = [];

    for (let y = 0; y < rows; y++) {
        const row = sourceRows[y] || '';
        terrainMap[y] = [];
        for (let x = 0; x < cols; x++) {
            terrainMap[y][x] = IMAGE_MAP_LEGEND[row[x]] ?? TERRAIN.grass;
        }
    }

    return terrainMap;
}

function drawImageMapGrid(ctx, game) {
    const size = game.gridSize;
    const rows = game.terrainMap?.length || 0;
    const cols = game.terrainMap?.[0]?.length || 0;
    ctx.save();
    ctx.strokeStyle = game.theme?.gridLine || 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) ctx.strokeRect(x * size, y * size, size, size);
    }
    ctx.restore();
}

function getManualTileKey(level, x, y) {
    if (!usesManualManhattanMap(level)) return null;
    return MANHATTAN_MANUAL_ROWS[y]?.[x] || null;
}

function getTerrainForManualTile(tileKey) {
    if (MANHATTAN_MANUAL_ROAD_TILES.has(tileKey)) return TERRAIN.path;
    if (tileKey === 'water') return TERRAIN.water;
    if (tileKey === 'mountain') return TERRAIN.mountain;
    if (MANHATTAN_MANUAL_BLOCKED_TILES.has(tileKey)) {
        return TERRAIN.blocked;
    }
    return TERRAIN.grass;
}

function drawManualTile(ctx, tileKey, dx, dy, size) {
    const image = manualTileImages[tileKey];
    if (!image?.complete || image.naturalWidth <= 0) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, dx, dy, size, size);
    ctx.restore();
    return true;
}

function drawManualTilePolish(ctx, tileKey, px, py, size, x, y, map) {
    if (tileKey === 'water') return drawManualWaterPolish(ctx, px, py, size, x, y);
    if (MANHATTAN_MANUAL_ROAD_TILES.has(tileKey)) return drawManualRoadPolish(ctx, tileKey, px, py, size, x, y, map);
    if (tileKey === 'mountain') return drawManualMountainPolish(ctx, px, py, size, x, y);
    if (MANHATTAN_MANUAL_BLOCKED_TILES.has(tileKey)) return drawManualBuildingPolish(ctx, tileKey, px, py, size, x, y);
    return drawManualGroundPolish(ctx, tileKey, px, py, size, x, y);
}

function drawManualWaterPolish(ctx, px, py, size, x, y) {
    ctx.save();
    const shimmer = (x * 11 + y * 7) % 9;
    const gradient = ctx.createLinearGradient(px, py, px + size, py + size);
    gradient.addColorStop(0, 'rgba(19, 104, 149, 0.72)');
    gradient.addColorStop(1, 'rgba(23, 168, 206, 0.46)');
    ctx.fillStyle = gradient;
    ctx.fillRect(px, py, size, size);
    ctx.strokeStyle = 'rgba(196, 244, 255, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(px + 3, py + 9 + shimmer * 0.2);
    ctx.quadraticCurveTo(px + size * 0.45, py + 4, px + size - 3, py + 10);
    ctx.moveTo(px + 2, py + 22 - shimmer * 0.15);
    ctx.quadraticCurveTo(px + size * 0.48, py + 17, px + size - 2, py + 22);
    ctx.stroke();
    ctx.restore();
}

function drawManualRoadPolish(ctx, tileKey, px, py, size, x, y, map) {
    const hasLeft = map[y]?.[x - 1] === TERRAIN.path;
    const hasRight = map[y]?.[x + 1] === TERRAIN.path;
    const hasUp = map[y - 1]?.[x] === TERRAIN.path;
    const hasDown = map[y + 1]?.[x] === TERRAIN.path;
    const horizontal = hasLeft || hasRight || tileKey.includes('horizontal');
    const vertical = hasUp || hasDown || tileKey.includes('vertical');

    ctx.save();
    ctx.fillStyle = '#10151b';
    ctx.fillRect(px, py, size, size);
    ctx.fillStyle = '#1e252d';
    ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(px + 4, py + 5, size - 8, 1);
    ctx.fillRect(px + 4, py + size - 6, size - 8, 1);

    ctx.strokeStyle = 'rgba(255, 211, 77, 0.92)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    if (horizontal) {
        ctx.moveTo(px - 1, py + size / 2);
        ctx.lineTo(px + size + 1, py + size / 2);
    }
    if (vertical) {
        ctx.moveTo(px + size / 2, py - 1);
        ctx.lineTo(px + size / 2, py + size + 1);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(65, 182, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 2.5, py + 2.5, size - 5, size - 5);
    ctx.restore();
}

function drawManualMountainPolish(ctx, px, py, size, x, y) {
    ctx.save();
    const shade = (x + y) % 2 ? '#7e6d52' : '#6f614c';
    ctx.fillStyle = shade;
    ctx.fillRect(px, py, size, size);
    ctx.fillStyle = 'rgba(255, 241, 184, 0.22)';
    ctx.beginPath();
    ctx.moveTo(px + 4, py + size - 5);
    ctx.lineTo(px + size * 0.5, py + 6);
    ctx.lineTo(px + size - 4, py + size - 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(63, 47, 33, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + size - 7);
    ctx.lineTo(px + size * 0.5, py + 9);
    ctx.lineTo(px + size - 8, py + size - 7);
    ctx.stroke();
    ctx.restore();
}

function drawManualBuildingPolish(ctx, tileKey, px, py, size, x, y) {
    ctx.save();
    const base = tileKey.includes('center') ? '#5f6972' : '#707a82';
    const gradient = ctx.createLinearGradient(px, py, px + size, py + size);
    gradient.addColorStop(0, '#9ea7ad');
    gradient.addColorStop(0.52, base);
    gradient.addColorStop(1, '#3e474f');
    ctx.fillStyle = gradient;
    ctx.fillRect(px, py, size, size);
    ctx.strokeStyle = 'rgba(7, 12, 18, 0.52)';
    ctx.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
    ctx.fillStyle = 'rgba(213, 238, 255, 0.42)';
    const offset = (x + y) % 2 ? 5 : 8;
    ctx.fillRect(px + offset, py + 7, 4, 4);
    ctx.fillRect(px + size - offset - 4, py + 7, 4, 4);
    ctx.fillRect(px + offset, py + size - 12, 4, 4);
    ctx.restore();
}

function drawManualGroundPolish(ctx, tileKey, px, py, size, x, y) {
    ctx.save();
    const isForest = tileKey === 'forest';
    const isSidewalk = tileKey === 'sidewalk' || tileKey === 'detail';
    const seed = (x * 37 + y * 19) % 13;

    if (isSidewalk) {
        ctx.fillStyle = tileKey === 'detail' ? 'rgba(122, 132, 140, 0.76)' : 'rgba(139, 150, 156, 0.72)';
        ctx.fillRect(px, py, size, size);
        ctx.strokeStyle = 'rgba(74, 82, 90, 0.42)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py + size / 2);
        ctx.lineTo(px + size, py + size / 2);
        ctx.moveTo(px + size / 2, py);
        ctx.lineTo(px + size / 2, py + size);
        ctx.stroke();
        ctx.restore();
        return;
    }

    ctx.fillStyle = isForest ? 'rgba(36, 103, 51, 0.76)' : 'rgba(49, 132, 61, 0.62)';
    ctx.fillRect(px, py, size, size);
    ctx.fillStyle = 'rgba(130, 226, 113, 0.28)';
    ctx.fillRect(px + 5 + seed % 5, py + 8, 8, 2);
    ctx.fillRect(px + 16, py + 17 + seed % 4, 7, 2);
    if (isForest) {
        ctx.fillStyle = 'rgba(21, 72, 36, 0.76)';
        ctx.beginPath();
        ctx.arc(px + 10, py + 12, 7, 0, Math.PI * 2);
        ctx.arc(px + 21, py + 17, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function pickTile(group, x, y) {
    const entries = SHEET[group];
    return entries[(x * 5 + y * 3 + entries.length) % entries.length];
}

function drawSheetTile(ctx, coord, dx, dy, size, alpha = 1) {
    const [tileX, tileY] = coord;
    const sx = tileX * (SOURCE_TILE + SOURCE_MARGIN);
    const sy = tileY * (SOURCE_TILE + SOURCE_MARGIN);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tilesetImage, sx, sy, SOURCE_TILE, SOURCE_TILE, dx, dy, size, size);
    ctx.restore();
}

function drawKenneyBaseTile(ctx, px, py, size, terrainType, x, y, map) {
    if (terrainType === TERRAIN.water) {
        ctx.fillStyle = '#1d6f94';
        ctx.fillRect(px, py, size, size);
        ctx.strokeStyle = 'rgba(190, 237, 255, 0.52)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 9);
        ctx.lineTo(px + size - 4, py + 5);
        ctx.moveTo(px + 3, py + 21);
        ctx.lineTo(px + size - 4, py + 18);
        ctx.stroke();
        return;
    }

    if (terrainType === TERRAIN.path) {
        drawSheetTile(ctx, pickTile('street', x, y), px, py, size);
        drawStreetMarkings(ctx, px, py, size, map, x, y);
        return;
    }

    if (terrainType === TERRAIN.sidewalk) {
        drawSheetTile(ctx, pickTile('sidewalk', x, y), px, py, size);
        return;
    }

    if (terrainType === TERRAIN.blocked) {
        ctx.fillStyle = '#707981';
        ctx.fillRect(px, py, size, size);
        drawSheetTile(ctx, pickTile('building', x, y), px, py, size);
        return;
    }

    if (terrainType === TERRAIN.park) {
        drawSheetTile(ctx, pickTile('park', x, y), px, py, size);
        return;
    }

    if (terrainType === TERRAIN.grass) {
        drawSheetTile(ctx, pickTile('grass', x, y), px, py, size);
        return;
    }

    drawSheetTile(ctx, pickTile('sidewalk', x, y), px, py, size);
}

function drawStreetMarkings(ctx, px, py, size, map, x, y) {
    const horizontal = map[y]?.[x - 1] === TERRAIN.path || map[y]?.[x + 1] === TERRAIN.path;
    const vertical = map[y - 1]?.[x] === TERRAIN.path || map[y + 1]?.[x] === TERRAIN.path;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 224, 80, 0.84)';
    if (horizontal) ctx.fillRect(px + 6, py + size / 2 - 1, size - 12, 2);
    if (vertical) ctx.fillRect(px + size / 2 - 1, py + 6, 2, size - 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
    if (horizontal && !vertical && x % 3 === 0) ctx.fillRect(px + 10, py + size / 2 + 7, 12, 2);
    if (vertical && !horizontal && y % 3 === 0) ctx.fillRect(px + size / 2 + 7, py + 10, 2, 12);
    ctx.restore();
}

function drawCellProp(ctx, key, px, py, size) {
    const props = {
        '1,6': PROPS.treeGreen, '2,6': PROPS.treeDark, '3,6': PROPS.treeGreen,
        '4,6': PROPS.treeDark, '5,6': PROPS.treeGreen, '6,6': PROPS.treeDark,
        '1,15': PROPS.treeGreen, '2,15': PROPS.treeGreen, '3,15': PROPS.treeDark,
        '4,15': PROPS.treeGreen, '5,15': PROPS.treeDark, '6,15': PROPS.treeGreen,
        '12,8': PROPS.bench, '16,10': PROPS.lamp, '19,11': PROPS.hydrant,
        '4,4': PROPS.taxi, '16,8': PROPS.carGray, '23,16': PROPS.van,
        '7,13': PROPS.trash, '21,4': PROPS.cone, '22,4': PROPS.cone
    };
    const coord = props[key];
    if (!coord) return;
    drawSheetTile(ctx, coord, px, py, size);
}

function drawMarvelCityOverlays(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = 'rgba(9, 16, 28, 0.7)';
    ctx.fillRect(386, 70, 124, 86);
    ctx.strokeStyle = '#40c9ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(390, 74, 116, 78);
    ctx.fillStyle = '#8bdcff';
    for (let x = 400; x < 490; x += 18) {
        ctx.fillRect(x, 88, 9, 11);
        ctx.fillRect(x, 112, 9, 11);
    }
    ctx.fillStyle = '#fca311';
    ctx.font = '800 9px Segoe UI, sans-serif';
    ctx.fillText('STARK', 424, 145);

    ctx.fillStyle = 'rgba(18, 32, 48, 0.75)';
    ctx.fillRect(646, 90, 92, 72);
    ctx.strokeStyle = '#58d6ff';
    ctx.strokeRect(650, 94, 84, 64);
    ctx.fillStyle = '#d6dde6';
    ctx.fillRect(682, 112, 20, 20);
    ctx.fillStyle = '#234a7a';
    ctx.fillText('S.H.I.E.L.D.', 658, 153);

    ctx.restore();
}

function drawWater(ctx, px, py, size, variant) {
    ctx.fillStyle = variant > 0.5 ? '#216d90' : '#1b5f7e';
    ctx.fillRect(px, py, size, size);
    ctx.strokeStyle = 'rgba(188, 234, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 4, py + size * 0.35);
    ctx.lineTo(px + size * 0.42, py + size * 0.26);
    ctx.lineTo(px + size - 4, py + size * 0.36);
    ctx.moveTo(px + 3, py + size * 0.68);
    ctx.lineTo(px + size * 0.44, py + size * 0.58);
    ctx.lineTo(px + size - 3, py + size * 0.68);
    ctx.stroke();
}

function drawStreet(ctx, px, py, size, map, x, y) {
    const horizontal = map[y]?.[x - 1] === TERRAIN.path || map[y]?.[x + 1] === TERRAIN.path;
    const vertical = map[y - 1]?.[x] === TERRAIN.path || map[y + 1]?.[x] === TERRAIN.path;
    ctx.fillStyle = '#4f5965';
    ctx.fillRect(px, py, size, size);
    ctx.fillStyle = '#697482';
    ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
    ctx.fillStyle = '#d9c56f';
    if (horizontal) ctx.fillRect(px + 8, py + size / 2 - 1, size - 16, 2);
    if (vertical) ctx.fillRect(px + size / 2 - 1, py + 8, 2, size - 16);
}

function drawSidewalk(ctx, px, py, size, variant) {
    ctx.fillStyle = variant > 0.45 ? '#8a9298' : '#7e878d';
    ctx.fillRect(px, py, size, size);
    ctx.strokeStyle = '#626b72';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + size / 2);
    ctx.lineTo(px + size, py + size / 2);
    ctx.moveTo(px + size / 2, py);
    ctx.lineTo(px + size / 2, py + size);
    ctx.stroke();
}

function drawBuilding(ctx, px, py, size, variant) {
    ctx.fillStyle = variant > 0.55 ? '#202a36' : '#18212d';
    ctx.fillRect(px, py, size, size);
    ctx.fillStyle = '#2e3b4b';
    ctx.fillRect(px + 3, py + 3, size - 6, size - 6);
    ctx.fillStyle = '#4aa9d8';
    ctx.fillRect(px + 8, py + 7, 5, 5);
    ctx.fillRect(px + size - 13, py + 7, 5, 5);
    ctx.fillRect(px + 8, py + size - 13, 5, 5);
}

function drawTreeCanopy(ctx, px, py, size, variant) {
    ctx.fillStyle = variant > 0.5 ? '#28633a' : '#235834';
    ctx.fillRect(px, py, size, size);
    ctx.fillStyle = '#3c8a4e';
    ctx.beginPath();
    ctx.arc(px + size * 0.5, py + size * 0.42, size * 0.28, 0, Math.PI * 2);
    ctx.arc(px + size * 0.35, py + size * 0.58, size * 0.22, 0, Math.PI * 2);
    ctx.arc(px + size * 0.65, py + size * 0.58, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
}

function drawGrassLot(ctx, px, py, size, variant) {
    ctx.fillStyle = variant > 0.48 ? '#3f6e46' : '#37643f';
    ctx.fillRect(px, py, size, size);
    ctx.fillStyle = '#ca4461';
    ctx.fillRect(px + 8, py + 10, 3, 3);
    ctx.fillRect(px + 14, py + 16, 3, 3);
    ctx.fillStyle = '#66a85f';
    ctx.fillRect(px + size - 11, py + 9, 4, 8);
}

function drawStreetDetail(ctx, px, py, size) {
    ctx.fillStyle = '#697482';
    ctx.fillRect(px, py, size, size);
    ctx.fillStyle = '#f2c94c';
    ctx.fillRect(px + 5, py + size / 2 - 2, size - 10, 4);
    ctx.fillStyle = '#1d2734';
    ctx.fillRect(px + 4, py + 6, size - 8, 5);
}

function drawHudsonRail(ctx) {
    ctx.fillStyle = 'rgba(10, 18, 28, 0.55)';
    ctx.fillRect(570, 0, 10, 600);
    ctx.fillRect(612, 0, 10, 600);
}

function drawStarkTower(ctx) {
    ctx.save();
    ctx.fillStyle = '#243348';
    ctx.fillRect(384, 70, 116, 92);
    ctx.fillStyle = '#315071';
    ctx.fillRect(396, 82, 92, 68);
    ctx.fillStyle = '#87d7ff';
    for (let x = 406; x < 480; x += 18) {
        ctx.fillRect(x, 94, 10, 12);
        ctx.fillRect(x, 118, 10, 12);
    }
    ctx.fillStyle = '#fca311';
    ctx.font = '800 10px Segoe UI, sans-serif';
    ctx.fillText('STARK', 420, 155);
    ctx.restore();
}

function drawRooftopBlocks(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(16, 24, 34, 0.72)';
    [[96, 322, 96, 76], [480, 342, 82, 82], [646, 84, 92, 74]].forEach(([x, y, width, height]) => {
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#33475f';
        ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
    });
    ctx.restore();
}

function drawStreetLabels(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
    ctx.font = '800 9px Segoe UI, sans-serif';
    ctx.fillText('5TH AVE', 48, 134);
    ctx.fillText('HUDSON', 632, 438);
    ctx.fillText('STARK RELIEF ROUTE', 232, 276);
    ctx.restore();
}

function drawTinyVehicles(ctx) {
    ctx.save();
    drawTaxi(ctx, 130, 126);
    drawTaxi(ctx, 520, 286);
    drawShieldVan(ctx, 680, 512);
    ctx.restore();
}

function isTilePlanModeEnabled() {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.has('tilePlan');
}

function drawTilePlanOverlay(ctx, game) {
    const size = game.gridSize || 32;
    const rows = game.terrainMap?.length || 0;
    const cols = game.terrainMap?.[0]?.length || 0;
    if (!rows || !cols) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 8px Consolas, monospace';
    ctx.lineWidth = 1;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const px = x * size;
            const py = y * size;
            const id = getManhattanTileId(x, y, cols);
            ctx.fillStyle = 'rgba(3, 7, 12, 0.56)';
            ctx.fillRect(px + 1, py + 1, size - 2, 12);
            ctx.strokeStyle = 'rgba(255, 214, 102, 0.68)';
            ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
            ctx.fillStyle = '#ffe082';
            ctx.fillText(String(id).padStart(3, '0'), px + size / 2, py + 7);
        }
    }

    ctx.fillStyle = 'rgba(3, 7, 12, 0.78)';
    ctx.fillRect(8, 8, 188, 30);
    ctx.strokeStyle = '#40c9ff';
    ctx.strokeRect(8.5, 8.5, 187, 29);
    ctx.fillStyle = '#d7f4ff';
    ctx.font = '800 10px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PLAN DE TILES: cuadro 001-475', 16, 20);
    ctx.fillText('Orden: izquierda a derecha, fila por fila', 16, 32);
    ctx.restore();
}

function drawTaxi(ctx, x, y) {
    ctx.fillStyle = '#f2c94c';
    ctx.fillRect(x, y, 24, 12);
    ctx.fillStyle = '#111923';
    ctx.fillRect(x + 4, y + 3, 6, 4);
    ctx.fillRect(x + 14, y + 3, 6, 4);
}

function drawShieldVan(ctx, x, y) {
    ctx.fillStyle = '#d6dde6';
    ctx.fillRect(x, y, 28, 14);
    ctx.fillStyle = '#234a7a';
    ctx.fillRect(x + 5, y + 3, 8, 5);
    ctx.fillRect(x + 16, y + 3, 7, 5);
}
