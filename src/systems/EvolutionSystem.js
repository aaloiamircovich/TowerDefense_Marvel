export const EVOLUTION_CATALOG = {
    iron_man_extremis: {
        id: 'iron_man_extremis', baseHeroId: 'iron_man', name: 'Iron Man Extremis', shortName: 'Extremis',
        description: 'Nanotecnologia agresiva: mas dano, cadencia y Sobrecarga ARC cada dos ataques.',
        color: '#56e6ff', stats: { damage: 0.18, fireRate: 0.12, range: 0, critChance: 4 }
    },
    iron_spider: {
        id: 'iron_spider', baseHeroId: 'spiderman', name: 'Iron Spider', shortName: 'Iron Spider',
        description: 'Patas mecanicas y lanzaredes mejorado: mas alcance, penetracion y control rapido.',
        color: '#f4c542', stats: { damage: 0.1, fireRate: 0, range: 0.16, critChance: 3 }
    },
    phoenix: {
        id: 'phoenix', baseHeroId: 'jean_grey', name: 'Phoenix', shortName: 'Phoenix',
        description: 'La Fuerza Phoenix amplifica el dano y libera su onda con mayor frecuencia.',
        color: '#ff6b3d', stats: { damage: 0.22, fireRate: 0.08, range: 0.08, critChance: 5 }
    }
};

export function getEvolutionForHero(hero, selectedEvolutions = {}) {
    const evolution = EVOLUTION_CATALOG[selectedEvolutions[hero?.id]];
    return evolution?.baseHeroId === hero?.id ? evolution : null;
}

export function applyEvolutionStats(stats, evolution) {
    if (!evolution) return stats;
    stats.damage *= 1 + evolution.stats.damage;
    stats.fireRate *= 1 + evolution.stats.fireRate;
    stats.range *= 1 + evolution.stats.range;
    stats.critChance += evolution.stats.critChance;
    if (evolution.id === 'iron_spider') stats.canSeeStealth = true;
    return stats;
}
