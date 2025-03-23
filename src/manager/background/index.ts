import { autoDetectRenderer, Container, Renderer, Ticker } from 'pixi.js';
import { AssetManager } from '../asset';
import { OceanTheme } from './ocean';
import { ClassicTheme } from './classic';
import { BasicTheme } from './basic';

export interface BackgroundTheme {
    renderInitial(): void;
    renderWin(): void;
    renderLose(): void;
    onResize(): void;
}

export class BackgroundManager {
    private renderer: Renderer<HTMLCanvasElement> | null;
    private stage: Container | null;
    private background: Container | null;
    private assetManager: AssetManager;
    private currentTheme: BackgroundTheme | null;

    constructor(assetManager: AssetManager) {
        this.renderer = null;
        this.stage = null;
        this.background = null;
        this.assetManager = assetManager;
        this.currentTheme = null;
    }

    async initialize() {
        this.renderer = await autoDetectRenderer({
            width: window.innerWidth,
            height: window.innerHeight,
        });

        // Attach renderer onto the page
        const domContainer = document.body.querySelector('div.game-wrapper') as HTMLDivElement;
        this.renderer.canvas.style.position = 'absolute';
        this.renderer.canvas.style.top = '0';
        this.renderer.canvas.style.left = '0';
        this.renderer.canvas.style.zIndex = '-10';
        domContainer.appendChild(this.renderer.canvas);

        this.stage = new Container();
        this.background = new Container();
        this.stage.addChild(this.background);

        const render = () => {
            if (!this.renderer || !this.stage) {
                return;
            }
            // Render the stage
            this.renderer.render(this.stage);
        };

        var ticker = new Ticker();
        ticker.add(render);
        ticker.start();

        var resizeGame = () => {
            if (!this.renderer) {
                return;
            }
            this.renderer.resize(window.innerWidth, window.innerHeight);
            this.currentTheme?.onResize();
        };
        window.onresize = resizeGame;
        resizeGame();
    }

    switchTheme(theme: string) {
        if (!this.renderer || !this.background) {
            throw new Error('Background not initialized');
        }

        this.background.removeChildren();
        this.background.filters = [];

        switch (theme) {
            case 'basic':
                this.currentTheme = new BasicTheme(this.renderer, this.background);
                break;
            case 'ocean':
                this.currentTheme = new OceanTheme(this.renderer, this.background);
                break;
            case 'classic':
            default:
                this.currentTheme = new ClassicTheme(
                    this.renderer,
                    this.background,
                    this.assetManager
                );
                break;
        }

        this.currentTheme.renderInitial();
    }

    renderWin() {
        if (this.currentTheme) {
            this.currentTheme.renderWin();
        }
    }

    renderLose() {
        if (this.currentTheme) {
            this.currentTheme.renderLose();
        }
    }

    renderInitial() {
        if (this.currentTheme) {
            this.currentTheme.renderInitial();
        }
    }
}
