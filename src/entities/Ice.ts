import { Tile } from './Tile';
import { TileType } from '../types';

/**
 * Лёд — танки скользят, пули пролетают.
 *
 * Геймплейно:
 *  - не блокирует танки (isSolid = false)
 *  - не блокирует пули (blocksBullets = false)
 *  - не разрушается (damage() = false)
 *  - Tank проверяет isIceAt под собой и добавляет инерцию
 */
export class Ice extends Tile {
    override typeCode = TileType.Ice;
    private readonly phase: number;

    constructor(col: number, row: number) {
        super(col, row);
        this.typeCode = TileType.Ice;
        this.phase = (col * 7 + row * 13) * 0.13;
    }

    get isSolid() { return false; }
    get blocksBullets() { return false; }

    damage(): boolean {
        // лёд неуязвим
        return false;
    }

    render(ctx: CanvasRenderingContext2D) {
        const { x, y, w: s, h } = this;
        const t = performance.now() / 1000 + this.phase;

        // ---- БАЗА ----
        // светло-голубая плитка
        ctx.fillStyle = '#c8e8f0';
        ctx.fillRect(x, y, s, h);

        // ---- ГРАДИЕНТ ПРОЗРАЧНОСТИ ----
        // мягкий переход к краям — «стеклянный» вид
        const grad = ctx.createLinearGradient(x, y, x + s, y + h);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        grad.addColorStop(0.5, 'rgba(180, 220, 235, 0.1)');
        grad.addColorStop(1, 'rgba(120, 180, 200, 0.25)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, s, h);

        // ---- ТРЕЩИНЫ ----
        // 2–3 трещины, статичные по форме, но с лёгким мерцанием
        const shine = 0.25 + 0.1 * Math.sin(t);
        ctx.strokeStyle = `rgba(80, 140, 165, ${shine})`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        // трещина №1 — от верхнего левого угла
        ctx.moveTo(x + s * 0.15, y + s * 0.1);
        ctx.lineTo(x + s * 0.35, y + s * 0.35);
        ctx.lineTo(x + s * 0.28, y + s * 0.6);
        ctx.lineTo(x + s * 0.5, y + s * 0.85);

        // трещина №2 — из центра
        ctx.moveTo(x + s * 0.55, y + s * 0.2);
        ctx.lineTo(x + s * 0.7, y + s * 0.45);
        ctx.lineTo(x + s * 0.65, y + s * 0.7);

        // трещина №3 — справа
        ctx.moveTo(x + s * 0.85, y + s * 0.15);
        ctx.lineTo(x + s * 0.75, y + s * 0.4);
        ctx.lineTo(x + s * 0.9, y + s * 0.65);
        ctx.stroke();

        // ---- БЛИК ----
        // диагональная светлая полоса, скользящая со временем
        const shinePos = ((t * 0.3) % 1) * s * 1.5 - s * 0.25;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, s, h);
        ctx.clip();

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + 0.15 * Math.sin(t * 2)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + shinePos, y);
        ctx.lineTo(x + shinePos + s * 0.4, y + s);
        ctx.stroke();

        ctx.restore();

        // ---- КОНТУР ----
        ctx.strokeStyle = '#8ac0d0';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, s - 1, h - 1);

        // ---- УГЛОВЫЕ «ЗАМОРОЗКИ» ----
        // маленькие точки по углам — намёк на иней
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + 0.2 * Math.sin(t * 1.5)})`;
        for (const [px, py] of [
            [x + 3, y + 3],
            [x + s - 3, y + 3],
            [x + 3, y + h - 3],
            [x + s - 3, y + h - 3],
        ]) {
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}