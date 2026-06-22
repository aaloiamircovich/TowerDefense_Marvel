const CUES = {
    repulsor: { frequency: 520, endFrequency: 220, duration: 0.09, type: 'sawtooth', volume: 0.035 },
    arc: { frequency: 180, endFrequency: 920, duration: 0.24, type: 'sawtooth', volume: 0.055 },
    web: { frequency: 760, endFrequency: 320, duration: 0.08, type: 'triangle', volume: 0.025 },
    shield: { frequency: 230, endFrequency: 150, duration: 0.13, type: 'square', volume: 0.025 },
    thunder: { frequency: 95, endFrequency: 42, duration: 0.38, type: 'sawtooth', volume: 0.065 },
    portal: { frequency: 340, endFrequency: 680, duration: 0.28, type: 'sine', volume: 0.04 },
    gamma: { frequency: 82, endFrequency: 42, duration: 0.34, type: 'square', volume: 0.065 },
    taser: { frequency: 880, endFrequency: 260, duration: 0.12, type: 'sawtooth', volume: 0.035 },
    arrow: { frequency: 720, endFrequency: 180, duration: 0.07, type: 'triangle', volume: 0.022 },
    vibranium: { frequency: 190, endFrequency: 620, duration: 0.16, type: 'sine', volume: 0.042 },
    density: { frequency: 410, endFrequency: 110, duration: 0.2, type: 'sawtooth', volume: 0.04 },
    redwing: { frequency: 640, endFrequency: 510, duration: 0.08, type: 'square', volume: 0.024 },
    binary: { frequency: 240, endFrequency: 980, duration: 0.3, type: 'sawtooth', volume: 0.052 },
    blaster: { frequency: 680, endFrequency: 240, duration: 0.08, type: 'square', volume: 0.025 },
    roots: { frequency: 130, endFrequency: 75, duration: 0.24, type: 'triangle', volume: 0.04 },
    cosmicBlade: { frequency: 520, endFrequency: 160, duration: 0.1, type: 'sawtooth', volume: 0.033 },
    cosmic: { frequency: 310, endFrequency: 860, duration: 0.22, type: 'sine', volume: 0.045 },
    boss: { frequency: 120, endFrequency: 45, duration: 0.52, type: 'sawtooth', volume: 0.07 },
    ui: { frequency: 420, endFrequency: 520, duration: 0.05, type: 'sine', volume: 0.025 },
    confirm: { frequency: 440, endFrequency: 780, duration: 0.12, type: 'triangle', volume: 0.035 },
    warning: { frequency: 210, endFrequency: 150, duration: 0.18, type: 'square', volume: 0.028 },
    wave: { frequency: 260, endFrequency: 620, duration: 0.2, type: 'sawtooth', volume: 0.04 },
    reward: { frequency: 520, endFrequency: 880, duration: 0.16, type: 'triangle', volume: 0.035 },
    victory: { frequency: 330, endFrequency: 990, duration: 0.45, type: 'triangle', volume: 0.05 }
};

const THEME_TONES = {
    'new-york': [82.41, 123.47],
    avengers: [98, 146.83],
    wakanda: [110, 164.81],
    sanctum: [73.42, 146.83],
    'x-mansion': [87.31, 130.81],
    knowhere: [65.41, 130.81],
    latveria: [77.78, 116.54]
};

export class AudioManager {
    constructor() {
        this.enabled = true;
        this.context = null;
        this.masterVolume = 0.7;
        this.musicVolume = 0.25;
        this.sfxVolume = 0.75;
        this.themeId = 'new-york';
        this.nodes = null;
        this.ambient = [];
    }

    setEnabled(enabled) {
        const next = Boolean(enabled);
        if (this.enabled === next) {
            this.applyVolumes();
            return;
        }
        this.enabled = next;
        if (!this.enabled) this.stopAmbient();
        else if (this.context) this.startAmbient();
        this.applyVolumes();
    }

    setBusVolume(bus, value) {
        const normalized = clampVolume(value);
        if (bus === 'master') this.masterVolume = normalized;
        if (bus === 'music') this.musicVolume = normalized;
        if (bus === 'sfx') this.sfxVolume = normalized;
        this.applyVolumes();
        return normalized;
    }

    getBusVolume(bus) {
        return bus === 'music' ? this.musicVolume : bus === 'sfx' ? this.sfxVolume : this.masterVolume;
    }

    setTheme(themeId) {
        this.themeId = THEME_TONES[themeId] ? themeId : 'new-york';
        if (this.context) this.startAmbient();
    }

    unlock() {
        if (!this.enabled || !this.ensureContext()) return false;
        if (this.context.state === 'suspended') this.context.resume();
        this.startAmbient();
        return true;
    }

    play(cueName) {
        if (!this.enabled || !this.ensureContext()) return false;
        const cue = CUES[cueName];
        if (!cue) return false;
        if (this.context.state === 'suspended') this.context.resume();

        const now = this.context.currentTime;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = cue.type;
        oscillator.frequency.setValueAtTime(cue.frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(cue.endFrequency, now + cue.duration);
        gain.gain.setValueAtTime(cue.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
        oscillator.connect(gain);
        gain.connect(this.nodes.sfx);
        oscillator.start(now);
        oscillator.stop(now + cue.duration);
        return true;
    }

    ensureContext() {
        if (this.context) return true;
        const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContextClass) return false;
        this.context = new AudioContextClass();
        const master = this.context.createGain();
        const music = this.context.createGain();
        const sfx = this.context.createGain();
        music.connect(master);
        sfx.connect(master);
        master.connect(this.context.destination);
        this.nodes = { master, music, sfx };
        this.applyVolumes();
        return true;
    }

    applyVolumes() {
        if (!this.nodes || !this.context) return;
        const now = this.context.currentTime;
        this.nodes.master.gain.setTargetAtTime(this.enabled ? this.masterVolume : 0, now, 0.03);
        this.nodes.music.gain.setTargetAtTime(this.musicVolume, now, 0.03);
        this.nodes.sfx.gain.setTargetAtTime(this.sfxVolume, now, 0.03);
    }

    startAmbient() {
        if (!this.enabled || !this.context || !this.nodes) return;
        this.stopAmbient();
        const tones = THEME_TONES[this.themeId] || THEME_TONES['new-york'];
        this.ambient = tones.map((frequency, index) => {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.type = index === 0 ? 'sine' : 'triangle';
            oscillator.frequency.value = frequency;
            gain.gain.value = index === 0 ? 0.018 : 0.009;
            oscillator.connect(gain);
            gain.connect(this.nodes.music);
            oscillator.start();
            return { oscillator, gain };
        });
    }

    stopAmbient() {
        this.ambient.forEach(({ oscillator }) => {
            try { oscillator.stop(); } catch { /* Already stopped. */ }
        });
        this.ambient = [];
    }
}

function clampVolume(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
}

export { CUES, THEME_TONES };
