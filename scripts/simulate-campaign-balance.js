import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { WaveManager } from '../src/systems/WaveManager.js';
import { getHeroDamageAtLevel, getScaledSupportAura } from '../src/utils/HeroLevel.js';
import { TypeChart } from '../data/TypeChart.js';

const enemies = JSON.parse(fs.readFileSync(new URL('../data/enemies.json', import.meta.url), 'utf8'));
const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const levels = JSON.parse(fs.readFileSync(new URL('../data/levels.json', import.meta.url), 'utf8'));

export const CAMPAIGN_BALANCE_CHECKPOINTS = [
    {
        id: 'base-avengers-wave-25-first-attempt',
        label: 'Base Avengers W25, primer intento',
        levelId: 'level_1',
        wave: 25,
        coverageSeconds: 24,
        expected: 'fail',
        maxMargin: 0.95,
        team: [
            ['cyclops', 30],
            ['black_widow', 15],
            ['hawkeye', 15],
            ['groot', 15],
            ['korg', 15],
            ['ms_marvel', 15]
        ]
    },
    {
        id: 'base-avengers-wave-25-ready',
        label: 'Base Avengers W25, equipo preparado',
        levelId: 'level_1',
        wave: 25,
        coverageSeconds: 24,
        expected: 'pass',
        minMargin: 1.08,
        maxMargin: 1.45,
        team: [
            ['cyclops', 34],
            ['black_widow', 20],
            ['hawkeye', 20],
            ['groot', 20],
            ['korg', 20],
            ['ms_marvel', 20]
        ]
    },
    {
        id: 'new-york-wave-25-unlocked',
        label: 'Nueva York W25, mapa desbloqueado',
        levelId: 'level_2',
        wave: 25,
        coverageSeconds: 24,
        expected: 'pass',
        minMargin: 1.12,
        maxMargin: 2.1,
        team: [
            ['cyclops', 38],
            ['black_widow', 25],
            ['hawkeye', 25],
            ['groot', 25],
            ['korg', 25],
            ['ms_marvel', 25]
        ]
    },
    {
        id: 'wakanda-wave-25-unlocked',
        label: 'Wakanda W25, mapa desbloqueado',
        levelId: 'level_3',
        wave: 25,
        coverageSeconds: 24,
        expected: 'pass',
        minMargin: 1.1,
        maxMargin: 1.75,
        team: [
            ['black_panther', 42],
            ['shuri', 36],
            ['okoye', 36],
            ['iron_man', 38],
            ['cyclops', 38],
            ['hawkeye', 34]
        ]
    },
    {
        id: 'base-avengers-wave-50-ready',
        label: 'Base Avengers W50, segundo checkpoint',
        levelId: 'level_1',
        wave: 50,
        coverageSeconds: 30,
        expected: 'pass',
        minMargin: 1.08,
        maxMargin: 1.55,
        team: [
            ['iron_man', 60],
            ['cyclops', 58],
            ['doctor_strange', 56],
            ['black_widow', 50],
            ['black_panther', 55],
            ['capitan_america', 55]
        ]
    },
    {
        id: 'base-avengers-wave-75-ready',
        label: 'Base Avengers W75, tercer checkpoint',
        levelId: 'level_1',
        wave: 75,
        coverageSeconds: 42,
        expected: 'pass',
        minMargin: 1.05,
        maxMargin: 1.5,
        team: [
            ['thor', 88],
            ['iron_man', 86],
            ['doctor_strange', 84],
            ['scarlet_witch', 82],
            ['black_panther', 78],
            ['profesor_x', 78]
        ]
    },
    {
        id: 'base-avengers-wave-100-ready',
        label: 'Base Avengers W100, final boss',
        levelId: 'level_1',
        wave: 100,
        coverageSeconds: 42,
        expected: 'pass',
        minMargin: 1.03,
        maxMargin: 1.45,
        team: [
            ['thor', 100],
            ['silver_surfer', 100],
            ['scarlet_witch', 100],
            ['doctor_strange', 100],
            ['jean_grey', 100],
            ['profesor_x', 100]
        ]
    }
];

function createGame(levelId = 'level_1') {
    const currentLevel = levels.find((level) => level.id === levelId) || levels[0];
    return {
        uiManager: null,
        heroes: [],
        activeTeam: [],
        enemies: [],
        completedWaves: [],
        stars: 0,
        path: currentLevel.path || [{ x: 0, y: 0 }, { x: 40, y: 0 }],
        currentLevel,
        levelsData: levels,
        resourceManager: {
            credits: 0,
            lives: 20,
            addCredits(amount) {
                this.credits += amount;
            }
        },
        pause: () => {}
    };
}

function getPreparedBoss(levelId, wave) {
    const manager = new WaveManager(createGame(levelId), enemies);
    manager.currentWave = wave;
    manager.prepareNextWave();
    return manager.preparedQueue.map((entry) => entry.config).find((config) => config?.isBoss);
}

