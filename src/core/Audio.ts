export class Audio {
    private ctx: AudioContext | null = null;
    muted = false;

    private ensure(): AudioContext {
        if (!this.ctx) this.ctx = new AudioContext();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    }

    private tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.04) {
        if (this.muted) return;
        try {
            const ctx = this.ensure();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            osc.connect(gain).connect(ctx.destination);
            const t = ctx.currentTime;
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.start(t);
            osc.stop(t + dur);
        } catch { /* игнорируем */ }
    }

    shoot()   { this.tone(180, 0.09, 'square', 0.05); }
    hit()     { this.tone(90, 0.15, 'sawtooth', 0.06); }
    brick()   { this.tone(320, 0.05, 'square', 0.03); }
    steel()   { this.tone(500, 0.04, 'triangle', 0.04); }
    explode() {
        this.tone(60, 0.35, 'sawtooth', 0.09);
        setTimeout(() => this.tone(40, 0.25, 'sawtooth', 0.06), 60);
    }
    levelUp() {
        this.tone(523, 0.1); setTimeout(() => this.tone(659, 0.1), 90);
        setTimeout(() => this.tone(784, 0.18), 180);
    }
    lose() {
        this.tone(220, 0.2, 'sawtooth', 0.07);
        setTimeout(() => this.tone(150, 0.3, 'sawtooth', 0.07), 180);
    }

    destroy() {
        if (this.ctx) {
            this.ctx.close().catch(() => {});
            this.ctx = null;
        }
    }
}