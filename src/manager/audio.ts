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

const soundEffectsMap: { [theme in Theme]: { [soundEffect in SoundEffect]: string } } = {
    [BASIC_THEME]: {
        [SoundEffect.Click]: 'sound/Button click.wav',
        [SoundEffect.Explode]: 'sound/Explode.mp3',
        // TODO: Add new sound effects for these
        [SoundEffect.Reveal]: 'sound/Button click.wav',
        [SoundEffect.Flag]: 'sound/Button click.wav',
        [SoundEffect.Win]: 'sound/Button click.wav',
        [SoundEffect.ZoomIn]: 'sound/Button click.wav',
        [SoundEffect.ZoomOut]: 'sound/Button click.wav',
        [SoundEffect.ZoomReset]: 'sound/Button click.wav',
    },
    [OCEAN_THEME]: {
        [SoundEffect.Click]: 'sound/Button click.wav',
        [SoundEffect.Explode]: 'sound/Explode.mp3',
        // TODO: Add new sound effects for these
        [SoundEffect.Reveal]: 'sound/Button click.wav',
        [SoundEffect.Flag]: 'sound/Button click.wav',
        [SoundEffect.Win]: 'sound/Button click.wav',
        [SoundEffect.ZoomIn]: 'sound/Button click.wav',
        [SoundEffect.ZoomOut]: 'sound/Button click.wav',
        [SoundEffect.ZoomReset]: 'sound/Button click.wav',
    },
    [CLASSIC_THEME]: {
        [SoundEffect.Click]: 'sound/Button click.wav',
        [SoundEffect.Explode]: 'sound/Explode.mp3',
        // TODO: Add new sound effects for these
        [SoundEffect.Reveal]: 'sound/Button click.wav',
        [SoundEffect.Flag]: 'sound/Button click.wav',
        [SoundEffect.Win]: 'sound/Button click.wav',
        [SoundEffect.ZoomIn]: 'sound/Button click.wav',
        [SoundEffect.ZoomOut]: 'sound/Button click.wav',
        [SoundEffect.ZoomReset]: 'sound/Button click.wav',
    },
};

export class AudioManger {
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

    playSoundEffect(soundEffect: SoundEffect) {
        if (!this.soundEffectsEnabled) return;
        const currentTheme = this.themeManager.getCurrentTheme();
        const soundEffectName = soundEffectsMap[currentTheme][soundEffect];
        const sound = this.assetManager.getSoundEffect(soundEffectName);
        if (!sound) {
            throw new Error('Sound not loaded');
        }
        sound.play();
    }
}
