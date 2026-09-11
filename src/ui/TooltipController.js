export class TooltipController {
    constructor(root = document) {
        this.root = root;
        this.target = null;
        this.tooltip = root.createElement('div');
        this.tooltip.id = 'ui-tooltip';
        this.tooltip.setAttribute('role', 'tooltip');
        this.tooltip.className = 'hidden';
        root.body.appendChild(this.tooltip);
        root.addEventListener('pointerover', (event) => this.handleShow(event));
        root.addEventListener('focusin', (event) => this.handleShow(event));
        root.addEventListener('pointerout', (event) => this.handleHide(event));
        root.addEventListener('focusout', (event) => this.handleHide(event));
        root.addEventListener('scroll', () => this.hide(), true);
        root.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.hide();
        });
        root.defaultView?.addEventListener('resize', () => this.hide());
    }

    handleShow(event) {
        const target = event.target.closest?.('[data-tooltip]');
        if (!target) return;
        if (this.target === target && !this.tooltip.classList.contains('hidden')) return;
        this.show(target, target.dataset.tooltip);
    }

    handleHide(event) {
        const target = event.target.closest?.('[data-tooltip]');
        if (!target || target !== this.target || target.contains(event.relatedTarget)) return;
        this.hide();
    }

    hide() {
        this.tooltip.classList.add('hidden');
        if (this.target) {
            const descriptions = (this.target.getAttribute('aria-describedby') || '')
                .split(/\s+/).filter((id) => id && id !== this.tooltip.id);
            if (descriptions.length) this.target.setAttribute('aria-describedby', descriptions.join(' '));
            else this.target.removeAttribute('aria-describedby');
            this.target = null;
        }
    }

    show(target, text) {
        this.hide();
        if (!text) return;
        this.target = target;
        const descriptions = (target.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        target.setAttribute('aria-describedby', [...new Set([...descriptions, this.tooltip.id])].join(' '));
        this.tooltip.textContent = text;
        this.tooltip.classList.remove('hidden');
        const rect = target.getBoundingClientRect();
        const width = this.tooltip.offsetWidth;
        const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2));
        const height = this.tooltip.offsetHeight;
        const top = rect.bottom + 8 + height <= window.innerHeight - 8 ? rect.bottom + 8 : rect.top - height - 8;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`;
    }
}
