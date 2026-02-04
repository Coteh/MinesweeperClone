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

    constructor(assetManager: AssetManager) {
        this.assetManager = assetManager;
        this.soundEffectsEnabled = true;
        this.soundEffectsVolume = 1.0; // Default to full volume
        this.setupAudioContextResumeHandlers();
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

    /**
     * Sets up event listeners to resume AudioContext when the page becomes visible again.
     * This is necessary for iOS PWAs where the AudioContext gets suspended when the app
     * goes to background and needs to be explicitly resumed.
     * NOTE: Might not need this anymore after https://github.com/goldfire/howler.js/pull/1770 is merged.
     */
    private setupAudioContextResumeHandlers() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.resumeAudioContext();
            }
        });
    }

    /**
     * Attempts to resume the AudioContext if it's not running.
     * If the AudioContext is already running, this is a no-op.
     */
    private resumeAudioContext() {
        if (Howler.ctx && Howler.ctx.state !== 'running') {
            Howler.ctx.resume().catch((err) => {
                console.warn('Failed to resume audio context:', err);
            });
        }
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
