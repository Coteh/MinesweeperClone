import { savePreferenceValue } from '../preferences';

export class FullscreenManager {
    private isFullscreen: boolean = false;

    constructor() {}

    public isFullscreenEnabled() {
        return this.isFullscreen;
    }

    public toggleFullscreen(fullscreen?: boolean) {
        if (typeof fullscreen === 'undefined') {
            fullscreen = !this.isFullscreen;
        }
        if (fullscreen) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            }
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        }
        this.isFullscreen = fullscreen;
        this.saveFullscreenPreference(this.isFullscreen);
    }

    public setFullscreenPreference(fullscreen: boolean) {
        this.isFullscreen = fullscreen;
        this.saveFullscreenPreference(fullscreen);
    }

    private saveFullscreenPreference(fullscreen: boolean) {
        savePreferenceValue('fullscreen', fullscreen ? 'enabled' : 'disabled');
    }
}
