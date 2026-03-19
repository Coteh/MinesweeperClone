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
    private needsAudioResume: boolean = false;

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
     * Recovers audio after iOS suspends the AudioContext when the user switches to a
     * native app. iOS sets ctx.state to 'suspended' but Howler has no listener for
     * external state changes, so Howler.state stays 'running'. This mismatch causes
     * _autoResume() to no-op and play() to fire immediately on a dead context, silently
     * dropping sounds.
     *
     * Fix: on the first gesture after returning, sync Howler.state to 'suspended' so
     * _autoResume() takes the branch that calls ctx.resume() and emits 'resume' to all
     * Howls — including any already-playing sounds like looping background music.
     *
     * NOTE: Remove if https://github.com/goldfire/howler.js/pull/1770 is ever merged.
     */
    private setupAudioContextResumeHandlers() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.needsAudioResume = true;
            }
        });

        const resumeOnInteraction = () => {
            if (!this.needsAudioResume) return;

            const ctx = Howler.ctx;
            if (!ctx || ctx.state === 'running') {
                this.needsAudioResume = false;
                return;
            }

            type HowlerInternals = { state?: string; _autoResume?: () => void };
            const howler = Howler as unknown as HowlerInternals;

            if ('state' in howler && typeof howler._autoResume === 'function') {
                // Sync Howler's internal state to match the real AudioContext state so that
                // _autoResume() enters the branch that calls ctx.resume() and emits 'resume'.
                howler.state = 'suspended';
                howler._autoResume();
                this.needsAudioResume = false;
            } else {
                // Howler internals unavailable; fall back to resuming the AudioContext directly.
                ctx.resume()
                    .then(() => {
                        this.needsAudioResume = false;
                    })
                    .catch((err) => {
                        console.warn('Failed to resume audio context:', err);
                    });
            }
        };

        document.addEventListener('touchstart', resumeOnInteraction, { passive: true });
        document.addEventListener('click', resumeOnInteraction);
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
