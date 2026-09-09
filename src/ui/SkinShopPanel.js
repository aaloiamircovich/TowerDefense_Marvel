function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export class SkinShopPanel {
    constructor(ui) {
        this.ui = ui;
    }

    render(title = 'Skins') {
        this.ui.panelContent.innerHTML = `
            <div class="panel-title-row">
                <h2>${escapeHtml(title)}</h2>
            </div>
            <section class="skins-shop-panel skins-shop-panel--empty" aria-label="Sin skins disponibles">
                <i class="fas fa-shirt"></i>
                <strong>Sin skins disponibles</strong>
            </section>
        `;
    }
}
