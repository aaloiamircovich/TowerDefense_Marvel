import test from 'node:test';
import assert from 'node:assert/strict';
import { SpriteAnimator, collectVisualSources, directionFromVector } from '../src/rendering/SpriteAnimator.js';

test('directionFromVector resuelve las ocho direcciones', () => {
    assert.equal(directionFromVector(1, 0), 'east');
    assert.equal(directionFromVector(1, 1), 'south-east');
    assert.equal(directionFromVector(0, 1), 'south');
    assert.equal(directionFromVector(-1, 1), 'south-west');
    assert.equal(directionFromVector(-1, 0), 'west');
    assert.equal(directionFromVector(-1, -1), 'north-west');
    assert.equal(directionFromVector(0, -1), 'north');
    assert.equal(directionFromVector(1, -1), 'north-east');
});

test('SpriteAnimator reproduce ataque y vuelve a idle', () => {
    const animator = new SpriteAnimator({
        idle: { south: 'idle.png' },
        attack: { fps: 10, loop: false, frames: ['a.png', 'b.png', 'c.png'] }
    });

    animator.playAttack();
    assert.equal(animator.getCurrentSource(), 'a.png');
    animator.update(0.11);
    assert.equal(animator.getCurrentSource(), 'b.png');
    animator.update(0.21);
    assert.equal(animator.state, 'idle');
    assert.equal(animator.getCurrentSource(), 'idle.png');
});

test('SpriteAnimator conserva direccion ante vector nulo', () => {
    const animator = new SpriteAnimator({ defaultDirection: 'west', idle: { west: 'west.png' } });
    animator.faceVector(0, 0);
    assert.equal(animator.facing, 'west');
});

test('collectVisualSources devuelve fuentes unicas utilizables por precarga', () => {
    const sources = collectVisualSources({
        portrait: 'portrait.png',
        idle: { south: 'idle.png' },
        attack: { frames: ['a.png', 'b.png'] }
    });

    assert.deepEqual(sources, ['portrait.png', 'idle.png', 'a.png', 'b.png']);
});
