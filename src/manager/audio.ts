import { AssetManager } from './asset';

export enum SoundEffect {
    Click = "click",
    Explode = "explode",
    Reveal = "reveal",
    Flag = "flag",
    Win = "win",
    ZoomIn = "zoom-in",
    ZoomOut = "zoom-out",
    ZoomReset = "zoom-reset",
}

export type SoundSettings = {
    volume?: number;
    seconds?: number;
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

    constructor(assetManager: AssetManager) {
        this.assetManager = assetManager;
        this.soundEffectsEnabled = true;
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
        
        if (typeof settings !== 'undefined') {
            if (typeof settings.seconds !== 'undefined') {
                sound.seek(settings.seconds);
            }
            if (typeof settings.volume !== 'undefined') {
                sound.volume(settings.volume);
            }
        }
        sound.play();
    }
}
