export const TARGETING_PRIORITIES = ['Primero', 'Último', 'Fuerte', 'Débil', 'Rápido', 'Sigilo', 'Jefe'];

export const TARGETING_PRIORITY_COPY = {
    Primero: { label: '1ro', icon: 'fa-route', description: 'prioriza al enemigo mas avanzado' },
    Último: { label: 'Ult', icon: 'fa-backward', description: 'limpia rezagados e invocaciones' },
    Fuerte: { label: 'Fte', icon: 'fa-shield-alt', description: 'enfoca tanques y elites' },
    Débil: { label: 'Deb', icon: 'fa-bolt', description: 'remata objetivos bajos' },
    Rápido: { label: 'Rap', icon: 'fa-running', description: 'corta corredores' },
    Sigilo: { label: 'Sig', icon: 'fa-eye', description: 'busca infiltrados detectables' },
    Jefe: { label: 'Jfe', icon: 'fa-skull', description: 'prioriza jefes y amenaza alta' }
};

export function getNextTargetingPriority(current = 'Primero', direction = 1) {
    const index = TARGETING_PRIORITIES.indexOf(current);
    const safeIndex = index >= 0 ? index : 0;
    const offset = Number(direction || 1);
    const nextIndex = (safeIndex + offset + TARGETING_PRIORITIES.length) % TARGETING_PRIORITIES.length;
    return TARGETING_PRIORITIES[nextIndex];
}

export function buildTargetingControlState(current = 'Primero') {
    const priority = TARGETING_PRIORITIES.includes(current) ? current : 'Primero';
    const next = getNextTargetingPriority(priority);
    const copy = TARGETING_PRIORITY_COPY[priority];
    return {
        priority,
        next,
        label: copy.label,
        icon: copy.icon,
        description: copy.description,
        tooltip: `Objetivo: ${priority}; ${copy.description}. Click: ${next}.`,
        ariaLabel: `Cambiar prioridad de objetivo de ${priority} a ${next}`
    };
}
