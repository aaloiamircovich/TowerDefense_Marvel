const imageCache = new Map();

export function getCachedImage(source) {
    if (!source || typeof Image === 'undefined') return null;

    if (!imageCache.has(source)) {
        const image = new Image();
        image.decoding = 'async';
        image.src = source;
        imageCache.set(source, image);
    }

    return imageCache.get(source);
}

export async function preloadImages(sources) {
    const uniqueSources = [...new Set(sources.filter(Boolean))];
    const images = uniqueSources.map((source) => getCachedImage(source)).filter(Boolean);

    await Promise.all(images.map((image) => {
        if (image.complete) return Promise.resolve();

        return new Promise((resolve) => {
            const finish = () => resolve();
            image.addEventListener('load', finish, { once: true });
            image.addEventListener('error', finish, { once: true });
        });
    }));
}

export function clearImageCache() {
    imageCache.clear();
}
