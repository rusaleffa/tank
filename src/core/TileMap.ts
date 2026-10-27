import { CONFIG } from '@/config';
import { TileType, type Rect } from '@/types';
import { Tile } from '@/entities/Tile';
import { Brick } from '@/entities/Brick';
import { Steel } from '@/entities/Steel';
import { Water } from '@/entities/Water';
import { Ice } from '@/entities/Ice';
import { Bush } from '@/entities/Bush';

export interface RenderFilter {
    only?: string[];
    exclude?: string[];
}

export class TileMap {
    cols: number;
    rows: number;
    tileSize = CONFIG.TILE;

    tiles: (Tile | null)[][] = [];
    activeTiles: Tile[] = [];

    constructor(layout: number[][]) {
        this.rows = layout.length;
        this.cols = layout[0]?.length ?? 0;
        this.load(layout);
    }

    load(layout: number[][]) {
        this.tiles = [];
        this.activeTiles = [];

        for (let r = 0; r < this.rows; r++) {
            const row: (Tile | null)[] = [];
            for (let c = 0; c < this.cols; c++) {
                const code = layout[r]?.[c] ?? TileType.Empty;
                const tile = this.createTile(code, c, r);
                row.push(tile);
                if (tile) this.activeTiles.push(tile);
            }
            this.tiles.push(row);
        }
    }

    private createTile(code: number, col: number, row: number): Tile | null {
        switch (code) {
            case TileType.Brick: return new Brick(col, row);
            case TileType.Steel: return new Steel(col, row);
            case TileType.Water: return new Water(col, row);
            case TileType.Ice:   return new Ice(col, row);
            case TileType.Bush:  return new Bush(col, row);
          // Base-тайлы в раскладке образуют кластер вокруг базы.
          // Один из них Game заменит на Base, остальные становятся кирпичами,
          // формируя защитную стену.
            case TileType.Base:  return new Brick(col, row);
            default: return null;
        }
    }

    get(col: number, row: number): Tile | null {
        if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null;
        return this.tiles[row][col];
    }

    tileRect(tile: Tile): Rect {
        return { x: tile.x, y: tile.y, w: tile.w, h: tile.h };
    }

    inBounds(col: number, row: number): boolean {
        return col >= 0 && row >= 0 && col < this.cols && row < this.rows;
    }

    *solidTiles(): IterableIterator<Tile> {
        for (const t of this.activeTiles) {
            if (t.alive && t.isSolid) yield t;
        }
    }

    *bulletBlockers(): IterableIterator<Tile> {
        for (const t of this.activeTiles) {
            if (t.alive && t.blocksBullets) yield t;
        }
    }

    setTile(col: number, row: number, tile: Tile | null) {
        if (!this.inBounds(col, row)) return;

        const old = this.tiles[row][col];
        if (old) {
            const idx = this.activeTiles.indexOf(old);
            if (idx >= 0) this.activeTiles.splice(idx, 1);
        }

        this.tiles[row][col] = tile;
        if (tile) this.activeTiles.push(tile);
    }

    clearTile(col: number, row: number) {
        this.setTile(col, row, null);
    }

    update(dt: number) {
        for (const t of this.activeTiles) {
            if (t.alive) t.update(dt);
        }
        this.sweep();
    }

    private sweep() {
        let hasDead = false;
        for (const t of this.activeTiles) {
            if (!t.alive) { hasDead = true; break; }
        }
        if (!hasDead) return;

        this.activeTiles = this.activeTiles.filter(t => t.alive);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const t = this.tiles[r][c];
                if (t && !t.alive) this.tiles[r][c] = null;
            }
        }
    }

    render(ctx: CanvasRenderingContext2D, filter?: RenderFilter) {
        for (const t of this.activeTiles) {
            if (!t.alive) continue;

            if (filter) {
                const name = t.constructor.name;
                if (filter.only && !filter.only.includes(name)) continue;
                if (filter.exclude && filter.exclude.includes(name)) continue;
            }

            t.render(ctx);
        }
    }

    isIceAt(worldX: number, worldY: number): boolean {
        const col = Math.floor(worldX / this.tileSize);
        const row = Math.floor(worldY / this.tileSize);
        return this.get(col, row) instanceof Ice;
    }

    isBushAt(worldX: number, worldY: number): boolean {
        const col = Math.floor(worldX / this.tileSize);
        const row = Math.floor(worldY / this.tileSize);
        return this.get(col, row) instanceof Bush;
    }
}