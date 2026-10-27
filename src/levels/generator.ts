import { TileType } from '../types';
import type { Level, LevelMeta } from '../types';

const COLS = 26;
const ROWS = 26;

interface GenerateOptions {
    seed?: number;
    difficulty: 1 | 2 | 3 | 4 | 5;
    name?: string;
}

// ============================================================
//  PRNG (Mulberry32) — детерминированный по seed
// ============================================================

function mulberry32(seed: number) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ============================================================
//  ПУБЛИЧНЫЙ API
// ============================================================

export function generateLevel(opts: GenerateOptions): Level {
    const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
    const rnd = mulberry32(seed);
    const difficulty = opts.difficulty ?? 3;

    const layout: number[][] = [];
    for (let r = 0; r < ROWS; r++) {
        layout.push(new Array(COLS).fill(TileType.Empty));
    }

    for (let c = 0; c < COLS; c++) {
        layout[0][c] = TileType.Steel;
        layout[ROWS - 1][c] = TileType.Steel;
    }
    for (let r = 0; r < ROWS; r++) {
        layout[r][0] = TileType.Steel;
        layout[r][COLS - 1] = TileType.Steel;
    }

    const patternCount = 4 + difficulty * 2;
    for (let i = 0; i < patternCount; i++) {
        const type = rnd();
        const row = 2 + Math.floor(rnd() * (ROWS - 8));
        const col = 2 + Math.floor(rnd() * (COLS / 2 - 4));

        if (type < 0.5) {
            stampBrick(layout, row, col, 2 + Math.floor(rnd() * 3), 2, rnd);
        } else if (type < 0.8) {
            stampSteel(layout, row, col, 2, 2);
        } else {
            stampWater(layout, row, col, 2, 2);
        }
    }

    const baseCol = Math.floor(COLS / 2) - 1;
    const baseRow = ROWS - 3;

    // Безопасная зона вокруг базы + над ней (там спавнится игрок)
    clearArea(layout, baseCol - 3, baseRow - 5, 6, 8);

    // Зоны спавна врагов
    clearArea(layout, 1, 1, 4, 3);
    clearArea(layout, Math.floor(COLS / 2) - 2, 1, 4, 3);
    clearArea(layout, COLS - 5, 1, 4, 3);

    layout[baseRow][baseCol] = TileType.Base;
    layout[baseRow][baseCol + 1] = TileType.Base;
    layout[baseRow + 1][baseCol] = TileType.Base;
    layout[baseRow + 1][baseCol + 1] = TileType.Base;

    if (!isPathClear(layout, { col: 1, row: 1 }, { col: baseCol, row: baseRow })) {
        carveCorridor(layout, 1, 1, baseCol, baseRow);
    }

    const meta: LevelMeta = {
        name: opts.name ?? `Случайный #${seed % 1000}`,
        difficulty,
        enemyCount: 6 + difficulty * 2,
        spawnInterval: 2.1 - difficulty * 0.2,
        enemyMix: mixForDifficulty(difficulty),
        theme: 'classic',
    };

    return {
        meta,
        layout,
        basePos: { col: baseCol, row: baseRow },
        playerSpawn: {
            col: baseCol - 2,
            row: baseRow - 3,
        },
        enemySpawns: [
            { col: 1, row: 1 },
            { col: Math.floor(COLS / 2) - 1, row: 1 },
            { col: COLS - 2, row: 1 },
        ],
    };
}

// ============================================================
//  ВСПОМОГАТЕЛЬНЫЕ
// ============================================================

function mixForDifficulty(d: number): LevelMeta['enemyMix'] {
    const fast = Math.min(0.1 + d * 0.06, 0.4);
    const armored = Math.min(0.05 + d * 0.08, 0.5);
    const basic = Math.max(1 - fast - armored, 0.1);
    return { basic, fast, armored };
}

function stampBrick(
    grid: number[][],
    row: number,
    col: number,
    w: number,
    h: number,
    rnd: () => number
) {
    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            const rr = row + r;
            const cc = col + c;
            if (rr <= 0 || rr >= ROWS - 1 || cc <= 0 || cc >= COLS - 1) continue;
            if (grid[rr][cc] !== TileType.Empty) continue;

            if (rnd() < 0.85) grid[rr][cc] = TileType.Brick;

            // симметрия по горизонтали
            const mirror = COLS - 1 - cc;
            if (rnd() < 0.85) grid[rr][mirror] = TileType.Brick;
        }
    }
}

function stampSteel(
    grid: number[][],
    row: number,
    col: number,
    w: number,
    h: number
) {
    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            const rr = row + r;
            const cc = col + c;
            if (rr <= 0 || rr >= ROWS - 1 || cc <= 0 || cc >= COLS - 1) continue;
            if (grid[rr][cc] !== TileType.Empty) continue;

            grid[rr][cc] = TileType.Steel;
            grid[rr][COLS - 1 - cc] = TileType.Steel;
        }
    }
}

function stampWater(
    grid: number[][],
    row: number,
    col: number,
    w: number,
    h: number
) {
    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            const rr = row + r;
            const cc = col + c;
            if (rr <= 0 || rr >= ROWS - 1 || cc <= 0 || cc >= COLS - 1) continue;
            if (grid[rr][cc] !== TileType.Empty) continue;

            grid[rr][cc] = TileType.Water;
            grid[rr][COLS - 1 - cc] = TileType.Water;
        }
    }
}

function clearArea(
    grid: number[][],
    col: number,
    row: number,
    w: number,
    h: number
) {
    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            const rr = row + r;
            const cc = col + c;
            if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) continue;
            if (rr === 0 || rr === ROWS - 1 || cc === 0 || cc === COLS - 1) continue;
            grid[rr][cc] = TileType.Empty;
        }
    }
}

// ============================================================
//  BFS — проверка проходимости
// ============================================================

function isPathClear(
    grid: number[][],
    start: { col: number; row: number },
    goal: { col: number; row: number }
): boolean {
    const visited = new Set<string>();
    const queue: { col: number; row: number }[] = [start];
    visited.add(`${start.col},${start.row}`);

    const isPassable = (col: number, row: number) => {
        if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return false;
        const t = grid[row][col];
        return t === TileType.Empty || t === TileType.Base;
    };

    while (queue.length) {
        const cur = queue.shift()!;

        // достигли окрестности цели (в радиусе 1)
        if (
            Math.abs(cur.col - goal.col) <= 1 &&
            Math.abs(cur.row - goal.row) <= 1
        ) {
            return true;
        }

        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nc = cur.col + dc;
            const nr = cur.row + dr;
            const key = `${nc},${nr}`;
            if (visited.has(key)) continue;
            if (!isPassable(nc, nr)) continue;
            visited.add(key);
            queue.push({ col: nc, row: nr });
        }
    }
    return false;
}

/** Пробить прямой коридор, если BFS не нашёл путь. */
function carveCorridor(
    grid: number[][],
    c1: number,
    r1: number,
    c2: number,
    r2: number
) {
    let c = c1;
    let r = r1;

    while (c !== c2) {
        c += Math.sign(c2 - c);
        if (isInside(c, r)) grid[r][c] = TileType.Empty;
    }
    while (r !== r2) {
        r += Math.sign(r2 - r);
        if (isInside(c, r)) grid[r][c] = TileType.Empty;
    }
}

function isInside(c: number, r: number) {
    return c > 0 && r > 0 && c < COLS - 1 && r < ROWS - 1;
}