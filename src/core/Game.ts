import { CONFIG } from '@/config';
import {
    GameState,
    type InputState,
    type Rect,
    type Level,
    type LevelMeta,
    type Theme,
    type EnemyType,
    type EnemyRole,
} from '@/types';

import { Input } from './Input';
import { Audio } from './Audio';
import { TileMap } from './TileMap';
import { rectsOverlap } from './math';

import type { Tank } from '@entities/Tank';
import { PlayerTank } from '@entities/PlayerTank';
import { EnemyTank } from '@entities/EnemyTank';
import { Bullet } from '@entities/Bullet';
import { Explosion } from '@entities/Explosion';
import { Brick } from '@entities/Brick';
import { Steel } from '@entities/Steel';
import { Base } from '@entities/Base';

import { LEVELS, generateLevel } from '@/levels';

// Темы оформления уровня: цвет фона и сетки
const THEMES: Record<string, Theme> = {
    classic: { bg: '#1a1f2b', grid: '#232b3a' },
    desert:  { bg: '#2b241a', grid: '#3a2f22' },
    arctic:  { bg: '#1a2630', grid: '#22323e' },
    night:   { bg: '#0e1018', grid: '#181c28' },
    volcano: { bg: '#2a1410', grid: '#3a1c18' },
};

export class Game {
    // ============================================================
    //  ИНФРАСТРУКТУРА
    // ============================================================
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;
    readonly input: Input;
    readonly audio = new Audio();
    private spawnCounter = 0;   // ← добавить

    map!: TileMap;

    // ============================================================
    //  СОСТОЯНИЕ
    // ============================================================
    state: GameState = GameState.Menu;
    level = 0;
    currentLevel!: Level;
    theme: Theme = THEMES.classic;

    enemiesRemaining = 0;
    spawnQueue: EnemyType[] = [];

    // ============================================================
    //  СУЩНОСТИ
    // ============================================================
    player!: PlayerTank;
    base!: Base;
    enemies: EnemyTank[] = [];
    bullets: Bullet[] = [];
    explosions: Explosion[] = [];

    // ============================================================
    //  СЛУЖЕБНОЕ
    // ============================================================
    private inputState: InputState = {
        up: false, down: false, left: false, right: false, fire: false,
    };

    private spawnTimer = 0;
    private respawnTimer = 0;
    private levelEndTimer = 0;

    private lastTime = 0;
    private rafId: number | null = null;
    private running = false;

    /** Колбэк для UI-слоя (меню / пауза / game over). */
    onStateChange?: (state: GameState, game: Game) => void;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        canvas.width = CONFIG.WIDTH;
        canvas.height = CONFIG.HEIGHT;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context not available');
        this.ctx = ctx;
        this.ctx.imageSmoothingEnabled = false;

        this.input = new Input();

