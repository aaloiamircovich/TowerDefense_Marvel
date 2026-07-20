import test from 'node:test';
import assert from 'node:assert/strict';
import { AssetPreloader, collectHeroPreloadSources, collectLevelPreloadSources } from '../src/rendering/AssetPreloader.js';

test('collectHeroPreloadSources deduplica retrato, idle y ataque', () => {
    const heroes = [{
        visual: {
            portrait: 'hero/portrait.png',
            idle: { south: 'hero/idle.png', north: 'hero/idle.png' },
            attack: { frames: ['hero/a.png', 'hero/b.png', 'hero/a.png'] }
        }
    }];

    assert.deepEqual(collectHeroPreloadSources(heroes), [
        'hero/portrait.png',
        'hero/idle.png',
        'hero/a.png',
        'hero/b.png'
    ]);
});

test('collectLevelPreloadSources incluye solo assets reales de mapas', () => {
    const sources = collectLevelPreloadSources({
        thumbnail: 'city_streets',
        theme: { image: 'assets/images/maps/wakanda.png' },
        mission: { image: 'assets/images/missions/briefing.png' }
    });

    assert.deepEqual(sources, [
        'assets/images/maps/wakanda.png',
        'assets/images/missions/briefing.png'
    ]);
});

test('AssetPreloader evita pedir dos veces las mismas fuentes', async () => {
    const calls = [];
    const preloader = new AssetPreloader(async (sources) => calls.push(sources));
    const hero = {
        visual: {
            portrait: 'hero/portrait.png',
            idle: { south: 'hero/idle.png' },
            attack: { frames: ['hero/a.png'] }
        }
    };

    assert.deepEqual(await preloader.preloadHeroes([hero]), ['hero/portrait.png', 'hero/idle.png', 'hero/a.png']);
    assert.deepEqual(await preloader.preloadHeroes([hero]), []);
    assert.deepEqual(calls, [['hero/portrait.png', 'hero/idle.png', 'hero/a.png']]);
});
