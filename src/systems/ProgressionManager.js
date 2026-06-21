import { calculateHeroBonuses, getUpgradeNode } from '../data/HeroUpgradeCatalog.js';

const SAVE_KEY = 'tower-defense-marvel-save';
const SAVE_VERSION = 2;

function createDefaultState() {
    return {
        version: SAVE_VERSION,
        metaCredits: 1200,
        unlockedHeroIds: [],
        activeTeamIds: [],
        ownedItemIds: [],
        equippedItems: {},
        heroUpgrades: {},
        mapProgress: {},
        lastLevelId: 'level_1',
        shop: { rotationKey: '', slotIds: [], purchasedIds: [], heroPity: 0 },
        settings: { ranges: true, grid: true, audio: true }
    };
}

export class ProgressionManager {
    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
        this.state = createDefaultState();
        this.game = null;
        this.data = null;
    }

    initialize(game, data) {
        this.game = game;
        this.data = data;
        this.state = this.load();
        this.sanitize();
        this.syncGame();
        return this.state;
    }

    load() {
        try {
            const raw = this.storage?.getItem(SAVE_KEY);
            return raw ? ProgressionManager.migrate(JSON.parse(raw)) : createDefaultState();
        } catch {
            return createDefaultState();
        }
    }

    static migrate(raw) {
        if (!raw || typeof raw !== 'object') return createDefaultState();
        if (raw.version === SAVE_VERSION) return { ...createDefaultState(), ...raw };

        const migrated = createDefaultState();
        migrated.metaCredits = raw.metaCredits ?? raw.credits ?? migrated.metaCredits;
        migrated.unlockedHeroIds = raw.unlockedHeroIds || raw.heroes || [];
        migrated.activeTeamIds = raw.activeTeamIds || raw.team || migrated.unlockedHeroIds.slice(0, 6);
        migrated.ownedItemIds = raw.ownedItemIds || raw.items || [];
        migrated.equippedItems = raw.equippedItems || {};
        migrated.heroUpgrades = raw.heroUpgrades || raw.upgrades || {};
        migrated.mapProgress = raw.mapProgress || raw.maps || {};
        migrated.lastLevelId = raw.lastLevelId || 'level_1';
        return migrated;
    }

    sanitize() {
        const heroIds = new Set(Object.keys(this.data.heroes));
        const itemIds = new Set(Object.keys(this.data.items));
        const levelIds = new Set(this.data.levels.map((level) => level.id));
        this.state.unlockedHeroIds = [...new Set(this.state.unlockedHeroIds)].filter((id) => heroIds.has(id));
        this.state.activeTeamIds = [...new Set(this.state.activeTeamIds)]
            .filter((id) => this.state.unlockedHeroIds.includes(id)).slice(0, 6);
        this.state.ownedItemIds = [...new Set(this.state.ownedItemIds)].filter((id) => itemIds.has(id));
        Object.keys(this.state.equippedItems).forEach((heroId) => {
            const itemId = this.state.equippedItems[heroId];
            if (!heroIds.has(heroId) || !itemIds.has(itemId)) delete this.state.equippedItems[heroId];
        });
        if (!levelIds.has(this.state.lastLevelId)) this.state.lastLevelId = 'level_1';
        this.state.metaCredits = Math.max(0, Number(this.state.metaCredits) || 0);
        this.save();
    }

    syncGame() {
        if (!this.game) return;
        this.game.unlockedHeroes = this.state.unlockedHeroIds.map((id) => this.data.heroes[id]).filter(Boolean);
        this.game.activeTeam = this.state.activeTeamIds.map((id) => this.data.heroes[id]).filter(Boolean);
        this.game.ownedItems = this.state.ownedItemIds.map((id) => ({ ...this.data.items[id] })).filter(Boolean);
        this.game.showHeroRanges = this.state.settings.ranges;
        this.game.showGrid = this.state.settings.grid;
        this.game.audio?.setEnabled(this.state.settings.audio);
        this.game.stars = this.getTotalStars();
        this.game.heroes?.forEach((hero) => this.applyEquippedItem(hero));
    }

    save() {
        try {
            this.storage?.setItem(SAVE_KEY, JSON.stringify(this.state));
            return true;
        } catch {
            return false;
        }
    }

    startProfile(heroId) {
        if (!this.data.heroes[heroId]) return false;
        this.state.unlockedHeroIds = [heroId];
        this.state.activeTeamIds = [heroId];
        this.save();
        this.syncGame();
        return true;
    }

    spendMetaCredits(amount) {
        if (!Number.isFinite(amount) || amount <= 0 || this.state.metaCredits < amount) return false;
        this.state.metaCredits -= amount;
        this.save();
        return true;
    }

    addMetaCredits(amount) {
        if (!Number.isFinite(amount) || amount <= 0) return;
        this.state.metaCredits += Math.round(amount);
        this.save();
    }

    unlockHero(heroId) {
        if (this.state.unlockedHeroIds.includes(heroId) || !this.data.heroes[heroId]) return false;
        this.state.unlockedHeroIds.push(heroId);
        if (this.state.activeTeamIds.length < 6) this.state.activeTeamIds.push(heroId);
        this.save();
        this.syncGame();
        return true;
    }

    setActiveTeam(heroIds) {
        this.state.activeTeamIds = [...new Set(heroIds)]
            .filter((id) => this.state.unlockedHeroIds.includes(id)).slice(0, 6);
        this.save();
        this.syncGame();
    }

    purchaseUpgrade(hero, nodeId) {
        const node = getUpgradeNode(hero, nodeId);
        if (!node) return { ok: false, reason: 'Mejora inexistente' };
        const purchased = this.state.heroUpgrades[hero.id] || [];
        if (purchased.includes(nodeId)) return { ok: false, reason: 'Mejora ya adquirida' };
        if (node.requires && !purchased.includes(node.requires)) return { ok: false, reason: 'Compra primero el nodo anterior' };
        if (!this.spendMetaCredits(node.cost)) return { ok: false, reason: 'Fondos S.H.I.E.L.D. insuficientes' };
        this.state.heroUpgrades[hero.id] = [...purchased, nodeId];
        this.save();
        return { ok: true, node };
    }

    getHeroBonuses(heroId) {
        const hero = this.data?.heroes?.[heroId] || { id: heroId };
        return calculateHeroBonuses(hero, this.state.heroUpgrades[heroId] || []);
    }

    equipItem(heroId, itemId) {
        if (!this.state.ownedItemIds.includes(itemId) || !this.state.unlockedHeroIds.includes(heroId)) return false;
        const previous = this.state.equippedItems[heroId];
        this.state.ownedItemIds = this.state.ownedItemIds.filter((id) => id !== itemId);
        if (previous) this.state.ownedItemIds.push(previous);
        this.state.equippedItems[heroId] = itemId;
        this.save();
        this.syncGame();
        return true;
    }

    unequipItem(heroId) {
        const itemId = this.state.equippedItems[heroId];
        if (!itemId) return false;
        this.state.ownedItemIds.push(itemId);
        delete this.state.equippedItems[heroId];
        this.save();
        this.syncGame();
        return true;
    }

    applyEquippedItem(hero) {
        const itemId = this.state.equippedItems[hero.id];
        hero.items = itemId && this.data.items[itemId] ? [{ ...this.data.items[itemId] }] : [];
    }

    addOwnedItem(itemId) {
        if (!this.data.items[itemId] || this.hasItem(itemId)) return false;
        this.state.ownedItemIds.push(itemId);
        this.save();
        this.syncGame();
        return true;
    }

    hasItem(itemId) {
        return this.state.ownedItemIds.includes(itemId) || Object.values(this.state.equippedItems).includes(itemId);
    }

    recordWave(game, waveNumber) {
        const levelId = game.currentLevel?.id || 'level_1';
        const progress = this.state.mapProgress[levelId] || {
            bestWave: 0, stars: 0, difficulty: 'normal', challenges: []
        };
        progress.bestWave = Math.max(progress.bestWave, waveNumber);
        progress.stars = Math.max(progress.stars, waveNumber >= 50 ? 3 : waveNumber >= 20 ? 2 : waveNumber >= 5 ? 1 : 0);
        if (waveNumber >= 5 && game.resourceManager.lives === game.resourceManager.maxLives) {
            progress.challenges = [...new Set([...progress.challenges, 'sin_danos'])];
        }
        if (waveNumber % 10 === 0) progress.challenges = [...new Set([...progress.challenges, 'cazajefes'])];
        const reward = 18 + waveNumber * 3 + (waveNumber % 10 === 0 ? 100 : 0);
        this.state.mapProgress[levelId] = progress;
        this.addMetaCredits(reward);
        game.stars = this.getTotalStars();
        return reward;
    }

    getMapProgress(levelId) {
        return this.state.mapProgress[levelId] || { bestWave: 0, stars: 0, difficulty: 'normal', challenges: [] };
    }

    setDifficulty(levelId, difficulty) {
        if (!['easy', 'normal', 'hard'].includes(difficulty)) return false;
        const progress = this.getMapProgress(levelId);
        this.state.mapProgress[levelId] = { ...progress, difficulty };
        this.save();
        return true;
    }

    getTotalStars() {
        return Object.values(this.state.mapProgress).reduce((total, progress) => total + (progress.stars || 0), 0);
    }

    updateSetting(key, value) {
        if (!(key in this.state.settings)) return;
        this.state.settings[key] = Boolean(value);
        this.save();
    }
}

export { SAVE_KEY, SAVE_VERSION };