        // При потере фокуса окна — ставим игру на паузу
        window.addEventListener('blur', this.onWindowBlur);
    }

    // ============================================================
    //  ЖИЗНЕННЫЙ ЦИКЛ
    // ============================================================

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }

    destroy() {
        // todo доделать размонтирование
        this.running = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.input.destroy();
        window.removeEventListener('blur', this.onWindowBlur);
    }

    // ============================================================
    //  ГЛАВНЫЙ ЦИКЛ
    // ============================================================

    private loop = (now: number) => {
        if (!this.running) return;
        // dt в секундах, с защитой от «прыжков» после лага
        let dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        dt = Math.min(dt, 0.1);

        if (this.state === GameState.Playing) {
            this.update(dt);
        } else {
            // В меню/паузе продолжаем крутить «косметику»: взрывы, анимации тайлов
            this.updatePassive(dt);
        }

        this.render();
        this.rafId = requestAnimationFrame(this.loop);
    };

    private updatePassive(dt: number) {
        this.map?.update(dt);
        for (const ex of this.explosions) ex.update(dt);
        this.explosions = this.explosions.filter(e => e.alive);
    }

    // ============================================================
    //  УПРАВЛЕНИЕ ИГРОЙ
    // ============================================================

    startNewGame() {
        this.level = 0;
        this.player = new PlayerTank(0, 0);
        this.player.lives = CONFIG.STARTING_LIVES;
        this.player.score = 0;

        this.loadLevel(this.level);
        this.setState(GameState.Playing);
    }

    nextLevel() {
        this.level++;

        // После всех готовых уровней — процедурная генерация.
        // +5 — запас «случайных» уровней перед возвратом в меню.
        if (this.level >= LEVELS.length + 5) {
            this.setState(GameState.Menu);
            return;
        }

        this.loadLevel(this.level);
        this.setState(GameState.Playing);
    }

    loadLevel(index: number) {
        // ---- какой уровень брать ----
        let level: Level;
        if (index < LEVELS.length) {
            level = LEVELS[index];
        } else {
            const difficulty = Math.min(
                5,
                1 + Math.floor((index - LEVELS.length) / 2)
            ) as 1 | 2 | 3 | 4 | 5;
            level = generateLevel({ difficulty, seed: index });
        }
        this.currentLevel = level;

        // ---- карта ----
        this.map = new TileMap(level.layout);

        // ---- тема ----
        this.theme = THEMES[level.meta.theme] ?? THEMES.classic;

        // ---- база ----
        const base = new Base(level.basePos.col, level.basePos.row);
        base.onDestroyed = () => this.onBaseDestroyed();
        this.base = base;
        this.map.setTile(level.basePos.col, level.basePos.row, base);

        // ---- игрок ----
        const px = level.playerSpawn.col * CONFIG.TILE;
        const py = level.playerSpawn.row * CONFIG.TILE;
        this.player.respawn(px, py);
        this.player.map = this.map; // для isBushAt/isIceAt

        // ---- очистка ----
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];
        this.spawnTimer = 0;
        this.respawnTimer = 0;
        this.levelEndTimer = 0;

        // ---- враги ----
        this.spawnQueue = this.buildSpawnQueue(level.meta);
        this.enemiesRemaining = this.spawnQueue.length;
        this.spawnCounter = 0;   // ← сброс
    }

    private buildSpawnQueue(meta: LevelMeta): EnemyType[] {
        const queue: EnemyType[] = [];
        const { basic, fast } = meta.enemyMix;

        for (let i = 0; i < meta.enemyCount; i++) {
            const r = Math.random();
            if (r < basic) queue.push('basic');
            else if (r < basic + fast) queue.push('fast');
            else queue.push('armored');
        }
        return queue;
    }

    setState(s: GameState) {
        if (this.state === s) return;
        this.state = s;
        this.onStateChange?.(s, this);
    }

    togglePause() {
        if (this.state === GameState.Playing) {
            this.setState(GameState.Paused);
        } else if (this.state === GameState.Paused) {
            this.setState(GameState.Playing);
        }
    }

    private onWindowBlur = () => {
        if (this.state === GameState.Playing) {
            this.setState(GameState.Paused);
        }
    };

    // ============================================================
    //  ОБНОВЛЕНИЕ
    // ============================================================

    private update(dt: number) {
        this.inputState = this.input.poll();
        this.levelEndTimer = Math.max(0, this.levelEndTimer - dt);

        this.updatePlayer(dt);
        this.updateEnemies(dt);
        this.trySpawnEnemy(dt);
        this.updateBullets(dt);
        this.handleBulletCollisions();
        this.updateExplosions(dt);

        this.map.update(dt);

        this.checkLevelState(dt);
    }

    // ============================================================
    //  ИГРОК
    // ============================================================

    private updatePlayer(dt: number) {
        if (this.player.alive) {
            this.player.update(dt, this);
            return;
        }

        if (this.player.lives > 0) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                const px = this.currentLevel.playerSpawn.col * CONFIG.TILE;
                const py = this.currentLevel.playerSpawn.row * CONFIG.TILE;
                this.player.respawn(px, py);
                this.respawnTimer = 0;
            }
        } else if (this.state !== GameState.GameOver) {
            this.audio.lose();
            this.setState(GameState.GameOver);
        }
    }

    // ============================================================
    //  ВРАГИ
    // ============================================================

    private updateEnemies(dt: number) {
        for (const e of this.enemies) {
            if (e.alive) e.update(dt, this);
        }
        this.enemies = this.enemies.filter(e => e.alive);
    }

    private trySpawnEnemy(dt: number) {
        if (this.spawnQueue.length === 0) return;
        if (this.enemies.length >= 4) return;

        this.spawnTimer -= dt;
        if (this.spawnTimer > 0) return;

        const spawnPoints = this.currentLevel.enemySpawns.map(s => ({
            x: s.col * CONFIG.TILE,
            y: s.row * CONFIG.TILE,
        }));

        const order = spawnPoints
            .map(p => ({ p, r: Math.random() }))
            .sort((a, b) => a.r - b.r)
            .map(o => o.p);

        for (const p of order) {
            const testRect: Rect = {
                x: p.x, y: p.y,
                w: CONFIG.TANK.SIZE, h: CONFIG.TANK.SIZE,
            };

            // Проверка на пересечение с танками
            let blocked = false;
            for (const t of this.allTanks()) {
                if (rectsOverlap(testRect, t.rect)) { blocked = true; break; }
            }
            if (blocked) continue;

            // Проверка на пересечение с твёрдыми тайлами
            for (const tile of this.map.solidTiles()) {
                if (rectsOverlap(testRect, tile.rect)) { blocked = true; break; }
            }
            if (blocked) continue;

            // ---- РОЛЬ ----
            // Чередование: 0 — hunter, 1 — destroyer, 2 — hunter, 3 — destroyer, ...
            const role: EnemyRole =
                this.spawnCounter % 2 === 0 ? 'hunter' : 'destroyer';
            this.spawnCounter++;

            const type = this.spawnQueue.shift()!;

            // ---- СОЗДАНИЕ ВРАГА С РОЛЬЮ И БАЗОЙ ----
            const enemy = new EnemyTank(
                p.x,
                p.y,
                type,
                role,
                this.currentLevel.basePos    // ← координаты базы из уровня
            );
            enemy.map = this.map;

            this.enemies.push(enemy);

            this.spawnTimer = this.currentLevel.meta.spawnInterval;
            return;
        }

        this.spawnTimer = 0.2;
    }

    // ============================================================
    //  ПУЛИ
    // ============================================================

    private updateBullets(dt: number) {
        for (const b of this.bullets) {
            if (b.alive) b.update(dt, this);
        }
    }

    private handleBulletCollisions() {
        for (const b of this.bullets) {
            if (!b.alive) continue;
            this.bulletVsTiles(b);
            if (!b.alive) continue;
            this.bulletVsTanks(b);
        }
        this.bulletVsBullet();
        this.bullets = this.bullets.filter(b => b.alive);
    }

    private bulletVsTiles(b: Bullet) {
        for (const tile of this.map.bulletBlockers()) {
            if (!tile.alive) continue;
            if (!rectsOverlap(b.rect, tile.rect)) continue;

            b.alive = false;

            // База — особый случай: damage() сам вызовет onDestroyed → GameOver
            if (tile === this.base) {
                tile.damage();
                return;
            }

            if (tile instanceof Steel) {
                tile.damage();
                this.audio.steel();
            } else if (tile instanceof Brick) {
                const destroyed = tile.damage();
                if (destroyed) {
                    this.audio.brick();
                    this.spawnExplosion(tile.x + tile.w / 2, tile.y + tile.h / 2, 8);
                } else {
                    this.audio.brick();
                    this.spawnExplosion(b.x + b.w / 2, b.y + b.h / 2, 3);
                }
            }
            return;
        }
    }

    private bulletVsTanks(b: Bullet) {
        if (b.owner === 'player') {
            for (const e of this.enemies) {
                if (!e.alive) continue;
                if (!rectsOverlap(b.rect, e.rect)) continue;

                b.alive = false;
                const died = e.takeDamage();
                this.audio.hit();
                this.spawnExplosion(b.x, b.y, 6);

                if (died) {
                    this.spawnExplosion(e.cx, e.cy, 24);
                    this.audio.explode();
                    this.player.score +=
                        e.type === 'armored' ? 400 :
                            e.type === 'fast'    ? 200 : 100;
                }
                return;
            }
        } else {
            if (!this.player.alive) return;
            if (!rectsOverlap(b.rect, this.player.rect)) return;

            b.alive = false;

            if (this.player.shield > 0) {
                this.spawnExplosion(b.x, b.y, 6);
                return;
            }

            const died = this.player.takeDamage();
            this.spawnExplosion(b.x, b.y, 12);
            this.audio.hit();

            if (died) {
                this.spawnExplosion(this.player.cx, this.player.cy, 32);
                this.audio.explode();
                this.respawnTimer = 1.2;
            }
        }
    }

    private bulletVsBullet() {
        for (let i = 0; i < this.bullets.length; i++) {
            const a = this.bullets[i];
            if (!a.alive) continue;

            for (let j = i + 1; j < this.bullets.length; j++) {
                const b = this.bullets[j];
                if (!b.alive) continue;
                if (a.owner === b.owner) continue;
                if (!rectsOverlap(a.rect, b.rect)) continue;

                a.alive = false;
                b.alive = false;
                this.spawnExplosion((a.x + b.x) / 2, (a.y + b.y) / 2, 8);
                break;
            }
        }
    }

    // ============================================================
    //  ВЗРЫВЫ
    // ============================================================

    private updateExplosions(dt: number) {
        for (const ex of this.explosions) ex.update(dt);
        this.explosions = this.explosions.filter(e => e.alive);
    }

    // ============================================================
    //  УСЛОВИЯ УРОВНЯ
    // ============================================================

    private checkLevelState(dt: number) {
        if (this.state !== GameState.Playing) return;

        const noMoreEnemies =
            this.spawnQueue.length === 0 && this.enemies.length === 0;

        if (noMoreEnemies && this.levelEndTimer === 0) {
            this.levelEndTimer = 1.2;
        }

        if (this.levelEndTimer > 0 && this.levelEndTimer - dt <= 0) {
            this.audio.levelUp();
            this.setState(GameState.LevelComplete);
        }
    }

    private onBaseDestroyed() {
        this.audio.explode();
        this.spawnExplosion(
            this.base.x + this.base.w / 2,
            this.base.y + this.base.h / 2,
            40
        );
        this.setState(GameState.GameOver);
    }

    // ============================================================
    //  ПУБЛИЧНЫЕ ХЕЛПЕРЫ
    // ============================================================

    get inputs(): InputState {
        return this.inputState;
    }

    allTanks(): Tank[] {
        const arr: Tank[] = [];
        if (this.player?.alive) arr.push(this.player);
        for (const e of this.enemies) if (e.alive) arr.push(e);
        return arr;
    }

    spawnBullet(b: Bullet) {
        this.bullets.push(b);
    }

    /** Создать взрыв. count — число частиц, влияет на «силу». */
    spawnExplosion(x: number, y: number, count = 16) {
        this.explosions.push(new Explosion(x, y, count));
    }

    // ============================================================
    //  РЕНДЕР
    // ============================================================

    private render() {
        const ctx = this.ctx;

        // Фон темы
        ctx.fillStyle = this.theme.bg;
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        if (!this.map) return;

        // Сетка
        this.renderGrid(ctx);

        // 1-й проход: всё, кроме кустов
        this.map.render(ctx, { exclude: ['Bush'] });

        // Взрывы, враги, игрок, пули
        for (const ex of this.explosions) ex.render(ctx);
        for (const e of this.enemies) if (e.alive) e.render(ctx);
        if (this.player?.alive) this.player.render(ctx);
        for (const b of this.bullets) if (b.alive) b.render(ctx);

        // 2-й проход: кусты поверх танков
        this.map.render(ctx, { only: ['Bush'] });

        // HUD
        this.renderHUD(ctx);
    }

    private renderGrid(ctx: CanvasRenderingContext2D) {
        const T = CONFIG.TILE;

        ctx.strokeStyle = this.theme.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let c = 0; c <= this.map.cols; c++) {
            const x = c * T;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CONFIG.HEIGHT);
        }
        for (let r = 0; r <= this.map.rows; r++) {
            const y = r * T;
            ctx.moveTo(0, y);
            ctx.lineTo(CONFIG.WIDTH, y);
        }

        ctx.stroke();
    }

    private renderHUD(ctx: CanvasRenderingContext2D) {
        if (!this.player) return;

        ctx.fillStyle = '#e8e8e8';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textBaseline = 'alphabetic';

        // Счёт слева
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE ${this.player.score}`, 12, 22);

        // Имя уровня по центру
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8ab4ff';
        ctx.fillText(this.currentLevel?.meta.name ?? '', CONFIG.WIDTH / 2, 22);

        // Номер уровня справа
        ctx.fillStyle = '#e8e8e8';
        ctx.textAlign = 'right';
        ctx.fillText(`LVL ${this.level + 1}`, CONFIG.WIDTH - 12, 22);

        // Жизни
        ctx.textAlign = 'left';
        ctx.fillText('LIVES', 12, CONFIG.HEIGHT - 12);
        for (let i = 0; i < this.player.lives; i++) {
            ctx.fillStyle = CONFIG.COLORS.PLAYER;
            ctx.fillRect(70 + i * 18, CONFIG.HEIGHT - 22, 12, 12);
        }

        // Оставшиеся враги
        const remaining = this.spawnQueue.length + this.enemies.length;
        ctx.fillStyle = '#e8e8e8';
        ctx.textAlign = 'right';
        ctx.fillText(`ENEMIES ${remaining}`, CONFIG.WIDTH - 12, CONFIG.HEIGHT - 12);
    }
}