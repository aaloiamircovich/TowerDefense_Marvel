import fs from 'node:fs';
import path from 'node:path';
import { APP_VERSION, FAN_PROJECT_NOTICE } from '../src/config/AppConfig.js';

const root = process.cwd();
const errors = [];
const packageData = readJson('package.json');
const manifest = readJson('manifest.webmanifest');

if (packageData.version !== APP_VERSION) errors.push(`package.json (${packageData.version}) no coincide con APP_VERSION (${APP_VERSION})`);
if (!manifest.icons?.length) errors.push('manifest.webmanifest no define iconos');
for (const icon of manifest.icons || []) requireFile(icon.src);

for (const required of ['service-worker.js', 'CHANGELOG.md', 'NOTICE.md', 'data/sprite-atlas.js', 'assets/images/heroes/atlas.png']) {
    requireFile(required);
}

const atlasSource = fs.readFileSync(path.join(root, 'data', 'sprite-atlas.js'), 'utf8');
const atlas = JSON.parse(atlasSource.replace(/^window\.__MARVEL_TD_ATLAS__\s*=\s*/, '').replace(/;\s*$/, ''));
if (Object.keys(atlas.frames || {}).length < 558) errors.push('El atlas debe contener al menos 558 sprites en la Fase 16');
requireFile(atlas.image);

const serviceWorker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
if (!serviceWorker.includes(`v${APP_VERSION}`)) errors.push('El service worker no usa la versión actual de caché');
const cachedPaths = [...serviceWorker.matchAll(/'\.\/([^']+)'/g)].map((match) => match[1]);
cachedPaths.filter((file) => file && file !== '/').forEach(requireFile);

const notice = fs.readFileSync(path.join(root, 'NOTICE.md'), 'utf8');
if (!notice.includes('proyecto fan no oficial') || !FAN_PROJECT_NOTICE.includes('no oficial')) {
    errors.push('El aviso de proyecto fan no oficial es obligatorio');
}

errors.forEach((error) => console.error(`ERROR: ${error}`));
console.log(`Validación de lanzamiento ${APP_VERSION}: ${errors.length} errores.`);
if (errors.length > 0) process.exitCode = 1;

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function requireFile(relativePath) {
    if (!fs.existsSync(path.join(root, relativePath))) errors.push(`Falta ${relativePath}`);
}
