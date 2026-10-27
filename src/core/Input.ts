import type { InputState } from '../types';

export class Input {
    private keys = new Set<string>();
    private state: InputState = {
        up: false, down: false, left: false, right: false, fire: false,
    };

    constructor() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.reset);
    }

    private onKeyDown = (e: KeyboardEvent) => {
        this.keys.add(e.code);
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
            e.preventDefault();
        }
    };

    private onKeyUp = (e: KeyboardEvent) => {
        this.keys.delete(e.code);
    };

    private reset = () => {
        this.keys.clear();
    };

    poll(): InputState {
        this.state.up    = this.keys.has('ArrowUp')    || this.keys.has('KeyW');
        this.state.down  = this.keys.has('ArrowDown')  || this.keys.has('KeyS');
        this.state.left  = this.keys.has('ArrowLeft')  || this.keys.has('KeyA');
        this.state.right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
        this.state.fire  = this.keys.has('Space');
        return { ...this.state };
    }

    destroy() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.reset);
    }
}