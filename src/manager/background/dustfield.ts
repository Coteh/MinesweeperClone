import { Renderer, Container, Graphics, Ticker } from 'pixi.js';
import { BackgroundTheme } from '.';

interface DustParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    targetAlpha: number;
    fadeSpeed: number;
}

export class DustFieldTheme implements BackgroundTheme {
    private renderer: Renderer<HTMLCanvasElement>;
    private background: Container;
    private particles: DustParticle[] = [];
    private dustGraphics: Graphics;
    private lastSpawnTime: number = 0;
    private spawnInterval: number = 800; // milliseconds
    private updateParticlesBound: () => void;

    constructor(renderer: Renderer<HTMLCanvasElement>, background: Container) {
        this.renderer = renderer;
        this.background = background;
        this.dustGraphics = new Graphics();
        this.updateParticlesBound = this.updateParticles.bind(this);

        this.initialize();
    }

    initialize() {
        this.background.addChild(this.dustGraphics);

        // Create initial dust particles
        for (let i = 0; i < 15; i++) {
            this.createParticle(Math.random() * this.renderer.width);
        }

        Ticker.shared.add(this.updateParticlesBound);
    }

    private createParticle(x?: number) {
        const particle: DustParticle = {
            x: x !== undefined ? x : -50,
            y: Math.random() * this.renderer.height,
            vx: 0.3 + Math.random() * 0.5,
            vy: (Math.random() - 0.5) * 0.2,
            size: 30 + Math.random() * 60,
            alpha: 0,
            targetAlpha: 0.25 + Math.random() * 0.35,
            fadeSpeed: 0.001 + Math.random() * 0.002,
        };
        this.particles.push(particle);
    }

    private updateParticles() {
        const currentTime = Date.now();

        // Spawn new particles at intervals
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.createParticle();
            this.lastSpawnTime = currentTime;
        }

        this.dustGraphics.clear();

        // Update and draw each particle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // Update alpha (fade in/out)
            if (p.alpha < p.targetAlpha) {
                p.alpha = Math.min(p.alpha + p.fadeSpeed, p.targetAlpha);
            } else if (p.x > this.renderer.width * 0.8) {
                p.alpha = Math.max(0, p.alpha - p.fadeSpeed * 2);
            }

            // Remove particles that are off-screen or fully faded
            if (p.x > this.renderer.width + 100 || p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            // Draw particle as a soft ellipse with darker tan/brown color
            this.dustGraphics.fill({ color: 0xa68860, alpha: p.alpha });
            this.dustGraphics.ellipse(p.x, p.y, p.size * 1.5, p.size);
        }
    }

    renderInitial() {
        this.renderer.background.color = 0xb8956a;
    }

    renderWin() {
        this.renderer.background.color = 0x2ecc71;
    }

    renderLose() {
        this.renderer.background.color = 0xe74c3c;
    }

    onResize(): void {
        // Particles will naturally adjust to new screen dimensions
    }
}
