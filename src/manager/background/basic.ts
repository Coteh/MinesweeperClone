import { Renderer, Container, Graphics, Ticker } from 'pixi.js';
import { BackgroundTheme } from '.';

export class BasicTheme implements BackgroundTheme {
    private renderer: Renderer<HTMLCanvasElement>;

    constructor(renderer: Renderer<HTMLCanvasElement>, background: Container) {
        this.renderer = renderer;

        this.initialize();
    }

    private initialize() {}

    renderInitial() {
        this.renderer.background.color = 0xbbbbbb;
    }

    renderWin() {
        this.renderer.background.color = 0x2ecc71;
    }

    renderLose() {
        this.renderer.background.color = 0xe74c3c;
    }

    onResize(): void {}
}
