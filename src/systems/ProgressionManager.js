import { calculateHeroBonuses, getUpgradeNode } from '../data/HeroUpgradeCatalog.js';
import { EVOLUTION_CATALOG, getEvolutionForHero } from './EvolutionSystem.js';
import { CODEX_MECHANICS, completedMasteryChallenges, createCodexSnapshot } from './MasteryCodexSystem.js';

const SAVE_KEY = 'tower-defense-marvel-save';
const SAVE_VERSION = 7;

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
        selectedEvolutions: {},
        heroMastery: {},
        codexDiscovered: { heroes: [], enemies: [], items: [], factions: [], mechanics: [] },
        achievements: [],
        statistics: { missions: 0, victories: 0, defeats: 0, waves: 0, enemiesDefeated: 0, damageDealt: 0, creditsEarned: 0 },
        lastMissionSummary: null,
        lastLevelId: 'level_1',
        shop: { rotationKey: '', slotIds: [], purchasedIds: [], heroPity: 0 },
        settings: {
            ranges: true,
            grid: false,
            audio: true,
            highContrast: false,
            reduceMotion: false,
            uiScale: 'normal',
            masterVolume: 0.7,
            musicVolume: 0.25,
            sfxVolume: 0.75,
            locale: 'es',
            keyBindings: { pause: 'p', speed: 's', nextWave: 'n', cancel: 'Escape', targeting: 't' }
        }
    };
}

export class ProgressionManager {
    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
        this.state = createDefaultState();
        this.game = null;
        this.data = null;
        this.recoveredFromCorruptSave = false;
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
            this.recoveredFromCorruptSave = true;
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
        migrated.selectedEvolutions = raw.selectedEvolutions || {};
        migrated.heroMastery = raw.heroMastery || {};
        migrated.codexDiscovered = raw.codexDiscovered || migrated.codexDiscovered;
        migrated.achievements = raw.achievements || [];
        migrated.statistics = { ...migrated.statistics, ...(raw.statistics || {}) };
        migrated.lastMissionSummary = raw.lastMissionSummary || null;
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
        this.state.selectedEvolutions = Object.fromEntries(Object.entries(this.state.selectedEvolutions || {})
            .filter(([heroId, evolutionId]) => heroIds.has(heroId)
                && EVOLUTION_CATALOG[evolutionId]?.baseHeroId === heroId));
        this.state.heroMastery = Object.fromEntries(Object.entries(this.state.heroMastery || {})
            .filter(([heroId]) => heroIds.has(heroId))
            .map(([heroId, value]) => [heroId, { completed: [...new Set(value?.completed || [])].filter((id) => ['impacto', 'especialista', 'protector'].includes(id)) }]));
        const codex = this.state.codexDiscovered || {};
        this.state.codexDiscovered = {
            heroes: [...new Set([...(codex.heroes || []), ...this.state.unlockedHeroIds])].filter((id) => heroIds.has(id)),
            enemies: [...new Set(codex.enemies || [])].filter((id) => this.data.enemies?.[id]),
            items: [...new Set([...(codex.items || []), ...this.state.ownedItemIds])].filter((id) => itemIds.has(id)),
            factions: [...new Set(codex.factions || [])].filter((name) => typeof name === 'string'),
            mechanics: [...new Set(codex.mechanics || [])].filter((id) => CODEX_MECHANICS.includes(id))
        };
        this.state.achievements = [...new Set(this.state.achievements || [])].filter((id) => ['primera_defensa', 'intocable', 'cazajefes', 'maestro', 'coleccionista'].includes(id));
        const statistics = this.state.statistics || {};
        this.state.statistics = Object.fromEntries(['missions', 'victories', 'defeats', 'waves', 'enemiesDefeated', 'damageDealt', 'creditsEarned']
            .map((key) => [key, Math.max(0, Math.round(Number(statistics[key]) || 0))]));
        this.state.metaCredits = Math.max(0, Number(this.state.metaCredits) || 0);
        this.state.settings.keyBindings = { ...createDefaultState().settings.keyBindings, ...(this.state.settings.keyBindings || {}) };
        this.state.settings.locale = ['es', 'en'].includes(this.state.settings.locale) ? this.state.settings.locale : 'es';
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
        this.discoverCodex('heroes', heroId, false);
        this.discoverCodex('mechanics', 'colocacion', false);
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
        this.discoverCodex('heroes', heroId, false);
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

    getHeroEvolution(heroId) {
        return getEvolutionForHero(this.data?.heroes?.[heroId], this.state.selectedEvolutions);
    }

    setHeroEvolution(heroId, evolutionId = null) {
        const hero = this.data?.heroes?.[heroId];
        if (!hero || !this.state.unlockedHeroIds.includes(heroId)) return false;
        if (evolutionId === null) delete this.state.selectedEvolutions[heroId];
        else if (hero.evolutionId !== evolutionId || EVOLUTION_CATALOG[evolutionId]?.baseHeroId !== heroId) return false;
        else {
            this.state.selectedEvolutions[heroId] = evolutionId;
            this.discoverCodex('mechanics', 'evoluciones', false);
        }
        this.save();
        this.syncGame();
        return true;
    }

