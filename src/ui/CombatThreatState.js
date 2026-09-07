function getPathLength(path = []) {
    if (!Array.isArray(path) || path.length < 2) return 0;
    let total = 0;
    for (let index = 1; index < path.length; index++) {
        total += Math.hypot(path[index].x - path[index - 1].x, path[index].y - path[index - 1].y);
    }
    return total;
}

export function buildCombatPressureState(enemies = [], path = [], waveActive = false) {
    const active = enemies.filter((enemy) => enemy?.isAlive && !enemy.hasReachedEnd);
    if (!waveActive || active.length === 0) {
        return {
            id: 'clear',
            label: waveActive ? 'Ruta despejada' : 'Sin oleada',
            advice: waveActive ? 'Mantén la formación.' : 'Prepara la siguiente oleada.',
            progress: 0,
            activeCount: active.length,
            dangerCount: 0,
            leadEnemyName: '',
            signature: `clear:${waveActive}:${active.length}`
        };
    }

    const pathLength = getPathLength(path);
    const projected = active.map((enemy) => {
        const progress = pathLength > 0 ? Math.max(0, Math.min(1, (enemy.distanceTravelled || 0) / pathLength)) : 0;
        return { enemy, progress };
    }).sort((a, b) => b.progress - a.progress);

    const lead = projected[0];
    const dangerCount = projected.filter(({ progress }) => progress >= 0.78).length;
    const score = lead.progress + dangerCount * 0.08 + Math.min(0.16, active.length * 0.012);

    let state = { id: 'holding', label: 'Controlada', advice: 'Sostén daño y ahorra si puedes.' };
    if (score >= 0.92 || lead.progress >= 0.9) state = { id: 'critical', label: 'Base critica', advice: 'Pausa, mejora o reposiciona ya.' };
    else if (score >= 0.72 || dangerCount > 0) state = { id: 'warning', label: 'Presión alta', advice: 'Refuerza la base o activa control.' };
    else if (score >= 0.48) state = { id: 'watch', label: 'Vigilar ruta', advice: 'El frente avanza; prepara mejora.' };

    const progress = Math.round(lead.progress * 100);
    return {
        ...state,
        progress,
        activeCount: active.length,
        dangerCount,
        leadEnemyName: lead.enemy.name || 'Enemigo',
        signature: `${state.id}:${progress}:${active.length}:${dangerCount}:${lead.enemy.uid || lead.enemy.name || ''}`
    };
}

export function buildBossHudState(enemies = [], waveActive = false) {
    if (!waveActive) return null;
    const boss = (enemies || [])
        .filter((enemy) => enemy?.isAlive && !enemy.hasReachedEnd && enemy.isBoss)
        .sort((a, b) => (b.threat || 0) - (a.threat || 0) || (b.maxHp || 0) - (a.maxHp || 0))[0];
    if (!boss) return null;

    const maxHp = Math.max(1, Number(boss.maxHp || boss.hp || 1));
    const hp = Math.max(0, Math.min(maxHp, Number(boss.hp || 0)));
    const hpPct = Math.round(hp / maxHp * 100);
    const phase = boss.currentPhase || boss.phaseLabel || (boss.phases?.length ? 'Fase activa' : 'Fase inicial');
    return {
        id: boss.uid || boss.id || boss.name || 'boss',
        name: boss.name || boss.config?.name || 'Jefe',
        phase,
        isFinalBoss: Boolean(boss.isFinalBoss || boss.config?.isFinalBoss),
        hp,
        maxHp,
        hpPct,
        threat: Math.max(1, Number(boss.threat || 5)),
        critical: hpPct <= 30
    };
}

export function buildSpawnQueueState(queue = [], spawnTimer = 0, waveActive = false) {
    if (!waveActive || !queue?.length) return null;
    const next = queue[0]?.config || {};
    const delay = Math.max(0, Number(queue[0]?.delay || 0));
    const eta = Math.max(0, delay - Math.max(0, Number(spawnTimer || 0)));
    const threat = Math.max(1, Number(next.threat || 1));
    const danger = next.isBoss || threat >= 5 ? 'critical' : threat >= 4 ? 'high' : threat >= 3 ? 'guarded' : 'low';

    return {
        name: next.name || 'Enemigo',
        eta: Number(eta.toFixed(1)),
        remaining: queue.length,
        threat,
        danger,
        role: next.archetype || (next.isBoss ? 'boss' : 'soldier'),
        isBoss: Boolean(next.isBoss)
    };
}

export function buildPressureActionState(pressureState, heroes = [], credits = 0, levelCost = (level) => level * 120) {
    if (!pressureState || !['watch', 'warning', 'critical'].includes(pressureState.id)) return null;
    const deployed = heroes.filter((hero) => hero?.isAlive !== false);
    if (!deployed.length) {
        return {
            type: 'hint',
            label: 'Sin heroes desplegados',
            reason: 'Coloca defensa antes de que el frente llegue a la base.',
            signature: `hint:none:${pressureState.id}`
        };
    }

    const candidates = deployed.map((hero) => {
        const level = Number(hero.level || hero.config?.level || 1);
        const cost = Number(levelCost(level, 1));
        const stats = hero.getEffectiveStats?.() || hero;
        const damage = Number(stats.damage || hero.damage || 0);
        const fireRate = Number(stats.fireRate || hero.fireRate || 1);
        const range = Number(stats.range || hero.range || 100);
        const control = Number(hero.config?.teamMetrics?.control || hero.teamMetrics?.control || 0);
        const detection = hero.canSeeStealth || stats.canSeeStealth ? 1 : 0;
        const pressureBonus = pressureState.id === 'critical' ? control * 1.2 + range / 120 : control * 0.8;
        return {
            hero,
            cost,
            level,
            score: damage * fireRate + range / 4 + level * 8 + pressureBonus + detection * 10
        };
    }).sort((a, b) => b.score - a.score);

    const affordable = candidates.find((candidate) => candidate.cost <= credits);
    if (affordable) {
        const name = affordable.hero.name || affordable.hero.config?.name || affordable.hero.id || 'Heroe';
        return {
            type: 'upgrade',
            heroId: affordable.hero.id || affordable.hero.config?.id,
            heroName: name,
            cost: affordable.cost,
            label: `Mejorar ${name}`,
            reason: pressureState.id === 'critical' ? 'Respuesta recomendada para proteger la base.' : 'Refuerzo rapido antes de que escale.',
            signature: `upgrade:${affordable.hero.id || name}:${affordable.level}:${affordable.cost}:${Math.floor(credits)}`
        };
    }

    const cheapest = candidates.reduce((best, candidate) => !best || candidate.cost < best.cost ? candidate : best, null);
    const missing = Math.max(0, (cheapest?.cost || 0) - credits);
    return {
        type: 'hint',
        label: `Faltan $${Math.ceil(missing)}`,
        reason: 'Ahorra para la siguiente mejora clave.',
        signature: `hint:${cheapest?.hero?.id || 'none'}:${cheapest?.cost || 0}:${Math.floor(credits)}`
    };
}
