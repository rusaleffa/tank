import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { CONFIG } from '../config';
import { Direction, type InputState } from '../types';

export class PlayerTank extends Tank {
    lives = CONFIG.STARTING_LIVES;
    score = 0;

    constructor(x: number, y: number) {
        super(x, y, CONFIG.TANK.SIZE, CONFIG.TANK.SIZE);
        this.direction = Direction.Up;
        this.speed = CONFIG.TANK.SPEED;
        this.shield = CONFIG.TANK.SPAWN_SHIELD;
    }

    update(dt: number, game: any) {
        this.updateTimers(dt);

        const input: InputState = game.inputs;

        let dx = 0;
        let dy = 0;

        if (input.up)         { this.direction = Direction.Up;    dy = -1; }
        else if (input.down)  { this.direction = Direction.Down;  dy =  1; }
        else if (input.left)  { this.direction = Direction.Left;  dx = -1; }
        else if (input.right) { this.direction = Direction.Right; dx =  1; }

        this.moveWithIce(dx, dy, dt, game.map, game.allTanks());

        if (input.fire && this.canShoot()) {
            const m = this.muzzle;
            game.spawnBullet(new Bullet(m.x, m.y, this.direction, 'player'));
            this.shoot();
            game.audio.shoot();
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        const inBush = this.map?.isBushAt(this.cx, this.cy) ?? false;
        this.renderTankBody(
            ctx,
            CONFIG.COLORS.PLAYER,
            CONFIG.COLORS.PLAYER_DARK,
            inBush
        );
    }

    // ---- жизненный цикл ----

    respawn(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.direction = Direction.Up;
        this.health = CONFIG.TANK.HEALTH;
        this.shield = CONFIG.TANK.SPAWN_SHIELD;
        this.alive = true;
        this.iceVx = 0;
        this.iceVy = 0;
        this.iceSlideTimer = 0;
        this.cooldown = 0;
    }

    /** Возвращает true, если игрок погиб от этого урона. */
    takeDamage(): boolean {
        if (this.shield > 0) return false;
        this.health--;
        if (this.health <= 0) {
            this.alive = false;
            this.lives--;
            return true;
        }
        return false;
    }
}