import test from 'node:test';
import assert from 'node:assert/strict';
import { UIManager } from '../src/systems/UIManager.js';

test('UIManager usa sprite de batalla para Iron Man y Spider-Man en paneles', () => {
    const ui = Object.create(UIManager.prototype);

    assert.equal(ui.getHeroDisplaySprite({
        id: 'iron_man',
        sprite: 'assets/images/heroes/iron_man/portrait.png',
        visual: {
            portrait: 'assets/images/heroes/iron_man/portrait.png',
            idle: { south: 'assets/images/heroes/iron_man/sprites/south.png' }
        }
    }), 'assets/images/heroes/iron_man/sprites/south.png');

    assert.equal(ui.getHeroDisplaySprite({
        config: {
            id: 'spiderman',
            sprite: 'assets/images/heroes/spiderman/portrait.png',
            visual: {
                portrait: 'assets/images/heroes/spiderman/portrait.png',
                idle: { south: 'assets/images/heroes/spiderman/sprites/south.png' }
            }
        }
    }), 'assets/images/heroes/spiderman/sprites/south.png');
});
