import test from 'node:test';
import assert from 'node:assert/strict';
import { getSupportedLocales, translate } from '../src/utils/I18n.js';
import { SettingsPanel } from '../src/ui/SettingsPanel.js';

test('I18n expone idiomas soportados y fallback seguro', () => {
    assert.deepEqual(getSupportedLocales().sort(), ['en', 'es']);
    assert.equal(translate('settings', 'en'), 'Settings');
    assert.equal(translate('settings', 'es'), 'Ajustes');
    assert.equal(translate('showFps', 'en'), 'Show FPS');
    assert.equal(translate('showFps', 'es'), 'Mostrar FPS');
    assert.equal(translate('unknown_key', 'en'), 'unknown_key');
});

test('SettingsPanel usa el locale guardado para renderizar textos reales', () => {
    const previousDocument = globalThis.document;
    globalThis.document = { getElementById: () => null };

    const panelContent = {
        html: '',
        set innerHTML(value) { this.html = value; },
        get innerHTML() { return this.html; },
        querySelectorAll: () => []
    };
    const panel = new SettingsPanel({
        panelContent,
        game: {
            progression: {
                state: {
                    version: 1,
                    settings: {
                        ranges: true,
                        grid: true,
                        combatText: true,
                        audio: true,
                        highContrast: false,
                        reduceMotion: false,
                        pixelArtCrisp: false,
                        reducedVfx: false,
                        simplifiedUi: false,
                        showFps: false,
                        masterVolume: 0.8,
                        musicVolume: 0.45,
                        sfxVolume: 0.75,
                        uiScale: 'normal',
                        locale: 'en',
                        musicTrackId: 'the-avengers-theme-song',
                        keyBindings: {
                            pause: 'p',
                            speed: 'f',
                            nextWave: 'n',
                            cancel: 'Escape',
                            targeting: 't',
                            upgrade: 'u'
                        }
                    }
                }
            }
        }
    });

    try {
        panel.render();

        assert.match(panelContent.html, /<h2>Settings<\/h2>/);
        assert.match(panelContent.html, /settings-command-header/);
        assert.match(panelContent.html, /settings-readout/);
        assert.match(panelContent.html, /settings-status-strip/);
        assert.match(panelContent.html, /Game audio/);
        assert.match(panelContent.html, /Enabled/);
        assert.match(panelContent.html, /Admin mode/);
        assert.match(panelContent.html, /Disabled/);
        assert.match(panelContent.html, /Active options/);
        assert.match(panelContent.html, /Master audio/);
        assert.match(panelContent.html, /80%/);
        assert.match(panelContent.html, /settings-layout--compact/);
        assert.match(panelContent.html, /settings-grid--compact/);
        assert.match(panelContent.html, /<details class="settings-details" data-settings-group="controls">/);
        assert.match(panelContent.html, /<details class="settings-details" data-settings-group="interface">/);
        assert.match(panelContent.html, /<details class="settings-details" data-settings-group="save">/);
        assert.match(panelContent.html, /<details class="settings-details admin-settings " data-settings-group="admin" >/);
        assert.match(panelContent.html, /<details class="settings-details" data-settings-group="run">/);
        assert.match(panelContent.html, /settings-split-controls/);
        assert.match(panelContent.html, /settings-actions--inline/);
        assert.match(panelContent.html, /Game and accessibility/);
        assert.match(panelContent.html, /Show tactical grid/);
        assert.match(panelContent.html, /Crisp pixel art/);
        assert.match(panelContent.html, /Reduced VFX/);
        assert.doesNotMatch(panelContent.html, /Contextual tactical guide/);
        assert.match(panelContent.html, /Simplified interface/);
        assert.match(panelContent.html, /Show FPS/);
        assert.match(panelContent.html, /Start wave/);
        assert.match(panelContent.html, /Cancel placement/);
        assert.match(panelContent.html, /Reset all/);
        assert.match(panelContent.html, /id="toggle-grid" data-setting="grid" aria-label="Show tactical grid"/);
        assert.match(panelContent.html, /data-key-binding="nextWave" maxlength="12" value="n" aria-label="Start wave"/);
        assert.match(panelContent.html, /data-bus="master" aria-label="Master volume"/);
        assert.match(panelContent.html, /id="music-track-select" aria-label="Song"/);
        assert.match(panelContent.html, /data-locale="en" class="active" type="button" aria-pressed="true" aria-label="Language EN" title="Language EN" data-tooltip="Language EN"/);
        assert.match(panelContent.html, /data-scale="normal" class="active" type="button" aria-pressed="true" aria-label="Interface size Normal" title="Interface size Normal" data-tooltip="Interface size Normal"/);
        assert.match(panelContent.html, /id="export-save" type="button" aria-label="Export" title="Export" data-tooltip="Export"/);
        assert.match(panelContent.html, /id="enable-admin-mode" type="button" aria-label="Enable admin" title="Enable admin" data-tooltip="Enable admin"/);
        assert.match(panelContent.html, /id="clear-run" type="button" aria-label="Restart level"/);
    } finally {
        globalThis.document = previousDocument;
    }
});

