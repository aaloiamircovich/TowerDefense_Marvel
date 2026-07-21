import { calculateHeroBonuses, getUpgradeNode } from '../data/HeroUpgradeCatalog.js';
import { EVOLUTION_CATALOG, getEvolutionForHero } from './EvolutionSystem.js';
import { CODEX_MECHANICS, completedMasteryChallenges, createCodexSnapshot, flattenEnemyDatabase } from './MasteryCodexSystem.js';
import { PAIR_SYNERGIES, SYNERGY_DEFINITIONS, analyzeTeam } from './TeamSynergySystem.js';

const SAVE_KEY = 'tower-defense-marvel-save';
const SAVE_VERSION = 7;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const ACHIEVEMENT_CATALOG = {
    primera_defensa: achievement('Primera defensa', 'Completa tu primera mision registrada.'),
    intocable: achievement('Intocable', 'Gana una mision sin perder vidas.'),
    cazajefes: achievement('Cazajefes', 'Alcanza una oleada de jefe.'),
    maestro: achievement('Maestro heroico', 'Completa una maestria entera con un heroe.'),
    coleccionista: achievement('Coleccionista', 'Recluta al menos 10 heroes.'),
    tactico_superior: achievement('Tactico superior', 'Acumula 2500 de valor tactico en una mision.'),
    protector: achievement('Protector', 'Evita 5 fugas con efectos defensivos en una mision.'),
    controlador: achievement('Control de masas', 'Acumula 30 segundos de control en una mision.'),
    arsenal_vivo: achievement('Arsenal vivo', 'Activa 6 habilidades en una mision.'),
    sinergia_activa: achievement('Sinergia activa', 'Termina una mision con una agrupacion activa.'),
    explorador_multiversal: achievement('Explorador multiversal', 'Registra progreso en 5 mapas distintos.')
};

const ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENT_CATALOG);
const WEEKLY_FACTIONS = ['Hydra', 'A.I.M.', 'La Mano', 'Ultron', 'Kang', 'Thanos'];

function createMapProgress(progress = {}) {
    const bestWave = Math.max(0, Number(progress.bestWave) || 0);
    const rawStars = Math.max(0, Number(progress.stars) || 0);
    return {
        bestWave,
        stars: Math.max(rawStars, bestWave),
        difficulty: ['easy', 'normal', 'hard'].includes(progress.difficulty) ? progress.difficulty : 'normal',
        challenges: [...new Set(progress.challenges || [])],
        missionObjectives: [...new Set(progress.missionObjectives || [])]
    };
}

function achievement(label, description) {
    return { label, description };
}

function getWeekKey(now = new Date()) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getFactionForWeek(weekKey) {
    const seed = [...weekKey].reduce((total, char) => total + char.charCodeAt(0), 0);
    return WEEKLY_FACTIONS[seed % WEEKLY_FACTIONS.length];
}

