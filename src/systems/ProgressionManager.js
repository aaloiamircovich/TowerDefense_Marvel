import { calculateHeroBonuses, getUpgradeNode } from '../data/HeroUpgradeCatalog.js';

const SAVE_KEY = 'tower-defense-marvel-save';
const SAVE_VERSION = 6;

function createMapProgress(progress = {}) {
    return {
        bestWave: Math.max(0, Number(progress.bestWave) || 0),
        stars: Math.max(0, Math.min(3, Number(progress.stars) || 0)),
        difficulty: ['easy', 'normal', 'hard'].includes(progress.difficulty) ? progress.difficulty : 'normal',
        challenges: [...new Set(progress.challenges || [])],
        missionObjectives: [...new Set(progress.missionObjectives || [])]
    };
}

function createDefaultState() {
    return {
        version: SAVE_VERSION,
        metaCredits: 1200,
        unlockedHeroIds: [],
        activeTeamIds: [],
        ownedItemIds: [],
        equippedItems: {},
        itemLevels: {},
        forgeMaterials: 0,
        loadouts: {},
        heroUpgrades: {},
        mapProgress: {},
        modeRecords: {},
        lastLevelId: 'level_1',
        shop: { rotationKey: '', slotIds: [], purchasedIds: [], heroPity: 0 },
        settings: {
            ranges: true,
            grid: true,
            audio: true,
            highContrast: false,
            reduceMotion: false,
            uiScale: 'normal',
            masterVolume: 0.7,
            musicVolume: 0.25,
            sfxVolume: 0.75
        }
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
        if (raw.version === SAVE_VERSION) {
            const defaults = createDefaultState();
            return {
                ...defaults,
                ...raw,
                shop: { ...defaults.shop, ...(raw.shop || {}) },
                settings: { ...defaults.settings, ...(raw.settings || {}) }
            };
        }

        const migrated = createDefaultState();
        migrated.metaCredits = raw.metaCredits ?? raw.credits ?? migrated.metaCredits;
        migrated.unlockedHeroIds = raw.unlockedHeroIds || raw.heroes || [];
        migrated.activeTeamIds = raw.activeTeamIds || raw.team || migrated.unlockedHeroIds.slice(0, 6);
        migrated.ownedItemIds = raw.ownedItemIds || raw.items || [];
        migrated.equippedItems = raw.equippedItems || {};
        migrated.itemLevels = raw.itemLevels || {};
        migrated.forgeMaterials = raw.forgeMaterials || 0;
        migrated.loadouts = raw.loadouts || {};
        migrated.heroUpgrades = raw.heroUpgrades || raw.upgrades || {};
        migrated.mapProgress = raw.mapProgress || raw.maps || {};
        migrated.modeRecords = raw.modeRecords || {};
        migrated.lastLevelId = raw.lastLevelId || 'level_1';
        migrated.shop = raw.shop || migrated.shop;
        migrated.settings = { ...migrated.settings, ...(raw.settings || {}) };
        return migrated;
    }

    sanitize() {
        const heroIds = new Set(Object.keys(this.data.heroes));
        const itemIds = new Set(Object.keys(this.data.items));
        const levelIds = new Set(this.data.levels.map((level) => level.id));
        this.state.unlockedHeroIds = [...new Set(this.state.unlockedHeroIds)].filter((id) => heroIds.has(id));
        this.state.activeTeamIds = [...new Set(this.state.activeTeamIds)]
            .filter((id) => this.state.unlockedHeroIds.includes(id)).slice(0, 6);
        this.state.ownedItemIds = (this.state.ownedItemIds || []).filter((id) => itemIds.has(id));
        Object.keys(this.state.equippedItems).forEach((heroId) => {
            if (!heroIds.has(heroId)) {
                delete this.state.equippedItems[heroId];
                return;
            }
            const rawSlots = this.state.equippedItems[heroId];
            const slots = typeof rawSlots === 'string'
                ? { [this.data.items[rawSlots]?.slot || 'artifact']: rawSlots }
                : { ...(rawSlots || {}) };
            this.state.equippedItems[heroId] = Object.fromEntries(Object.entries(slots)
                .filter(([slot, itemId]) => ['weapon', 'armor', 'artifact'].includes(slot)
                    && itemIds.has(itemId)
                    && this.data.items[itemId].slot === slot));
        });
        this.state.itemLevels = Object.fromEntries(Object.entries(this.state.itemLevels || {})
            .filter(([itemId]) => itemIds.has(itemId))
            .map(([itemId, level]) => [itemId, Math.max(1, Math.min(3, Number(level) || 1))]));
        this.state.forgeMaterials = Math.max(0, Math.floor(Number(this.state.forgeMaterials) || 0));
        this.state.loadouts = Object.fromEntries(Object.entries(this.state.loadouts || {})
            .filter(([heroId]) => heroIds.has(heroId))
            .map(([heroId, loadout]) => [heroId, {
                slots: Object.fromEntries(Object.entries(loadout?.slots || {})
                    .filter(([slot, itemId]) => ['weapon', 'armor', 'artifact'].includes(slot) && itemIds.has(itemId)))
            }]));
        if (!levelIds.has(this.state.lastLevelId)) this.state.lastLevelId = 'level_1';
        this.state.mapProgress = Object.fromEntries(Object.entries(this.state.mapProgress || {})
            .filter(([levelId]) => levelIds.has(levelId))
            .map(([levelId, progress]) => [levelId, createMapProgress(progress)]));
        const validModes = new Set(['daily', 'boss_rush', 'survival', 'draft', 'convoy']);
        this.state.modeRecords = Object.fromEntries(Object.entries(this.state.modeRecords || {})
            .filter(([modeId]) => validModes.has(modeId))
            .map(([modeId, record]) => [modeId, {
                bestScore: Math.max(0, Math.floor(Number(record?.bestScore) || 0)),
                bestWave: Math.max(0, Math.floor(Number(record?.bestWave) || 0)),
                lastResult: typeof record?.lastResult === 'string' ? record.lastResult : '',
                seedKey: typeof record?.seedKey === 'string' ? record.seedKey : ''
            }]));
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
        this.applySettings();
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
        const item = this.data.items[itemId];
        if (!item?.slot) return false;
        const slots = { ...(this.state.equippedItems[heroId] || {}) };
        const previous = slots[item.slot];
        this.removeOwnedItem(itemId);
        if (previous) this.state.ownedItemIds.push(previous);
        slots[item.slot] = itemId;
        this.state.equippedItems[heroId] = slots;
        this.save();
        this.syncGame();
        return true;
    }

    unequipItem(heroId, slot = null) {
        const slots = { ...(this.state.equippedItems[heroId] || {}) };
        const targetSlot = slot || Object.keys(slots)[0];
        const itemId = slots[targetSlot];
        if (!itemId) return false;
        this.state.ownedItemIds.push(itemId);
        delete slots[targetSlot];
        if (Object.keys(slots).length) this.state.equippedItems[heroId] = slots;
        else delete this.state.equippedItems[heroId];
        this.save();
        this.syncGame();
        return true;
    }

    applyEquippedItem(hero) {
        const slots = this.state.equippedItems[hero.id] || {};
        hero.items = Object.values(slots).map((itemId) => this.data.items[itemId]
            ? { ...this.data.items[itemId], forgeLevel: this.getItemLevel(itemId) }
            : null).filter(Boolean);
    }

    addOwnedItem(itemId) {
        if (!this.data.items[itemId]) return false;
        this.state.ownedItemIds.push(itemId);
        this.save();
        this.syncGame();
        return true;
    }

    hasItem(itemId) {
        return this.state.ownedItemIds.includes(itemId)
            || Object.values(this.state.equippedItems).some((slots) => Object.values(slots || {}).includes(itemId));
    }

    getOwnedQuantity(itemId) {
        return this.state.ownedItemIds.filter((id) => id === itemId).length;
    }

    removeOwnedItem(itemId) {
        const index = this.state.ownedItemIds.indexOf(itemId);
        if (index < 0) return false;
        this.state.ownedItemIds.splice(index, 1);
        return true;
    }

    getItemLevel(itemId) {
        return this.state.itemLevels[itemId] || 1;
    }

    getForgeCost(itemId) {
        const item = this.data.items[itemId];
        const level = this.getItemLevel(itemId);
        return item ? item.tier * level * 30 : Infinity;
    }

    salvageItem(itemId) {
        const item = this.data.items[itemId];
        if (!item || !this.removeOwnedItem(itemId)) return { ok: false, reason: 'No hay una copia disponible para reciclar' };
        const materials = item.tier * 20;
        this.state.forgeMaterials += materials;
        this.save();
        this.syncGame();
        return { ok: true, materials };
    }

    upgradeItem(itemId) {
        if (!this.hasItem(itemId)) return { ok: false, reason: 'Primero debes obtener el objeto' };
        const level = this.getItemLevel(itemId);
        if (level >= 3) return { ok: false, reason: 'El objeto ya alcanzó nivel 3' };
        const cost = this.getForgeCost(itemId);
        if (this.state.forgeMaterials < cost) return { ok: false, reason: `Necesitas ${cost} materiales` };
        this.state.forgeMaterials -= cost;
        this.state.itemLevels[itemId] = level + 1;
        this.save();
        this.syncGame();
        return { ok: true, level: level + 1, cost };
    }

    saveLoadout(heroId) {
        if (!this.state.unlockedHeroIds.includes(heroId)) return false;
        this.state.loadouts[heroId] = { slots: { ...(this.state.equippedItems[heroId] || {}) } };
        this.save();
        return true;
    }

    applyLoadout(heroId) {
        const target = this.state.loadouts[heroId]?.slots;
        if (!target) return { ok: false, reason: 'No hay un loadout guardado' };

        const current = { ...(this.state.equippedItems[heroId] || {}) };
        const available = [...this.state.ownedItemIds, ...Object.values(current)];
        for (const itemId of Object.values(target)) {
            const index = available.indexOf(itemId);
            if (index < 0) return { ok: false, reason: `Falta ${this.data.items[itemId]?.name || itemId}` };
            available.splice(index, 1);
        }

        this.state.ownedItemIds.push(...Object.values(current));
        Object.values(target).forEach((itemId) => this.removeOwnedItem(itemId));
        this.state.equippedItems[heroId] = { ...target };
        this.save();
        this.syncGame();
        return { ok: true };
    }

    recordWave(game, waveNumber) {
        const levelId = game.currentLevel?.id || 'level_1';
        const progress = createMapProgress(this.state.mapProgress[levelId]);
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
        return createMapProgress(this.state.mapProgress[levelId]);
    }

    recordModeScore(modeId, score, wave, result, seedKey = '') {
        const previous = this.state.modeRecords[modeId] || { bestScore: 0, bestWave: 0 };
        this.state.modeRecords[modeId] = {
            bestScore: Math.max(previous.bestScore || 0, Math.round(score || 0)),
            bestWave: Math.max(previous.bestWave || 0, Math.round(wave || 0)),
            lastResult: result,
            seedKey
        };
        this.save();
        return this.state.modeRecords[modeId];
    }

    getModeRecord(modeId) {
        return { bestScore: 0, bestWave: 0, lastResult: '', seedKey: '', ...(this.state.modeRecords[modeId] || {}) };
    }

    completeMissionObjective(levelId, objectiveId, reward) {
        const progress = this.getMapProgress(levelId);
        if (progress.missionObjectives.includes(objectiveId)) return false;
        progress.missionObjectives.push(objectiveId);
        this.state.mapProgress[levelId] = progress;
        this.addMetaCredits(reward);
        return true;
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
        if (['ranges', 'grid', 'audio', 'highContrast', 'reduceMotion'].includes(key)) {
            this.state.settings[key] = Boolean(value);
        } else if (['masterVolume', 'musicVolume', 'sfxVolume'].includes(key)) {
            this.state.settings[key] = Math.max(0, Math.min(1, Number(value) || 0));
        } else if (key === 'uiScale' && ['compact', 'normal', 'large'].includes(value)) {
            this.state.settings[key] = value;
        } else {
            return;
        }
        this.save();
        this.applySettings();
    }

    applySettings() {
        const settings = this.state.settings;
        this.game.showHeroRanges = settings.ranges;
        this.game.showGrid = settings.grid;
        this.game.audio?.setEnabled(settings.audio);
        this.game.audio?.setBusVolume?.('master', settings.masterVolume);
        this.game.audio?.setBusVolume?.('music', settings.musicVolume);
        this.game.audio?.setBusVolume?.('sfx', settings.sfxVolume);

        const documentRef = globalThis.document;
        if (!documentRef) return;
        documentRef.body.classList.toggle('high-contrast', settings.highContrast);
        documentRef.body.classList.toggle('reduce-motion', settings.reduceMotion);
        documentRef.body.dataset.uiScale = settings.uiScale;
    }
}

export { SAVE_KEY, SAVE_VERSION };
