import { Tile } from './Tile';
import { TileType } from '../types';

/**
 * Вода — танки не проходят, пули пролетают.
 */
export class Water extends Tile {
    override typeCode = TileType.Water;

    constructor(col: number, row: number) {
        super(col, row);
        this.typeCode = TileType.Water;
    }

    get isSolid() { return true; }
    get blocksBullets() { return false; }

    damage(): boolean {
        return false;
    }

    render(ctx: CanvasRenderingContext2D) {
        const { x, y, w: s, h } = this;
        const t = performance.now() / 600;

        // основа
        ctx.fillStyle = '#2a5b8a';
        ctx.fillRect(x, y, s, h);

        // волны — три полосы
        for (let i = 0; i < 3; i++) {
            const offset =
                Math.sin(t + this.col * 0.5 + this.row * 0.3 + i * 0.8) * 2;
            const yy = y + h * (0.2 + i * 0.3) + offset;

            ctx.fillStyle = i === 1 ? '#4a8bc0' : '#3a7aaa';
            ctx.fillRect(x + 2, yy, s - 4, 2);
        }

        // лёгкий блик сверху
        ctx.fillStyle = 'rgba(180, 220, 255, 0.15)';
        ctx.fillRect(x + 2, y + 2, s - 4, 2);

        // контур
        ctx.strokeStyle = '#1a3b5a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, s - 1, h - 1);
    }
}