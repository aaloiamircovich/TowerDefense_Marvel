import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSpriteMarkup, versionAssetSource } from '../src/ui/SpriteRenderer.js';

test('versionAssetSource agrega version solo a assets visuales locales', () => {
    assert.equal(
        versionAssetSource('assets/images/heroes/iron_man/sprites/south.png', 'test-version'),
        'assets/images/heroes/iron_man/sprites/south.png?v=test-version'
    );
    assert.equal(
        versionAssetSource('assets/images/heroes/iron_man/sprites/south.png?frame=1', 'test-version'),
        'assets/images/heroes/iron_man/sprites/south.png?frame=1&v=test-version'
    );
    assert.equal(versionAssetSource('assets/audio/music/theme.mp3', 'test-version'), 'assets/audio/music/theme.mp3');
});

test('renderSpriteMarkup escapa imagen, etiqueta y fallback sin inyectar nombres en onerror', () => {
    const html = renderSpriteMarkup('assets/images/test"sprite.png', 'Kitty "Pryde" <X>', 'test-version');

    assert.match(html, /src="assets\/images\/test&quot;sprite\.png\?v=test-version"/);
    assert.match(html, /alt="Kitty &quot;Pryde&quot; &lt;X&gt;"/);
    assert.match(html, /data-fallback="K"/);
    assert.doesNotMatch(html, /textContent: 'Kitty/);
    assert.match(html, /this\.dataset\.fallback/);
    assert.match(renderSpriteMarkup('', '<Hero>'), /<span class="sprite-fallback">&lt;<\/span>/);
});
