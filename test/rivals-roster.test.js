import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Hero } from '../src/entities/Hero.js';
import { DIRECTIONS, collectVisualSources } from '../src/rendering/SpriteAnimator.js';
import { EVOLUTION_CATALOG } from '../src/systems/EvolutionSystem.js';
import { SYNERGY_DEFINITIONS, analyzeTeam, getHeroTeamEffects } from '../src/systems/TeamSynergySystem.js';

const root = process.cwd();
const heroes = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes.json'), 'utf8'));
const atlasSource = fs.readFileSync(path.join(root, 'data', 'sprite-atlas.js'), 'utf8');
const atlas = JSON.parse(atlasSource.replace(/^window\.__MARVEL_TD_ATLAS__\s*=\s*/, '').replace(/;\s*$/, ''));

const requestedNames = [
    'Black Cat', 'Black Panther', 'Black Widow', 'Blade', 'Cyclops', 'Daredevil',
    'Elsa Bloodstone', 'Gambit', 'Hawkeye', 'Hela', 'Human Torch', 'Iron Fist',
    'Iron Man', 'The Hood', 'Magik', 'Moon Knight', 'Psylocke', 'Scarlet Witch',
    'Spider-Man', 'Squirrel Girl', 'Star-Lord', 'Storm', 'The Punisher', 'Venom',
    'Winter Soldier', 'Wolverine', 'Angela', 'Hulk', 'Captain America',
    'Devil Dinosaur', 'Doctor Strange', 'Emma Frost', 'Groot', 'Magneto',
    'Namor', 'Peni Parker', 'Thor', 'Adam Warlock', 'Cloak & Dagger',
    'Deadpool', 'Invisible Woman', 'Jeff The Land Shark', 'Jubilee', 'Loki',
    'Luna Snow', 'Mantis', 'Mister Fantastic', 'Phoenix (Jean Grey)', 'Rocket Raccoon'
];

const aliases = {
    'Captain America': 'capitan_america',
    'Spider-Man': 'spiderman',
    'The Punisher': 'punisher',
    'Cloak & Dagger': ['cloak', 'dagger'],
    'Phoenix (Jean Grey)': 'jean_grey'
};

const rivalsHeroes = [
    'black_cat', 'elsa_bloodstone', 'gambit', 'hela', 'human_torch', 'the_hood',
    'psylocke', 'squirrel_girl', 'venom', 'angela', 'devil_dinosaur',
    'emma_frost', 'magneto', 'peni_parker', 'adam_warlock', 'deadpool',
    'invisible_woman', 'jeff_the_land_shark', 'jubilee', 'loki', 'luna_snow',
    'mantis', 'mister_fantastic', 'rocket_raccoon'
];

test('lista solicitada queda cubierta por heroes jugables o evolucion existente', () => {
    for (const name of requestedNames) {
        const target = aliases[name] || toId(name);
        const ids = Array.isArray(target) ? target : [target];
        for (const id of ids) assert.ok(heroes[id], `Falta ${name} como ${id}`);
    }
    assert.equal(EVOLUTION_CATALOG.phoenix.baseHeroId, 'jean_grey');
});

test('roster Rivales agrega veinticuatro heroes con contrato tactico, visual y taxonomia acotada', () => {
    assert.equal(rivalsHeroes.length, 24);
    const validTags = new Set(Object.keys(SYNERGY_DEFINITIONS));
    for (const id of rivalsHeroes) {
        const hero = heroes[id];
        assert.ok(hero, `Falta ${id}`);
        assert.equal(hero.id, id);
        assert.ok(hero.tags.length >= 1 && hero.tags.length <= 2, `${id} debe tener una o dos agrupaciones`);
        assert.ok(hero.tags.every((tag) => validTags.has(tag)), `${id} tiene tags invalidos`);
        assert.ok(hero.visual?.portrait);
        assert.equal(hero.sprite, hero.visual.portrait);
        assert.deepEqual(Object.keys(hero.visual.idle).sort(), [...DIRECTIONS].sort());
        assert.equal(hero.visual.attack.frames.length, 9);
        assert.ok(hero.abilityDesc.length > 20);
        assert.ok(hero.niche.length > 8);
        assert.ok(hasSpecialContract(hero));

        for (const source of collectVisualSources(hero.visual)) {
            const file = path.join(root, source);
            assert.ok(fs.existsSync(file), `Falta ${source}`);
            assert.ok(atlas.frames[source], `El atlas no contiene ${source}`);
        }
    }
});

test('agrupacion Rivales activa buff de cinco miembros', () => {
    const team = ['hela', 'the_hood', 'venom', 'magneto', 'deadpool'].map((id) => heroes[id]);
    const snapshot = analyzeTeam(team);
    const rivals = snapshot.families.find((family) => family.tag === 'Rivales');
    const effects = getHeroTeamEffects(heroes.hela, team);

    assert.equal(rivals.activeTier.count, 5);
    assert.ok(Math.abs(effects.damagePct - 0.11) < 0.0001);
    assert.ok(Math.abs(effects.rangePct - 0.06) < 0.0001);
    assert.ok(Math.abs(effects.abilityPower - 0.07) < 0.0001);
    assert.equal(effects.detectStealth, true);
});

test('especiales Rivales se conectan al combate generico', () => {
    const hero = new Hero(heroes.magneto, 0, 0, createGame());
    const profile = hero.getProjectileProfile();
    const effects = hero.getProjectileEffects();

    assert.ok(profile.splashRadius > 0);
    assert.ok(profile.armorPenetration > 0);
    assert.ok(effects.some((effect) => effect.type === 'armorBreak'));
});

function toId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function hasSpecialContract(hero) {
    return Boolean(hero.special?.statModifiers
        || hero.special?.attackEffects
        || hero.special?.projectileProfile
        || hero.special?.supportAura
        || hero.special?.economyOnHit);
}

function createGame() {
    return {
        resourceManager: { lives: 20 },
        heroes: [],
        enemies: [],
        progression: {
            getHeroBonuses: () => null,
            getHeroEvolution: () => null
        },
        teamSynergy: null
    };
}
