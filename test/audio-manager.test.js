import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioManager } from '../src/audio/AudioManager.js';

test('AudioManager mantiene volúmenes separados y normalizados', () => {
    const audio = new AudioManager();

    assert.equal(audio.setBusVolume('master', 1.5), 1);
    assert.equal(audio.setBusVolume('music', -1), 0);
    assert.equal(audio.setBusVolume('sfx', 0.42), 0.42);
    assert.equal(audio.getBusVolume('master'), 1);
    assert.equal(audio.getBusVolume('music'), 0);
    assert.equal(audio.getBusVolume('sfx'), 0.42);
});

test('AudioManager funciona sin Web Audio disponible', () => {
    const audio = new AudioManager();
    audio.setTheme('wakanda');

    assert.equal(audio.themeId, 'wakanda');
    assert.equal(audio.play('repulsor'), false);
    assert.equal(audio.unlock(), false);
});
