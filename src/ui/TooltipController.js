export class TooltipController {
    constructor(root = document) {
        this.root = root;
        this.tooltip = root.createElement('div');
        this.tooltip.id = 'ui-tooltip';
        this.tooltip.setAttribute('role', 'tooltip');
        this.tooltip.className = 'hidden';
        root.body.appendChild(this.tooltip);
        root.addEventListener('pointerover', (event) => this.handleShow(event));
        root.addEventListener('focusin', (event) => this.handleShow(event));
        root.addEventListener('pointerout', (event) => this.handleHide(event));
        root.addEventListener('focusout', (event) => this.handleHide(event));
    }

    handleShow(event) {
        const target = event.target.closest?.('[data-tooltip]');
        if (!target) return;
        this.show(target, target.dataset.tooltip);
    }

    handleHide(event) {
        if (!event.target.closest?.('[data-tooltip]')) return;
        this.hide();
    }

    hide() {
        this.tooltip.classList.add('hidden');
    }

    show(target, text) {
        if (!text) return;
        this.tooltip.textContent = text;
        this.tooltip.classList.remove('hidden');
        const rect = target.getBoundingClientRect();
        const width = this.tooltip.offsetWidth;
        const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2));
        const top = rect.bottom + 8 < window.innerHeight - 48 ? rect.bottom + 8 : rect.top - this.tooltip.offsetHeight - 8;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${Math.max(8, top)}px`;
    }
}
