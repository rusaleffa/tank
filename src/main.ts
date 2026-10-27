import './style.css';
import { Game } from '@core/Game';
import { HUD } from './ui/HUD';
import { GameState } from './types';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new Game(canvas);
new HUD(game);

// пауза по P
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
        if (game.state === GameState.Playing) game.setState(GameState.Paused);
        else if (game.state === GameState.Paused) game.setState(GameState.Playing);
    }
});

game.start();

// авто-пауза при потере фокуса
window.addEventListener('blur', () => {
    if (game.state === GameState.Playing) game.setState(GameState.Paused);
});