function collectSupportMultipliers(team) {
    return team.reduce((multipliers, [heroId, level]) => {
        const hero = heroes[heroId];
        const aura = getScaledSupportAura(hero?.special?.supportAura, level, hero?.rarity);
        if (!aura?.type) return multipliers;
        if (aura.type === 'damage') multipliers.damage += Number(aura.power || 0);
        if (aura.type === 'fireRate') multipliers.fireRate += Number(aura.power || 0);
        return multipliers;
    }, { damage: 0, fireRate: 0 });
}

function getExpectedStatusValue(hero, boss) {
    const effects = hero.special?.attackEffects || [];
    return effects.reduce((bonus, effect) => {
        const chance = Math.max(0, Math.min(1, Number(effect.chance || 0)));
        const power = Math.max(0, Number(effect.power || 0));
        if (effect.type === 'armorBreak') return bonus + Math.min(Number(boss.armor || 0) * 0.45, power * chance * 0.75);
        if (['mark', 'curse'].includes(effect.type)) return bonus + Math.min(0.12, power * chance * 0.5);
        if (['slow', 'stun', 'web'].includes(effect.type)) return bonus + Math.min(0.08, chance * 0.05);
        if (['burn', 'bleed', 'poison'].includes(effect.type)) return bonus + Math.min(0.1, chance * 0.04);
        return bonus;
    }, 0);
}

function estimateHeroDamage(hero, level, boss, coverageSeconds, support) {
    if (!hero || hero.special?.supportAura?.type) return 0;

    const profile = hero.special?.projectileProfile || {};
    const damage = getHeroDamageAtLevel(hero.damage, level, hero.rarity);
    const fireRate = Number(hero.fireRate || 1) * (1 + support.fireRate);
    const critChance = Number(hero.critChance ?? 5) / 100;
    const critMultiplier = Number(hero.critMultiplier || 2);
    const critFactor = 1 + critChance * (critMultiplier - 1);
    const typeMultiplier = TypeChart[hero.category]?.[boss.category] || 1;
    const resistance = Number(boss.resistances?.[hero.category] || 0);
    const armorBreak = getExpectedStatusValue(hero, boss);
    const armorPenetration = Number(profile.armorPenetration || 0);
    const armor = Math.max(0, Number(boss.armor || 0) - armorPenetration - armorBreak);
    const statusMultiplier = 1 + Math.min(0.16, getExpectedStatusValue(hero, boss) * 0.35);

    return damage
        * fireRate
        * critFactor
        * typeMultiplier
        * (1 - resistance)
        * (1 - armor)
        * (1 + support.damage)
        * statusMultiplier
        * coverageSeconds;
}

export function simulateCampaignBalance(checkpoints = CAMPAIGN_BALANCE_CHECKPOINTS) {
    const results = checkpoints.map((checkpoint) => {
        const boss = getPreparedBoss(checkpoint.levelId, checkpoint.wave);
        const support = collectSupportMultipliers(checkpoint.team);
        const totalDamage = checkpoint.team.reduce((total, [heroId, level]) => (
            total + estimateHeroDamage(heroes[heroId], level, boss, checkpoint.coverageSeconds, support)
        ), 0);
        const margin = totalDamage / Math.max(1, Number(boss?.hp || 0));
        const minMargin = checkpoint.minMargin ?? 0;
        const maxMargin = checkpoint.maxMargin ?? Infinity;
        const passed = margin >= minMargin && margin <= maxMargin;

        return {
            ...checkpoint,
            bossId: boss?.id || 'unknown',
            bossName: boss?.name || 'Jefe',
            bossHp: Math.round(Number(boss?.hp || 0)),
            estimatedDamage: Math.round(totalDamage),
            margin: Number(margin.toFixed(3)),
            passed
        };
    });

    return {
        results,
        failures: results.filter((result) => !result.passed)
    };
}

function formatResult(result) {
    const status = result.passed ? 'OK' : 'REVISAR';
    const expected = result.expected === 'fail' ? 'debe frenar progreso bajo' : 'debe ser vencible';
    return [
        `[${status}] ${result.label}`,
        `boss=${result.bossName}`,
        `hp=${result.bossHp}`,
        `dano=${result.estimatedDamage}`,
        `margen=x${result.margin}`,
        `objetivo=${expected}`
    ].join(' | ');
}

function runCli() {
    const report = simulateCampaignBalance();
    console.log('Simulacion de balance de campania Marvel TD');
    for (const result of report.results) console.log(formatResult(result));
    if (report.failures.length) {
        console.error(`Balance fuera de rango: ${report.failures.map((result) => result.id).join(', ')}`);
        process.exitCode = 1;
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    runCli();
}
