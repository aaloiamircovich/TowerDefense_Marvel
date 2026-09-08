export const ENEMY_CATEGORY_COLORS = {
    Tecnológico: '#40c9ff',
    Místico: '#b865ff',
    Urbano: '#e63946',
    Cósmico: '#ff8bd1',
    Mutante: '#c7f464'
};

export function buildWaveEnemyCardModel(enemy = {}, intel = {}, traitPreview = {}) {
    const name = intel.name || enemy.name || 'Enemigo';
    const roleLabel = intel.roleLabel || 'Soldado';
    const counter = intel.counter || 'DPS';
    const threat = Math.max(1, Math.round(Number(intel.threat || enemy.threat || 1)));
    const traits = [
        ...(traitPreview.visible || []),
        Number(traitPreview.overflow || 0) > 0 ? `+${traitPreview.overflow}` : ''
    ].filter(Boolean);
    const affix = enemy.affix?.label ? `${enemy.affix.label} · ` : '';
    return {
        name,
        danger: intel.danger || 'low',
        color: ENEMY_CATEGORY_COLORS[enemy.category] || '#fca311',
        tooltip: intel.counterDetail || '',
        title: `${name} | ${roleLabel} | ${counter} | Amenaza ${threat}/5`,
        ariaLabel: `${name}. ${roleLabel}. Respuesta: ${counter}. Amenaza ${threat} de 5.`,
        portrait: enemy.visual?.portrait || enemy.sprite || '',
        initial: intel.initial || name.charAt(0) || '?',
        countLabel: `x${enemy.previewCount || 1}`,
        roleLine: `${roleLabel} | ${intel.pips || ''}`.trim(),
        traits,
        traitTitle: traitPreview.title || '',
        counter,
        metaLine: `${affix}${enemy.stealth ? 'Sigilo · ' : ''}${'◆'.repeat(threat)}`
    };
}
