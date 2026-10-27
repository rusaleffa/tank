import { CONFIG } from '../config';
import { rand } from '../core/math';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
}

/**
 * Взрыв — набор частиц, разлетающихся от центра.
 *
 * Не наследует Entity: у него другая логика (частицы, а не прямоугольник)
 * и он не участвует в коллизиях. Game хранит их в отдельном массиве
 * и обновляет через update(dt).
 */
export class Explosion {
    particles: Particle[] = [];
    alive = true;

    private timer = 0;
    private readonly duration = 0.6;

    constructor(x: number, y: number, count = 16) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = rand(40, 180);
            const life = rand(0.3, this.duration);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life,
                maxLife: life,
                size: rand(2, 5),
            });
        }
    }

    update(dt: number) {
        this.timer += dt;

        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.life -= dt;
        }

        if (this.timer >= this.duration) this.alive = false;
    }

    render(ctx: CanvasRenderingContext2D) {
        for (const p of this.particles) {
            if (p.life <= 0) continue;

            const t = p.life / p.maxLife;

            // яркость: сначала белый, потом оранжевый
            ctx.globalAlpha = t;
            ctx.fillStyle =
                t > 0.5
                    ? '#fff8a0'
                    : CONFIG.COLORS.EXPLOSION;

            // частица — квадрат
            ctx.fillRect(
                p.x - p.size / 2,
                p.y - p.size / 2,
                p.size,
                p.size
            );
        }
        ctx.globalAlpha = 1;
    }
}