export class Loader {
    /**
     * Carga un archivo JSON de forma asíncrona.
     */
    static async loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error cargando recurso en ${url}:`, error);
            return null;
        }
    }

    /**
     * Carga múltiples archivos a la vez (Manifiesto).
     */
    static async loadManifest(manifest) {
        const entries = Object.entries(manifest);
        const results = await Promise.all(
            entries.map(([key, url]) => this.loadJSON(url))
        );
        
        return entries.reduce((acc, [key], index) => {
            acc[key] = results[index];
            return acc;
        }, {});
    }
}