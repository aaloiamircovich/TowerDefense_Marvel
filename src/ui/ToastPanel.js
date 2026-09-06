export class ToastPanel {
    constructor(ui) {
        this.ui = ui;
    }

    show(message, type = 'info') {
        if (!this.ui.toastEl) return;
        window.clearTimeout(this.ui.toastTimer);
        this.ui.toastEl.textContent = message;
        this.ui.toastEl.className = `toast ${type}`;
        if (type === 'success') this.ui.game.audio?.play('confirm');
        if (type === 'warning') this.ui.game.audio?.play('warning');
        if (type === 'reward') this.ui.game.audio?.play('reward');
        this.ui.toastTimer = window.setTimeout(() => this.ui.toastEl.classList.add('hidden'), 2200);
    }
}
