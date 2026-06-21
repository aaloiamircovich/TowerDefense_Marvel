import fs from 'node:fs';
import path from 'node:path';
import { buildBootstrapSource, readProjectData } from './lib/project-data.js';

const root = process.cwd();
const target = path.join(root, 'data', 'bootstrapData.js');
const source = buildBootstrapSource(readProjectData(root));

fs.writeFileSync(target, source, 'utf8');
console.log(`Datos de respaldo generados: ${path.relative(root, target)}`);
