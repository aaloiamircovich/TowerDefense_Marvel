import fs from 'node:fs';

const manifestPath = new URL('../tmp_enemy_sprite_manifest.json', import.meta.url);
const enemiesPath = new URL('../data/enemies.json', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
const enemies = JSON.parse(fs.readFileSync(enemiesPath, 'utf8'));

for (const [id, spriteContract] of Object.entries(manifest)) {
    const target = enemies.normal?.[id] || enemies.bosses?.[id];
    if (!target) {
        console.warn(`Sin enemigo en data/enemies.json: ${id}`);
        continue;
    }
    target.sprite = spriteContract.sprite;
    target.visual = spriteContract.visual;
}

fs.writeFileSync(enemiesPath, `${JSON.stringify(enemies, null, 2)}\n`);
console.log(`Actualizados ${Object.keys(manifest).length} contratos visuales de enemigos.`);
