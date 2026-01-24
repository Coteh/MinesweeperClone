import { Renderer, Container } from 'pixi.js';
import { BackgroundTheme } from '.';
import { ThemeConfig } from '../../config';

export class BasicTheme implements BackgroundTheme {
    private renderer: Renderer<HTMLCanvasElement>;
    private themeConfig: ThemeConfig;

    constructor(
        renderer: Renderer<HTMLCanvasElement>,
        _background: Container,
        themeConfig: ThemeConfig
    ) {
        this.renderer = renderer;
        this.themeConfig = themeConfig;

        this.initialize();
    }

    initialize() {}

    private hexToPixiColor(hex: string): number {
        return parseInt(hex.replace('#', '0x'), 16);
    }

    renderInitial() {
        const defaultColor = 0xbbbbbb;
        const color = this.themeConfig.backgroundColor
            ? this.hexToPixiColor(this.themeConfig.backgroundColor)
            : defaultColor;
        this.renderer.background.color = color;
    }

    renderWin() {
        const defaultColor = 0x2ecc71;
        const color = this.themeConfig.winColor
            ? this.hexToPixiColor(this.themeConfig.winColor)
            : defaultColor;
        this.renderer.background.color = color;
    }

    renderLose() {
        const defaultColor = 0xe74c3c;
        const color = this.themeConfig.loseColor
            ? this.hexToPixiColor(this.themeConfig.loseColor)
            : defaultColor;
        this.renderer.background.color = color;
    }

    onResize(): void {}
}
