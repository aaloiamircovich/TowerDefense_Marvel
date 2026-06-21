import fs from 'node:fs';
import path from 'node:path';

export const DATA_KEYS = ['heroes', 'enemies', 'waves', 'levels', 'items'];

export function readProjectData(root = process.cwd()) {
    return Object.fromEntries(DATA_KEYS.map((key) => {
        const file = path.join(root, 'data', `${key}.json`);
        return [key, JSON.parse(fs.readFileSync(file, 'utf8'))];
    }));
}

export function buildBootstrapSource(data) {
    return `window.__MARVEL_TD_DATA__ = ${JSON.stringify(data, null, 2)};\n`;
}
