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
     * Sets up event listeners to recover audio after iOS suspends the AudioContext when
     * the user switches to a native app (e.g. tapping a link that opens the GitHub app).
     *
     * The problem: when a native app takes focus, iOS suspends the WebAudio AudioContext.
     * Howler's play() check is `Howler.state === 'running' && ctx.state !== 'interrupted'`.
     * Since iOS reports the suspended context as 'suspended' (not 'interrupted'), Howler
     * sees this as fine and tries to play immediately on a suspended context. The buffer
     * source starts but never produces audio; the end timer fires and the sound is dropped.
     *
     * The fix: on the first user gesture after the page was hidden, override Howler's
     * internal state to 'suspended' so that its _autoResume() takes the correct code path:
     * it resumes the AudioContext and emits the 'resume' event that pending sounds wait on.
     * NOTE: This workaround can be removed if https://github.com/goldfire/howler.js/pull/1770
     * is ever merged and released.
     */
    private setupAudioContextResumeHandlers() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.needsAudioResume = true;
            }
        });

        const resumeOnInteraction = () => {
            if (!this.needsAudioResume) return;
            this.needsAudioResume = false;

            const ctx = Howler.ctx;
            if (!ctx || ctx.state === 'running') return;

            // Force Howler's internal state to 'suspended' so _autoResume() takes the
            // branch that calls ctx.resume() and emits 'resume' to all queued Howl sounds.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Howler as any).state = 'suspended';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Howler as any)._autoResume();
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
