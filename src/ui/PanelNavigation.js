export const PANEL_NAV_ITEMS = [
    { id: 'profile', label: 'Perfil', icon: 'fa-id-card' },
    { id: 'radar', label: 'Radar', icon: 'fa-satellite-dish' },
    { id: 'collection', label: 'Colección', icon: 'fa-grip' },
    { id: 'inventory', label: 'Inventario', icon: 'fa-box-open' },
    { id: 'shop', label: 'Tienda', icon: 'fa-shopping-cart' },
    { id: 'skins', label: 'Skins', title: 'Tienda de skins', icon: 'fa-shirt' },
    { id: 'map', label: 'Mapa', icon: 'fa-map-marked-alt' },
    { id: 'settings', label: 'Ajustes', icon: 'fa-cog' }
];

export const PANEL_TITLES = Object.fromEntries(PANEL_NAV_ITEMS.map((item) => [item.id, item.title || item.label]));

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function getPanelTitle(type = '') {
    return PANEL_TITLES[type] || type;
}

export function isPanelNavigationType(type = '') {
    return Object.prototype.hasOwnProperty.call(PANEL_TITLES, type);
}

export function buildPanelNavigationMarkup(activeType = '') {
    const buttons = PANEL_NAV_ITEMS.map((item) => {
        const active = item.id === activeType;
        const title = item.title || item.label;
        const label = 'Abrir ' + title;
        return '<button class="panel-modal-nav-btn ' + (active ? 'active' : '') + '" type="button" data-panel-nav="' + escapeHtml(item.id) + '" aria-label="' + escapeHtml(label) + '" title="' + escapeHtml(title) + '" data-tooltip="' + escapeHtml(label) + '" aria-current="' + (active ? 'page' : 'false') + '"><i class="fas ' + escapeHtml(item.icon) + '"></i><span>' + escapeHtml(item.label) + '</span></button>';
    }).join('');
    return '<nav class="panel-modal-nav" aria-label="Navegación de paneles">' + buttons + '</nav>';
}
