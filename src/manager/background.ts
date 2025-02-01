import {
    autoDetectRenderer,
    Container,
    Filter,
    ImageSource,
    Point,
    Renderer,
    Texture,
    Ticker,
    TilingSprite,
} from 'pixi.js';
import { PixelateFilter } from 'pixi-filters/pixelate';
import { AssetManager } from './asset';

// Background colors
const REGULAR_BACKGROUND_COLOR = 0x888888;
const GAME_OVER_BACKGROUND_COLOR = 0x3d0000;

export class BackgroundManager {
    private renderer: Renderer<HTMLCanvasElement> | null;
    private stage: Container | null;
    private background: Container | null;
    private tileDelta: number;

    private normalBGFilters: Filter | Filter[];
    private pixelBackgroundFilters: Filter | Filter[];

    private assetManager: AssetManager;

    constructor(assetManager: AssetManager) {
        this.renderer = null;
        this.stage = null;
        this.background = null;
        this.tileDelta = 1;
        this.normalBGFilters = [];
        this.pixelBackgroundFilters = [];
        this.assetManager = assetManager;
    }

    async initialize() {
        this.renderer = await autoDetectRenderer({
            width: 800,
            height: 600,
        });

        // Attach renderer onto the page
        const domContainer = document.body.querySelector('div.game-wrapper') as HTMLDivElement;
        this.renderer.canvas.style.position = 'absolute';
        this.renderer.canvas.style.top = '0';
        this.renderer.canvas.style.left = '0';
        this.renderer.canvas.style.zIndex = '-10';
        domContainer.appendChild(this.renderer.canvas);

        this.renderer.background.color = REGULAR_BACKGROUND_COLOR;
        this.stage = new Container();
        this.background = new Container();
        let tileImg = this.assetManager.getImage('img/Tiles.png');
        if (!tileImg) {
            throw new Error('Tile asset not loaded');
        }
        const tileTexSource = new ImageSource({
            resource: tileImg,
        });
        const tileTex = new Texture({
            source: tileTexSource,
        });
        var tilingTile = new TilingSprite({
            texture: tileTex,
            width: this.renderer.width,
            height: this.renderer.height,
        });
        this.tileDelta = 1;
        this.stage.addChild(this.background);
        this.background.addChild(tilingTile);

        const updateRenderer = (ticker: Ticker) => {
            //Tiling Sprite update
            tilingTile.tilePosition.x -= this.tileDelta;
            tilingTile.tilePosition.y -= this.tileDelta;
        };

        const render = () => {
            if (!this.renderer || !this.stage) {
                return;
            }
            //Render the stage
            this.renderer.render(this.stage);
        };

        var ticker = new Ticker();
        ticker.add(updateRenderer);
        ticker.add(render);
        ticker.start();

        //Adding resize callback for resizing tiling background
        var resizeCallbacks = new Array<Function>();
        resizeCallbacks.push(() => {
            if (!this.renderer) {
                return;
            }
            tilingTile.width = this.renderer.width;
            tilingTile.height = this.renderer.height;
        });

        // Background filter setup
        this.normalBGFilters = this.background.filters;
        const pixelateFilter = new PixelateFilter();
        const pixelIntensity = 10;
        pixelateFilter.size = new Point(pixelIntensity, pixelIntensity);
        this.pixelBackgroundFilters = [pixelateFilter];
        // var blurFilter = new filters.BlurFilter();
        // blurFilter.blur = 20;
        // var gameInactiveFilters = [blurFilter];

        var resizeGame = () => {
            if (!this.renderer) {
                return;
            }
            this.renderer.resize(window.innerWidth, window.innerHeight);
            console.log(window.innerWidth, window.innerHeight);
            for (var i = 0; i < resizeCallbacks.length; i++) {
                resizeCallbacks[i]();
            }
        };
        window.onresize = resizeGame;
        resizeGame();
    }

    renderWin() {
        if (!this.renderer || !this.background) {
            throw new Error('Background not initialized');
        }
        this.renderer.background.color = REGULAR_BACKGROUND_COLOR;
        this.background.filters = this.normalBGFilters;
        this.tileDelta = 0.25;
    }

    renderLose() {
        if (!this.renderer || !this.background) {
            throw new Error('Background not initialized');
        }
        this.renderer.background.color = GAME_OVER_BACKGROUND_COLOR;
        this.background.filters = this.pixelBackgroundFilters;
        this.tileDelta = 0.25;
    }

    renderInitial() {
        if (!this.renderer || !this.background) {
            throw new Error('Background not initialized');
        }
        this.renderer.background.color = REGULAR_BACKGROUND_COLOR;
        this.background.filters = this.normalBGFilters;
        this.tileDelta = 1;
    }
}
