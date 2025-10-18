import { BASIC_THEME, CLASSIC_THEME, OCEAN_THEME } from '../consts';
import { AssetManager } from './asset';
import { ThemeManager, Theme } from './theme';

export enum SoundEffect {
    Click,
    Explode,
    Reveal,
    Flag,
    Win,
    ZoomIn,
    ZoomOut,
    ZoomReset,
}

export type SoundSettings = {
    volume?: number;
    seconds?: number;
};

const soundEffectsMap: { [theme in Theme]: { [soundEffect in SoundEffect]: string } } = {
    [BASIC_THEME]: {
        [SoundEffect.Click]: 'sound/Button click.wav',
        [SoundEffect.Explode]: 'sound/Explode.mp3',
        [SoundEffect.Reveal]: 'sound/Tile click.wav',
        [SoundEffect.Flag]: 'sound/Flag.wav',
        [SoundEffect.Win]: 'sound/Win.wav',
        // TODO: Add new sound effects for these
        [SoundEffect.ZoomIn]: 'sound/Button click.wav',
        [SoundEffect.ZoomOut]: 'sound/Button click.wav',
        [SoundEffect.ZoomReset]: 'sound/Button click.wav',
    },
    // TODO: Add new sound effects for this theme
    [OCEAN_THEME]: {
        [SoundEffect.Click]: 'sound/Button click.wav',
        [SoundEffect.Explode]: 'sound/Explode.mp3',
        [SoundEffect.Reveal]: 'sound/Tile click.wav',
        [SoundEffect.Flag]: 'sound/Flag.wav',
        [SoundEffect.Win]: 'sound/Win.wav',
        [SoundEffect.ZoomIn]: 'sound/Button click.wav',
        [SoundEffect.ZoomOut]: 'sound/Button click.wav',
        [SoundEffect.ZoomReset]: 'sound/Button click.wav',
    },
    // TODO: Add new sound effects for this theme
    [CLASSIC_THEME]: {
        [SoundEffect.Click]: 'sound/Button click.wav',
        [SoundEffect.Explode]: 'sound/Explode.mp3',
        [SoundEffect.Reveal]: 'sound/Tile click.wav',
        [SoundEffect.Flag]: 'sound/Flag.wav',
        [SoundEffect.Win]: 'sound/Win.wav',
        [SoundEffect.ZoomIn]: 'sound/Button click.wav',
        [SoundEffect.ZoomOut]: 'sound/Button click.wav',
        [SoundEffect.ZoomReset]: 'sound/Button click.wav',
    },
};

export class AudioManager {
    private assetManager: AssetManager;
    private themeManager: ThemeManager;

    private soundEffectsEnabled: boolean;

    constructor(assetManager: AssetManager, themeManager: ThemeManager) {
        this.assetManager = assetManager;
        this.themeManager = themeManager;
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
        const currentTheme = this.themeManager.getCurrentTheme();
        const soundEffectName = soundEffectsMap[currentTheme][soundEffect];
        const sound = this.assetManager.getSoundEffect(soundEffectName);
        if (!sound) {
            console.error('Sound not loaded');
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
