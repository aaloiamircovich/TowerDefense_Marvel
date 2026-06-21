import { getSpriteFrame } from './ImageCache.js';

export const DIRECTIONS = [
    'east',
    'south-east',
    'south',
    'south-west',
    'west',
    'north-west',
    'north',
    'north-east'
];

export class SpriteAnimator {
    constructor(config = {}) {
        this.config = config;
        this.state = 'idle';
        this.facing = config.defaultDirection || 'south';
        this.frameIndex = 0;
        this.elapsed = 0;

        collectVisualSources(config).forEach((source) => getSpriteFrame(source));
    }

    faceVector(dx, dy) {
        this.facing = directionFromVector(dx, dy, this.facing);
    }

    playAttack() {
        if (!this.config.attack?.frames?.length) return;
        this.state = 'attack';
        this.frameIndex = 0;
        this.elapsed = 0;
    }

    update(dt) {
        if (this.state !== 'attack') return;

        const attack = this.config.attack;
        const fps = attack.fps || 12;
        const frameDuration = 1 / fps;
        this.elapsed += dt;

        while (this.elapsed >= frameDuration) {
            this.elapsed -= frameDuration;
            this.frameIndex++;

            if (this.frameIndex >= attack.frames.length) {
                if (attack.loop) this.frameIndex = 0;
                else {
                    this.state = 'idle';
                    this.frameIndex = 0;
                    break;
                }
            }
        }
    }

    getCurrentSource() {
        if (this.state === 'attack' && this.config.attack?.frames?.length) {
            return this.config.attack.frames[this.frameIndex] || this.config.attack.frames[0];
        }

        const idle = this.config.idle || {};
        return idle[this.facing] || idle.south || Object.values(idle)[0] || null;
    }

    render(ctx, x, y) {
        const { image, frame } = getSpriteFrame(this.getCurrentSource());
        if (!image?.complete || image.naturalWidth <= 0) return false;

        const size = this.config.size || 96;
        const anchor = this.config.anchor || { x: 0.5, y: 0.5 };
        const previousSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;
        if (frame) {
            ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height, x - size * anchor.x, y - size * anchor.y, size, size);
        } else {
            ctx.drawImage(image, x - size * anchor.x, y - size * anchor.y, size, size);
        }
        ctx.imageSmoothingEnabled = previousSmoothing;
        return true;
    }
}

export function directionFromVector(dx, dy, fallback = 'south') {
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) return fallback;

    const angle = Math.atan2(dy, dx);
    const index = Math.round(angle / (Math.PI / 4));
    return DIRECTIONS[(index + 8) % 8];
}

export function collectVisualSources(config = {}) {
    return [
        config.portrait,
        ...Object.values(config.idle || {}),
        ...(config.attack?.frames || [])
    ].filter(Boolean);
}
