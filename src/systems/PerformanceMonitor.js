export class PerformanceMonitor {
    constructor(sampleSize = 120, reportInterval = 1000) {
        this.sampleSize = sampleSize;
        this.reportInterval = reportInterval;
        this.samples = new Array(sampleSize).fill(0);
        this.sampleCount = 0;
        this.sampleIndex = 0;
        this.elapsed = 0;
        this.peakEntities = 0;
        this.lastSnapshot = { averageMs: 0, p95Ms: 0, fps: 0, peakEntities: 0 };
    }

    record(frameMs, entityCount = 0) {
        if (!Number.isFinite(frameMs) || frameMs <= 0) return null;
        this.samples[this.sampleIndex] = frameMs;
        this.sampleIndex = (this.sampleIndex + 1) % this.sampleSize;
        this.sampleCount = Math.min(this.sampleSize, this.sampleCount + 1);
        this.elapsed += frameMs;
        this.peakEntities = Math.max(this.peakEntities, entityCount);
        if (this.elapsed < this.reportInterval) return null;
        this.elapsed = 0;
        this.lastSnapshot = this.snapshot();
        return this.lastSnapshot;
    }

    snapshot() {
        const values = this.samples.slice(0, this.sampleCount).filter((value) => value > 0).sort((a, b) => a - b);
        if (values.length === 0) return { averageMs: 0, p95Ms: 0, fps: 0, peakEntities: this.peakEntities };
        const averageMs = values.reduce((total, value) => total + value, 0) / values.length;
        const p95Ms = values[Math.min(values.length - 1, Math.floor(values.length * 0.95))];
        return {
            averageMs,
            p95Ms,
            fps: 1000 / averageMs,
            peakEntities: this.peakEntities
        };
    }
}
