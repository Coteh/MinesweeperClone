import { AssetManager } from './asset';
import { Howler } from 'howler';

export enum SoundEffect {
    Click = 'click',
    Explode = 'explode',
    Reveal = 'reveal',
    Flag = 'flag',
    Win = 'win',
    ZoomIn = 'zoom-in',
    ZoomOut = 'zoom-out',
    ZoomReset = 'zoom-reset',
}

export type SoundSettings = {
    volume?: number;
    seek?: number;
};

const soundEffectsMap: Record<SoundEffect, string> = {
    [SoundEffect.Click]: 'click',
    [SoundEffect.Explode]: 'explode',
    [SoundEffect.Reveal]: 'reveal',
    [SoundEffect.Flag]: 'flag',
    [SoundEffect.Win]: 'win',
    // TODO: Add new sound effects for these
    [SoundEffect.ZoomIn]: 'click',
    [SoundEffect.ZoomOut]: 'click',
    [SoundEffect.ZoomReset]: 'click',
};

export class AudioManager {
    private assetManager: AssetManager;

    private soundEffectsEnabled: boolean;
    private soundEffectsVolume: number;
    private visibilityChangeListener: (() => void) | null = null;

    constructor(assetManager: AssetManager) {
        this.assetManager = assetManager;
        this.soundEffectsEnabled = true;
        this.soundEffectsVolume = 1.0; // Default to full volume

        // Listen for visibility changes to resume audio context on iOS PWA
        this.setupVisibilityChangeListener();
    }

    /**
     * Set up listener for page visibility changes.
     * This is crucial for iOS PWAs where audio context gets suspended when backgrounded.
     */
    private setupVisibilityChangeListener() {
        // Only set up the listener if running in a browser environment
        if (typeof document !== 'undefined') {
            this.visibilityChangeListener = () => {
                if (!document.hidden && Howler.ctx) {
                    // Resume the audio context when the page becomes visible
                    // This is specifically needed for iOS PWAs where the audio context
                    // remains suspended after returning from background
                    if (Howler.ctx.state === 'suspended') {
                        Howler.ctx.resume();
                    }
                }
            };
            document.addEventListener('visibilitychange', this.visibilityChangeListener);
        }
    }

    /**
     * Clean up resources and remove event listeners.
     * Call this when the AudioManager is no longer needed to prevent memory leaks.
     */
    destroy() {
        if (this.visibilityChangeListener && typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.visibilityChangeListener);
            this.visibilityChangeListener = null;
        }
    }

    isSoundEffectsEnabled() {
        return this.soundEffectsEnabled;
    }

    toggleSoundEffects(enabled?: boolean) {
        if (typeof enabled !== 'undefined') {
            this.soundEffectsEnabled = enabled;
            return;
        }
        this.soundEffectsEnabled = !this.soundEffectsEnabled;
    }

    getSoundEffectsVolume() {
        return this.soundEffectsVolume;
    }

    setSoundEffectsVolume(volume: number) {
        // Clamp volume between 0 and 1
        this.soundEffectsVolume = Math.max(0, Math.min(1, volume));
    }

    playSoundEffect(soundEffect: SoundEffect, settings?: SoundSettings) {
        if (!this.soundEffectsEnabled) return;

        const soundEffectName = soundEffectsMap[soundEffect];
        const extensions = ['.wav', '.mp3', '.ogg'];

        let sound;
        for (const ext of extensions) {
            sound = this.assetManager.getSoundEffect(`sound/${soundEffectName}${ext}`);
            if (sound) break;
        }

        if (!sound) {
            console.error('Sound not loaded:', soundEffectName);
            return;
        }

        // Calculate final volume
        let finalVolume = this.soundEffectsVolume;

        if (typeof settings !== 'undefined') {
            if (typeof settings.seek !== 'undefined') {
                sound.seek(settings.seek);
            }
            if (typeof settings.volume !== 'undefined') {
                // Apply both the per-sound volume and the global volume
                finalVolume = settings.volume * this.soundEffectsVolume;
            }
        }

        sound.volume(finalVolume);
        sound.play();
    }
}
