import { PixelateFilter } from 'pixi-filters/pixelate';
import {
    Renderer,
    Container,
    Filter,
    ImageSource,
    Texture,
    TilingSprite,
    Ticker,
    Point,
} from 'pixi.js';
import { BackgroundTheme } from '.';
import { AssetManager } from '../asset';

export class ClassicTheme implements BackgroundTheme {
    private renderer: Renderer<HTMLCanvasElement>;
    private background: Container;
    private tileDelta: number;
    private normalBGFilters: Filter | Filter[];
    private pixelBackgroundFilters: Filter | Filter[];
    private assetManager: AssetManager;
    private tilingTile: TilingSprite;

    constructor(
        renderer: Renderer<HTMLCanvasElement>,
        background: Container,
        assetManager: AssetManager
    ) {
        this.renderer = renderer;
        this.background = background;
        this.tileDelta = 1;
        this.normalBGFilters = [];
        this.pixelBackgroundFilters = [];
        this.assetManager = assetManager;
        this.tilingTile = new TilingSprite();

        this.initialize();
    }

    private initialize() {
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
        this.tilingTile = new TilingSprite({
            texture: tileTex,
            width: this.renderer.width,
            height: this.renderer.height,
        });
        this.background.addChild(this.tilingTile);

        const updateRenderer = (ticker: Ticker) => {
            // Tiling Sprite update
            this.tilingTile.tilePosition.x -= this.tileDelta;
            this.tilingTile.tilePosition.y -= this.tileDelta;
        };

        const ticker = Ticker.shared;
        ticker.add(updateRenderer);

        // Background filter setup
        this.normalBGFilters = this.background.filters;
        const pixelateFilter = new PixelateFilter();
        const pixelIntensity = 10;
        pixelateFilter.size = new Point(pixelIntensity, pixelIntensity);
        this.pixelBackgroundFilters = [pixelateFilter];
    }

    renderInitial() {
        this.renderer.background.color = 0x888888;
        this.background.filters = this.normalBGFilters;
        this.tileDelta = 1;
    }

    renderWin() {
        this.renderer.background.color = 0x888888;
        this.background.filters = this.normalBGFilters;
        this.tileDelta = 0.25;
    }

    renderLose() {
        this.renderer.background.color = 0x3d0000;
        this.background.filters = this.pixelBackgroundFilters;
        this.tileDelta = 0.25;
    }

    onResize() {
        if (!this.renderer) {
            return;
        }
        this.tilingTile.width = this.renderer.width;
        this.tilingTile.height = this.renderer.height;
    }
}
