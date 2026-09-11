import { getSupportedLocales, translate } from '../utils/I18n.js';
import { MUSIC_TRACKS } from '../audio/AudioManager.js';
import { clampPercent, escapeHtml, normalizeClassToken, normalizeIconClass } from './HtmlSanitizer.js';

const BOOLEAN_SETTINGS = [
    ['ranges', 'toggle-ranges', 'showRanges'],
    ['grid', 'toggle-grid', 'showGrid'],
    ['combatText', 'toggle-combat-text', 'combatText'],
    ['audio', 'toggle-audio', 'gameAudio'],
    ['highContrast', 'toggle-contrast', 'highContrast'],
    ['reduceMotion', 'toggle-motion', 'reduceMotion'],
    ['pixelArtCrisp', 'toggle-pixel-crisp', 'pixelArtCrisp'],
    ['reducedVfx', 'toggle-vfx', 'reducedVfx'],
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
        const masterVolume = clampPercent((settings.masterVolume ?? 0) * 100);
        const currentTrack = MUSIC_TRACKS.find((track) => track.id === settings.musicTrackId)?.title || MUSIC_TRACKS[0]?.title || '-';
        const statusChips = [
            { key: 'locale', icon: 'fa-language', label: t('language'), value: locale.toUpperCase(), tone: 'neutral' },
            { key: 'uiScale', icon: 'fa-desktop', label: t('uiSize'), value: t(settings.uiScale || 'normal'), tone: 'neutral' },
            { key: 'audio', icon: 'fa-volume-high', label: t('gameAudio'), value: settings.audio ? t('enabled') : t('disabled'), tone: settings.audio ? 'ready' : 'muted' },
            { key: 'musicLoop', icon: 'fa-repeat', label: t('musicLoop'), value: settings.musicLoop ? t('enabled') : t('disabled'), tone: settings.musicLoop ? 'ready' : 'muted' }
        ];
        if (settings.adminMode) {
            statusChips.push({ key: 'adminMode', icon: 'fa-user-shield', label: t('adminMode'), value: t('enabled'), tone: 'danger' });
        }

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
        const copy = (key) => escapeHtml(t(key));
        const volumePercent = (key) => clampPercent((settings[key] ?? 0) * 100);
        const localeCode = escapeHtml(locale.toUpperCase());
        const uiScaleLabel = escapeHtml(t(settings.uiScale || 'normal'));

        this.ui.panelContent.innerHTML = `
            <section class="settings-command-header">
                <div>
                    <span class="briefing-kicker">${copy('settings')}</span>
                    <h2>${escapeHtml(panelTitle)}</h2>
                    <p>${copy('settingsBrief')}</p>
                </div>
                <div class="settings-readout">
                    <span><small>${copy('activeOptions')}</small><b data-settings-summary="activeOptions">${escapeHtml(summary.enabledOptions)}/${escapeHtml(BOOLEAN_SETTINGS.length)}</b></span>
                    <span><small>${copy('masterAudio')}</small><b data-settings-summary="masterVolume">${escapeHtml(summary.masterVolume)}%</b></span>
                    <span><small>${copy('currentTrack')}</small><b data-settings-summary="currentTrack">${escapeHtml(summary.currentTrack)}</b></span>
                </div>
                <div class="settings-status-strip" aria-label="${copy('settings')}">
                    ${summary.statusChips.map((chip) => `<span class="settings-status-chip ${normalizeClassToken(chip.tone, 'neutral')}" data-settings-status-chip="${escapeHtml(normalizeClassToken(chip.key, 'status'))}"><i class="fas ${normalizeIconClass(chip.icon)}"></i><small>${escapeHtml(chip.label)}</small><b data-settings-status="${escapeHtml(normalizeClassToken(chip.key, 'status'))}">${escapeHtml(chip.value)}</b></span>`).join('')}
                </div>
            </section>
            <div class="settings-layout settings-layout--compact">
                <section class="settings-section settings-section--toggles">
                    <h3>${copy('gameplayAccessibility')}</h3>
                    <div class="settings-grid settings-grid--compact">
                        ${BOOLEAN_SETTINGS.map(([key, id, labelKey]) => `<label class="setting-toggle"><input type="checkbox" id="${escapeHtml(id)}" data-setting="${escapeHtml(key)}" aria-label="${copy(labelKey)}" ${settings[key] ? 'checked' : ''}><span>${copy(labelKey)}</span></label>`).join('')}
                    </div>
                </section>
                <section class="settings-section">
                    <h3>${copy('audioMix')}</h3>
                    <div class="audio-mixer">
                        ${VOLUME_SETTINGS.map(([key, bus, labelKey]) => `<label class="volume-control"><span>${copy(labelKey)}</span><input type="range" min="0" max="100" value="${volumePercent(key)}" data-setting="${escapeHtml(key)}" data-bus="${escapeHtml(bus)}" aria-label="${copy(labelKey)}"><output>${volumePercent(key)}%</output></label>`).join('')}
                    </div>
                    <div class="music-picker">
                        <label><span>${copy('musicTrack')}</span><select id="music-track-select" aria-label="${copy('musicTrack')}">${MUSIC_TRACKS.map((track) => `<option value="${escapeHtml(track.id)}" ${settings.musicTrackId === track.id ? 'selected' : ''}>${escapeHtml(track.title)}</option>`).join('')}</select></label>
                        <label class="setting-toggle"><input type="checkbox" id="toggle-music-loop" aria-label="${copy('musicLoop')}" ${settings.musicLoop ? 'checked' : ''}><span>${copy('musicLoop')}</span></label>
                    </div>
                </section>
                <details class="settings-details" data-settings-group="controls">
                    <summary><span><i class="fas fa-keyboard"></i><b>${copy('controls')}</b></span><small>${escapeHtml(KEY_BINDINGS.length)}</small></summary>
                    <div class="settings-details-body">
                        <div class="key-binding-grid">${KEY_BINDINGS.map(([key, labelKey]) => `<label><span>${copy(labelKey)}</span><input data-key-binding="${escapeHtml(key)}" maxlength="12" value="${escapeHtml(settings.keyBindings[key])}" aria-label="${copy(labelKey)}"></label>`).join('')}</div>
                        <small>${copy('controllerHint')}</small>
                    </div>
                </details>
                <details class="settings-details" data-settings-group="interface">
                    <summary><span><i class="fas fa-language"></i><b>${copy('language')} / ${copy('uiSize')}</b></span><small>${localeCode} | ${uiScaleLabel}</small></summary>
                    <div class="settings-details-body settings-split-controls">
                        <div>
                            <span>${copy('language')}</span>
                            <div class="ui-scale-switch" role="group" aria-label="${copy('language')}">
                                ${getSupportedLocales().map((supportedLocale) => {
                                    const languageLabel = `${t('language')} ${supportedLocale.toUpperCase()}`;
                                    return `<button data-locale="${escapeHtml(supportedLocale)}" class="${settings.locale === supportedLocale ? 'active' : ''}" type="button" aria-pressed="${settings.locale === supportedLocale}" aria-label="${escapeHtml(languageLabel)}" title="${escapeHtml(languageLabel)}" data-tooltip="${escapeHtml(languageLabel)}">${escapeHtml(supportedLocale.toUpperCase())}</button>`;
                                }).join('')}
                            </div>
                        </div>
                        <div>
                            <span>${copy('uiSize')}</span>
                            <div class="ui-scale-switch" role="group" aria-label="${copy('uiSize')}">
                                ${UI_SCALES.map(([value, labelKey]) => {
                                    const scaleLabel = `${t('uiSize')} ${t(labelKey)}`;
                                    return `<button data-scale="${escapeHtml(value)}" class="${settings.uiScale === value ? 'active' : ''}" type="button" aria-pressed="${settings.uiScale === value}" aria-label="${escapeHtml(scaleLabel)}" title="${escapeHtml(scaleLabel)}" data-tooltip="${escapeHtml(scaleLabel)}">${copy(labelKey)}</button>`;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </details>
                <details class="settings-details" data-settings-group="save">
                    <summary><span><i class="fas fa-save"></i><b>${copy('saveData')}</b></span><small>4</small></summary>
                    <div class="settings-details-body settings-actions"><button class="btn-primary ghost" id="export-save" type="button" aria-label="${copy('export')}" title="${copy('export')}" data-tooltip="${copy('export')}"><i class="fas fa-download"></i> ${copy('export')}</button><button class="btn-primary ghost" id="import-save" type="button" aria-label="${copy('import')}" title="${copy('import')}" data-tooltip="${copy('import')}"><i class="fas fa-upload"></i> ${copy('import')}</button><button class="btn-primary ghost" id="export-replay" type="button" aria-label="${copy('replay')}" title="${copy('replay')}" data-tooltip="${copy('replay')}"><i class="fas fa-film"></i> ${copy('replay')}</button><button class="btn-primary danger" id="reset-all-game" type="button" aria-label="${copy('resetAllGame')}" title="${copy('resetAllGame')}" data-tooltip="${copy('resetAllGame')}"><i class="fas fa-trash"></i> ${copy('resetAllGame')}</button><input id="import-save-file" type="file" accept="application/json,.json" hidden></div>
                </details>
                <details class="settings-details admin-settings ${settings.adminMode ? 'admin-active' : ''}" data-settings-group="admin" ${settings.adminMode ? 'open' : ''}>
                    <summary><span><i class="fas fa-toolbox"></i><b>${copy('advancedTools')}</b></span><small>${settings.adminMode ? copy('adminMode') : copy('disabled')}</small></summary>
                    <div class="settings-details-body">
                        <p>${settings.adminMode ? copy('adminModeActive') : copy('adminModeHint')}</p>
                        <div class="settings-actions">
                        ${settings.adminMode
                            ? `<button class="btn-primary danger" id="disable-admin-mode" type="button" aria-label="${copy('disableAdmin')}" title="${copy('disableAdmin')}" data-tooltip="${copy('disableAdmin')}"><i class="fas fa-lock"></i> ${copy('disableAdmin')}</button>`
                            : `<input id="admin-password" type="password" inputmode="numeric" maxlength="8" placeholder="${copy('adminPassword')}" aria-label="${copy('adminPassword')}"><button class="btn-primary ghost" id="enable-admin-mode" type="button" aria-label="${copy('enableAdmin')}" title="${copy('enableAdmin')}" data-tooltip="${copy('enableAdmin')}"><i class="fas fa-unlock"></i> ${copy('enableAdmin')}</button>`}
                        </div>
                    </div>
                </details>
                <details class="settings-details" data-settings-group="run">
                    <summary><span><i class="fas fa-rotate-left"></i><b>${copy('restartLevel')}</b></span><small>2</small></summary>
                    <div class="settings-details-body settings-actions settings-actions--inline">
                    <button class="btn-primary ghost" id="reset-placement" type="button" aria-label="${copy('cancelPlacement')}" title="${copy('cancelPlacement')}" data-tooltip="${copy('cancelPlacement')}"><i class="fas fa-ban"></i> ${copy('cancelPlacement')}</button>
                    <button class="btn-primary danger" id="clear-run" type="button" aria-label="${copy('restartLevel')}" title="${copy('restartLevel')}" data-tooltip="${copy('restartLevel')}"><i class="fas fa-rotate-left"></i> ${copy('restartLevel')}</button>
                    </div>
                </details>
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
