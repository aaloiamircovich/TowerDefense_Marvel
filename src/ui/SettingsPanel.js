const BOOLEAN_SETTINGS = [
    ['ranges', 'toggle-ranges', 'Mostrar rangos de héroes'],
    ['grid', 'toggle-grid', 'Mostrar cuadrícula táctica'],
    ['audio', 'toggle-audio', 'Audio del juego'],
    ['highContrast', 'toggle-contrast', 'Modo de alto contraste'],
    ['reduceMotion', 'toggle-motion', 'Reducir movimiento']
];

const VOLUME_SETTINGS = [
    ['masterVolume', 'master', 'Volumen general'],
    ['musicVolume', 'music', 'Música ambiental'],
    ['sfxVolume', 'sfx', 'Efectos y combate']
];

export class SettingsPanel {
    constructor(ui) {
        this.ui = ui;
    }

    render(title = 'Ajustes') {
        const settings = this.ui.game.progression.state.settings;
        this.ui.panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="settings-layout">
                <section class="settings-section">
                    <h3>Juego y accesibilidad</h3>
                    <div class="settings-grid">
                        ${BOOLEAN_SETTINGS.map(([key, id, label]) => `<label class="setting-toggle"><input type="checkbox" id="${id}" data-setting="${key}" ${settings[key] ? 'checked' : ''}><span>${label}</span></label>`).join('')}
                    </div>
                </section>
                <section class="settings-section">
                    <h3>Mezcla de audio</h3>
                    <div class="audio-mixer">
                        ${VOLUME_SETTINGS.map(([key, bus, label]) => `<label class="volume-control"><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(settings[key] * 100)}" data-setting="${key}" data-bus="${bus}"><output>${Math.round(settings[key] * 100)}%</output></label>`).join('')}
                    </div>
                </section>
                <section class="settings-section">
                    <h3>Tamaño de interfaz</h3>
                    <div class="ui-scale-switch" role="group" aria-label="Tamaño de interfaz">
                        ${[['compact', 'Compacta'], ['normal', 'Normal'], ['large', 'Grande']].map(([value, label]) => `<button data-scale="${value}" class="${settings.uiScale === value ? 'active' : ''}" aria-pressed="${settings.uiScale === value}">${label}</button>`).join('')}
                    </div>
                </section>
                <div class="settings-actions">
                    <button class="btn-primary ghost" id="reset-placement"><i class="fas fa-ban"></i> Cancelar colocación</button>
                    <button class="btn-primary danger" id="clear-run"><i class="fas fa-rotate-left"></i> Reiniciar nivel</button>
                </div>
            </div>
        `;
        this.bind();
    }

    bind() {
        const { game } = this.ui;
        this.ui.panelContent.querySelectorAll('input[type="checkbox"][data-setting]').forEach((input) => {
            input.addEventListener('change', () => {
                game.progression.updateSetting(input.dataset.setting, input.checked);
                this.ui.showToast(`${input.nextElementSibling.textContent}: ${input.checked ? 'activado' : 'desactivado'}`, 'info');
            });
        });
        this.ui.panelContent.querySelectorAll('.volume-control input').forEach((input) => {
            input.addEventListener('input', () => {
                const value = Number(input.value) / 100;
                game.progression.updateSetting(input.dataset.setting, value);
                input.nextElementSibling.value = `${input.value}%`;
            });
            input.addEventListener('change', () => game.audio?.play('ui'));
        });
        this.ui.panelContent.querySelectorAll('[data-scale]').forEach((button) => {
            button.addEventListener('click', () => {
                game.progression.updateSetting('uiScale', button.dataset.scale);
                this.render('Ajustes');
            });
        });
        document.getElementById('reset-placement')?.addEventListener('click', () => {
            game.inputManager.clearPlacement();
            this.ui.closePanel();
        });
        document.getElementById('clear-run')?.addEventListener('click', () => {
            game.loadLevel(game.currentLevel);
            this.ui.renderHeroRoster(game.activeTeam, (hero) => game.inputManager.setPlacementMode(hero));
            this.ui.closePanel();
        });
    }
}

export { BOOLEAN_SETTINGS, VOLUME_SETTINGS };
