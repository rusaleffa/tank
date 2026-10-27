import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { CONFIG } from '../config';
import { Direction, DIR_VECTORS, type EnemyType, type EnemyRole } from '../types';
import { rand, randInt } from '../core/math';

type Mode = 'advance' | 'engage' | 'stuck';

export class EnemyTank extends Tank {
    type: EnemyType;
    role: EnemyRole;
    private basePos: { col: number; row: number };

    private path: { col: number; row: number }[] = [];
    private pathIndex = 0;
    private pathTimer = 0;

    private mode: Mode = 'advance';

    private fireTimer = rand(0.5, 1.5);
    private stuckTimer = 0;

    private lastX = 0;
    private lastY = 0;
    private progressTimer = 0;

    debug = false;

    constructor(
      x: number, y: number,
      type: EnemyType, role: EnemyRole,
      basePos: { col: number; row: number }
    ) {
        super(x, y, CONFIG.TANK.SIZE, CONFIG.TANK.SIZE);
        this.type = type;
        this.role = role;
        this.basePos = basePos;
        this.direction = Direction.Down;
        this.lastX = x;
        this.lastY = y;

        switch (type) {
            case 'fast':    this.speed = CONFIG.ENEMY.SPEED * 1.8; this.health = 1; break;
            case 'armored': this.speed = CONFIG.ENEMY.SPEED * 0.7; this.health = 4; break;
            default:        this.speed = CONFIG.ENEMY.SPEED;       this.health = 2; break;
        }
    }

    // ============================================================
    //  ОБНОВЛЕНИЕ
    // ============================================================

    update(dt: number, game: any) {
        this.updateTimers(dt);
        this.pathTimer -= dt;

        const pathInterval = this.role === 'hunter'
          ? 0.15
          : this.pathIntervalForDestroyer();

        if (this.pathTimer <= 0 || this.path.length === 0) {
            this.computePath(game);
            this.pathTimer = pathInterval;
        }

        this.checkStuck(dt);

        if (this.mode === 'stuck') {
            this.handleStuck(dt, game);
        } else {
            this.followPath(dt, game);
        }

        this.tryShoot(game, dt);
    }

    private pathIntervalForDestroyer(): number {
        if (this.type === 'armored') return 1.0;
        if (this.type === 'fast')    return 1.8;
        return 1.4;
    }

    // ============================================================
    //  ПУТЬ
    // ============================================================

    private computePath(game: any) {
        const map = game.map;
        let targetCol: number;
        let targetRow: number;

        if (this.role === 'hunter') {
            const player = game.player;
            if (player?.alive) {
                targetCol = Math.floor(player.cx / CONFIG.TILE);
                targetRow = Math.floor(player.cy / CONFIG.TILE);
            } else {
                targetCol = this.basePos.col;
                targetRow = this.basePos.row;
            }
        } else {
            targetCol = this.basePos.col;
            targetRow = this.basePos.row;
        }

        const startCol = Math.floor(this.cx / CONFIG.TILE);
        const startRow = Math.floor(this.cy / CONFIG.TILE);
        const maxVisited = this.role === 'hunter' ? 200 : 400;

        this.path = this.bfs(map, startCol, startRow, targetCol, targetRow, maxVisited);
        this.pathIndex = 0;
    }
//обход в ширину (Breadth-First Search) todo может еще какой то алгоритм сделать
    private bfs(
      map: any,
      startCol: number, startRow: number,
      goalCol: number, goalRow: number,
      maxVisited = 400
    ): { col: number; row: number }[] {
        const cols = map.cols;
        const rows = map.rows;
        const key = (c: number, r: number) => c + r * cols;
        const visited = new Set<number>();
        const parent = new Map<number, number>();
        const queue: { col: number; row: number }[] = [];
        queue.push({ col: startCol, row: startRow });
        visited.add(key(startCol, startRow));

        const isPassable = (c: number, r: number) => {
            if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
            if (c === goalCol && r === goalRow) return true;
            const t = map.get(c, r);
            if (!t) return true;
            return !t.isSolid;
        };

        let found = false;
        while (queue.length > 0 && visited.size < maxVisited) {
            const cur = queue.shift()!;
            if (cur.col === goalCol && cur.row === goalRow) { found = true; break; }

            for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
                const nc = cur.col + dc;
                const nr = cur.row + dr;
                const k = key(nc, nr);
                if (visited.has(k)) continue;
                if (!isPassable(nc, nr)) continue;
                visited.add(k);
                parent.set(k, key(cur.col, cur.row));
                queue.push({ col: nc, row: nr });
            }
        }

