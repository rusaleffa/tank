import { TileType, SYMBOLS } from '../types';
import type { Level, LevelMeta } from '../types';

const E = TileType.Empty;
const X = TileType.Base;

const COLS = 26;
const ROWS = 26;
// ============================================================
//  УТИЛИТЫ
// ============================================================


function parse(lines: string): number[][] {
  const rows = lines.trim().split('\n').map(l => l.trimEnd());
  const grid: number[][] = [];

  for (let r = 0; r < ROWS; r++) {
    const row: number[] = [];
    const line = rows[r] ?? '';
    for (let c = 0; c < COLS; c++) {
      const ch = line[c] ?? '.';
      row.push(SYMBOLS[ch] ?? E);
    }
    grid.push(row);
  }
  return grid;
}

function findBase(layout: number[][]): { col: number; row: number } {
  for (let r = 0; r < layout.length; r++) {
    for (let c = 0; c < layout[r].length; c++) {
      if (layout[r][c] === X) return { col: c, row: r };
    }
  }
  return { col: Math.floor(COLS / 2) - 1, row: ROWS - 3 };
}

/**
 * Создать уровень.
 * Игрок спавнится слева-сверху от базы — на безопасном расстоянии,
 * чтобы не перекрываться с ней и гарантированно не появляться в кирпичах
 * (все уровни проверены).
 */
function makeLevel(meta: LevelMeta, map: string): Level {
  const layout = parse(map);
  const basePos = findBase(layout);

  return {
    meta,
    layout,
    basePos,
    playerSpawn: {
      col: Math.max(1, basePos.col - 2),
      row: Math.max(1, basePos.row - 3),
    },
    enemySpawns: [
      { col: 1, row: 1 },
      { col: Math.floor(COLS / 2) - 1, row: 1 },
      { col: COLS - 2, row: 1 },
    ],
  };
}


// ============================================================
//  УРОВНИ
// ============================================================

