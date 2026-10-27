export const CONFIG = {
    TILE: 32,
    COLS: 26,
    ROWS: 26,

    get WIDTH()  { return this.TILE * this.COLS; },
    get HEIGHT() { return this.TILE * this.ROWS; },

    TANK: {
        SIZE: 28,
        SPEED: 130,
        ROTATION_SPEED: 8,
        HEALTH: 3,
        COOLDOWN: 0.35,
        SPAWN_SHIELD: 2.5,
    },

    BULLET: {
        SIZE: 6,
        SPEED: 420,
        LIFETIME: 2.0,
    },

    ENEMY: {
        SPEED: 80,
        COOLDOWN: 1.4,
        THINK_INTERVAL: 0.6,
    },

    COLORS: {
        BG: '#1a1f2b',
        GRID: '#232b3a',
        PLAYER: '#4ac76a',
        PLAYER_DARK: '#2a7a3d',
        ENEMY: '#e85454',
        ENEMY_DARK: '#8a2a2a',
        BULLET: '#fff8a0',
        BRICK: '#b35a2a',
        BRICK_DARK: '#6e3418',
        STEEL: '#8892a6',
        STEEL_DARK: '#4a5266',
        EXPLOSION: '#ffaa44',
    },

    STARTING_LIVES: 3,
};
