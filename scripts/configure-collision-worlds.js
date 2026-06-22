import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const levelFile = path.join(root, 'data', 'levels.json');
const enemyFile = path.join(root, 'data', 'enemies.json');
const levels = JSON.parse(fs.readFileSync(levelFile, 'utf8')).filter((level) => !['level_8', 'level_9', 'level_10', 'level_11'].includes(level.id));
const enemies = JSON.parse(fs.readFileSync(enemyFile, 'utf8'));

levels.push(
    {
        id: 'level_8', name: 'Asgard', description: 'Las fuerzas de Malekith cruzan el Bifrost hacia el Palacio Dorado. Usa sus saltos sin perder el control de la ruta.', thumbnail: 'asgard', difficulty: 'Extrema',
        theme: { id: 'asgard', label: 'Asgard', accent: '#ffd166', brief: 'Oro asgardiano, puentes estelares, piedra rúnica y vacío cósmico.' },
        mission: { operation: 'Puente de los Nueve Reinos', speaker: 'Thor', briefing: 'Malekith ha corrompido dos anclas del Bifrost. Cada oleada alterna el puente y sus portales aceleran a quien alcance el umbral.', dialogue: 'Que crucen el puente. Aquí sabrán por qué Asgard aún se mantiene en pie.', mechanic: { type: 'bifrost', label: 'Anclas del Bifrost', description: 'La entrada alterna y cada portal adelanta enemigos por su misma ruta. Controla las salidas antes del salto.', status: 'Heimdall mantiene dos anclas abiertas.', portals: [{ x: 240, y: 160, radius: 42 }, { x: 560, y: 400, radius: 42 }], jumpDistance: 145 }, objectives: [{ id: 'asgard_control', label: 'Guardián del puente', description: 'Controla 20 saltos del Bifrost.', metric: 'mechanicUses', target: 20, reward: 520 }, { id: 'asgard_boss', label: 'Por los Nueve Reinos', description: 'Derrota a un jefe.', metric: 'bosses', target: 1, reward: 560 }] },
        path: [{ x: 0, y: 160 }, { x: 240, y: 160 }, { x: 240, y: 400 }, { x: 560, y: 400 }, { x: 560, y: 200 }, { x: 800, y: 200 }],
        alternatePaths: [[{ x: 0, y: 160 }, { x: 240, y: 160 }, { x: 240, y: 400 }, { x: 560, y: 400 }, { x: 560, y: 200 }, { x: 800, y: 200 }], [{ x: 400, y: 0 }, { x: 400, y: 160 }, { x: 160, y: 160 }, { x: 160, y: 440 }, { x: 640, y: 440 }, { x: 640, y: 600 }]]
    },
    {
        id: 'level_9', name: 'Dimensión Oscura', description: 'El espacio de Dormammu invierte las reglas del combate. Las zonas estables y corruptas cambian durante cada oleada.', thumbnail: 'dark_dimension', difficulty: 'Extrema',
        theme: { id: 'dark-dimension', label: 'Dimensión Oscura', accent: '#ff4fa3', brief: 'Geometría imposible, energía carmesí, obsidiana y portales vivos.' },
        mission: { operation: 'Paradoja de Dormammu', speaker: 'Doctor Strange', briefing: 'La dimensión oscila cada seis segundos. Cuando la realidad se invierte, las runas que ralentizan pasan a acelerar a los invasores.', dialogue: 'No intenten comprender el paisaje. Solo recuerden qué lado de la paradoja está activo.', mechanic: { type: 'inversion', label: 'Ciclo de inversión', description: 'Las runas alternan ralentización y aceleración cada seis segundos. Reubica el daño alrededor del ciclo.', status: 'Realidad estable durante seis segundos.', cycle: 6, landmarks: [{ x: 220, y: 300, radius: 72, label: 'NEXO', color: '#ff4fa3' }, { x: 580, y: 300, radius: 72, label: 'VACÍO', color: '#8b5cff' }] }, objectives: [{ id: 'dark_cycles', label: 'Dueño del tiempo', description: 'Resiste 12 inversiones.', metric: 'mechanicUses', target: 12, reward: 560 }, { id: 'dark_clean', label: 'Realidad intacta', description: 'Supera 8 oleadas sin fugas.', metric: 'noLeakWaves', target: 8, reward: 600 }] },
        path: [{ x: 0, y: 300 }, { x: 220, y: 300 }, { x: 220, y: 100 }, { x: 580, y: 100 }, { x: 580, y: 500 }, { x: 800, y: 500 }]
    },
    {
        id: 'level_10', name: 'Savage Land', description: 'Raptores y mutados emergen entre ruinas prehistóricas. La vegetación cede y revela rutas ocultas.', thumbnail: 'savage_land', difficulty: 'Extrema',
        theme: { id: 'savage-land', label: 'Savage Land', accent: '#7ee081', brief: 'Jungla húmeda, ruinas, lava, dinosaurios y senderos ocultos.' },
        mission: { operation: 'Ecos de Pangea', speaker: 'Wolverine', briefing: 'La selva contiene los primeros ataques, pero cada oleada destruye más vegetación. Cada tercera oleada revela un sendero distinto.', dialogue: 'La jungla cambia de opinión rápido. Mantengan los ojos en el sendero y las garras listas.', mechanic: { type: 'jungle', label: 'Vegetación destructible', description: 'Cinco masas de vegetación frenan enemigos por oleada. Cada tercera oleada abre una ruta oculta.', status: 'La maleza cubre ambos senderos.', vegetation: 5, landmarks: [{ x: 200, y: 180, radius: 54, label: 'LIANA', color: '#7ee081' }, { x: 560, y: 420, radius: 54, label: 'RUINA', color: '#ffd166' }] }, objectives: [{ id: 'savage_vines', label: 'Superviviente', description: 'Activa 30 barreras de vegetación.', metric: 'mechanicUses', target: 30, reward: 600 }, { id: 'savage_boss', label: 'Señor de la jungla', description: 'Derrota a un jefe.', metric: 'bosses', target: 1, reward: 620 }] },
        path: [{ x: 0, y: 180 }, { x: 200, y: 180 }, { x: 200, y: 420 }, { x: 560, y: 420 }, { x: 560, y: 140 }, { x: 800, y: 140 }],
        alternatePaths: [[{ x: 0, y: 180 }, { x: 200, y: 180 }, { x: 200, y: 420 }, { x: 560, y: 420 }, { x: 560, y: 140 }, { x: 800, y: 140 }], [{ x: 0, y: 460 }, { x: 280, y: 460 }, { x: 280, y: 120 }, { x: 640, y: 120 }, { x: 640, y: 360 }, { x: 800, y: 360 }]]
    },
    {
        id: 'level_11', name: 'The Raft', description: 'Una fuga masiva amenaza la prisión oceánica. El daño cerca de las celdas puede liberar prisioneros de élite.', thumbnail: 'the_raft', difficulty: 'Extrema',
        theme: { id: 'the-raft', label: 'The Raft', accent: '#58d6ff', brief: 'Acero naval, celdas energéticas, océano nocturno y luces de emergencia.' },
        mission: { operation: 'Cierre Total', speaker: 'Nick Fury', briefing: 'Las celdas están inestables. Si un enemigo herido cruza su perímetro, la contención cederá y liberará un prisionero.', dialogue: 'Cuiden el daño de área. Aquí cada pared rota viene con un problema nuevo detrás.', mechanic: { type: 'raft', label: 'Celdas inestables', description: 'Un enemigo dañado dentro de una celda libera un mini-jefe sobre el mismo tramo. Cada celda abre una vez por oleada.', status: 'Tres bloques de contención siguen sellados.', landmarks: [{ x: 200, y: 180, radius: 58, label: 'A-1', color: '#58d6ff' }, { x: 400, y: 420, radius: 58, label: 'B-2', color: '#ff6b6b' }, { x: 640, y: 220, radius: 58, label: 'C-3', color: '#ffd166' }], prisoner: { id: 'raft_abomination', name: 'Prisionero Gamma', category: 'Mutante', hp: 620, speed: 36, reward: 90, armor: 0.38, stealth: false, faction: 'Prisioneros de The Raft', archetype: 'tank', threat: 5 } }, objectives: [{ id: 'raft_cells', label: 'Control de daños', description: 'Completa 8 oleadas con menos de 6 brechas.', metric: 'noLeakWaves', target: 8, reward: 640 }, { id: 'raft_boss', label: 'Alcaide de emergencia', description: 'Derrota a un jefe.', metric: 'bosses', target: 1, reward: 680 }] },
        path: [{ x: 0, y: 180 }, { x: 200, y: 180 }, { x: 200, y: 420 }, { x: 400, y: 420 }, { x: 400, y: 220 }, { x: 640, y: 220 }, { x: 640, y: 480 }, { x: 800, y: 480 }]
    }
);

