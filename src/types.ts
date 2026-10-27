/** Вектор в 2D. */
export interface Vec2 {
    x: number;
    y: number;
}

/** Прямоугольник в мировых координатах. */
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** Направление танка / пули. */
export enum Direction {
    Up = 0,
    Right = 1,
    Down = 2,
    Left = 3,
}

export const DIR_VECTORS: Record<Direction, Vec2> = {
    [Direction.Up]:    { x: 0, y: -1 },
    [Direction.Right]: { x: 1, y: 0 },
    [Direction.Down]:  { x: 0, y: 1 },
    [Direction.Left]:  { x: -1, y: 0 },
};

/** Тип тайла в раскладке уровня. */
export enum TileType {
    Empty = 0,
    Brick = 1,
    Steel = 2,
    Water = 3,
    Ice = 4,
    Bush = 5,
    Base = 6,
}
/** Роль врага. Определяет его цель. */
export type EnemyRole = 'hunter' | 'destroyer';
/** Символы для удобной записи карт. */
export const SYMBOLS: Record<string, TileType> = {
    '.': TileType.Empty,
    'B': TileType.Brick,
    'S': TileType.Steel,
    'W': TileType.Water,
    'I': TileType.Ice,
    'G': TileType.Bush,
    'X': TileType.Base,
};

/** Верхнеуровневое состояние игры. */
export enum GameState {
    Menu = 'menu',
    Playing = 'playing',
    Paused = 'paused',
    LevelComplete = 'levelComplete',
    GameOver = 'gameOver',
}

/** Снимок ввода за кадр. */
export interface InputState {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    fire: boolean;
}

/** Владелец пули. */
export type BulletOwner = 'player' | 'enemy';

/** Тип врага. */
export type EnemyType = 'basic' | 'fast' | 'armored';

/** Тема уровня. */
export type ThemeName = 'classic' | 'desert' | 'arctic' | 'night' | 'volcano';

/** Темы оформления. */
export interface Theme {
    bg: string;
    grid: string;
}

/** Метаданные уровня. */
export interface LevelMeta {
    name: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    enemyCount: number;
    spawnInterval: number;
    enemyMix: {
        basic: number;
        fast: number;
        armored: number;
    };
    theme: ThemeName;
}

/** Полное описание уровня. */
export interface Level {
    meta: LevelMeta;
    layout: number[][];
    enemySpawns: { col: number; row: number }[];
    basePos: { col: number; row: number };
    playerSpawn: { col: number; row: number };
}