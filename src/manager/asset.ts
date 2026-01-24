import { Howl } from 'howler';

export class AssetManager {
    private parentElement: HTMLElement;
    private loadingLabel: HTMLElement;
    private loaderElem: HTMLElement;
    private images: Map<string, HTMLImageElement>;
    private sounds: Map<string, Howl>;

    constructor(parentElement: HTMLElement) {
        this.parentElement = parentElement;
        this.loadingLabel = document.createElement('div');
        this.loadingLabel.classList.add('loading-label');
        this.loaderElem = this.parentElement.querySelector('.loader') as HTMLElement;
        this.images = new Map<string, HTMLImageElement>();
        this.sounds = new Map<string, Howl>();
    }

    async loadAssets(assetMap: Record<string, string>) {
        // Show loading UI
        this.loadingLabel.innerText = 'Loading Assets...';
        const progressElem = document.createElement('span');
        this.loadingLabel.appendChild(progressElem);
        this.parentElement.appendChild(this.loadingLabel);

        const totalAssets = Object.keys(assetMap).length;
        let loadedCount = 0;

        const updateProgress = () => {
            const progress = loadedCount / totalAssets;
            progressElem.innerText = Math.round(progress * 100) + '%';
        };

        try {
            // Register assets with progress callback
            await this.registerAssets(assetMap, () => {
                loadedCount++;
                updateProgress();
            });
        } catch (e) {
            const animations = this.loaderElem.getAnimations();
            animations[0].pause();
            throw e;
        }

        this.parentElement.removeChild(this.loadingLabel);
    }

    async registerAssets(assetMap: Record<string, string>, onProgress?: () => void) {
        // assetMap: logicalKey -> resolved URL
        const imageEntries = Object.entries(assetMap).filter(([k]) =>
            ['.png', '.jpg', '.jpeg'].some((ext) => k.endsWith(ext))
        );
        const soundEntries = Object.entries(assetMap).filter(([k]) =>
            ['.mp3', '.ogg', '.wav'].some((ext) => k.endsWith(ext))
        );

        // Preload images
        for (const [key, url] of imageEntries) {
            if (this.images.has(key) || this.images.has(url)) {
                onProgress?.();
                continue;
            }
            await this.preloadImage(url);
            const img = this.images.get(url);
            if (img) {
                this.images.set(key, img);
            }
        }

        // Preload sounds
        for (const [key, url] of soundEntries) {
            if (this.sounds.has(key) || this.sounds.has(url)) {
                onProgress?.();
                continue;
            }
            await this.preloadSound(url);
            const snd = this.sounds.get(url);
            if (snd) {
                this.sounds.set(key, snd);
            }
        }
    }

    preloadImage(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(url, img);
                resolve(url);
            };
            img.onerror = () => {
                console.error('Error loading image: ' + url);
                reject(url);
            };
            img.src = url;
        });
    }

    preloadSound(url: string): Promise<string> {
        return new Promise((resolve) => {
            const sound = new Howl({
                src: [url],
            });
            this.sounds.set(url, sound);
            resolve(url);
        });
    }

    getImage(url: string): HTMLImageElement | undefined {
        // Try logical key first
        if (this.images.has(url)) return this.images.get(url);

        // Fallback: find any image whose key ends with the requested url
        const found = Array.from(this.images.entries()).find(([k]) => k.endsWith(url));
        if (found) {
            return found[1];
        }

        console.warn('getImage: asset not found for', url);
        return undefined;
    }

    getSoundEffect(url: string): Howl | undefined {
        // Try logical key first
        if (this.sounds.has(url)) return this.sounds.get(url);

        // Fallback: find any sound whose key ends with the requested url
        const found = Array.from(this.sounds.entries()).find(([k]) => k.endsWith(url));
        return found?.[1];
    }

    /**
     * Apply asset manager URLs to all elements with data-asset attributes within the given root element.
     * @param rootElement The root element to search within (defaults to document)
     */
    applyDataAssets(rootElement: HTMLElement | Document = document): void {
        const assets = rootElement.querySelectorAll('[data-asset]');
        assets.forEach((el) => {
            if (el instanceof HTMLImageElement) {
                const key = el.getAttribute('data-asset') || '';
                const img = this.getImage(key);
                if (img) {
                    el.src = img.src;
                }
            }
        });
    }
}
