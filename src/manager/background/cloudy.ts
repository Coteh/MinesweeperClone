import {
    Renderer,
    Container,
    Graphics,
    Ticker,
    Sprite,
    ImageSource,
    Texture,
    ColorMatrixFilter,
} from 'pixi.js';
import { BackgroundTheme } from '.';
import { ThemeConfig } from '../../config';
import { AssetManager } from '../asset';

interface Cloud {
    graphics: Graphics;
    x: number;
    y: number;
    speedX: number;
    speedY: number;
    width: number;
    height: number;
}

export class CloudyTheme implements BackgroundTheme {
    private renderer: Renderer<HTMLCanvasElement>;
    private background: Container;
    private cloudsContainer: Container;
    private themeConfig: ThemeConfig;
    private assetManager: AssetManager;
    private clouds: Cloud[] = [];
    private backgroundSprite: Sprite;

    constructor(
        renderer: Renderer<HTMLCanvasElement>,
        background: Container,
        themeConfig: ThemeConfig,
        assetManager: AssetManager
    ) {
        this.renderer = renderer;
        this.background = background;
        this.themeConfig = themeConfig;
        this.assetManager = assetManager;
        this.backgroundSprite = new Sprite();
        this.cloudsContainer = new Container();

        this.initialize();
    }

    initialize() {
        // Load and add background image
        const bgImg = this.assetManager.getImage('Background.png');
        if (bgImg) {
            const bgTexSource = new ImageSource({
                resource: bgImg,
            });
            const bgTex = new Texture({
                source: bgTexSource,
            });
            this.backgroundSprite = new Sprite({
                texture: bgTex,
            });

            // Scale to cover viewport while maintaining aspect ratio
            this.scaleBackgroundSprite();
            this.background.addChildAt(this.backgroundSprite, 0);
        }

        // Create multiple clouds with different sizes and speeds
        const cloudCount = 5;
        this.background.addChild(this.cloudsContainer);

        for (let i = 0; i < cloudCount; i++) {
            const cloud = this.createCloud();
            this.clouds.push(cloud);
            this.cloudsContainer.addChild(cloud.graphics);
        }

        // Animate clouds
        Ticker.shared.add(this.animateClouds.bind(this));

        // Set initial filter state
        this.renderInitial();
    }

    private createCloud(): Cloud {
        const graphics = new Graphics();

        // Random cloud properties
        const width = 80 + Math.random() * 100;
        const height = 40 + Math.random() * 40;
        const x = Math.random() * this.renderer.width;
        const y = Math.random() * (this.renderer.height * 0.6); // Keep clouds in upper 60% of screen
        const speedX = 0.2 + Math.random() * 0.3;
        const speedY = Math.sin(Math.random() * Math.PI) * 0.1; // Slight vertical movement

        // Draw a simple cloud shape using multiple circles
        this.drawCloudShape(graphics, width, height);

        graphics.x = x;
        graphics.y = y;

        return {
            graphics,
            x,
            y,
            speedX,
            speedY,
            width,
            height,
        };
    }

    private scaleBackgroundSprite() {
        if (!this.backgroundSprite.texture) return;

        const imageWidth = this.backgroundSprite.texture.width;
        const imageHeight = this.backgroundSprite.texture.height;
        const viewportWidth = this.renderer.width;
        const viewportHeight = this.renderer.height;

        const imageAspect = imageWidth / imageHeight;
        const viewportAspect = viewportWidth / viewportHeight;

        let scale = 1;
        if (imageAspect > viewportAspect) {
            // Image is wider than viewport, scale by height
            scale = viewportHeight / imageHeight;
        } else {
            // Image is taller than viewport, scale by width
            scale = viewportWidth / imageWidth;
        }

        this.backgroundSprite.scale.set(scale);

        // Center the sprite
        this.backgroundSprite.x = (viewportWidth - imageWidth * scale) / 2;
        this.backgroundSprite.y = (viewportHeight - imageHeight * scale) / 2;
    }

