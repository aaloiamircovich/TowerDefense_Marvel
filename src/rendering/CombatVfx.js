import { ObjectPool } from '../utils/ObjectPool.js';

export class CombatVfx {
    constructor() {
        this.effects = [];
        this.pool = new ObjectPool(() => ({}), clearEffect, 384);
    }

    addBeam(from, to, options = {}) {
        this.addEffect({
            type: 'beam',
            from: { x: from.x, y: from.y },
            to: { x: to.x, y: to.y },
            color: options.color || '#40c9ff',
            width: options.width || 8,
            duration: options.duration || 0.2,
            maxDuration: options.duration || 0.2
        });
    }

    addRing(x, y, options = {}) {
        this.addEffect({
            type: 'ring',
            x,
            y,
            color: options.color || '#fca311',
            radius: options.radius || 60,
            duration: options.duration || 0.45,
            maxDuration: options.duration || 0.45
        });
    }

    addLightning(x, y, options = {}) {
        const points = [{ x, y: 0 }];
        const segments = 7;
        for (let index = 1; index < segments; index++) {
            const progress = index / segments;
            const offset = Math.sin((x + y + index) * 1.73) * 13;
            points.push({ x: x + offset, y: y * progress });
        }
        points.push({ x, y });
        this.addEffect({
            type: 'lightning',
            points,
            color: options.color || '#dff6ff',
            duration: options.duration || 0.28,
            maxDuration: options.duration || 0.28
        });
    }

    addBurst(x, y, options = {}) {
        this.addEffect({
            type: 'burst',
            x,
            y,
            color: options.color || '#ffffff',
            radius: options.radius || 28,
            duration: options.duration || 0.3,
            maxDuration: options.duration || 0.3
        });
    }

    addFloatingText(x, y, text, options = {}) {
        this.addEffect({
            type: 'floatingText',
            x,
            y,
            text: String(text),
            color: options.color || '#ffffff',
            size: options.size || 14,
            velocityY: options.velocityY || -34,
            duration: options.duration || 0.72,
            maxDuration: options.duration || 0.72
        });
    }

    update(dt) {
        let writeIndex = 0;
        for (const effect of this.effects) {
            effect.duration -= dt;
            if (effect.duration > 0) this.effects[writeIndex++] = effect;
            else this.pool.release(effect);
        }
        this.effects.length = writeIndex;
    }

    addEffect(config) {
        const effect = this.pool.acquire((target) => Object.assign(target, config));
        this.effects.push(effect);
        return effect;
    }

    clear() {
        this.effects.forEach((effect) => this.pool.release(effect));
        this.effects.length = 0;
    }

    render(ctx) {
        this.effects.forEach((effect) => this.renderEffect(ctx, effect));
    }

    renderEffect(ctx, effect) {
        const progress = 1 - effect.duration / effect.maxDuration;
        const alpha = Math.max(0, 1 - progress);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = effect.color;
        ctx.fillStyle = effect.color;
        ctx.shadowColor = effect.color;
        ctx.shadowBlur = 14;

        if (effect.type === 'beam') {
            ctx.lineWidth = Math.max(1, effect.width * (1 - progress * 0.55));
            ctx.beginPath();
            ctx.moveTo(effect.from.x, effect.from.y);
            ctx.lineTo(effect.to.x, effect.to.y);
            ctx.stroke();
        } else if (effect.type === 'ring') {
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * progress, 0, Math.PI * 2);
            ctx.stroke();
        } else if (effect.type === 'lightning') {
            ctx.lineWidth = 4;
            ctx.beginPath();
            effect.points.forEach((point, index) => index === 0
                ? ctx.moveTo(point.x, point.y)
                : ctx.lineTo(point.x, point.y));
            ctx.stroke();
        } else if (effect.type === 'burst') {
            ctx.lineWidth = 3;
            for (let index = 0; index < 8; index++) {
                const angle = index * Math.PI / 4;
                const inner = effect.radius * progress * 0.35;
                const outer = effect.radius * progress;
                ctx.beginPath();
                ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
                ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
                ctx.stroke();
            }
        } else if (effect.type === 'floatingText') {
            ctx.font = `900 ${Math.round(effect.size * (1 + progress * 0.12))}px Segoe UI, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 4;
            const y = effect.y + effect.velocityY * progress;
            ctx.strokeStyle = 'rgba(5, 7, 11, 0.85)';
            ctx.strokeText(effect.text, effect.x, y);
            ctx.fillText(effect.text, effect.x, y);
        }
        ctx.restore();
    }
}

function clearEffect(effect) {
    for (const key of Object.keys(effect)) {
        if (key !== '__poolUsed') delete effect[key];
    }
}
