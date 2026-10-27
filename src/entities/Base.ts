import { Tile } from './Tile';
import { TileType } from '../types';

/**
 * База игрока.
 *
 * Наследник Tile, но с особой ролью:
 *  - неуязвима для «своих» пуль (опционально)
 *  - при уничтожении сигналит Game → GameOver
 *  - имеет анимацию «дыхания» и индикатор опасности
 */
export class Base extends Tile {
    hp = 1;
    override typeCode = TileType.Base;

    onDestroyed?: () => void;

    private pulseTime = 0;
    private readonly pulseSpeed = 2.4;

    private dangerTime = 0;
    private readonly dangerDuration = 0.6;

    private destroyedTime = 0;
    private readonly destroyedAnim = 0.8;

    private _destroyed = false;

    constructor(col: number, row: number) {
        super(col, row);
        this.typeCode = TileType.Base;
    }

    get isSolid() { return true; }
    get blocksBullets() { return true; }
    get destroyed() { return this._destroyed; }

    damage(): boolean {
        if (this._destroyed) return false;
        this.hp = 0;
        this._destroyed = true;
        this.destroyedTime = 0;
        this.dangerTime = 0;
        this.onDestroyed?.();
        return true;
    }

    /** Пометить базу как «в опасности» (вражеская пуля рядом). */
    alertDanger() {
        if (this._destroyed) return;
        this.dangerTime = this.dangerDuration;
    }

    override update(dt: number) {
        this.pulseTime += dt;

        if (this.dangerTime > 0) {
            this.dangerTime -= dt;
            if (this.dangerTime < 0) this.dangerTime = 0;
        }

        if (this._destroyed) {
            this.destroyedTime += dt;
            if (this.destroyedTime >= this.destroyedAnim) {
                this.alive = false;
            }
        }
    }

    // ============================================================
    //  РЕНДЕР
    // ============================================================

    render(ctx: CanvasRenderingContext2D) {
        if (!this.alive) return;

        const { x, y, w: s, h } = this;

        if (this._destroyed) {
            this.renderDestroyed(ctx, x, y, s, h);
            return;
        }

        // ---- ФОН ----
        // тёмная «плита» вокруг базы
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(x, y, s, h);

        // ---- ТЕЛО БАЗЫ ----
        // золотой квадрат
        ctx.fillStyle = '#e8c04a';
        ctx.fillRect(x + 2, y + 2, s - 4, h - 4);

        // тёмная обводка
        ctx.strokeStyle = '#8a6a1a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 2.5, y + 2.5, s - 5, h - 5);

        // ---- «ОРЁЛ» / СИМВОЛ ----
        this.renderEagle(ctx, x + s / 2, y + h / 2, s);

        // ---- ПУЛЬС ----
        this.renderPulse(ctx, x, y, s, h);

        // ---- ИНДИКАТОР ОПАСНОСТИ ----
        if (this.dangerTime > 0) {
            this.renderDanger(ctx, x, y, s, h);
        }
    }

    private renderEagle(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        size: number
    ) {
        // стилизованный «орёл»: треугольное тело + крылья
        const r = size * 0.28;

        // тело
        ctx.fillStyle = '#8a6a1a';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r * 0.6, cy + r * 0.6);
        ctx.lineTo(cx - r * 0.6, cy + r * 0.6);
        ctx.closePath();
        ctx.fill();

        // крылья
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.9, cy - r * 0.1);
        ctx.lineTo(cx - r * 1.4, cy + r * 0.4);
        ctx.lineTo(cx - r * 0.4, cy + r * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + r * 0.9, cy - r * 0.1);
        ctx.lineTo(cx + r * 1.4, cy + r * 0.4);
        ctx.lineTo(cx + r * 0.4, cy + r * 0.3);
        ctx.closePath();
        ctx.fill();

        // голова
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.7, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderPulse(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        // мягкий «дышащий» контур
        const t = (Math.sin(this.pulseTime * this.pulseSpeed) + 1) / 2; // 0..1
        const alpha = 0.15 + t * 0.25;

        ctx.strokeStyle = `rgba(255, 230, 120, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }

    private renderDanger(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        // быстрое красное мигание
        const t = this.dangerTime / this.dangerDuration;
        const blink = Math.sin(this.dangerTime * 40) > 0;
        const alpha = t * (blink ? 0.9 : 0.3);

        ctx.strokeStyle = `rgba(255, 60, 60, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);

        // внешний ореол
        ctx.strokeStyle = `rgba(255, 100, 60, ${alpha * 0.4})`;
        ctx.lineWidth = 6;
        ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    }

    private renderDestroyed(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        const t = Math.min(this.destroyedTime / this.destroyedAnim, 1);

        // тёмный обугленный квадрат
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(x, y, w, h);

        // обломки — треугольники, разлетающиеся по краям
        const pieces = 8;
        for (let i = 0; i < pieces; i++) {
            const angle = (i / pieces) * Math.PI * 2;
            const dist = 4 + t * 10;
            const px = x + w / 2 + Math.cos(angle) * dist;
            const py = y + h / 2 + Math.sin(angle) * dist;
            const size = 4 * (1 - t * 0.5);

            ctx.fillStyle = t < 0.5 ? '#e8c04a' : '#8a6a1a';
            ctx.beginPath();
            ctx.moveTo(px, py - size);
            ctx.lineTo(px + size, py);
            ctx.lineTo(px - size, py);
            ctx.closePath();
            ctx.fill();
        }

        // затухающий дым
        const smokeAlpha = (1 - t) * 0.4;
        ctx.fillStyle = `rgba(60, 40, 30, ${smokeAlpha})`;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        // красная вспышка в первые 0.2 сек
        if (this.destroyedTime < 0.2) {
            const flash = 1 - this.destroyedTime / 0.2;
            ctx.fillStyle = `rgba(255, 200, 100, ${flash * 0.8})`;
            ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
        }
    }
}