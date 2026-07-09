import { getSupportedLocales, translate } from '../utils/I18n.js';

const BOOLEAN_SETTINGS = [
    ['ranges', 'toggle-ranges', 'showRanges'],
    ['grid', 'toggle-grid', 'showGrid'],
    ['combatText', 'toggle-combat-text', 'combatText'],
    ['audio', 'toggle-audio', 'gameAudio'],
    ['highContrast', 'toggle-contrast', 'highContrast'],
    ['reduceMotion', 'toggle-motion', 'reduceMotion']
];

const VOLUME_SETTINGS = [
    ['masterVolume', 'master', 'masterVolume'],
    ['musicVolume', 'music', 'musicVolume'],
    ['sfxVolume', 'sfx', 'sfxVolume']
];

const KEY_BINDINGS = [
    ['pause', 'pause'],
    ['speed', 'speed'],
    ['nextWave', 'nextWave'],
    ['cancel', 'cancel'],
    ['targeting', 'targeting'],
    ['upgrade', 'upgrade']
];

const UI_SCALES = [['compact', 'compact'], ['normal', 'normal'], ['large', 'large']];

export class SettingsPanel {
    constructor(ui) {
        this.ui = ui;
    }

    render(title = 'Ajustes') {
        const settings = this.ui.game.progression.state.settings;
        const locale = settings.locale || 'es';
        const t = (key) => translate(key, locale);
        const panelTitle = title === 'Ajustes' ? t('settings') : title;

        this.ui.panelContent.innerHTML = `
            <h2>${panelTitle}</h2>
            <div class="settings-layout">
                <section class="settings-section">
                    <h3>${t('gameplayAccessibility')}</h3>
                    <div class="settings-grid">
                        ${BOOLEAN_SETTINGS.map(([key, id, labelKey]) => `<label class="setting-toggle"><input type="checkbox" id="${id}" data-setting="${key}" ${settings[key] ? 'checked' : ''}><span>${t(labelKey)}</span></label>`).join('')}
                    </div>
                </section>
                <section class="settings-section">
                    <h3>${t('controls')}</h3>
                    <div class="key-binding-grid">${KEY_BINDINGS.map(([key, labelKey]) => `<label><span>${t(labelKey)}</span><input data-key-binding="${key}" maxlength="12" value="${settings.keyBindings[key]}"></label>`).join('')}</div>
                    <small>${t('controllerHint')}</small>
                </section>
                <section class="settings-section">
                    <h3>${t('language')}</h3>
                    <div class="ui-scale-switch" role="group" aria-label="${t('language')}">
                        ${getSupportedLocales().map((supportedLocale) => `<button data-locale="${supportedLocale}" class="${settings.locale === supportedLocale ? 'active' : ''}">${supportedLocale.toUpperCase()}</button>`).join('')}
                    </div>
                </section>
                <section class="settings-section">
                    <h3>${t('saveData')}</h3>
                    <div class="settings-actions"><button class="btn-primary ghost" id="export-save"><i class="fas fa-download"></i> ${t('export')}</button><button class="btn-primary ghost" id="import-save"><i class="fas fa-upload"></i> ${t('import')}</button><button class="btn-primary ghost" id="export-replay"><i class="fas fa-film"></i> ${t('replay')}</button><input id="import-save-file" type="file" accept="application/json,.json" hidden></div>
                </section>
                <section class="settings-section">
                    <h3>${t('audioMix')}</h3>
                    <div class="audio-mixer">
                        ${VOLUME_SETTINGS.map(([key, bus, labelKey]) => `<label class="volume-control"><span>${t(labelKey)}</span><input type="range" min="0" max="100" value="${Math.round(settings[key] * 100)}" data-setting="${key}" data-bus="${bus}"><output>${Math.round(settings[key] * 100)}%</output></label>`).join('')}
                    </div>
                </section>
                <section class="settings-section">
                    <h3>${t('uiSize')}</h3>
                    <div class="ui-scale-switch" role="group" aria-label="${t('uiSize')}">
                        ${UI_SCALES.map(([value, labelKey]) => `<button data-scale="${value}" class="${settings.uiScale === value ? 'active' : ''}" aria-pressed="${settings.uiScale === value}">${t(labelKey)}</button>`).join('')}
                    </div>
                </section>
                <div class="settings-actions">
                    <button class="btn-primary ghost" id="reset-placement"><i class="fas fa-ban"></i> ${t('cancelPlacement')}</button>
                    <button class="btn-primary danger" id="clear-run"><i class="fas fa-rotate-left"></i> ${t('restartLevel')}</button>
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
                this.render();
            });
        });
        this.ui.panelContent.querySelectorAll('[data-key-binding]').forEach((input) => input.addEventListener('change', () => {
            if (!game.progression.updateKeyBinding(input.dataset.keyBinding, input.value)) this.render();
        }));
        this.ui.panelContent.querySelectorAll('[data-locale]').forEach((button) => button.addEventListener('click', () => {
            game.progression.updateSetting('locale', button.dataset.locale);
            this.render();
        }));
        document.getElementById('export-save')?.addEventListener('click', () => {
            const blob = new Blob([game.progression.exportSave()], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `tower-defense-marvel-save-v${game.progression.state.version}.json`;
            link.click();
            URL.revokeObjectURL(link.href);
        });
        document.getElementById('export-replay')?.addEventListener('click', () => {
            const blob = new Blob([game.replaySystem.exportReplay()], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `marvel-td-replay-${game.currentLevel.id}.json`;
            link.click();
            URL.revokeObjectURL(link.href);
        });
        const importFile = document.getElementById('import-save-file');
        document.getElementById('import-save')?.addEventListener('click', () => importFile?.click());
        importFile?.addEventListener('change', async () => {
            const file = importFile.files?.[0];
            if (!file) return;
            const result = game.progression.importSave(await file.text());
            this.ui.showToast(result.ok ? 'Guardado importado' : result.reason, result.ok ? 'success' : 'warning');
            if (result.ok) this.render();
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

export { BOOLEAN_SETTINGS, VOLUME_SETTINGS, KEY_BINDINGS };
