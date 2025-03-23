import { Renderer, Container, Graphics, Ticker } from 'pixi.js';
import { BackgroundTheme } from '.';

export class OceanTheme implements BackgroundTheme {
    private renderer: Renderer<HTMLCanvasElement>;
    private background: Container;

    constructor(renderer: Renderer<HTMLCanvasElement>, background: Container) {
        this.renderer = renderer;
        this.background = background;

        this.initialize();
    }

    private initialize() {
        const waveGraphics = new Graphics();
        waveGraphics.fill(0x3b82f6);
        waveGraphics.rect(0, 0, this.renderer.width, this.renderer.height);
        this.background.addChild(waveGraphics);

        const waveAmplitude = 20;
        const waveFrequency = 0.05;
        const waveSpeed = 0.005;

        const drawWaves = () => {
            waveGraphics.clear();
            waveGraphics.fill(0x3b82f6);
            waveGraphics.moveTo(0, this.renderer.height / 2);

            for (let x = 0; x < this.renderer.width; x++) {
                const y =
                    this.renderer.height / 2 +
                    waveAmplitude *
                        Math.sin(x * waveFrequency + Ticker.shared.lastTime * waveSpeed);
                waveGraphics.lineTo(x, y);
            }

            waveGraphics.lineTo(this.renderer.width, this.renderer.height);
            waveGraphics.lineTo(0, this.renderer.height);
            waveGraphics.closePath();
            // TODO: Remove this deprecation
            waveGraphics.endFill();
        };

        Ticker.shared.add(drawWaves);
    }

    renderInitial() {
        this.renderer.background.color = 0x1e3a5f;
    }

    renderWin() {
        this.renderer.background.color = 0x1e3a5f;
    }

    renderLose() {
        this.renderer.background.color = 0x3d0000;
    }

    onResize(): void {}
}
