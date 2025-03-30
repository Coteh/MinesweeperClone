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

    async loadAssets(assetsList: string[]) {
        this.loadingLabel.innerText = 'Loading Assets...';
        const progressElem = document.createElement('span');
        this.loadingLabel.appendChild(progressElem);
        this.parentElement.appendChild(this.loadingLabel);
        const imagesList = assetsList.filter((assetName) => {
            return ['.png', '.jpg', '.jpeg'].some((ext) => assetName.endsWith(ext));
        });
        const soundsList = assetsList.filter((assetName) => {
            return ['.mp3', '.ogg', '.wav'].some((ext) => assetName.endsWith(ext));
        });
        let totalImagesLoaded = 0;
        let totalSoundsLoaded = 0;
        const getTotalProgress = () => {
            return (totalImagesLoaded + totalSoundsLoaded) / assetsList.length;
        };
        try {
            await this.preloadImages(imagesList, (_progress: number, totalLoaded: number) => {
                totalImagesLoaded = totalLoaded;
                progressElem.innerText = Math.round(getTotalProgress() * 100) + '%';
            });
            await this.preloadSounds(soundsList, (_progress: number, totalLoaded: number) => {
                totalSoundsLoaded = totalLoaded;
                progressElem.innerText = Math.round(getTotalProgress() * 100) + '%';
            });
        } catch (e) {
            const animations = this.loaderElem.getAnimations();
            animations[0].pause();
            throw e;
        }
        this.parentElement.removeChild(this.loadingLabel);
    }

    preloadImages(
        imagesList: string[],
        onProgressCallback: (progress: number, totalLoaded: number) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            var loadedCount = 0;

            const onAssetLoaded = (url: string) => {
                loadedCount++;
                const progress = loadedCount / imagesList.length;
                console.log(
                    'Asset loaded: ' + url + ', Progress: ' + Math.round(progress * 100) + '%'
                );

                onProgressCallback(progress, loadedCount);

                if (loadedCount === imagesList.length) {
                    resolve();
                }
            };

            const onAssetLoadError = (url: string) => {
                loadedCount++;
                const progress = loadedCount / imagesList.length;
                console.error(
                    'Asset did not load: ' + url + ', Progress: ' + Math.round(progress * 100) + '%'
                );

                this.loadingLabel.innerText = 'Could not load asset: ' + url;
                this.loadingLabel.style.color = 'red';

                reject(new Error(`Could not load asset ${url}`));
            };

            imagesList.forEach((url) => {
                const fullUrl = import.meta.env.BASE_URL + url;
                this.loadingLabel.innerText = 'Loading Asset: ' + fullUrl;
                this.preloadImage(fullUrl).then(onAssetLoaded).catch(onAssetLoadError);
            });
        });
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

    preloadSounds(
        soundsList: string[],
        onProgressCallback: (progress: number, totalLoaded: number) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            var loadedCount = 0;

            const onAssetLoaded = (url: string) => {
                loadedCount++;
                const progress = loadedCount / soundsList.length;
                console.log(
                    'Asset loaded: ' + url + ', Progress: ' + Math.round(progress * 100) + '%'
                );

                onProgressCallback(progress, loadedCount);

                if (loadedCount === soundsList.length) {
                    resolve();
                }
            };

            const onAssetLoadError = (url: string) => {
                loadedCount++;
                const progress = loadedCount / soundsList.length;
                console.error(
                    'Asset did not load: ' + url + ', Progress: ' + Math.round(progress * 100) + '%'
                );

                this.loadingLabel.innerText = 'Could not load asset: ' + url;
                this.loadingLabel.style.color = 'red';

                reject(new Error(`Could not load asset ${url}`));
            };

            soundsList.forEach((url) => {
                const fullUrl = import.meta.env.BASE_URL + url;
                this.loadingLabel.innerText = 'Loading Asset: ' + fullUrl;
                this.preloadSound(fullUrl).then(onAssetLoaded).catch(onAssetLoadError);
            });
        });
    }

    preloadSound(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const sound = new Howl({
                src: [url],
            });
            this.sounds.set(url, sound);
            resolve(url);
        });
    }

    getImage(url: string): HTMLImageElement | undefined {
        const fullUrl = import.meta.env.BASE_URL + url;
        return this.images.get(fullUrl);
    }

    getSoundEffect(url: string): Howl | undefined {
        const fullUrl = import.meta.env.BASE_URL + url;
        return this.sounds.get(fullUrl);
    }
}
