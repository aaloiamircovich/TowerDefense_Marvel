import { preloadImages } from './ImageCache.js';
import { collectVisualSources } from './SpriteAnimator.js';

export class AssetPreloader {
    constructor(loader = preloadImages) {
        this.loader = loader;
        this.loadedSources = new Set();
    }

    preloadHeroes(heroes = []) {
        return this.preloadSources(collectHeroPreloadSources(heroes));
    }

    preloadLevel(level = null) {
        return this.preloadSources(collectLevelPreloadSources(level));
    }

    preloadTeamForLevel(heroes = [], level = null) {
        return this.preloadSources([
            ...collectHeroPreloadSources(heroes),
            ...collectLevelPreloadSources(level)
        ]);
    }

    async preloadSources(sources = []) {
        const nextSources = uniqueSources(sources).filter((source) => !this.loadedSources.has(source));
        nextSources.forEach((source) => this.loadedSources.add(source));
        if (!nextSources.length) return [];
        await this.loader(nextSources);
        return nextSources;
    }
}

export function collectHeroPreloadSources(heroes = []) {
    return uniqueSources(heroes.flatMap((hero) => collectVisualSources(hero?.visual)));
}

export function collectLevelPreloadSources(level = null) {
    return uniqueSources([
        assetPathOrNull(level?.thumbnail),
        assetPathOrNull(level?.theme?.image),
        assetPathOrNull(level?.mission?.image)
    ]);
}

function assetPathOrNull(source) {
    return typeof source === 'string' && source.startsWith('assets/') ? source : null;
}

function uniqueSources(sources = []) {
    return [...new Set(sources.filter(Boolean))];
}