function createWeeklyContracts(weekKey = getWeekKey()) {
    const faction = getFactionForWeek(weekKey);
    return [
        {
            id: `${weekKey}:clean_run`,
            title: 'Defensa impecable',
            group: 'S.H.I.E.L.D.',
            reward: 180,
            goal: 'Gana una mision con 18 o mas vidas restantes.',
            evaluate: (summary) => summary.result === 'victory' && summary.lives >= 18
        },
        {
            id: `${weekKey}:tactical_control`,
            title: 'Zona bajo control',
            group: 'Control',
            reward: 220,
            goal: 'Acumula 20 segundos de control tactico.',
            evaluate: (summary) => (summary.tactical?.controlSeconds || 0) >= 20
        },
        {
            id: `${weekKey}:active_allegiance`,
            title: 'Agrupacion en campo',
            group: 'Agrupaciones',
            reward: 240,
            goal: 'Termina con al menos una agrupacion activa.',
            evaluate: (summary) => (summary.synergies?.activeFamilies || 0) >= 1
        },
        {
            id: `${weekKey}:faction_${faction.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
            title: `Contrato contra ${faction}`,
            group: faction,
            reward: 260,
            goal: `Derrota 30 enemigos y gana contra una oleada de ${faction}.`,
            evaluate: (summary) => summary.result === 'victory'
                && String(summary.enemyFaction || '').toLowerCase().includes(faction.toLowerCase())
                && (summary.totals?.kills || 0) >= 30
        }
    ];
}

function normalizeWeeklyContracts(value = {}) {
    return {
        weekKey: typeof value.weekKey === 'string' ? value.weekKey : '',
        completedIds: [...new Set(value.completedIds || [])].filter((id) => typeof id === 'string')
    };
}

function normalizeStringList(value = []) {
    return [...new Set(value || [])].filter((id) => typeof id === 'string');
}

function getSynergyChallengeReward(definition) {
    const rewardByRarity = { Common: 100, Rare: 130, Epic: 170, Legendary: 220, Mythic: 280, Secret: 340 };
    return rewardByRarity[definition?.rarity] || 140;
}

function createSynergyChallenges() {
    const familyChallenges = Object.entries(SYNERGY_DEFINITIONS).map(([tag, definition]) => ({
        id: `family:${tag}`,
        type: 'family',
        tag,
        title: `${definition.label}: dominio`,
        reward: getSynergyChallengeReward(definition),
        goal: 'Gana una mision con esta agrupacion activa y 25 bajas.'
    }));
    const pairChallenges = PAIR_SYNERGIES.map((pair) => ({
        id: `pair:${pair.id}`,
        type: 'pair',
        pairId: pair.id,
        title: `${pair.label}: dupla tactica`,
        reward: 180,
        goal: 'Gana una mision usando esta pareja con 15 bajas.'
    }));
    return [...familyChallenges, ...pairChallenges];
}

function encodeSharePayload(payload) {
    const json = JSON.stringify(payload);
    if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(json)));
    return Buffer.from(json, 'utf8').toString('base64');
}

function decodeSharePayload(source) {
    const text = String(source || '').trim();
    const json = typeof atob === 'function'
        ? decodeURIComponent(escape(atob(text)))
        : Buffer.from(text, 'base64').toString('utf8');
    return JSON.parse(json);
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
        weeklyContracts: { weekKey: '', completedIds: [] },
        synergyChallenges: [],
        statistics: { missions: 0, victories: 0, defeats: 0, waves: 0, enemiesDefeated: 0, damageDealt: 0, creditsEarned: 0 },
        lastMissionSummary: null,
        lastLevelId: 'level_1',
        shop: { rotationKey: '', slotIds: [], purchasedIds: [], heroPity: 0 },
        settings: {
            ranges: true,
            grid: false,
            combatText: true,
            audio: true,
            highContrast: false,
            reduceMotion: false,
            pixelArtCrisp: false,
            reducedVfx: false,
            tutorialHints: true,
            simplifiedUi: false,
            uiScale: 'normal',
            masterVolume: 0.7,
            musicVolume: 0.25,
            sfxVolume: 0.75,
            locale: 'es',
            keyBindings: { pause: 'p', speed: 's', nextWave: 'n', cancel: 'Escape', targeting: 't', upgrade: 'u' }
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
                weeklyContracts: normalizeWeeklyContracts(raw.weeklyContracts),
                synergyChallenges: normalizeStringList(raw.synergyChallenges),
                settings: { ...defaults.settings, ...(raw.settings || {}) }
            };
        }

        const migrated = createDefaultState();
        migrated.metaCredits = raw.metaCredits ?? raw.credits ?? migrated.metaCredits;
        migrated.unlockedHeroIds = raw.unlockedHeroIds || raw.heroes || [];
        migrated.activeTeamIds = raw.activeTeamIds || raw.team || migrated.unlockedHeroIds.slice(0, 6);
        migrated.ownedItemIds = raw.ownedItemIds || raw.items || [];
        migrated.equippedItems = raw.equippedItems || {};
        migrated.itemLevels = {};
        migrated.forgeMaterials = 0;
        migrated.loadouts = raw.loadouts || {};
        migrated.heroUpgrades = raw.heroUpgrades || raw.upgrades || {};
        migrated.mapProgress = raw.mapProgress || raw.maps || {};
        migrated.modeRecords = raw.modeRecords || {};
        migrated.selectedEvolutions = raw.selectedEvolutions || {};
        migrated.heroMastery = raw.heroMastery || {};
        migrated.codexDiscovered = raw.codexDiscovered || migrated.codexDiscovered;
        migrated.achievements = raw.achievements || [];
        migrated.weeklyContracts = normalizeWeeklyContracts(raw.weeklyContracts);
        migrated.synergyChallenges = normalizeStringList(raw.synergyChallenges);
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
            const candidateIds = typeof rawSlots === 'string'
                ? [rawSlots]
                : Object.values(rawSlots || {});
            const validIds = candidateIds.filter((itemId) => itemIds.has(itemId));
            const [equippedItemId, ...extraItemIds] = validIds;
            this.state.ownedItemIds.push(...extraItemIds);
            if (equippedItemId) this.state.equippedItems[heroId] = { [this.data.items[equippedItemId].slot]: equippedItemId };
            else delete this.state.equippedItems[heroId];
        });
        this.state.itemLevels = {};
        this.state.forgeMaterials = 0;
        this.state.loadouts = Object.fromEntries(Object.entries(this.state.loadouts || {})
            .filter(([heroId]) => heroIds.has(heroId))
            .map(([heroId, loadout]) => [heroId, {
                slots: Object.fromEntries(Object.entries(loadout?.slots || {})
                    .filter(([, itemId], index) => index === 0 && itemIds.has(itemId)))
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
                && this.data.heroes[heroId]?.evolutionId === evolutionId
                && EVOLUTION_CATALOG[evolutionId]?.baseHeroId === heroId));
        this.state.heroMastery = Object.fromEntries(Object.entries(this.state.heroMastery || {})
            .filter(([heroId]) => heroIds.has(heroId))
            .map(([heroId, value]) => [heroId, { completed: [...new Set(value?.completed || [])].filter((id) => ['impacto', 'especialista', 'protector'].includes(id)) }]));
        const codex = this.state.codexDiscovered || {};
        const enemyIds = new Set(Object.keys(flattenEnemyDatabase(this.data.enemies || {})));
        this.state.codexDiscovered = {
            heroes: [...new Set([...(codex.heroes || []), ...this.state.unlockedHeroIds])].filter((id) => heroIds.has(id)),
            enemies: [...new Set(codex.enemies || [])].filter((id) => enemyIds.has(id)),
            items: [...new Set([...(codex.items || []), ...this.state.ownedItemIds])].filter((id) => itemIds.has(id)),
            factions: [...new Set(codex.factions || [])].filter((name) => typeof name === 'string'),
            mechanics: [...new Set(codex.mechanics || [])].filter((id) => CODEX_MECHANICS.includes(id))
        };
        this.state.achievements = [...new Set(this.state.achievements || [])].filter((id) => ACHIEVEMENT_IDS.includes(id));
        this.state.weeklyContracts = normalizeWeeklyContracts(this.state.weeklyContracts);
        const validSynergyChallenges = new Set(createSynergyChallenges().map((challenge) => challenge.id));
        this.state.synergyChallenges = normalizeStringList(this.state.synergyChallenges).filter((id) => validSynergyChallenges.has(id));
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
        this.game.assetPreloader?.preloadHeroes(this.game.activeTeam);
        this.reconcileDeployedHeroesWithActiveTeam();
        this.game.ownedItems = this.state.ownedItemIds.map((id) => ({ ...this.data.items[id] })).filter(Boolean);
        this.game.showHeroRanges = this.state.settings.ranges;
        this.game.showGrid = this.state.settings.grid;
        this.applySettings();
        this.game.stars = this.getTotalStars();
        this.game.heroes?.forEach((hero) => this.applyEquippedItem(hero));
    }

    reconcileDeployedHeroesWithActiveTeam() {
        if (!Array.isArray(this.game?.heroes)) return [];

        const activeIds = new Set(this.state.activeTeamIds);
        const removed = [];
        let writeIndex = 0;
        for (const hero of this.game.heroes) {
            if (activeIds.has(hero.id)) {
                this.game.heroes[writeIndex++] = hero;
            } else {
                removed.push(hero);
            }
        }
        this.game.heroes.length = writeIndex;

        if (removed.includes(this.game.selectedUnit)
            || (this.game.selectedUnit?.id && this.game.selectedUnit.takeDamage === undefined && !activeIds.has(this.game.selectedUnit.id))) {
            this.game.selectedUnit = null;
        }
        const removedIds = new Set(removed.map((hero) => hero.id));
        const input = this.game.inputManager;
        const placingId = input?.placingHero?.id;
        const movingId = input?.movingHero?.id;
        if ((placingId && !activeIds.has(placingId)) || removedIds.has(movingId)) input?.clearPlacement?.();

        (this.game.projectiles || []).forEach((projectile) => {
            if (removed.includes(projectile.attacker)) projectile.deactivate?.();
        });
        if (removed.length) this.game.waveManager?.refreshWaveIntel?.();
        return removed;
    }

    save() {
        try {
            this.storage?.setItem(SAVE_KEY, JSON.stringify(this.state));
            return true;
        } catch {
            return false;
        }
    }

    resetAllProgress() {
        this.state = createDefaultState();
        this.recoveredFromCorruptSave = false;
        const saved = this.save();
        this.syncGame();
        return saved;
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
        const enemies = flattenEnemyDatabase(this.data.enemies || {});
        const valid = category === 'heroes' ? this.data.heroes?.[id]
            : category === 'enemies' ? enemies[id]
                : category === 'items' ? this.data.items?.[id]
                    : category === 'mechanics' ? CODEX_MECHANICS.includes(id)
                        : category === 'factions' && Object.values(enemies).some((enemy) => enemy.faction === id);
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
            damage: sum.damage + (hero.damageDealt || 0),
            kills: sum.kills + (hero.kills || 0),
            abilities: sum.abilities + (hero.abilityActivations || 0),
            credits: sum.credits + (hero.goldGenerated || 0)
        }), { damage: 0, kills: 0, abilities: 0, credits: 0 });
        const tactical = heroes.reduce((sum, hero) => ({
            controlSeconds: sum.controlSeconds + (hero.controlSeconds || 0),
            armorBreaks: sum.armorBreaks + (hero.armorBreaks || 0),
            marks: sum.marks + (hero.marks || 0),
            detectionReveals: sum.detectionReveals + (hero.detectionReveals || 0),
            livesSaved: sum.livesSaved + (hero.livesSaved || 0),
            tacticalScore: sum.tacticalScore + (hero.tacticalScore || 0)
        }), { controlSeconds: 0, armorBreaks: 0, marks: 0, detectionReveals: 0, livesSaved: 0, tacticalScore: 0 });
        const teamSnapshot = game.teamSynergy?.getSnapshot?.() || analyzeTeam(game.activeTeam || []);
        const activeFamilyTags = (teamSnapshot.families || []).filter((family) => family.activeTier).map((family) => family.tag);
        const activePairIds = (teamSnapshot.pairs || []).filter((pair) => pair.active).map((pair) => pair.id);
        const synergies = {
            activeFamilies: activeFamilyTags.length,
            activePairs: activePairIds.length,
            activeFamilyTags,
            activePairIds,
            versatile: false
        };
        const summary = {
            result, mode: game.modeSystem?.modeId || 'campaign', map: game.currentLevel?.name || 'Mision',
            wave: game.waveManager?.currentWave || 1, lives: game.resourceManager?.lives || 0,
            enemyFaction: game.waveManager?.faction?.label || game.currentLevel?.theme?.label || '',
            totals, tactical, synergies, heroes, bestHero: heroes[0]?.name || 'Sin despliegue', recordedAt: new Date().toISOString()
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
        if (tactical.tacticalScore >= 2500) unlocked.add('tactico_superior');
        if (tactical.livesSaved >= 5) unlocked.add('protector');
        if (tactical.controlSeconds >= 30) unlocked.add('controlador');
        if (totals.abilities >= 6) unlocked.add('arsenal_vivo');
        if (synergies.activeFamilies > 0 || synergies.activePairs > 0) unlocked.add('sinergia_activa');
        if (Object.keys(this.state.mapProgress).length >= 5) unlocked.add('explorador_multiversal');
        this.state.achievements = [...unlocked];
        summary.synergyRewards = this.evaluateSynergyChallenges(summary);
        summary.weeklyRewards = this.evaluateWeeklyContracts(summary);
        this.state.lastMissionSummary = summary;
        this.save();
        return summary;
    }

    getSynergyChallengeSnapshot(teamSnapshot = this.game?.teamSynergy?.getSnapshot?.()) {
        const snapshot = teamSnapshot || analyzeTeam(this.game?.activeTeam || []);
        const completedIds = new Set(this.state.synergyChallenges || []);
        const familyCounts = Object.fromEntries((snapshot.families || []).map((family) => [family.tag, family.count]));
        const activeFamilyTags = new Set((snapshot.families || []).filter((family) => family.activeTier).map((family) => family.tag));
        const activePairIds = new Set((snapshot.pairs || []).filter((pair) => pair.active).map((pair) => pair.id));
        const challenges = createSynergyChallenges().map((challenge) => ({
            id: challenge.id,
            type: challenge.type,
            title: challenge.title,
            reward: challenge.reward,
            goal: challenge.goal,
            completed: completedIds.has(challenge.id),
            active: challenge.type === 'family' ? activeFamilyTags.has(challenge.tag) : activePairIds.has(challenge.pairId),
            progress: challenge.type === 'family' ? (familyCounts[challenge.tag] || 0) : Number(activePairIds.has(challenge.pairId)) * 2
        })).sort((a, b) => Number(b.active) - Number(a.active) || Number(a.completed) - Number(b.completed) || a.title.localeCompare(b.title));
        return {
            completed: challenges.filter((challenge) => challenge.completed).length,
            total: challenges.length,
            challenges
        };
    }

    evaluateSynergyChallenges(summary) {
        if (summary.result !== 'victory') return [];
        const completed = new Set(this.state.synergyChallenges || []);
        const activeFamilyTags = new Set(summary.synergies?.activeFamilyTags || []);
        const activePairIds = new Set(summary.synergies?.activePairIds || []);
        const kills = summary.totals?.kills || 0;
        const earned = [];
        createSynergyChallenges().forEach((challenge) => {
            const qualifies = challenge.type === 'family'
                ? activeFamilyTags.has(challenge.tag) && kills >= 25
                : activePairIds.has(challenge.pairId) && kills >= 15;
            if (!qualifies || completed.has(challenge.id)) return;
            completed.add(challenge.id);
            this.state.metaCredits += challenge.reward;
            earned.push({
                id: challenge.id,
                title: challenge.title,
                reward: challenge.reward
            });
        });
        this.state.synergyChallenges = [...completed];
        return earned;
    }

    getWeeklyContractSnapshot(now = new Date()) {
        const weekKey = getWeekKey(now);
        const stored = this.state.weeklyContracts?.weekKey === weekKey
            ? this.state.weeklyContracts
            : { weekKey, completedIds: [] };
        const completedIds = new Set(stored.completedIds || []);
        const contracts = createWeeklyContracts(weekKey).map((contract) => ({
            id: contract.id,
            title: contract.title,
            group: contract.group,
            reward: contract.reward,
            goal: contract.goal,
            completed: completedIds.has(contract.id)
        }));
        return {
            weekKey,
            completed: contracts.filter((contract) => contract.completed).length,
            total: contracts.length,
            contracts
        };
    }

    evaluateWeeklyContracts(summary, now = new Date()) {
        const weekKey = getWeekKey(now);
        if (this.state.weeklyContracts?.weekKey !== weekKey) {
            this.state.weeklyContracts = { weekKey, completedIds: [] };
        }
        const completed = new Set(this.state.weeklyContracts.completedIds || []);
        const earned = [];
        createWeeklyContracts(weekKey).forEach((contract) => {
            if (completed.has(contract.id) || !contract.evaluate(summary)) return;
            completed.add(contract.id);
            this.state.metaCredits += contract.reward;
            earned.push({
                id: contract.id,
                title: contract.title,
                group: contract.group,
                reward: contract.reward
            });
        });
        this.state.weeklyContracts = { weekKey, completedIds: [...completed] };
        return earned;
    }

    equipItem(heroId, itemId) {
        if (!this.state.unlockedHeroIds.includes(heroId)) return false;
        const item = this.data.items[itemId];
        if (!item?.slot) return false;
        const hasFreeCopy = this.state.ownedItemIds.includes(itemId);
        const sourceHeroId = Object.entries(this.state.equippedItems)
            .find(([, slots]) => Object.values(slots || {}).includes(itemId))?.[0] || null;
        if (!hasFreeCopy && !sourceHeroId) return false;
        const slots = { ...(this.state.equippedItems[heroId] || {}) };
        const previousItems = Object.values(slots);
        if (previousItems.includes(itemId)) return true;
        if (hasFreeCopy) {
            this.removeOwnedItem(itemId);
        } else if (sourceHeroId && sourceHeroId !== heroId) {
            const sourceSlots = { ...(this.state.equippedItems[sourceHeroId] || {}) };
            Object.entries(sourceSlots).forEach(([slot, equippedItemId]) => {
                if (equippedItemId === itemId) delete sourceSlots[slot];
            });
            if (Object.keys(sourceSlots).length) this.state.equippedItems[sourceHeroId] = sourceSlots;
            else delete this.state.equippedItems[sourceHeroId];
        }
        this.state.ownedItemIds.push(...previousItems);
        this.state.equippedItems[heroId] = { [item.slot]: itemId };
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
            ? { ...this.data.items[itemId] }
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
        return 1;
    }

    getForgeCost(itemId) {
        return Infinity;
    }

    salvageItem(itemId) {
        return { ok: false, reason: 'La forja fue retirada' };
    }

    upgradeItem(itemId) {
        return { ok: false, reason: 'La forja fue retirada' };
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
        progress.stars = Math.max(progress.stars, waveNumber);
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
        if (['ranges', 'grid', 'combatText', 'audio', 'highContrast', 'reduceMotion', 'pixelArtCrisp', 'reducedVfx', 'tutorialHints', 'simplifiedUi'].includes(key)) {
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
        if (!['pause', 'speed', 'nextWave', 'cancel', 'targeting', 'upgrade'].includes(action) || typeof key !== 'string' || !key.trim()) return false;
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

    exportBuildCode() {
        return encodeSharePayload({
            format: 'tower-defense-marvel-build',
            version: 1,
            team: this.state.activeTeamIds,
            equippedItems: this.state.equippedItems,
            selectedEvolutions: this.state.selectedEvolutions,
            lastLevelId: this.state.lastLevelId,
            exportedAt: new Date().toISOString()
        });
    }

    importBuildCode(source) {
        try {
            const parsed = decodeSharePayload(source);
            if (parsed?.format !== 'tower-defense-marvel-build') throw new Error('Codigo de build no valido');
            const heroIds = new Set(Object.keys(this.data.heroes));
            const itemIds = new Set(Object.keys(this.data.items));
            const unlocked = new Set(this.state.unlockedHeroIds);
            const team = [...new Set(parsed.team || [])]
                .filter((id) => heroIds.has(id) && unlocked.has(id))
                .slice(0, 6);
            if (!team.length) throw new Error('La build no contiene heroes desbloqueados');

            const availableItems = [
                ...this.state.ownedItemIds,
                ...Object.values(this.state.equippedItems || {}).flatMap((slots) => Object.values(slots || {}))
            ];
            const equippedItems = {};
            Object.entries(parsed.equippedItems || {}).forEach(([heroId, slots]) => {
                if (!team.includes(heroId)) return;
                const validSlots = {};
                Object.entries(slots || {}).forEach(([slot, itemId]) => {
                    if (Object.keys(validSlots).length > 0) return;
                    const index = availableItems.indexOf(itemId);
                    if (!['weapon', 'armor', 'artifact'].includes(slot)
                        || !itemIds.has(itemId)
                        || this.data.items[itemId].slot !== slot
                        || index < 0) return;
                    availableItems.splice(index, 1);
                    validSlots[slot] = itemId;
                });
                if (Object.keys(validSlots).length) equippedItems[heroId] = validSlots;
            });

            const selectedEvolutions = Object.fromEntries(Object.entries(parsed.selectedEvolutions || {})
                .filter(([heroId, evolutionId]) => team.includes(heroId)
                    && this.data.heroes[heroId]?.evolutionId === evolutionId
                    && EVOLUTION_CATALOG[evolutionId]?.baseHeroId === heroId));

            this.state.activeTeamIds = team;
            this.state.equippedItems = equippedItems;
            this.state.ownedItemIds = availableItems;
            this.state.selectedEvolutions = selectedEvolutions;
            if (this.data.levels.some((level) => level.id === parsed.lastLevelId)) this.state.lastLevelId = parsed.lastLevelId;
            this.save();
            this.syncGame();
            return { ok: true, team };
        } catch (error) {
            return { ok: false, reason: error.message || 'No se pudo importar la build' };
        }
    }

    applySettings() {
        const settings = this.state.settings;
        this.game.showHeroRanges = settings.ranges;
        this.game.showGrid = settings.grid;
        this.game.showCombatText = settings.combatText;
        this.game.pixelArtCrisp = settings.pixelArtCrisp;
        this.game.reducedVfx = settings.reducedVfx;
        this.game.vfx?.setReduced?.(settings.reducedVfx);
        this.game.audio?.setEnabled(settings.audio);
        this.game.audio?.setBusVolume?.('master', settings.masterVolume);
        this.game.audio?.setBusVolume?.('music', settings.musicVolume);
        this.game.audio?.setBusVolume?.('sfx', settings.sfxVolume);

        const documentRef = globalThis.document;
        if (!documentRef) return;
        documentRef.body.classList.toggle('high-contrast', settings.highContrast);
        documentRef.body.classList.toggle('reduce-motion', settings.reduceMotion);
        documentRef.body.classList.toggle('pixel-art-crisp', settings.pixelArtCrisp);
        documentRef.body.classList.toggle('reduced-vfx', settings.reducedVfx);
        documentRef.body.classList.toggle('simple-ui', settings.simplifiedUi);
        documentRef.body.dataset.uiScale = settings.uiScale;
    }
}

export { SAVE_KEY, SAVE_VERSION };
