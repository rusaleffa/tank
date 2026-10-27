import { GameState } from '../types';
import type { Game } from '../core/Game';

export class HUD {
    private el: HTMLElement;

    constructor(private game: Game) {
        this.el = document.getElementById('overlay')!;
        this.game.onStateChange = (s, g) => this.render(s, g);
        this.render(GameState.Menu, game);
    }

    private render(state: GameState, game: Game) {
        if (state === GameState.Playing) {
            this.el.classList.remove('visible');
            this.el.innerHTML = '';
            return;
        }

        this.el.classList.add('visible');

        switch (state) {
            case GameState.Menu:
                this.el.innerHTML = `
          <h1>TANKS</h1>
          <p>
            <kbd>WASD</kbd> / <kbd>←↑↓→</kbd> — движение<br>
            <kbd>Space</kbd> — выстрел<br>
            <kbd>P</kbd> — пауза<br><br>
            Защити базу, уничтожь всех врагов!
          </p>
          <button id="startBtn">Начать игру</button>
        `;
                document.getElementById('startBtn')!.onclick = () => {
                    this.game.startNewGame();
                };
                break;

            case GameState.Paused:
                this.el.innerHTML = `
          <h1>PAUSE</h1>
          <button id="resumeBtn">Продолжить</button>
        `;
                document.getElementById('resumeBtn')!.onclick = () => {
                    this.game.setState(GameState.Playing);
                };
                break;

            case GameState.LevelComplete:
                this.el.innerHTML = `
          <h2>УРОВЕНЬ ${game.level + 1} ПРОЙДЕН</h2>
          <p>Счёт: ${game.player.score}</p>
          <button id="nextBtn">Следующий уровень</button>
        `;
                document.getElementById('nextBtn')!.onclick = () => {
                    this.game.nextLevel();
                };
                break;

            case GameState.GameOver:
                this.el.innerHTML = `
          <h2>ИГРА ОКОНЧЕНА</h2>
          <p>Счёт: ${game.player.score}<br>Уровень: ${game.level + 1}</p>
          <button id="restartBtn">Заново</button>
        `;
                document.getElementById('restartBtn')!.onclick = () => {
                    this.game.startNewGame();
                };
                break;
        }
    }
}