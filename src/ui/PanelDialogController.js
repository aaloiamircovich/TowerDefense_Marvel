import { getPanelTitle, isPanelNavigationType } from './PanelNavigation.js';

export class PanelDialogController {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.buildPanelNavigationMarkup = builders.buildPanelNavigationMarkup || (() => '');
    }

    handleHubButtonClick(type) {
        const closeButtonHidden = document.getElementById('close-panel-btn')?.classList.contains('hidden');
        const panelOpen = !this.ui.overlay?.classList.contains('hidden');
        if (type && this.ui.activePanelType === type && panelOpen && !closeButtonHidden) {
            this.ui.closePanel();
            return;
        }
        this.ui.openPanel(type);
    }

    openPanel(type) {
        this.ui.tooltipController.hide();
        this.ui.lastFocusedElement = document.activeElement;
        this.ui.game.pause();
        this.ui.showPanelOverlay(true);
        this.ui.game.audio?.play('ui');
        this.ui.renderPanel(type);
        window.requestAnimationFrame(() => document.getElementById('close-panel-btn')?.focus());
    }

    closePanel() {
        this.ui.shopPanel?.clearGachaRevealTimers?.();
        this.ui.hidePanelOverlay();
        this.ui.setActiveHubButton(null);
        if (!document.body.classList.contains('title-screen-active') && !this.ui.game.isManuallyPaused && !this.ui.game.isGameOver) {
            this.ui.game.start();
        }
        const restoreFocus = this.ui.lastFocusedElement;
        this.ui.lastFocusedElement = null;
        if (restoreFocus?.isConnected !== false) restoreFocus?.focus?.();
    }

    setActiveHubButton(type = null) {
        this.ui.activePanelType = type || null;
        document.querySelectorAll?.('.hub-btn').forEach((button) => {
            const active = Boolean(type && button.dataset.panel === type);
            button.classList.toggle('active', active);
            button.setAttribute('aria-current', active ? 'dialog' : 'false');
            button.setAttribute('aria-expanded', String(active));
            button.setAttribute('aria-controls', 'panel-container');
        });
    }

    showPanelOverlay(showCloseButton = true) {
        document.body.classList.add('panel-open');
        this.ui.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.toggle('hidden', !showCloseButton);
    }

    hidePanelOverlay() {
        this.ui.overlay.classList.add('hidden');
        document.body.classList.remove('panel-open');
    }

    handlePanelBackdropPointerDown(event) {
        if (event.target !== this.ui.overlay) return;
        if (document.getElementById('close-panel-btn')?.classList.contains('hidden')) return;
        event.preventDefault();
        this.ui.closePanel();
    }

    handleDialogKeydown(event) {
        if (this.ui.overlay.classList.contains('hidden')) return;
        if (event.key === 'Escape' && !document.getElementById('close-panel-btn')?.classList.contains('hidden')) {
            event.preventDefault();
            this.ui.closePanel();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [...this.ui.overlay.querySelectorAll('button:not([disabled]), select, input, [tabindex="0"]')]
            .filter((element) => !element.classList.contains('hidden'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    setPanelDialogLabel(title = 'Panel del juego') {
        const dialog = document.getElementById('panel-container');
        dialog?.setAttribute('aria-label', title || 'Panel del juego');
    }

    renderPanel(type) {
        const title = getPanelTitle(type);
        this.ui.setPanelDialogLabel(title);
        this.ui.setActiveHubButton(isPanelNavigationType(type) ? type : null);

        let result;
        if (type === 'shop') result = this.ui.renderShop(title);
        else if (type === 'skins') result = this.ui.renderSkinShop(title);
        else if (type === 'radar') result = this.ui.renderRadarPanel(title);
        else if (type === 'collection') result = this.ui.teamBuilderPanel.render('Constructor de equipo');
        else if (type === 'inventory') result = this.ui.inventoryPanel.render(title);
        else if (type === 'map') result = this.ui.renderMap(title);
        else if (type === 'settings') result = this.ui.renderSettings(title);
        else result = this.ui.renderProfile(title);

        this.ui.renderPanelNavigation(type);
        return result;
    }

    renderPanelNavigation(activeType = '') {
        if (!this.ui.panelContent || !isPanelNavigationType(activeType)) return;
        this.ui.panelContent.querySelector?.('.panel-modal-nav')?.remove?.();
        this.ui.panelContent.insertAdjacentHTML?.('afterbegin', this.buildPanelNavigationMarkup(activeType));
        this.ui.panelContent.querySelectorAll?.('[data-panel-nav]')?.forEach((button) => {
            button.addEventListener('click', () => {
                const nextType = button.dataset.panelNav;
                if (!nextType || nextType === this.ui.activePanelType) return;
                this.ui.game.audio?.play('ui');
                this.ui.renderPanel(nextType);
                window.requestAnimationFrame(() => this.ui.panelContent?.querySelector?.('.panel-modal-nav-btn.active')?.focus?.());
            });
        });
    }
}