Object.assign(enemies.normal, {
    asgardian_traitor: { id: 'asgardian_traitor', name: 'Traidor Asgardiano', category: 'Místico', hp: 240, speed: 58, reward: 34, armor: 0.25, stealth: false, faction: 'Ejército de Malekith', archetype: 'soldier', threat: 4 },
    dark_elf_skirmisher: { id: 'dark_elf_skirmisher', name: 'Hostigador Elfo Oscuro', category: 'Místico', hp: 175, speed: 86, reward: 31, armor: 0.12, stealth: true, faction: 'Ejército de Malekith', archetype: 'runner', threat: 4 },
    mindless_one: { id: 'mindless_one', name: 'Sin Mente', category: 'Místico', hp: 390, speed: 38, reward: 46, armor: 0.36, stealth: false, faction: 'Dimensión Oscura', archetype: 'tank', threat: 5 },
    dark_zealot: { id: 'dark_zealot', name: 'Fanático Oscuro', category: 'Místico', hp: 210, speed: 64, reward: 37, armor: 0.16, stealth: false, faction: 'Dimensión Oscura', archetype: 'support', healPower: 0.05, behaviorCooldown: 5, threat: 4 },
    savage_raptor: { id: 'savage_raptor', name: 'Raptor Salvaje', category: 'Mutante', hp: 150, speed: 102, reward: 29, armor: 0.06, stealth: false, faction: 'Savage Land', archetype: 'runner', threat: 4 },
    savage_brute: { id: 'savage_brute', name: 'Bruto Mutado', category: 'Mutante', hp: 440, speed: 34, reward: 52, armor: 0.34, stealth: false, faction: 'Savage Land', archetype: 'tank', threat: 5 },
    raft_escapee: { id: 'raft_escapee', name: 'Fugitivo de The Raft', category: 'Urbano', hp: 235, speed: 72, reward: 35, armor: 0.18, stealth: false, faction: 'Prisioneros de The Raft', archetype: 'soldier', threat: 4 },
    raft_saboteur: { id: 'raft_saboteur', name: 'Saboteador de Celdas', category: 'Tecnológico', hp: 190, speed: 78, reward: 42, armor: 0.14, stealth: true, faction: 'Prisioneros de The Raft', archetype: 'stealth', threat: 5 }
});
Object.assign(enemies.bosses, {
    malekith: { id: 'malekith', name: 'Malekith', category: 'Místico', hp: 5200, speed: 32, reward: 720, armor: 0.38, isBoss: true, faction: 'Ejército de Malekith', archetype: 'boss', threat: 5, phases: [{ threshold: 0.7, name: 'Éter oscuro', speed: 1.15, barrier: 0.12 }, { threshold: 0.35, name: 'Convergencia', speed: 1.25, summonId: 'dark_elf_skirmisher', summonCount: 3 }] },
    baron_mordo: { id: 'baron_mordo', name: 'Barón Mordo', category: 'Místico', hp: 5600, speed: 30, reward: 760, armor: 0.3, isBoss: true, faction: 'Dimensión Oscura', archetype: 'boss', threat: 5, phases: [{ threshold: 0.72, name: 'Hechizo vedado', barrier: 0.18 }, { threshold: 0.38, name: 'Ruptura temporal', speed: 1.3, summonId: 'dark_zealot', summonCount: 2 }] },
    sauron: { id: 'sauron', name: 'Sauron', category: 'Mutante', hp: 6100, speed: 36, reward: 800, armor: 0.32, flying: true, isBoss: true, faction: 'Savage Land', archetype: 'boss', threat: 5, phases: [{ threshold: 0.66, name: 'Drenaje vital', heal: 0.12 }, { threshold: 0.3, name: 'Señor prehistórico', speed: 1.25, summonId: 'savage_raptor', summonCount: 4 }] },
    abomination: { id: 'abomination', name: 'Abominación', category: 'Mutante', hp: 7200, speed: 28, reward: 860, armor: 0.45, isBoss: true, faction: 'Prisioneros de The Raft', archetype: 'boss', threat: 5, phases: [{ threshold: 0.7, name: 'Furia gamma', speed: 1.18, barrier: 0.12 }, { threshold: 0.32, name: 'Contención rota', speed: 1.3, summonId: 'raft_escapee', summonCount: 4 }] }
});

fs.writeFileSync(levelFile, `${JSON.stringify(levels, null, 2)}\n`, 'utf8');
fs.writeFileSync(enemyFile, `${JSON.stringify(enemies, null, 2)}\n`, 'utf8');
console.log('Mundos en colision configurados: 4 mapas, 8 tropas y 4 jefes');
