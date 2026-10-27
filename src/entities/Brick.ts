import { Tile } from './Tile';
import { CONFIG } from '../config';
import { TileType } from '../types';

/**
 * Кирпич — 2 hp.
 *
 * Геймплейно:
 *  - блокирует танки (isSolid = true)
 *  - блокирует пули (blocksBullets = true)
 *  - первый выстрел → трещина, второй → разрушение
 *  - микро-тряска при попадании
 */
export class Brick extends Tile {
    override typeCode = TileType.Brick;

    hp = 2;
    private readonly maxHp = 2;

    /** Микро-тряска при попадании (сек). */
    private shakeTime = 0;

    constructor(col: number, row: number) {
        super(col, row);
        this.typeCode = TileType.Brick;
    }

    // ============================================================
    //  ГЕЙМПЛЕЙНЫЕ ФЛАГИ
    // ============================================================

    get isSolid() { return true; }
    get blocksBullets() { return true; }

    // ============================================================
    //  УРОН
    // ============================================================

    /** Возвращает true, если именно этот выстрел разрушил кирпич. */
    damage(): boolean {
        this.hp--;
        this.shakeTime = 0.12;

        if (this.hp <= 0) {
            this.alive = false;
            return true;
        }
        return false;
    }

    // ============================================================
    //  ОБНОВЛЕНИЕ
    // ============================================================

    override update(dt: number, _game?: any) {
        if (this.shakeTime > 0) this.shakeTime -= dt;
    }

    // ============================================================
    //  РЕНДЕР
    // ============================================================

    render(ctx: CanvasRenderingContext2D) {
        if (!this.alive) return;

        const { x, y, w: s, h } = this;

        // микро-тряска
        const ox = this.shakeTime > 0 ? (Math.random() - 0.5) * 2 : 0;
        const oy = this.shakeTime > 0 ? (Math.random() - 0.5) * 2 : 0;

        // цвет зависит от состояния
        const base =
            this.hp === this.maxHp
                ? CONFIG.COLORS.BRICK
                : CONFIG.COLORS.BRICK_DARK;

        ctx.save();
        ctx.translate(x + ox, y + oy);

        // ---- ЗАЛИВКА ----
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, s, h);

        // ---- КЛАДКА ----
        ctx.strokeStyle = '#3a1c0a';
        ctx.lineWidth = 1;
        ctx.beginPath();

        const brickH = s / 4;

        // горизонтальные швы
        for (let i = 1; i < 4; i++) {
            ctx.moveTo(0, i * brickH);
            ctx.lineTo(s, i * brickH);
        }

        // вертикальные швы в шахматном порядке
        for (let row = 0; row < 4; row++) {
            const yTop = row * brickH;
            const offset = row % 2 === 0 ? 0 : s / 2;
            for (let xLine = offset; xLine < s; xLine += s / 2) {
                if (xLine === 0 || xLine === s) continue;
                ctx.moveTo(xLine, yTop);
                ctx.lineTo(xLine, yTop + brickH);
            }
        }
        ctx.stroke();

        // ---- ТРЕЩИНЫ (при hp=1) ----
        if (this.hp < this.maxHp) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(s * 0.3, 0);
            ctx.lineTo(s * 0.5, s * 0.4);
            ctx.lineTo(s * 0.35, s * 0.7);
            ctx.lineTo(s * 0.6, s);
            ctx.moveTo(s * 0.7, s * 0.2);
            ctx.lineTo(s * 0.55, s * 0.5);
            ctx.stroke();
        }

        // ---- БЛИК СВЕРХУ ----
        ctx.fillStyle = 'rgba(255, 200, 150, 0.15)';
        ctx.fillRect(1, 1, s - 2, 2);

        // ---- КОНТУР ----
        ctx.strokeStyle = '#3a1c0a';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, s - 1, h - 1);

        ctx.restore();
    }
}