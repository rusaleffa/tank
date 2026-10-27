import type { Rect } from '../types';

export const rand = (min: number, max: number) =>
    min + Math.random() * (max - min);

export const randInt = (min: number, max: number) =>
    Math.floor(rand(min, max + 1));

export function rectsOverlap(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