export const LEVELS: Level[] = [
    // ---------------------------------------------------------
    // 1. Полигон — простой обучающий уровень
    // ---------------------------------------------------------
    makeLevel(
        {
            name: 'Полигон',
            difficulty: 1,
            enemyCount: 6,
            spawnInterval: 2.0,
            enemyMix: { basic: 1, fast: 0, armored: 0 },
            theme: 'classic',
        },
        `
..........................
..BBBB..BBBB..BBBB..BBBB..
..BBBB..BBBB..BBBB..BBBB..
..BBBB..BBBB..BBBB..BBBB..
..........................
..BBBB..BBBB..BBBB..BBBB..
..BBBB..BBBB..BBBB..BBBB..
..........................
..BBBB..BBBB..BBBB..BBBB..
..BBBB..BBBB..BBBB..BBBB..
..........................
..SSSS....................
..........................
..BBBB..........BBBB......
..BBBB..........BBBB......
..........................
..........................
....BBBB....BBBB..........
....BBBB....BBBB..........
..........................
..........................
..........XXXX............
..........XXXX............
..........................
..........................
..........................
    `
    ),

    // ---------------------------------------------------------
    // 2. Крепость — стальные стены, узкие проходы
    // ---------------------------------------------------------
    makeLevel(
        {
            name: 'Крепость',
            difficulty: 2,
            enemyCount: 8,
            spawnInterval: 1.8,
            enemyMix: { basic: 0.7, fast: 0.3, armored: 0 },
            theme: 'classic',
        },
        `
..........................
..SSSSSSSSSSSSSSSSSSSSSS..
..S.......................
..S..BBBB..BBBB..BBBB..S..
..S..BBBB..BBBB..BBBB..S..
..S....................S..
..S..BBBB..BBBB..BBBB..S..
..S..BBBB..BBBB..BBBB..S..
..S....................S..
..S..BBBB..BBBB..BBBB..S..
..S..BBBB..BBBB..BBBB..S..
..S....................S..
..S..SSSS......SSSS....S..
..S....................S..
..S..BBBB..........BBBB.S..
..S..BBBB..........BBBB.S..
..S....................S..
..S....................S..
..S..BBBB......BBBB....S..
..S..BBBB......BBBB....S..
..S....................S..
..SSSSSSSS..XXXX..SSSSSS..
...........XXXX...........
..........................
..........................
..........................
    `
    ),

    // ---------------------------------------------------------
    // 3. Острова — вода делит карту
    // ---------------------------------------------------------
    makeLevel(
        {
            name: 'Острова',
            difficulty: 2,
            enemyCount: 8,
            spawnInterval: 1.7,
            enemyMix: { basic: 0.6, fast: 0.4, armored: 0 },
            theme: 'classic',
        },
        `
..........................
..BBBBBB..WWWW..BBBBBB....
..BBBBBB..WWWW..BBBBBB....
..BBBBBB..WWWW..BBBBBB....
..........WWWW............
..WWWW..WWWW..WWWW..WWWW..
..WWWW..WWWW..WWWW..WWWW..
..........................
..BBBB..BBBB..BBBB..BBBB..
..BBBB..BBBB..BBBB..BBBB..
..........................
..WWWW..WWWW..WWWW..WWWW..
..WWWW..WWWW..WWWW..WWWW..
..........................
..BBBB..BBBB..BBBB..BBBB..
..BBBB..BBBB..BBBB..BBBB..
..........................
..........................
....BBBB....BBBB..........
....BBBB....BBBB..........
..........................
..........XXXX............
..........XXXX............
..........................
..........................
..........................
    `
    ),

    // ---------------------------------------------------------
    // 4. Лабиринт — узкие коридоры
    // ---------------------------------------------------------
    makeLevel(
        {
            name: 'Лабиринт',
            difficulty: 3,
            enemyCount: 10,
            spawnInterval: 1.6,
            enemyMix: { basic: 0.5, fast: 0.3, armored: 0.2 },
            theme: 'classic',
        },
        `
..........................
..SS..SS..SS..SS..SS..SS..
..SS..SS..SS..SS..SS..SS..
..BB..BB..BB..BB..BB..BB..
..BB..BB..BB..BB..BB..BB..
..........................
..SS..BB..SS..BB..SS..BB..
..SS..BB..SS..BB..SS..BB..
..........................
..BB..BB..BB..BB..BB..BB..
..BB..BB..BB..BB..BB..BB..
..........................
..SS..SS..SS..SS..SS..SS..
..SS..SS..SS..SS..SS..SS..
..........................
..BB..BB..BB..BB..BB..BB..
..BB..BB..BB..BB..BB..BB..
..........................
..SS..SS..SS..SS..SS..SS..
..SS..SS..SS..SS..SS..SS..
..........................
..........XXXX............
..........XXXX............
..........................
..........................
..........................
    `
    ),

    // ---------------------------------------------------------
    // 5. Ледник — скользкие тайлы
    // ---------------------------------------------------------
    makeLevel(
        {
            name: 'Ледник',
            difficulty: 3,
            enemyCount: 10,
            spawnInterval: 1.6,
            enemyMix: { basic: 0.4, fast: 0.4, armored: 0.2 },
            theme: 'arctic',
        },
        `
..........................
..IIIIIIII..IIIIIIII......
..IIIIIIII..IIIIIIII......
..........................
..BBBB..IIII..BBBB..IIII..
..BBBB..IIII..BBBB..IIII..
..........................
..IIII..BBBB..IIII..BBBB..
..IIII..BBBB..IIII..BBBB..
..........................
..SS..IIII..SS..IIII..SS..
..SS..IIII..SS..IIII..SS..
..........................
..IIII..IIII..IIII..IIII..
..IIII..IIII..IIII..IIII..
..........................
..........................
....IIII....IIII..........
....IIII....IIII..........
..........................
..........................
..........XXXX............
..........XXXX............
..........................
..........................
..........................
    `
    ),

    // ---------------------------------------------------------
    // 6. Джунгли — кусты скрывают танки
    // ---------------------------------------------------------
    makeLevel(
        {
            name: 'Джунгли',
            difficulty: 3,
            enemyCount: 12,
            spawnInterval: 1.5,
            enemyMix: { basic: 0.4, fast: 0.4, armored: 0.2 },
            theme: 'classic',
        },
        `
..........................
..GGGG..BBBB..GGGG..BBBB..
..GGGG..BBBB..GGGG..BBBB..
..........................
..BBBB..GGGG..BBBB..GGGG..
..BBBB..GGGG..BBBB..GGGG..
..........................
..GGGG..GGGG..GGGG..GGGG..
..GGGG..GGGG..GGGG..GGGG..
..........................
..BBBB..BBBB..BBBB..BBBB..
..BBBB..BBBB..BBBB..BBBB..
..........................
..GGGG..BBBB..GGGG..BBBB..
..GGGG..BBBB..GGGG..BBBB..
..........................
..........................
....GGGG....GGGG..........
....GGGG....GGGG..........
..........................
..........................
..........XXXX............
..........XXXX............
..........................
..........................
..........................
    `
    ),

    // ---------------------------------------------------------
    // 7. Вулкан — стальные стены и узкие проходы
    // ---------------------------------------------------------
    makeLevel(
        {
            name: 'Вулкан',
            difficulty: 4,
            enemyCount: 12,
            spawnInterval: 1.3,
            enemyMix: { basic: 0.3, fast: 0.4, armored: 0.3 },
            theme: 'volcano',
        },
        `
..........................
..SSSSSSSSSSSSSSSSSSSSSS..
..S.......................
..S..BBBB..BBBB..BBBB..S..
..S..BBBB..BBBB..BBBB..S..
..S....................S..
..S..SSSS..SSSS..SSSS..S..
..S....................S..
..S..BBBB..BBBB..BBBB..S..
..S..BBBB..BBBB..BBBB..S..
..S....................S..
..S..SSSS..SSSS..SSSS..S..
..S....................S..
..S..BBBB..........BBBB.S..
..S..BBBB..........BBBB.S..
..S....................S..
..S....................S..
..S..SSSS......SSSS....S..
..S..SSSS......SSSS....S..
..S....................S..
..SSSSSSSS..XXXX..SSSSSS..
...........XXXX...........
..........................
..........................
..........................
..........................
    `
    ),

    // ---------------------------------------------------------
    // 8. Ночь — тёмная тема, много стали
    // ---------------------------------------------------------
    makeLevel(
        {
            name: 'Ночь',
            difficulty: 4,
            enemyCount: 14,
            spawnInterval: 1.2,
            enemyMix: { basic: 0.3, fast: 0.3, armored: 0.4 },
            theme: 'night',
        },
        `
..........................
..SS..BB..SS..BB..SS..BB..
..BB..SS..BB..SS..BB..SS..
..SS..BB..SS..BB..SS..BB..
..BB..SS..BB..SS..BB..SS..
..........................
..SS..SS..SS..SS..SS..SS..
..SS..SS..SS..SS..SS..SS..
..........................
..BB..BB..BB..BB..BB..BB..
..BB..BB..BB..BB..BB..BB..
..........................
..SS..BB..SS..BB..SS..BB..
..BB..SS..BB..SS..BB..SS..
..........................
..SS..SS..SS..SS..SS..SS..
..SS..SS..SS..SS..SS..SS..
..........................
..BB..BB..BB..BB..BB..BB..
..BB..BB..BB..BB..BB..BB..
..........................
..........XXXX............
..........XXXX............
..........................
..........................
..........................
    `
    ),

    // ---------------------------------------------------------
    // 9. Пустыня — открытые пространства, много кирпича
    // ---------------------------------------------------------
    makeLevel(
        {
            name: 'Пустыня',
            difficulty: 5,
            enemyCount: 16,
            spawnInterval: 1.0,
            enemyMix: { basic: 0.25, fast: 0.35, armored: 0.4 },
            theme: 'desert',
        },
        `
..........................
..BBBBBBBBBBBBBBBBBBBBBB..
..B......................B
..B..BB..BB..BB..BB..BB..B
..B..BB..BB..BB..BB..BB..B
..B......................B
..B..BB..BB..BB..BB..BB..B
..B..BB..BB..BB..BB..BB..B
..B......................B
..B..SS..SS..SS..SS..SS..B
..B......................B
..B..BB..BB..BB..BB..BB..B
..B..BB..BB..BB..BB..BB..B
..B......................B
..BBBBBBBBBBBBBBBBBBBBBBBB
..........................
..........................
....BBBB....BBBB..........
....BBBB....BBBB..........
..........................
..........................
..........XXXX............
..........XXXX............
..........................
..........................
..........................
    `
    ),

    // ---------------------------------------------------------
    // 10. Финал — всё вместе
    // ---------------------------------------------------------
    makeLevel(
        {
            name: 'Финал',
            difficulty: 5,
            enemyCount: 20,
            spawnInterval: 0.9,
            enemyMix: { basic: 0.2, fast: 0.3, armored: 0.5 },
            theme: 'volcano',
        },
        `
..........................
..SSSS..WWWW..SSSS..WWWW..
..SSSS..WWWW..SSSS..WWWW..
..........................
..BBBB..IIII..BBBB..IIII..
..BBBB..IIII..BBBB..IIII..
..........................
..GGGG..SSSS..GGGG..SSSS..
..GGGG..SSSS..GGGG..SSSS..
..........................
..WWWW..BBBB..WWWW..BBBB..
..WWWW..BBBB..WWWW..BBBB..
..........................
..IIII..SSSS..IIII..SSSS..
..IIII..SSSS..IIII..SSSS..
..........................
..........................
..BB..BB..BB..BB..BB..BB..
..BB..BB..BB..BB..BB..BB..
..........................
..SS..SS..SS..SS..SS..SS..
..........XXXX............
..........XXXX............
..........................
..........................
..........................
    `
    ),
];