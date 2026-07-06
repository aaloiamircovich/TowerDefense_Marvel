const CACHE_NAME = 'hero-td-v2.25.0';
const CORE_ASSETS = [
    './', './index.html', './styles.css', './manifest.webmanifest',
    './data/bootstrapData.js', './data/sprite-atlas.js', './data/heroes.json', './data/enemies.json',
    './data/items.json', './data/levels.json', './data/waves.json', './data/TypeChart.js',
    './assets/images/heroes/atlas.png', './assets/images/heroes/iron_man/portrait.png',
    './assets/images/heroes/spiderman/portrait.png', './assets/images/heroes/capitan_america/portrait.png',
    './assets/images/heroes/thor/portrait.png', './assets/images/heroes/doctor_strange/portrait.png',
    './assets/images/heroes/hulk/portrait.png', './assets/images/heroes/black_widow/portrait.png',
    './assets/images/heroes/hawkeye/portrait.png', './assets/images/heroes/black_panther/portrait.png',
    './assets/images/heroes/vision/portrait.png', './assets/images/heroes/falcon/portrait.png',
    './assets/images/heroes/captain_marvel/portrait.png', './assets/images/heroes/star_lord/portrait.png',
    './assets/images/heroes/groot/portrait.png', './assets/images/heroes/gamora/portrait.png',
    './assets/images/heroes/silver_surfer/portrait.png',
    './assets/images/heroes/daredevil/portrait.png', './assets/images/heroes/moon_knight/portrait.png',
    './assets/images/heroes/blade/portrait.png', './assets/images/heroes/ghost_rider/portrait.png',
    './assets/images/heroes/luke_cage/portrait.png', './assets/images/heroes/shang_chi/portrait.png',
    './assets/images/heroes/she_hulk/portrait.png',
    './assets/images/heroes/wolverine/portrait.png', './assets/images/heroes/jean_grey/portrait.png',
    './assets/images/heroes/cyclops/portrait.png', './assets/images/heroes/storm/portrait.png',
    './assets/images/heroes/domino/portrait.png', './assets/images/heroes/scarlet_witch/portrait.png',
    './assets/images/heroes/ant_man/portrait.png', './assets/images/heroes/winter_soldier/portrait.png',
    './assets/icons/icon-192.png', './assets/icons/icon-512.png',
    './src/main.js', './src/config/AppConfig.js', './src/pwa/register.js',
    './src/audio/AudioManager.js', './src/core/GameLoop.js', './src/core/InputManager.js',
    './src/data/HeroUpgradeCatalog.js', './src/entities/Enemy.js', './src/entities/Hero.js', './src/entities/Projectile.js',
    './src/rendering/CombatVfx.js', './src/rendering/ImageCache.js', './src/rendering/SpriteAnimator.js',
    './src/systems/AvengerKitSystem.js', './src/systems/CosmicKitSystem.js', './src/systems/StreetKitSystem.js', './src/systems/MutantKitSystem.js', './src/systems/CombatSystem.js', './src/systems/EncounterDirector.js', './src/systems/EnemyBehaviorSystem.js', './src/systems/HeroAbilitySystem.js',
    './src/systems/GameModeSystem.js', './src/systems/EvolutionSystem.js', './src/systems/MasteryCodexSystem.js', './src/systems/ReplaySystem.js', './src/systems/MissionSystem.js', './src/systems/PerformanceMonitor.js', './src/systems/ProgressionManager.js', './src/systems/TeamSynergySystem.js',
    './src/systems/ItemEffectSystem.js', './src/systems/ResourceManager.js', './src/systems/ShopSystem.js', './src/systems/TacticalActionSystem.js',
    './src/systems/UIManager.js', './src/systems/WaveManager.js',
    './src/ui/CampaignPanel.js', './src/ui/InventoryPanel.js', './src/ui/ProfilePanel.js', './src/ui/SettingsPanel.js', './src/ui/TeamBuilderPanel.js', './src/ui/TooltipController.js',
    './src/utils/I18n.js', './src/utils/Loader.js', './src/utils/ObjectPool.js', './src/utils/PathUtils.js', './src/utils/Random.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(CORE_ASSETS);
        const items = await fetch('./data/items.json').then((response) => response.json());
        await cache.addAll([...new Set(Object.values(items).map((item) => `./${item.icon}`))]);
    })());
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    const isImage = event.request.destination === 'image';
    if (isImage) {
        event.respondWith(caches.match(event.request).then((cached) => cached || fetchAndCache(event.request)));
        return;
    }

    event.respondWith(fetchAndCache(event.request).catch(() => (
        caches.match(event.request).then((cached) => cached || (
            event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()
        ))
    )));
});

async function fetchAndCache(request) {
    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
    }
    return response;
}
