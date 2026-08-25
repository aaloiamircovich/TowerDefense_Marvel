import { getSupportedLocales, translate } from '../utils/I18n.js';
import { MUSIC_TRACKS } from '../audio/AudioManager.js';

const BOOLEAN_SETTINGS = [
    ['ranges', 'toggle-ranges', 'showRanges'],
    ['grid', 'toggle-grid', 'showGrid'],
    ['combatText', 'toggle-combat-text', 'combatText'],
    ['audio', 'toggle-audio', 'gameAudio'],
    ['highContrast', 'toggle-contrast', 'highContrast'],
    ['reduceMotion', 'toggle-motion', 'reduceMotion'],
    ['pixelArtCrisp', 'toggle-pixel-crisp', 'pixelArtCrisp'],
    ['reducedVfx', 'toggle-vfx', 'reducedVfx'],
    ['tutorialHints', 'toggle-tutorial', 'tutorialHints'],
    ['simplifiedUi', 'toggle-simple-ui', 'simplifiedUi'],
    ['showFps', 'toggle-fps', 'showFps']
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

    buildSummaryState(settings, locale, t) {
        const enabledOptions = BOOLEAN_SETTINGS.filter(([key]) => settings[key]).length;
        const masterVolume = Math.round((settings.masterVolume ?? 0) * 100);
        const currentTrack = MUSIC_TRACKS.find((track) => track.id === settings.musicTrackId)?.title || MUSIC_TRACKS[0]?.title || '-';
        const statusChips = [
            { key: 'locale', icon: 'fa-language', label: t('language'), value: locale.toUpperCase(), tone: 'neutral' },
            { key: 'uiScale', icon: 'fa-desktop', label: t('uiSize'), value: t(settings.uiScale || 'normal'), tone: 'neutral' },
            { key: 'audio', icon: 'fa-volume-high', label: t('gameAudio'), value: settings.audio ? t('enabled') : t('disabled'), tone: settings.audio ? 'ready' : 'muted' },
            { key: 'musicLoop', icon: 'fa-repeat', label: t('musicLoop'), value: settings.musicLoop ? t('enabled') : t('disabled'), tone: settings.musicLoop ? 'ready' : 'muted' },
            { key: 'adminMode', icon: 'fa-user-shield', label: t('adminMode'), value: settings.adminMode ? t('enabled') : t('disabled'), tone: settings.adminMode ? 'danger' : 'muted' }
        ];

        return { enabledOptions, masterVolume, currentTrack, statusChips };
    }

    refreshSummary() {
        const settings = this.ui.game.progression.state.settings;
        const locale = settings.locale || 'es';
        const t = (key) => translate(key, locale);
        const summary = this.buildSummaryState(settings, locale, t);
        const root = this.ui.panelContent;
        const write = (selector, value) => {
            const node = root.querySelector?.(selector);
            if (node) node.textContent = value;
        };

        write('[data-settings-summary="activeOptions"]', `${summary.enabledOptions}/${BOOLEAN_SETTINGS.length}`);
        write('[data-settings-summary="masterVolume"]', `${summary.masterVolume}%`);
        write('[data-settings-summary="currentTrack"]', summary.currentTrack);
        summary.statusChips.forEach((chip) => {
            write(`[data-settings-status="${chip.key}"]`, chip.value);
            const chipNode = root.querySelector?.(`[data-settings-status-chip="${chip.key}"]`);
            chipNode?.classList?.remove('neutral', 'ready', 'muted', 'danger');
            chipNode?.classList?.add(chip.tone);
        });
    }

    render(title = 'Ajustes') {
        const settings = this.ui.game.progression.state.settings;
        const locale = settings.locale || 'es';
        const t = (key) => translate(key, locale);
        const panelTitle = title === 'Ajustes' ? t('settings') : title;
        const summary = this.buildSummaryState(settings, locale, t);

        this.ui.panelContent.innerHTML = `
            <section class="settings-command-header">
                <div>
                    <span class="briefing-kicker">${t('settings')}</span>
                    <h2>${panelTitle}</h2>
                    <p>${t('settingsBrief')}</p>
                </div>
                <div class="settings-readout">
                    <span><small>${t('activeOptions')}</small><b data-settings-summary="activeOptions">${summary.enabledOptions}/${BOOLEAN_SETTINGS.length}</b></span>
                    <span><small>${t('masterAudio')}</small><b data-settings-summary="masterVolume">${summary.masterVolume}%</b></span>
                    <span><small>${t('currentTrack')}</small><b data-settings-summary="currentTrack">${summary.currentTrack}</b></span>
                </div>
                <div class="settings-status-strip" aria-label="${t('settings')}">
                    ${summary.statusChips.map((chip) => `<span class="settings-status-chip ${chip.tone}" data-settings-status-chip="${chip.key}"><i class="fas ${chip.icon}"></i><small>${chip.label}</small><b data-settings-status="${chip.key}">${chip.value}</b></span>`).join('')}
                </div>
            </section>
            <div class="settings-layout settings-layout--compact">
                <section class="settings-section settings-section--toggles">
                    <h3>${t('gameplayAccessibility')}</h3>
                    <div class="settings-grid settings-grid--compact">
                        ${BOOLEAN_SETTINGS.map(([key, id, labelKey]) => `<label class="setting-toggle"><input type="checkbox" id="${id}" data-setting="${key}" aria-label="${t(labelKey)}" ${settings[key] ? 'checked' : ''}><span>${t(labelKey)}</span></label>`).join('')}
                    </div>
                </section>
                <section class="settings-section">
                    <h3>${t('controls')}</h3>
                    <div class="key-binding-grid">${KEY_BINDINGS.map(([key, labelKey]) => `<label><span>${t(labelKey)}</span><input data-key-binding="${key}" maxlength="12" value="${settings.keyBindings[key]}" aria-label="${t(labelKey)}"></label>`).join('')}</div>
                    <small>${t('controllerHint')}</small>
                </section>
                <section class="settings-section">
                    <h3>${t('audioMix')}</h3>
                    <div class="audio-mixer">
                        ${VOLUME_SETTINGS.map(([key, bus, labelKey]) => `<label class="volume-control"><span>${t(labelKey)}</span><input type="range" min="0" max="100" value="${Math.round(settings[key] * 100)}" data-setting="${key}" data-bus="${bus}" aria-label="${t(labelKey)}"><output>${Math.round(settings[key] * 100)}%</output></label>`).join('')}
                    </div>
                    <div class="music-picker">
                        <label><span>${t('musicTrack')}</span><select id="music-track-select" aria-label="${t('musicTrack')}">${MUSIC_TRACKS.map((track) => `<option value="${track.id}" ${settings.musicTrackId === track.id ? 'selected' : ''}>${track.title}</option>`).join('')}</select></label>
                        <label class="setting-toggle"><input type="checkbox" id="toggle-music-loop" aria-label="${t('musicLoop')}" ${settings.musicLoop ? 'checked' : ''}><span>${t('musicLoop')}</span></label>
                    </div>
                </section>
                <section class="settings-section settings-section--interface">
                    <h3>${t('language')} / ${t('uiSize')}</h3>
                    <div class="settings-split-controls">
                        <div>
                            <span>${t('language')}</span>
                            <div class="ui-scale-switch" role="group" aria-label="${t('language')}">
                                ${getSupportedLocales().map((supportedLocale) => `<button data-locale="${supportedLocale}" class="${settings.locale === supportedLocale ? 'active' : ''}" type="button" aria-pressed="${settings.locale === supportedLocale}" aria-label="${t('language')} ${supportedLocale.toUpperCase()}">${supportedLocale.toUpperCase()}</button>`).join('')}
                            </div>
                        </div>
                        <div>
                            <span>${t('uiSize')}</span>
                            <div class="ui-scale-switch" role="group" aria-label="${t('uiSize')}">
                                ${UI_SCALES.map(([value, labelKey]) => `<button data-scale="${value}" class="${settings.uiScale === value ? 'active' : ''}" type="button" aria-pressed="${settings.uiScale === value}" aria-label="${t('uiSize')} ${t(labelKey)}">${t(labelKey)}</button>`).join('')}
                            </div>
                        </div>
                    </div>
                </section>
                <section class="settings-section">
                    <h3>${t('saveData')}</h3>
                    <div class="settings-actions"><button class="btn-primary ghost" id="export-save" type="button" aria-label="${t('export')}"><i class="fas fa-download"></i> ${t('export')}</button><button class="btn-primary ghost" id="import-save" type="button" aria-label="${t('import')}"><i class="fas fa-upload"></i> ${t('import')}</button><button class="btn-primary ghost" id="export-replay" type="button" aria-label="${t('replay')}"><i class="fas fa-film"></i> ${t('replay')}</button><button class="btn-primary danger" id="reset-all-game" type="button" aria-label="${t('resetAllGame')}"><i class="fas fa-trash"></i> ${t('resetAllGame')}</button><input id="import-save-file" type="file" accept="application/json,.json" hidden></div>
                </section>
                <section class="settings-section admin-settings ${settings.adminMode ? 'admin-active' : ''}">
                    <h3>${t('adminMode')}</h3>
                    <p>${settings.adminMode ? t('adminModeActive') : t('adminModeHint')}</p>
                    <div class="settings-actions">
                        ${settings.adminMode
                            ? `<button class="btn-primary danger" id="disable-admin-mode" type="button" aria-label="${t('disableAdmin')}"><i class="fas fa-lock"></i> ${t('disableAdmin')}</button>`
                            : `<input id="admin-password" type="password" inputmode="numeric" maxlength="8" placeholder="${t('adminPassword')}" aria-label="${t('adminPassword')}"><button class="btn-primary ghost" id="enable-admin-mode" type="button" aria-label="${t('enableAdmin')}"><i class="fas fa-unlock"></i> ${t('enableAdmin')}</button>`}
                    </div>
                </section>
                <section class="settings-section settings-section--quick">
                    <h3>${t('restartLevel')}</h3>
                    <div class="settings-actions settings-actions--inline">
                    <button class="btn-primary ghost" id="reset-placement" type="button" aria-label="${t('cancelPlacement')}"><i class="fas fa-ban"></i> ${t('cancelPlacement')}</button>
                    <button class="btn-primary danger" id="clear-run" type="button" aria-label="${t('restartLevel')}"><i class="fas fa-rotate-left"></i> ${t('restartLevel')}</button>
                    </div>
                </section>
            </div>
        `;
        this.bind();
    }

    bind() {
        const { game } = this.ui;
        const locale = game.progression.state.settings.locale || 'es';
        const t = (key) => translate(key, locale);
        this.ui.panelContent.querySelectorAll('input[type="checkbox"][data-setting]').forEach((input) => {
            input.addEventListener('change', () => {
                const label = input.nextElementSibling.textContent;
                game.progression.updateSetting(input.dataset.setting, input.checked);
                this.ui.showToast(`${label}: ${input.checked ? 'activado' : 'desactivado'}`, 'info');
                this.render();
            });
        });
        this.ui.panelContent.querySelectorAll('.volume-control input').forEach((input) => {
            input.addEventListener('input', () => {
                const value = Number(input.value) / 100;
                game.progression.updateSetting(input.dataset.setting, value);
                input.nextElementSibling.value = `${input.value}%`;
                this.refreshSummary();
            });
            input.addEventListener('change', () => game.audio?.play('ui'));
        });
        document.getElementById('music-track-select')?.addEventListener('change', (event) => {
            game.audio?.unlock?.();
            game.progression.updateSetting('musicTrackId', event.target.value);
            game.audio?.play('ui');
            this.refreshSummary();
        });
        document.getElementById('toggle-music-loop')?.addEventListener('change', (event) => {
            game.progression.updateSetting('musicLoop', event.target.checked);
            game.audio?.play('ui');
            this.refreshSummary();
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
        document.getElementById('reset-all-game')?.addEventListener('click', async () => {
            const message = translate('resetAllConfirm', game.progression.state.settings.locale || 'es');
            const confirmed = window.showGameConfirm
                ? await window.showGameConfirm({
                    title: 'Reiniciar progreso',
                    message,
                    confirmLabel: 'Si, borrar',
                    cancelLabel: 'Cancelar',
                    tone: 'danger'
                })
                : window.confirm(message);
            if (!confirmed) return;
            game.progression.resetAllProgress();
            window.location.reload();
        });
        document.getElementById('enable-admin-mode')?.addEventListener('click', () => {
            const password = document.getElementById('admin-password')?.value || '';
            const result = game.progression.enableAdminMode(password);
            this.ui.showToast(result.ok ? t('adminUnlocked') : result.reason, result.ok ? 'success' : 'warning');
            if (result.ok) this.render();
        });
        document.getElementById('disable-admin-mode')?.addEventListener('click', () => {
            game.progression.disableAdminMode();
            this.ui.showToast(t('adminDisabled'), 'info');
            this.render();
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
