import { Tile } from './Tile';
import { TileType } from '../types';

/**
 * Куст — маскировка.
 *
 * Геймплейно:
 *  - не блокирует танки (isSolid = false)
 *  - не блокирует пули (blocksBullets = false)
 *  - не разрушается (damage() = false)
 *  - рисуется ПОВЕРХ танков (2-й проход рендера в Game)
 */
export class Bush extends Tile {
    override typeCode = TileType.Bush;
    private readonly phase: number;
    private leaves: { x: number; y: number; r: number; shade: number }[] = [];

    constructor(col: number, row: number) {
        super(col, row);
        this.typeCode = TileType.Bush;
        this.phase = (col * 3 + row * 5) * 0.21;
        this.generateLeaves();
    }

    get isSolid() { return false; }
    get blocksBullets() { return false; }

    damage(): boolean { return false; }

    /** Сгенерировать «кучу» кругов, из которых состоит куст. */
    private generateLeaves() {
        const s = this.w;
        const count = 7 + Math.floor(Math.random() * 4); // 7–10 листочков

        for (let i = 0; i < count; i++) {
            const cx = 4 + Math.random() * (s - 8);
            const cy = 4 + Math.random() * (s - 8);
            const r = 3 + Math.random() * 3;
            const shade = Math.random(); // 0 — тёмный, 1 — светлый
            this.leaves.push({ x: cx, y: cy, r, shade });
        }

        // сортируем по y — чтобы нижние рисовались позже (эффект глубины)
        this.leaves.sort((a, b) => a.y - b.y);
    }

    render(ctx: CanvasRenderingContext2D) {
        const { x, y, w: s, h } = this;
        const t = performance.now() / 1000 + this.phase;

        // ---- ФОН ----
        // очень тёмная зелёная подложка, чтобы «дырки» между листьями не просвечивали
        ctx.fillStyle = 'rgba(20, 50, 20, 0.55)';
        ctx.fillRect(x, y, s, h);

        // ---- ЛИСТОЧКИ ----
        for (const leaf of this.leaves) {
            // лёгкое покачивание
            const sway = Math.sin(t * 1.2 + leaf.x * 0.3 + leaf.y * 0.2) * 0.8;
            const px = x + leaf.x + sway;
            const py = y + leaf.y;

            // цвет от тёмного к светлому
            const g = Math.floor(80 + leaf.shade * 70);
            const r = Math.floor(30 + leaf.shade * 30);
            const b = Math.floor(30 + leaf.shade * 20);

            // основной круг
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.beginPath();
            ctx.arc(px, py, leaf.r, 0, Math.PI * 2);
            ctx.fill();

            // лёгкий блик сверху
            ctx.fillStyle = `rgba(180, 240, 160, ${0.15 + leaf.shade * 0.15})`;
            ctx.beginPath();
            ctx.arc(px - leaf.r * 0.3, py - leaf.r * 0.3, leaf.r * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }

        // ---- МЕЛКИЕ ТОЧКИ-ДЕТАЛИ ----
        // несколько «искр» света сквозь листву
        for (let i = 0; i < 3; i++) {
            const px = x + 6 + (i * 9) % s;
            const py = y + 5 + (i * 13) % h;
            const a = 0.15 + 0.15 * Math.sin(t * 2 + i);
            ctx.fillStyle = `rgba(220, 255, 200, ${a})`;
            ctx.fillRect(px, py, 1.5, 1.5);
        }

        // ---- КОНТУР ----
        // очень мягкая тёмная обводка — чтобы куст отделялся от травы
        ctx.strokeStyle = 'rgba(10, 30, 10, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, s - 1, h - 1);
    }
}