import { Entity } from './Entity';
import { CONFIG } from '../config';
import { Direction, DIR_VECTORS, type Rect } from '../types';

export abstract class Tank extends Entity {
    // ---- Состояние ----
    direction: Direction = Direction.Up;
    health = CONFIG.TANK.HEALTH;
    cooldown = 0;
    shield = 0;
    speed = CONFIG.TANK.SPEED;

    // ---- Ссылка на карту (для isIceAt/isBushAt) ----
    map: any = null;

    // ---- Инерция на льду ----
    protected iceVx = 0;
    protected iceVy = 0;
    protected iceSlideTimer = 0;
    protected readonly ICE_FRICTION = 0.92;
    protected readonly ICE_SLIDE_DURATION = 0.35;
    protected readonly ICE_ACCEL = 6;

    constructor(x: number, y: number, w: number, h: number) {
        super(x, y, w, h);
    }

    // ============================================================
    //  ГЕОМЕТРИЯ
    // ============================================================

    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }

    get muzzle(): { x: number; y: number } {
        const v = DIR_VECTORS[this.direction];
        return {
            x: this.cx + v.x * (this.w / 2 + 2),
            y: this.cy + v.y * (this.h / 2 + 2),
        };
    }

    // ============================================================
    //  СТРЕЛЬБА
    // ============================================================

    canShoot(): boolean {
        return this.cooldown <= 0;
    }

    shoot() {
        this.cooldown = CONFIG.TANK.COOLDOWN;
    }

    // ============================================================
    //  ДВИЖЕНИЕ
    // ============================================================

    /** Попытка сдвинуть танк с проверкой коллизий. */
    tryMove(dx: number, dy: number, map: any, tanks: Tank[]): boolean {
        if (dx === 0 && dy === 0) return false;

        const nx = this.x + dx;
        const ny = this.y + dy;
        const next: Rect = { x: nx, y: ny, w: this.w, h: this.h };

        // границы карты
        if (nx < 0 || ny < 0 ||
            nx + this.w > CONFIG.WIDTH || ny + this.h > CONFIG.HEIGHT) {
            return false;
        }

        // твёрдые тайлы
        for (const tile of map.solidTiles()) {
            const tr = map.tileRect(tile);
            if (this.overlaps(next, tr)) return false;
        }

        // другие танки
        for (const other of tanks) {
            if (other === this || !other.alive) continue;
            if (this.overlaps(next, other.rect)) return false;
        }

        this.x = nx;
        this.y = ny;
        return true;
    }

    protected overlaps(a: Rect, b: Rect): boolean {
        return a.x < b.x + b.w && a.x + a.w > b.x
            && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    /** Стоит ли танк хотя бы одной точкой на льду. */
    protected checkIce(map: any): boolean {
        if (!map) return false;
        const points = [
            { x: this.x + 2,        y: this.y + 2 },
            { x: this.x + this.w - 2, y: this.y + 2 },
            { x: this.x + 2,        y: this.y + this.h - 2 },
            { x: this.x + this.w - 2, y: this.y + this.h - 2 },
            { x: this.cx,           y: this.cy },
        ];
        for (const p of points) {
            if (map.isIceAt(p.x, p.y)) return true;
        }
        return false;
    }

    /**
     * Движение с учётом льда.
     *  dirX/dirY — желаемое направление (-1, 0, 1).
     */
    protected moveWithIce(
        dirX: number,
        dirY: number,
        dt: number,
        map: any,
        tanks: Tank[]
    ): boolean {
        const onIce = this.checkIce(map);

        if (dirX !== 0 || dirY !== 0) {
            const targetVx = dirX * this.speed;
            const targetVy = dirY * this.speed;

            if (onIce) {
                const k = Math.min(1, this.ICE_ACCEL * dt);
                this.iceVx += (targetVx - this.iceVx) * k;
                this.iceVy += (targetVy - this.iceVy) * k;
            } else {
                this.iceVx = targetVx;
                this.iceVy = targetVy;
            }
            this.iceSlideTimer = this.ICE_SLIDE_DURATION;
        } else if (this.iceSlideTimer > 0 && onIce) {
            this.iceSlideTimer -= dt;
            this.iceVx *= this.ICE_FRICTION;
            this.iceVy *= this.ICE_FRICTION;
        } else {
            this.iceVx = 0;
            this.iceVy = 0;
            this.iceSlideTimer = 0;
        }

        if (this.iceVx === 0 && this.iceVy === 0) return false;

        const dx = this.iceVx * dt;
        const dy = this.iceVy * dt;

        let moved = false;
        if (dx !== 0) {
            if (this.tryMove(dx, 0, map, tanks)) moved = true;
            else this.iceVx = 0;
        }
        if (dy !== 0) {
            if (this.tryMove(0, dy, map, tanks)) moved = true;
            else this.iceVy = 0;
        }
        return moved;
    }

    // ============================================================
    //  ТАЙМЕРЫ
    // ============================================================

    updateTimers(dt: number) {
        if (this.cooldown > 0) this.cooldown -= dt;
        if (this.shield > 0) this.shield -= dt;
    }

    // ============================================================
    //  РЕНДЕР
    // ============================================================

    protected renderTankBody(
        ctx: CanvasRenderingContext2D,
        bodyColor: string,
        darkColor: string,
        inBush = false
    ) {
        const { x, y, w, h } = this;
        const cx = x + w / 2;
        const cy = y + h / 2;

        ctx.save();
        if (inBush) ctx.globalAlpha = 0.55;

        // гусеницы
        ctx.fillStyle = darkColor;
        if (this.direction === Direction.Up || this.direction === Direction.Down) {
            ctx.fillRect(x, y, 5, h);
            ctx.fillRect(x + w - 5, y, 5, h);
        } else {
            ctx.fillRect(x, y, w, 5);
            ctx.fillRect(x, y + h - 5, w, 5);
        }

        // корпус
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

        // ствол
        const v = DIR_VECTORS[this.direction];
        ctx.fillStyle = darkColor;
        ctx.fillRect(cx - 2 + v.x * 6,  cy - 2 + v.y * 6,  4, 4);
        ctx.fillRect(cx - 1 + v.x * 10, cy - 1 + v.y * 10, 2, 2);
        ctx.fillRect(cx - 1 + v.x * 14, cy - 1 + v.y * 14, 2, 2);

        // башня
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // щит
        if (this.shield > 0) {
            const alpha = 0.4 + 0.3 * Math.sin(performance.now() / 80);
            ctx.strokeStyle = `rgba(120, 200, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, w / 2 + 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

}