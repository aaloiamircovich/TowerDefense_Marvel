import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioManager, MUSIC_TRACKS } from '../src/audio/AudioManager.js';

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

test('AudioManager normaliza pista musical y configura loop', () => {
    const audio = new AudioManager();

    assert.equal(audio.setMusicTrack('xmen-97-extended-theme'), 'xmen-97-extended-theme');
    assert.equal(audio.musicTrackId, 'xmen-97-extended-theme');
    assert.equal(audio.setMusicLoop(true), true);
    assert.equal(audio.musicLoop, true);
    assert.equal(audio.setMusicTrack('no-existe'), 'ambient');
});

test('AudioManager avanza a la siguiente cancion al terminar si loop esta apagado', () => {
    const audio = new AudioManager();
    const firstPlayable = MUSIC_TRACKS.find((track) => track.src);
    const secondPlayable = MUSIC_TRACKS.filter((track) => track.src)[1];
    audio.musicTrackId = firstPlayable.id;
    audio.startTrackElement = () => true;

    audio.handleTrackEnded();

    assert.equal(audio.musicTrackId, secondPlayable.id);
});
