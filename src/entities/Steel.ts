import { Tile } from './Tile';
import { CONFIG } from '../config';
import { TileType } from '../types';

interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
}

/**
 * Сталь — неуязвима для обычных пуль.
 *
 * Геймплейно:
 *  - блокирует танки (isSolid = true)
 *  - блокирует пули (blocksBullets = true)
 *  - не разрушается от обычного выстрела: damage() возвращает false,
 *    но спавнит искры
 *  - forceDestroy() — для бронебойных пуль / бонусов
 */
export class Steel extends Tile {
    override typeCode = TileType.Steel;

    private sparks: Spark[] = [];

    constructor(col: number, row: number) {
        super(col, row);
        this.typeCode = TileType.Steel;
    }

    // ============================================================
    //  ГЕЙМПЛЕЙНЫЕ ФЛАГИ
    // ============================================================

    get isSolid() { return true; }
    get blocksBullets() { return true; }

    // ============================================================
    //  УРОН
    // ============================================================

    /**
     * Обычный урон не проходит. Спавним искры, возвращаем false.
     */
    damage(): boolean {
        this.spawnSparks();
        return false;
    }

    /**
     * Принудительное уничтожение — для бронебойных пуль или бонусов.
     * Возвращает true, чтобы Game знал, что тайл стал мёртвым.
     */
    forceDestroy(): boolean {
        this.alive = false;
        return true;
    }

    private spawnSparks() {
        const count = 6;
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 60 + Math.random() * 120;
            const life = 0.2 + Math.random() * 0.2;

            this.sparks.push({
                x: this.w / 2,
                y: this.h / 2,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life,
                maxLife: life,
            });
        }
    }

    // ============================================================
    //  ОБНОВЛЕНИЕ
    // ============================================================

    override update(dt: number, _game?: any) {
        for (const sp of this.sparks) {
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.vx *= 0.9;
            sp.vy *= 0.9;
            sp.vy += 200 * dt; // гравитация
            sp.life -= dt;
        }
        this.sparks = this.sparks.filter(s => s.life > 0);
    }

    // ============================================================
    //  РЕНДЕР
    // ============================================================

    render(ctx: CanvasRenderingContext2D) {
        if (!this.alive) return;

        const { x, y, w: s, h } = this;

        // ---- ФОН ----
        ctx.fillStyle = CONFIG.COLORS.STEEL;
        ctx.fillRect(x, y, s, h);

        // ---- ВНУТРЕННИЙ ТЁМНЫЙ КВАДРАТ ----
        ctx.fillStyle = CONFIG.COLORS.STEEL_DARK;
        ctx.fillRect(x + 2, y + 2, s - 4, h - 4);

        // ---- МЕРЦАЮЩИЙ БЛИК ----
        const t = performance.now() / 500;
        const shineAlpha = 0.15 + 0.1 * Math.sin(t + (this.col + this.row));
        ctx.fillStyle = `rgba(255, 255, 255, ${shineAlpha})`;
        ctx.fillRect(x + 3, y + 3, s - 6, 2);

        // ---- СВЕТЛЫЙ ЦЕНТР ----
        ctx.fillStyle = CONFIG.COLORS.STEEL;
        ctx.fillRect(x + 6, y + 6, s - 12, h - 12);

        // ---- ЗАКЛЁПКИ ПО УГЛАМ ----
        ctx.fillStyle = CONFIG.COLORS.STEEL_DARK;
        const r = 1.5;
        const corners: [number, number][] = [
            [x + 4, y + 4],
            [x + s - 4, y + 4],
            [x + 4, y + h - 4],
            [x + s - 4, y + h - 4],
        ];
        for (const [px, py] of corners) {
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // ---- КОНТУР ----
        ctx.strokeStyle = CONFIG.COLORS.STEEL_DARK;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, s - 1, h - 1);

        // ---- ИСКРЫ ----
        for (const sp of this.sparks) {
            const a = sp.life / sp.maxLife;
            ctx.globalAlpha = a;
            ctx.fillStyle = a > 0.6 ? '#fff8a0' : '#ffaa44';
            ctx.fillRect(x + sp.x - 1, y + sp.y - 1, 3, 3);
        }
        ctx.globalAlpha = 1;
    }
}