    evaluateHeroMastery(hero) {
        if (!hero?.id || !this.state.unlockedHeroIds.includes(hero.id)) return [];
        const previous = this.state.heroMastery[hero.id]?.completed || [];
        const completed = [...new Set([...previous, ...completedMasteryChallenges(hero.combatStats)])];
        const unlocked = completed.filter((id) => !previous.includes(id));
        this.state.heroMastery[hero.id] = { completed };
        if (unlocked.length) {
            this.state.metaCredits += unlocked.length * 100;
            this.save();
        }
        return unlocked;
    }

    getHeroMastery(heroId) {
        return { completed: [], ...(this.state.heroMastery[heroId] || {}) };
    }

    discoverCodex(category, id, save = true) {
        const list = this.state.codexDiscovered?.[category];
        const valid = category === 'heroes' ? this.data.heroes?.[id]
            : category === 'enemies' ? this.data.enemies?.[id]
                : category === 'items' ? this.data.items?.[id]
                    : category === 'mechanics' ? CODEX_MECHANICS.includes(id)
                        : category === 'factions' && Object.values(this.data.enemies || {}).some((enemy) => enemy.faction === id);
        if (!Array.isArray(list) || !valid || list.includes(id)) return false;
        list.push(id);
        if (save) this.save();
        return true;
    }

    getCodexSnapshot() {
        return createCodexSnapshot(this.state, this.data);
    }

    recordMissionSummary(game, result = 'defeat') {
        if (!game || game.missionSummaryRecorded) return this.state.lastMissionSummary;
        game.missionSummaryRecorded = true;
        const heroes = (game.heroes || []).map((hero) => ({
            id: hero.id, name: hero.name, ...hero.combatStats
        })).sort((a, b) => b.damageDealt - a.damageDealt);
        const totals = heroes.reduce((sum, hero) => ({
            damage: sum.damage + hero.damageDealt,
            kills: sum.kills + hero.kills,
            abilities: sum.abilities + hero.abilityActivations,
            credits: sum.credits + hero.goldGenerated
        }), { damage: 0, kills: 0, abilities: 0, credits: 0 });
        const summary = {
            result, mode: game.modeSystem?.modeId || 'campaign', map: game.currentLevel?.name || 'Mision',
            wave: game.waveManager?.currentWave || 1, lives: game.resourceManager?.lives || 0,
            totals, heroes, bestHero: heroes[0]?.name || 'Sin despliegue', recordedAt: new Date().toISOString()
        };
        const stats = this.state.statistics;
        stats.missions++;
        stats[result === 'defeat' ? 'defeats' : 'victories']++;
        stats.waves += Math.max(0, summary.wave - 1);
        stats.enemiesDefeated += totals.kills;
        stats.damageDealt += Math.round(totals.damage);
        stats.creditsEarned += Math.round(totals.credits);
        const unlocked = new Set(this.state.achievements);
        unlocked.add('primera_defensa');
        if (result === 'victory' && summary.lives === game.resourceManager?.maxLives) unlocked.add('intocable');
        if (summary.wave >= 10) unlocked.add('cazajefes');
        if (Object.values(this.state.heroMastery).some((entry) => entry.completed?.length >= 3)) unlocked.add('maestro');
        if (this.state.unlockedHeroIds.length >= 10) unlocked.add('coleccionista');
        this.state.achievements = [...unlocked];
        this.state.lastMissionSummary = summary;
        this.save();
        return summary;
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
        this.discoverCodex('items', itemId, false);
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
        } else if (key === 'locale' && ['es', 'en'].includes(value)) {
            this.state.settings.locale = value;
        } else {
            return;
        }
        this.save();
        this.applySettings();
    }

    updateKeyBinding(action, key) {
        if (!['pause', 'speed', 'nextWave', 'cancel', 'targeting'].includes(action) || typeof key !== 'string' || !key.trim()) return false;
        this.state.settings.keyBindings[action] = key;
        this.save();
        return true;
    }

    exportSave() {
        return JSON.stringify({ format: 'tower-defense-marvel-save', version: SAVE_VERSION, exportedAt: new Date().toISOString(), state: this.state }, null, 2);
    }

    importSave(source) {
        const previous = this.state;
        try {
            const parsed = typeof source === 'string' ? JSON.parse(source) : source;
            if (parsed?.format !== 'tower-defense-marvel-save' || !parsed.state) throw new Error('Formato de guardado no valido');
            this.state = ProgressionManager.migrate(parsed.state);
            this.sanitize();
            this.syncGame();
            return { ok: true };
        } catch (error) {
            this.state = previous;
            return { ok: false, reason: error.message || 'No se pudo importar' };
        }
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
