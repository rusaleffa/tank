import { Entity } from './Entity';
import { CONFIG } from '../config';
import { DIR_VECTORS, Direction } from '../types';
import type { Rect } from '../types';

export class Bullet extends Entity {
    vx: number;
    vy: number;
    life = CONFIG.BULLET.LIFETIME;
    owner: 'player' | 'enemy';
    damage = 1;

    constructor(x: number, y: number, dir: Direction, owner: 'player' | 'enemy') {
        super(
            x - CONFIG.BULLET.SIZE / 2,
            y - CONFIG.BULLET.SIZE / 2,
            CONFIG.BULLET.SIZE,
            CONFIG.BULLET.SIZE
        );
        const v = DIR_VECTORS[dir];
        this.vx = v.x * CONFIG.BULLET.SPEED;
        this.vy = v.y * CONFIG.BULLET.SPEED;
        this.owner = owner;
    }

    update(dt: number, _game?: any) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.alive = false;

        if (
            this.x < 0 || this.y < 0 ||
            this.x + this.w > CONFIG.WIDTH ||
            this.y + this.h > CONFIG.HEIGHT
        ) {
            this.alive = false;
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = CONFIG.COLORS.BULLET;
        ctx.shadowColor = CONFIG.COLORS.BULLET;
        ctx.shadowBlur = 12;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.shadowBlur = 0;
    }

    override get rect(): Rect {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}