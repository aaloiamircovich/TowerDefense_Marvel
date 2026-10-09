import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Hero } from '../src/entities/Hero.js';
import { Enemy } from '../src/entities/Enemy.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { buildBootstrapSource, readProjectData } from '../scripts/lib/project-data.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));

function setup(id) {
    const game = { heroes: [], enemies: [], random: { next: () => 0 }, resourceManager: { lives: 15 } };
    const hero = new Hero(heroes[id], 0, 0, game);
    game.heroes = [hero];
    const spawn = (options = {}) => {
        const enemy = new Enemy({ id: 'target', hp: 100000, speed: 1, category: hero.category, ...options }, [{ x: 50, y: 0 }, { x: 1000, y: 0 }]);
        game.enemies.push(enemy);
        return enemy;
    };
    const hit = (target) => CombatSystem.applyImpact({
        damage: 10, attackerType: hero.category,
        ...hero.getProjectileProfile(), effects: hero.getProjectileEffects(target)
    }, target, hero, game.resourceManager);
    return { hero, game, spawn, hit };
}

for (const [id, status, chance, phrase] of [
    ['nightcrawler', 'mark', 0.3, 'solo al objetivo principal'],
    ['nebula', 'armorBreak', 0.34, '34% de reducir la armadura']
]) {
    test(`${id}: efecto descrito puede aplicar o fallar; no se transmite por rebote/splash`, () => {
        const f = setup(id);
        const primary = f.spawn();
        const neighbor = f.spawn();
        neighbor.x += 10;
        const effect = f.hero.getProjectileEffects(primary).find((entry) => entry.type === status);
        assert.equal(effect.chance, chance);
        assert.ok(heroes[id].abilityDesc.includes(phrase));
        f.hit(primary);
        assert.ok(primary.debuffs.some((entry) => entry.type === status));
        assert.equal(neighbor.debuffs.length, 0);
        if (id === 'crystal' || id === 'nightcrawler' || id === 'red_guardian') assert.ok(neighbor.hp < neighbor.maxHp);
        const failed = f.spawn();
        f.game.random.next = () => 0.999;
        f.hit(failed);
        assert.equal(failed.debuffs.length, 0);
    });
}

test('Crystal: ciclo preparado sustituye slow aleatorio, splash no transmite fuego', () => {
    const f = setup('crystal'), target = f.spawn(), neighbor = f.spawn();
    neighbor.x += 10;
    f.hero.abilitySystem.elementalKit.update(2);
    f.hero.shoot(target, f.hero.getEffectiveStats(), []);
    assert.equal(target.debuffs[0].type, 'burn');
    assert.equal(neighbor.debuffs.length, 0);
    assert.equal(f.hero.getProjectileEffects(target).length, 0);
    assert.match(heroes.crystal.abilityDesc, /Cada 2s.*15% poder\/s.*35%.*50%/);
});

test('Emma: mark/slow tambien sobre comunes; critico y deteccion propios, no aura aliada', () => {
    const f = setup('emma_frost');
    const target = f.spawn();
    const ally = new Hero({ id: 'ally', damage: 10, range: 100, fireRate: 1, critChance: 5 }, 20, 0, f.game);
    f.game.heroes.push(ally);
    f.hit(target);
    assert.deepEqual(target.debuffs.map((effect) => effect.type).sort(), ['mark', 'slow']);
    assert.equal(f.hero.getEffectiveStats().critChance, f.hero.critChance + 4);
    assert.equal(f.hero.getEffectiveStats().canSeeStealth, true);
    assert.equal(ally.getEffectiveStats().critChance, 5);
    assert.equal(ally.getEffectiveStats().canSeeStealth, false);
    assert.match(heroes.emma_frost.abilityDesc, /critica propia; no potencia aliados/);
});

test('Nebula: ruptura no exige categoria tecnologica', () => {
    const f = setup('nebula');
    for (const category of ['Tecnologico', 'Urbano', 'Mutante', 'Mistico', 'Cosmico']) {
        const target = f.spawn({ category });
        f.hit(target);
        assert.ok(target.debuffs.some((effect) => effect.type === 'armorBreak'), category);
    }
    assert.match(heroes.nebula.abilityDesc, /sin restriccion de categoria/);
});

test('Rocket: disparo ordinario conserva splash y penetracion antes de desplegar torreta', () => {
    const f = setup('rocket_raccoon');
    const primary = f.spawn();
    const shots = [];
    f.hero.shoot(primary, f.hero.getEffectiveStats(), shots);
    assert.equal(shots.length, 1);
    assert.equal(shots[0].splashRadius, 44);
    assert.equal(shots[0].armorPenetration, 0.14);
    assert.deepEqual(f.game.heroes, [f.hero]);
    assert.equal(f.hero.abilitySystem.fieldDevice.device, null);
    assert.match(heroes.rocket_raccoon.abilityDesc, /torreta durante 5 s/);
});

test('descripciones corregidas permanecen sincronizadas con generadores y bootstrap', () => {
    for (const [file, ids] of [
        ['configure-allegiance-roster.js', ['crystal']],
        ['configure-rivals-roster.js', ['emma_frost', 'rocket_raccoon']],
        ['configure-cosmic-expansion.js', ['gamora']],
        ['configure-street-expansion.js', ['luke_cage']]
    ]) {
        const source = fs.readFileSync(new URL(`../scripts/${file}`, import.meta.url), 'utf8');
        for (const id of ids) assert.ok(source.includes(heroes[id].abilityDesc), `${file}: ${id}`);
    }
    const bootstrap = fs.readFileSync(new URL('../data/bootstrapData.js', import.meta.url), 'utf8');
    assert.equal(bootstrap.replace(/\r\n/g, '\n'), buildBootstrapSource(readProjectData()));
});
