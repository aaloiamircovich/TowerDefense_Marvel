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
                        tutorialHints: true,
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
        assert.match(panelContent.html, /settings-split-controls/);
        assert.match(panelContent.html, /settings-actions--inline/);
        assert.match(panelContent.html, /Game and accessibility/);
        assert.match(panelContent.html, /Show tactical grid/);
        assert.match(panelContent.html, /Crisp pixel art/);
        assert.match(panelContent.html, /Reduced VFX/);
        assert.match(panelContent.html, /Contextual tactical guide/);
        assert.match(panelContent.html, /Simplified interface/);
        assert.match(panelContent.html, /Show FPS/);
        assert.match(panelContent.html, /Start wave/);
        assert.match(panelContent.html, /Cancel placement/);
        assert.match(panelContent.html, /Reset all/);
    } finally {
        globalThis.document = previousDocument;
    }
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
                        tutorialHints: true,
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
