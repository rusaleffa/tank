import type { Rect } from '../types';

export abstract class Entity {
    x: number;
    y: number;
    w: number;
    h: number;
    alive = true;

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    get rect(): Rect {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    abstract update(dt: number, game?: any): void;
    abstract render(ctx: CanvasRenderingContext2D): void;
}