test('SettingsPanel refresca el resumen al cambiar toggles', () => {
    const previousDocument = globalThis.document;
    globalThis.document = { getElementById: () => null };

    const listeners = {};
    const toggle = {
        checked: true,
        dataset: { setting: 'simplifiedUi' },
        nextElementSibling: { textContent: 'Simplified interface' },
        addEventListener(event, handler) {
            listeners[event] = handler;
        }
    };
    const calls = [];
    const settings = {
        ranges: true,
        grid: false,
        combatText: true,
        audio: true,
        highContrast: false,
        reduceMotion: false,
        pixelArtCrisp: true,
        reducedVfx: false,
        simplifiedUi: false,
        showFps: false,
        masterVolume: 0.8,
        musicVolume: 0.45,
        sfxVolume: 0.75,
        uiScale: 'normal',
        locale: 'en',
        musicTrackId: 'the-avengers-theme-song',
        musicLoop: false,
        adminMode: false,
        keyBindings: {
            pause: 'p',
            speed: 'f',
            nextWave: 'n',
            cancel: 'Escape',
            targeting: 't',
            upgrade: 'u'
        }
    };
    const panelContent = {
        html: '',
        renders: 0,
        set innerHTML(value) { this.html = value; this.renders += 1; },
        get innerHTML() { return this.html; },
        querySelectorAll(selector) {
            return selector === 'input[type="checkbox"][data-setting]' ? [toggle] : [];
        }
    };
    const panel = new SettingsPanel({
        panelContent,
        game: {
            progression: {
                state: { version: 1, settings },
                updateSetting(key, value) {
                    calls.push(`setting:${key}:${value}`);
                    settings[key] = value;
                }
            }
        },
        showToast(message, type) {
            calls.push(`toast:${type}:${message}`);
        }
    });

    try {
        panel.render();
        listeners.change();

        assert.ok(calls.includes('setting:simplifiedUi:true'));
        assert.ok(calls.includes('toast:info:Simplified interface: activado'));
        assert.equal(settings.simplifiedUi, true);
        assert.equal(panelContent.renders, 2);
        assert.match(panelContent.html, /Active options/);
    } finally {
        globalThis.document = previousDocument;
    }
});

