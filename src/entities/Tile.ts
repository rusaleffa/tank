import { Entity } from './Entity';
import { CONFIG } from '../config';
import { TileType } from '../types';

export abstract class Tile extends Entity {
    col: number;
    row: number;

    /** Код типа тайла — для findBase() и отладки. */
    typeCode: TileType = TileType.Empty;

    constructor(col: number, row: number) {
        super(
            col * CONFIG.TILE,
            row * CONFIG.TILE,
            CONFIG.TILE,
            CONFIG.TILE
        );
        this.col = col;
        this.row = row;
    }

    /** Урон от пули. Возвращает true, если тайл уничтожен. */
    abstract damage(): boolean;

    /** Можно ли пройти сквозь тайл (для танков). */
    abstract get isSolid(): boolean;

    /** Останавливает ли тайл пули. */
    abstract get blocksBullets(): boolean;

    abstract override render(ctx: CanvasRenderingContext2D): void;

    // Переопределяем с сигнатурой Entity (dt, game?), но игнорируем game
    update(_dt: number, _game?: any) {
        // по умолчанию тайлы статичны
    }
}