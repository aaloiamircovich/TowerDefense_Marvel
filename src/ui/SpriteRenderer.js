import { escapeHtml } from './HtmlSanitizer.js';

export const ASSET_VERSION = 'evolution-enemy-sprites-20260812';

export function versionAssetSource(source, assetVersion = ASSET_VERSION) {
    if (!source?.startsWith?.('assets/images/')) return source;
    return `${source}${source.includes('?') ? '&' : '?'}v=${assetVersion}`;
}

export function renderSpriteMarkup(src, name = '', assetVersion = ASSET_VERSION) {
    const label = String(name || 'Sprite');
    const fallback = label.charAt(0) || '?';
    const safeLabel = escapeHtml(label);
    const safeFallback = escapeHtml(fallback);
    if (!src) return `<span class="sprite-fallback">${safeFallback}</span>`;
    return `<img src="${escapeHtml(versionAssetSource(src, assetVersion))}" alt="${safeLabel}" data-fallback="${safeFallback}" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'sprite-fallback', textContent: this.dataset.fallback || '?' }))">`;
}
