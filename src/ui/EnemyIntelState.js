export const ENEMY_ROLE_COPY = {
    runner: 'Corredor',
    tank: 'Tanque',
    shield: 'Escudo',
    stealth: 'Sigilo',
    flying: 'Volador',
    summoner: 'Invocador',
    support: 'Soporte',
    commander: 'Comandante',
    phaser: 'Faseador',
    boss: 'Jefe',
    soldier: 'Soldado'
};

export function getEnemyRoleLabel(archetype, isBoss = false) {
    return ENEMY_ROLE_COPY[archetype] || (isBoss ? 'Jefe' : 'Soldado');
}

export function buildEnemyTraitPreview(traits = [], limit = 3) {
    const uniqueTraits = [...new Set((traits || []).filter(Boolean))];
    const visible = uniqueTraits.slice(0, Math.max(1, Number(limit) || 3));
    return {
        visible,
        overflow: Math.max(0, uniqueTraits.length - visible.length),
        title: uniqueTraits.join(', ')
    };
}

export function buildEnemyIntel(enemy = {}) {
    const threat = Math.max(1, Math.min(5, Math.round(Number(enemy.threat || 1))));
    const roleLabel = getEnemyRoleLabel(enemy.archetype, enemy.isBoss);
    const traits = [];
    const addTrait = (condition, label) => {
        if (condition && !traits.includes(label)) traits.push(label);
    };

    addTrait(enemy.isFinalBoss, 'Jefe final');
    addTrait(enemy.isBoss, 'Jefe');
    addTrait(Boolean(enemy.affix?.label), enemy.affix?.label);
    addTrait(enemy.stealth || enemy.archetype === 'stealth', 'Sigilo');
    addTrait(enemy.barrierRatio > 0, 'Barrera');
    addTrait((enemy.armor || 0) >= 0.25 || enemy.archetype === 'tank' || enemy.archetype === 'shield', 'Blindaje');
    addTrait((enemy.statusResistance || 0) >= 0.25, 'Resiste control');
    addTrait(enemy.archetype === 'support' || enemy.healPower > 0, 'Cura');
    addTrait(enemy.archetype === 'summoner' || enemy.summonId, 'Invoca');
    addTrait(enemy.archetype === 'commander' || enemy.auraPower, 'Aura');
    addTrait(enemy.archetype === 'phaser', 'Fasea');
    addTrait(enemy.archetype === 'flying' || enemy.flying, 'Aereo');
    addTrait(enemy.archetype === 'runner' || Number(enemy.speed || 0) >= 85, 'Rapido');

    let counterId = 'dps';
    let counter = 'Dano estable';
    let counterDetail = 'Dano constante y buena posicion bastan contra esta amenaza.';
    if (enemy.isBoss) {
        counter = 'DPS sostenido';
        counterDetail = enemy.isFinalBoss
            ? 'Si el jefe final llega a la base pierdes; concentra dano, control y perforacion.'
            : 'Si el jefe llega a la base pierdes; sube dano y mantenlo controlado en curvas.';
    } else if (enemy.stealth || enemy.archetype === 'stealth' || enemy.archetype === 'phaser') {
        counterId = 'detection';
        counter = 'Deteccion';
        counterDetail = 'Requiere heroes con vision de sigilo; sin deteccion puede cruzar sin recibir foco.';
    } else if (enemy.archetype === 'support' || enemy.healPower > 0) {
        counterId = 'focus';
        counter = 'Foco al soporte';
        counterDetail = 'Cura o protege a la oleada; priorizalo antes que tanques y soldados.';
    } else if (enemy.archetype === 'summoner' || enemy.summonId) {
        counterId = 'focus';
        counter = 'Corta invocador';
        counterDetail = 'Genera refuerzos; eliminarlo temprano reduce la saturacion del camino.';
    } else if (enemy.archetype === 'commander' || enemy.auraPower) {
        counterId = 'focus';
        counter = 'Elimina aura';
        counterDetail = 'Potencia enemigos cercanos; cae primero para bajar la presion general.';
    } else if ((enemy.armor || 0) >= 0.25 || enemy.barrierRatio > 0 || ['tank', 'shield'].includes(enemy.archetype)) {
        counterId = 'piercing';
        counter = 'Perforacion';
        counterDetail = 'Blindaje o barrera reducen dano plano; usa perforacion, armor break o criticos altos.';
    } else if (enemy.archetype === 'runner' || Number(enemy.speed || 0) >= 85) {
        counterId = 'control';
        counter = 'Control';
        counterDetail = 'Velocidad alta; slow, stun o web en curvas protege la base.';
    } else if (enemy.archetype === 'flying' || enemy.flying) {
        counterId = 'reach';
        counter = 'Alcance';
        counterDetail = 'Amenaza de ruta larga; conviene rango alto, cadenas o cobertura cruzada.';
    }

    const danger = enemy.isBoss || threat >= 5 ? 'critical' : threat >= 4 ? 'high' : threat >= 3 ? 'guarded' : 'low';
    return {
        name: enemy.name || 'Enemigo',
        initial: (enemy.name || '?').charAt(0).toUpperCase(),
        roleLabel,
        traits: traits.slice(0, 4),
        counterId,
        counter,
        counterDetail,
        danger,
        threat,
        pips: '!'.repeat(threat)
    };
}
