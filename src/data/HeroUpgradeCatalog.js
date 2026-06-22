const DEFAULT_BRANCHES = [
    {
        id: 'assault',
        name: 'Asalto',
        nodes: [
            { id: 'assault_1', name: 'Potencia I', desc: '+10% daño', cost: 220, bonus: { damage: 0.1 } },
            { id: 'assault_2', name: 'Potencia II', desc: '+15% daño', cost: 480, requires: 'assault_1', bonus: { damage: 0.15 } },
            { id: 'assault_3', name: 'Golpe decisivo', desc: '+5% crítico', cost: 850, requires: 'assault_2', bonus: { critChance: 5 } }
        ]
    },
    {
        id: 'tactics',
        name: 'Táctica',
        nodes: [
            { id: 'tactics_1', name: 'Control de zona', desc: '+10% alcance', cost: 220, bonus: { range: 0.1 } },
            { id: 'tactics_2', name: 'Ritmo de combate', desc: '+12% cadencia', cost: 480, requires: 'tactics_1', bonus: { fireRate: 0.12 } },
            { id: 'tactics_3', name: 'Maestría', desc: '+20% habilidad, -15% cooldown', cost: 850, requires: 'tactics_2', bonus: { abilityPower: 0.2, cooldown: 0.15 } }
        ]
    }
];

const HERO_LABELS = {
    iron_man: ['Repulsores calibrados', 'Nanotecnología ofensiva', 'Extremis', 'Radar J.A.R.V.I.S.', 'Reactor optimizado', 'Unibeam'],
    spiderman: ['Fuerza arácnida', 'Impacto acrobático', 'Spider-Sense', 'Fluido mejorado', 'Lanzaredes doble', 'Red multiversal'],
    capitan_america: ['Entrenamiento táctico', 'Golpe de vibranium', 'Voluntad indomable', 'Formación cerrada', 'Liderazgo', 'Vengadores unidos'],
    thor: ['Fuerza de Asgard', 'Mjolnir desatado', 'Digno', 'Ojo de la tormenta', 'Trueno veloz', 'Tormenta del Padre de Todos'],
    doctor_strange: ['Runas ofensivas', 'Proyección astral', 'Hechicero Supremo', 'Portales estables', 'Tiempo fracturado', 'Ojo de Agamotto'],
    hulk: ['Puños imparables', 'Furia creciente', 'Hulk aplasta', 'Piel gamma', 'Salto sísmico', 'Más fuerte que nunca'],
    black_widow: ['Munición táser', 'Sabotaje rojo', 'Viuda letal', 'Red Room', 'Cadena eléctrica', 'Agente perfecta'],
    hawkeye: ['Puntas calibradas', 'Flecha perforante', 'Tiro imposible', 'Carcaj criogénico', 'Detonación amplia', 'Nunca fallo'],
    black_panther: ['Garras de vibranium', 'Energía cinética', 'Rey guerrero', 'Manto real', 'Contraataque', 'Wakanda por siempre'],
    vision: ['Rayo solar', 'Masa crítica', 'Sintetizoide supremo', 'Fase espectral', 'Control de densidad', 'Piedra de la Mente'],
    falcon: ['Alas de combate', 'Ataque rasante', 'Capitán aéreo', 'Escáner Redwing', 'Marcado táctico', 'Superioridad aérea'],
    captain_marvel: ['Fotones concentrados', 'Impacto binario', 'Más alto, más lejos', 'Vuelo orbital', 'Absorción de energía', 'Forma binaria'],
    star_lord: ['Blásters gemelos', 'Plasma Kree', 'Forajido legendario', 'Carcaj elemental', 'Órdenes de la Milano', 'Plan casi perfecto'],
    groot: ['Golpe de rama', 'Corteza ancestral', 'Flora colosal', 'Raíces profundas', 'Regeneración', 'Yo soy Groot'],
    gamora: ['Godslayer', 'Cadena letal', 'Mujer más peligrosa', 'Paso asesino', 'Caza de élites', 'Última Zen-Whoberi'],
    silver_surfer: ['Poder primordial', 'Rayo estelar', 'Heraldo libre', 'Tabla cósmica', 'Resonancia universal', 'Poder Cósmico']
};

export function getHeroUpgradeTree(hero) {
    const labels = HERO_LABELS[hero.id] || [];
    let labelIndex = 0;
    return DEFAULT_BRANCHES.map((branch) => ({
        ...branch,
        nodes: branch.nodes.map((node) => ({
            ...node,
            name: labels[labelIndex++] || node.name,
            heroId: hero.id
        }))
    }));
}

export function getUpgradeNode(hero, nodeId) {
    return getHeroUpgradeTree(hero).flatMap((branch) => branch.nodes).find((node) => node.id === nodeId);
}

export function calculateHeroBonuses(hero, purchasedIds = []) {
    const purchased = new Set(purchasedIds);
    const bonuses = { damage: 0, range: 0, fireRate: 0, critChance: 0, abilityPower: 0, cooldown: 0 };
    getHeroUpgradeTree(hero).flatMap((branch) => branch.nodes).forEach((node) => {
        if (!purchased.has(node.id)) return;
        Object.entries(node.bonus).forEach(([key, value]) => { bonuses[key] += value; });
    });
    return bonuses;
}
