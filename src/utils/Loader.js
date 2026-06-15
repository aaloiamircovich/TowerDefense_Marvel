export class Loader {
    static async loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return await response.json();
        } catch (error) {
            const fallback = this.loadFromBootstrap(url);
            if (fallback) return fallback;

            console.error(`Error cargando recurso en ${url}:`, error);
            return null;
        }
    }

    static async loadManifest(manifest) {
        const entries = Object.entries(manifest);
        const results = await Promise.all(entries.map(([, url]) => this.loadJSON(url)));

        return entries.reduce((acc, [key], index) => {
            acc[key] = results[index];
            return acc;
        }, {});
    }

    static loadFromBootstrap(url) {
        const bootstrap = window.__MARVEL_TD_DATA__;
        if (!bootstrap) return null;

        const filename = url.split('/').pop().replace('.json', '');
        return bootstrap[filename] ? structuredClone(bootstrap[filename]) : null;
    }
}