    private drawCloudShape(graphics: Graphics, width: number, height: number) {
        graphics.clear();
        graphics.fill({ color: 0xffffff, alpha: 0.6 });

        // Create a more complex cloud shape using ellipses
        // Draw main body with multiple overlapping ellipses of varying sizes
        const numPuffs = 5 + Math.floor(Math.random() * 3); // 5-7 puffs per cloud

        for (let i = 0; i < numPuffs; i++) {
            // Position along the width with some randomness
            const xPos = (i / (numPuffs - 1)) * width * 0.8 + width * 0.1;

            // Vary the vertical position to create irregular cloud tops
            const yOffset = (Math.random() - 0.5) * height * 0.4;

            // Vary the size of each puff
            const radiusX = (width / numPuffs) * (0.6 + Math.random() * 0.5);
            const radiusY = height * (0.4 + Math.random() * 0.3);

            // Draw ellipse for this puff
            graphics.ellipse(xPos, yOffset, radiusX, radiusY);
        }

        // Add some smaller puffs on top for extra detail
        const numTopPuffs = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numTopPuffs; i++) {
            const xPos = width * (0.3 + Math.random() * 0.4);
            const yOffset = -height * (0.2 + Math.random() * 0.2);
            const radiusX = width * (0.1 + Math.random() * 0.15);
            const radiusY = height * (0.15 + Math.random() * 0.2);

            graphics.ellipse(xPos, yOffset, radiusX, radiusY);
        }

        graphics.fill();
    }

    private animateClouds() {
        for (const cloud of this.clouds) {
            // Move cloud
            cloud.x += cloud.speedX;
            cloud.y += cloud.speedY;

            // Wrap around horizontally
            if (cloud.x > this.renderer.width + cloud.width) {
                cloud.x = -cloud.width;
                cloud.y = Math.random() * (this.renderer.height * 0.6);
            }

            // Update graphics position
            cloud.graphics.x = cloud.x;
            cloud.graphics.y = cloud.y;
        }
    }

    private hexToPixiColor(hex: string): number {
        return parseInt(hex.replace('#', '0x'), 16);
    }

    renderInitial() {
        const defaultColor = 0x87ceeb; // Sky blue
        const color = this.themeConfig.backgroundColor
            ? this.hexToPixiColor(this.themeConfig.backgroundColor)
            : defaultColor;
        this.renderer.background.color = color;
        this.background.filters = [];

        // Reset CSS variable
        document.documentElement.style.setProperty(
            '--cloud-overlay-color',
            'rgba(255, 255, 255, 0)'
        );
    }

    renderWin() {
        const winFilter = new ColorMatrixFilter();
        winFilter.tint(0x32cd32, false); // Lime green
        winFilter.brightness(1.2, true);
        this.background.filters = [winFilter];

        // Update CSS variable for CSS clouds
        document.documentElement.style.setProperty(
            '--cloud-overlay-color',
            'rgba(50, 205, 50, 0.3)'
        );
    }

    renderLose() {
        const loseFilter = new ColorMatrixFilter();
        loseFilter.tint(0xdc143c, false); // Crimson red
        loseFilter.brightness(0.8, true);
        this.background.filters = [loseFilter];

        // Update CSS variable for CSS clouds
        document.documentElement.style.setProperty(
            '--cloud-overlay-color',
            'rgba(220, 20, 60, 0.4)'
        );
    }

    onResize(): void {
        // Rescale background sprite to maintain aspect ratio
        if (this.backgroundSprite && this.backgroundSprite.texture) {
            this.scaleBackgroundSprite();
        }

        // Reposition clouds if they're outside the new viewport
        for (const cloud of this.clouds) {
            if (cloud.y > this.renderer.height) {
                cloud.y = Math.random() * (this.renderer.height * 0.6);
            }
        }
    }
}