test('SettingsPanel refresca resumen de audio y musica sin reabrir panel', () => {
    const nodes = new Map();
    const makeNode = () => ({
        textContent: '',
        classes: new Set(['settings-status-chip']),
        classList: {
            remove(...names) {
                names.forEach((name) => this.owner.classes.delete(name));
            },
            add(name) {
                this.owner.classes.add(name);
            }
        }
    });
    const wireClassList = (node) => {
        node.classList.owner = node;
        return node;
    };
    ['activeOptions', 'masterVolume', 'currentTrack'].forEach((key) => nodes.set(`[data-settings-summary="${key}"]`, { textContent: '' }));
    ['locale', 'uiScale', 'audio', 'musicLoop', 'adminMode'].forEach((key) => {
        nodes.set(`[data-settings-status="${key}"]`, { textContent: '' });
        nodes.set(`[data-settings-status-chip="${key}"]`, wireClassList(makeNode()));
    });
    const settings = {
        ranges: true,
        grid: false,
        combatText: true,
        audio: true,
        highContrast: false,
        reduceMotion: false,
        pixelArtCrisp: true,
        reducedVfx: false,
        simplifiedUi: false,
        showFps: false,
        masterVolume: 0.35,
        musicVolume: 0.45,
        sfxVolume: 0.75,
        uiScale: 'compact',
        locale: 'en',
        musicTrackId: 'xmen-97-extended-theme',
        musicLoop: true,
        adminMode: false,
        keyBindings: {
            pause: 'p',
            speed: 'f',
            nextWave: 'n',
            cancel: 'Escape',
            targeting: 't',
            upgrade: 'u'
        }
    };
    const panel = new SettingsPanel({
        panelContent: {
            querySelector(selector) {
                return nodes.get(selector) || null;
            }
        },
        game: {
            progression: {
                state: { settings }
            }
        }
    });

    panel.refreshSummary();

    assert.equal(nodes.get('[data-settings-summary="activeOptions"]').textContent, '4/10');
    assert.equal(nodes.get('[data-settings-summary="masterVolume"]').textContent, '35%');
    assert.equal(nodes.get('[data-settings-summary="currentTrack"]').textContent, 'X-Men 97 Extended Theme');
    assert.equal(nodes.get('[data-settings-status="locale"]').textContent, 'EN');
    assert.equal(nodes.get('[data-settings-status="uiScale"]').textContent, 'Compact');
    assert.equal(nodes.get('[data-settings-status="musicLoop"]').textContent, 'Enabled');
    assert.ok(nodes.get('[data-settings-status-chip="musicLoop"]').classes.has('ready'));
});
test('SettingsPanel puede activar admin desde eventos sin perder traducciones', () => {
    const previousDocument = globalThis.document;
    const listeners = {};
    const button = {
        addEventListener(event, handler) {
            listeners[event] = handler;
        }
    };
    const password = { value: '0000' };
    globalThis.document = {
        getElementById(id) {
            if (id === 'enable-admin-mode') return button;
            if (id === 'admin-password') return password;
            return null;
        }
    };

    const calls = [];
    const panelContent = {
        html: '',
        set innerHTML(value) { this.html = value; },
        get innerHTML() { return this.html; },
        querySelectorAll: () => []
    };
    const panel = new SettingsPanel({
        panelContent,
        game: {
            progression: {
                state: {
                    version: 1,
                    settings: {
                        ranges: true,
                        grid: false,
                        combatText: true,
                        audio: true,
                        highContrast: false,
                        reduceMotion: false,
                        pixelArtCrisp: true,
                        reducedVfx: false,
                        simplifiedUi: false,
                        showFps: false,
                        masterVolume: 0.8,
                        musicVolume: 0.45,
                        sfxVolume: 0.75,
                        uiScale: 'normal',
                        locale: 'en',
                        musicTrackId: 'the-avengers-theme-song',
                        musicLoop: false,
                        adminMode: false,
                        keyBindings: {
                            pause: 'p',
                            speed: 'f',
                            nextWave: 'n',
                            cancel: 'Escape',
                            targeting: 't',
                            upgrade: 'u'
                        }
                    }
                },
                enableAdminMode(value) {
                    calls.push(`password:${value}`);
                    this.state.settings.adminMode = true;
                    return { ok: true };
                }
            }
        },
        showToast(message, type) {
            calls.push(`${type}:${message}`);
        }
    });

    try {
        panel.render();
        listeners.click();

        assert.ok(calls.includes('password:0000'));
        assert.ok(calls.includes('success:Admin mode enabled'));
    } finally {
        globalThis.document = previousDocument;
    }
});
