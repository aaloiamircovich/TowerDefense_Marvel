const CUES = {
    repulsor: { frequency: 520, endFrequency: 220, duration: 0.09, type: 'sawtooth', volume: 0.035 },
    arc: { frequency: 180, endFrequency: 920, duration: 0.24, type: 'sawtooth', volume: 0.055 },
    web: { frequency: 760, endFrequency: 320, duration: 0.08, type: 'triangle', volume: 0.025 },
    shield: { frequency: 230, endFrequency: 150, duration: 0.13, type: 'square', volume: 0.025 },
    thunder: { frequency: 95, endFrequency: 42, duration: 0.38, type: 'sawtooth', volume: 0.065 },
    portal: { frequency: 340, endFrequency: 680, duration: 0.28, type: 'sine', volume: 0.04 },
    boss: { frequency: 120, endFrequency: 45, duration: 0.52, type: 'sawtooth', volume: 0.07 }
};

export class AudioManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.7;
        this.context = null;
    }

    setEnabled(enabled) {
        this.enabled = Boolean(enabled);
    }

    play(cueName) {
        if (!this.enabled) return;
        const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContextClass) return;

        const cue = CUES[cueName];
        if (!cue) return;

        this.context ||= new AudioContextClass();
        if (this.context.state === 'suspended') this.context.resume();

        const now = this.context.currentTime;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = cue.type;
        oscillator.frequency.setValueAtTime(cue.frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(cue.endFrequency, now + cue.duration);
        gain.gain.setValueAtTime(cue.volume * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
        oscillator.connect(gain);
        gain.connect(this.context.destination);
        oscillator.start(now);
        oscillator.stop(now + cue.duration);
    }
}
