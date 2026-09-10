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

export function normalizeCssColor(value = '', fallback = 'var(--level-accent)') {
    const color = String(value || '').trim();
    if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
    if (/^rgba?\(\s*(\d{1,3}\s*,\s*){2}\d{1,3}\s*(,\s*(0|1|0?\.\d+))?\s*\)$/i.test(color)) return color;
    if (/^hsla?\(\s*-?\d{1,3}(deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*(0|1|0?\.\d+))?\s*\)$/i.test(color)) return color;
    if (/^var\(--[a-z0-9-]+\)$/i.test(color)) return color;
    return fallback;
}
