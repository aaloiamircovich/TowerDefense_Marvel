import test from 'node:test';
import assert from 'node:assert/strict';
import { getSupportedLocales, translate } from '../src/utils/I18n.js';
import { SettingsPanel } from '../src/ui/SettingsPanel.js';

test('I18n expone idiomas soportados y fallback seguro', () => {
    assert.deepEqual(getSupportedLocales().sort(), ['en', 'es']);
    assert.equal(translate('settings', 'en'), 'Settings');
    assert.equal(translate('settings', 'es'), 'Ajustes');
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
                        masterVolume: 0.8,
                        musicVolume: 0.45,
                        sfxVolume: 0.75,
                        uiScale: 'normal',
                        locale: 'en',
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
        assert.match(panelContent.html, /Game and accessibility/);
        assert.match(panelContent.html, /Show tactical grid/);
        assert.match(panelContent.html, /Crisp pixel art/);
        assert.match(panelContent.html, /Reduced VFX/);
        assert.match(panelContent.html, /Contextual tactical guide/);
        assert.match(panelContent.html, /Simplified interface/);
        assert.match(panelContent.html, /Start wave/);
        assert.match(panelContent.html, /Cancel placement/);
        assert.match(panelContent.html, /Reset all/);
    } finally {
        globalThis.document = previousDocument;
    }
});