        if (!found) return [];

        const path: { col: number; row: number }[] = [];
        let k = key(goalCol, goalRow);
        const startKey = key(startCol, startRow);
        while (k !== startKey) {
            path.push({ col: k % cols, row: Math.floor(k / cols) });
            const p = parent.get(k);
            if (p === undefined) break;
            k = p;
        }
        path.reverse();
        return path;
    }

    private followPath(dt: number, game: any) {
        if (this.path.length === 0 || this.pathIndex >= this.path.length) {
            const v = DIR_VECTORS[this.direction];
            const moved = this.moveWithIce(v.x, v.y, dt, game.map, game.allTanks());
            if (!moved) this.markStuck();
            return;
        }

        const target = this.path[this.pathIndex];
        const targetX = target.col * CONFIG.TILE + CONFIG.TILE / 2;
        const targetY = target.row * CONFIG.TILE + CONFIG.TILE / 2;
        const dx = targetX - this.cx;
        const dy = targetY - this.cy;
        const dist = Math.hypot(dx, dy);

        if (dist < CONFIG.TILE * 0.4) {
            this.pathIndex++;
            return;
        }

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        let dirX = 0, dirY = 0;

        if (absDx > absDy) {
            dirX = Math.sign(dx);
            this.direction = dirX > 0 ? Direction.Right : Direction.Left;
        } else {
            dirY = Math.sign(dy);
            this.direction = dirY > 0 ? Direction.Down : Direction.Up;
        }

        const moved = this.moveWithIce(dirX, dirY, dt, game.map, game.allTanks());
        if (!moved) this.markStuck();
    }

    // ============================================================
    //  ЗАСТРЕВАНИЕ
    // ============================================================

    private markStuck() {
        if (this.mode === 'stuck') return;
        this.mode = 'stuck';
        this.stuckTimer = 0;
    }

    private handleStuck(dt: number, game: any) {
        this.pathTimer = 0;

        this.stuckTimer -= dt;
        if (this.stuckTimer <= 0) {
            this.stuckTimer = 0.4;
            const dirs = [Direction.Up, Direction.Right, Direction.Down, Direction.Left];
            this.direction = dirs[randInt(0, 3)];
        }

        const v = DIR_VECTORS[this.direction];
        this.moveWithIce(v.x, v.y, dt, game.map, game.allTanks());
    }

    private checkStuck(dt: number) {
        this.progressTimer += dt;
        if (this.progressTimer < 0.5) return;

        const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);

        if (moved < 2) {
            if (this.mode !== 'stuck') {
                this.mode = 'stuck';
                this.stuckTimer = 0;
            }
        } else if (this.mode === 'stuck') {
            this.mode = 'advance';
        }

        this.lastX = this.x;
        this.lastY = this.y;
        this.progressTimer = 0;
    }

    // ============================================================
    //  СТРЕЛЬБА
    // ============================================================

    private tryShoot(game: any, dt: number) {
        this.fireTimer -= dt;
        if (this.fireTimer > 0) return;
        if (!this.canShoot()) return;
        if (!this.shouldFire(game)) return;

        const m = this.muzzle;
        game.spawnBullet(new Bullet(m.x, m.y, this.direction, 'enemy'));
        this.shoot();
        this.fireTimer = this.fireCooldown();
    }

    private fireCooldown(): number {
        const base = CONFIG.ENEMY.COOLDOWN;
        const roleMult = this.role === 'hunter' ? 0.8 : 1.0;
        const typeMult =
          this.type === 'fast'    ? 1.4 :
            this.type === 'armored' ? 0.7 : 1.0;
        return base * roleMult * typeMult + rand(-0.2, 0.4);
    }

    private shouldFire(game: any): boolean {
        const player = game.player;
        if (player?.alive && this.playerOnLine(player, game.map)) return true;
        if (game.base?.alive && this.baseOnLine(game.base)) return true;
        if (this.blockedAhead(game.map)) return false;

        const chance =
          this.role === 'hunter' ? 0.5 :
            this.type === 'armored' ? 0.25 : 0.4;
        return Math.random() < chance;
    }

    private blockedAhead(map: any): boolean {
        const v = DIR_VECTORS[this.direction];
        const startX = this.cx;
        const startY = this.cy;
        const step = CONFIG.BULLET.SIZE;

        for (let d = 0; d < CONFIG.TILE * 2; d += step) {
            const px = startX + v.x * d;
            const py = startY + v.y * d;
            const col = Math.floor(px / CONFIG.TILE);
            const row = Math.floor(py / CONFIG.TILE);
            const t = map.get(col, row);
            if (t && t.blocksBullets && t.alive) return true;
        }
        return false;
    }

    private playerOnLine(player: any, map: any): boolean {
        if (!player?.alive) return false;
        if (map?.isBushAt(player.cx, player.cy)) return false;

        const v = DIR_VECTORS[this.direction];
        const dx = player.cx - this.cx;
        const dy = player.cy - this.cy;

        if (v.x !== 0) return Math.abs(dy) < 20 && Math.sign(dx) === v.x;
        if (v.y !== 0) return Math.abs(dx) < 20 && Math.sign(dy) === v.y;
        return false;
    }

    private baseOnLine(base: any): boolean {
        if (!base?.alive || base.destroyed) return false;
        const v = DIR_VECTORS[this.direction];
        const dx = base.x + base.w / 2 - this.cx;
        const dy = base.y + base.h / 2 - this.cy;
        if (v.x !== 0) return Math.abs(dy) < 20 && Math.sign(dx) === v.x;
        if (v.y !== 0) return Math.abs(dx) < 20 && Math.sign(dy) === v.y;
        return false;
    }

    // ============================================================
    //  РЕНДЕР  ← ВОССТАНОВЛЕНО
    // ============================================================

    render(ctx: CanvasRenderingContext2D) {
        let body = CONFIG.COLORS.ENEMY;
        let dark = CONFIG.COLORS.ENEMY_DARK;

        if (this.type === 'fast')    { body = '#e8c04a'; dark = '#8a6a1a'; }
        if (this.type === 'armored') { body = '#b070e0'; dark = '#5a3080'; }

        const inBush = this.map?.isBushAt(this.cx, this.cy) ?? false;
        this.renderTankBody(ctx, body, dark, inBush);

        if (this.debug) this.renderDebug(ctx);
    }

    private renderDebug(ctx: CanvasRenderingContext2D) {
        if (this.path.length > 0) {
            ctx.strokeStyle =
              this.role === 'hunter'
                ? 'rgba(255, 100, 100, 0.6)'
                : 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.cx, this.cy);
            for (let i = this.pathIndex; i < this.path.length; i++) {
                const p = this.path[i];
                ctx.lineTo(
                  p.col * CONFIG.TILE + CONFIG.TILE / 2,
                  p.row * CONFIG.TILE + CONFIG.TILE / 2
                );
            }
            ctx.stroke();
        }

        ctx.strokeStyle = this.mode === 'stuck' ? '#0ff' : '#0f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 1, this.y - 1, this.w + 2, this.h + 2);

        ctx.fillStyle = this.role === 'hunter' ? '#f44' : '#ff4';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          this.role === 'hunter' ? 'H' : 'D',
          this.cx, this.y - 3
        );
    }

    // ============================================================
    //  УРОН
    // ============================================================

    takeDamage(): boolean {
        this.health--;
        if (this.health <= 0) { this.alive = false; return true; }
        return false;
    }
}