export function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function normalizeClassToken(value = '', fallback = 'neutral') {
    const token = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return token && /^[a-z][a-z0-9-]*$/.test(token) ? token : fallback;
}

export function normalizeIconClass(value = '', fallback = 'fa-circle-info') {
    const tokens = String(value || '')
        .split(/\s+/)
        .filter((token) => /^(fa[srb]?|fa-[a-z0-9-]+)$/i.test(token));
    return tokens.length ? tokens.join(' ') : fallback;
}

export function clampPercent(value = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function normalizeControlTag(value = 'div') {
    return value === 'button' ? 'button' : 'div';
}
