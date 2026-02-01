import { Renderer, Container, Graphics, Ticker } from 'pixi.js';
import { BackgroundTheme } from '.';
import { ThemeConfig } from '../../config';

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
    private themeConfig: ThemeConfig;
    private clouds: Cloud[] = [];

    constructor(
        renderer: Renderer<HTMLCanvasElement>,
        background: Container,
        themeConfig: ThemeConfig
    ) {
        this.renderer = renderer;
        this.background = background;
        this.themeConfig = themeConfig;

        this.initialize();
    }

    private initialize() {
        // Create multiple clouds with different sizes and speeds
        const cloudCount = 5;
        
        for (let i = 0; i < cloudCount; i++) {
            const cloud = this.createCloud();
            this.clouds.push(cloud);
            this.background.addChild(cloud.graphics);
        }

        // Animate clouds
        Ticker.shared.add(this.animateClouds.bind(this));
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
            height
        };
    }

    private drawCloudShape(graphics: Graphics, width: number, height: number) {
        graphics.clear();
        graphics.fill({ color: 0xFFFFFF, alpha: 0.6 });
        
        // Draw cloud using overlapping circles
        const circleRadius = height / 2;
        const numCircles = Math.floor(width / (circleRadius * 1.5));
        
        for (let i = 0; i < numCircles; i++) {
            const cx = (i * width) / (numCircles - 1);
            const cy = Math.sin((i / numCircles) * Math.PI) * height * 0.2;
            const radius = circleRadius * (0.8 + Math.random() * 0.4);
            graphics.circle(cx, cy, radius);
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
        const defaultColor = 0x87CEEB; // Sky blue
        const color = this.themeConfig.backgroundColor
            ? this.hexToPixiColor(this.themeConfig.backgroundColor)
            : defaultColor;
        this.renderer.background.color = color;
    }

    renderWin() {
        const defaultColor = 0xFFD700; // Gold
        const color = this.themeConfig.winColor
            ? this.hexToPixiColor(this.themeConfig.winColor)
            : defaultColor;
        this.renderer.background.color = color;
    }

    renderLose() {
        const defaultColor = 0x778899; // Light slate gray
        const color = this.themeConfig.loseColor
            ? this.hexToPixiColor(this.themeConfig.loseColor)
            : defaultColor;
        this.renderer.background.color = color;
    }

    onResize(): void {
        // Reposition clouds if they're outside the new viewport
        for (const cloud of this.clouds) {
            if (cloud.y > this.renderer.height) {
                cloud.y = Math.random() * (this.renderer.height * 0.6);
            }
        }
    }
}
