import { CLASSIC_THEME, OCEAN_THEME, BASIC_THEME } from '../consts';
import { BackgroundManager } from './background';

export type Theme = typeof BASIC_THEME | typeof OCEAN_THEME | typeof CLASSIC_THEME;

export const SELECTABLE_THEMES = [BASIC_THEME, OCEAN_THEME, CLASSIC_THEME];

export class ThemeManager {
    private currentTheme: Theme;
    private backgroundManager: BackgroundManager;

    constructor(backgroundManager: BackgroundManager) {
        this.currentTheme = BASIC_THEME;
        this.backgroundManager = backgroundManager;
    }

    getCurrentTheme(): Theme {
        return this.currentTheme;
    }

    switchTheme(theme: Theme) {
        if (!theme || !SELECTABLE_THEMES.includes(theme)) {
            theme = BASIC_THEME;
        }
        document.body.classList.remove(this.currentTheme);
        if (theme !== CLASSIC_THEME) {
            document.body.classList.add(theme);
        }
        let themeColor = '#000';
        switch (theme) {
            case OCEAN_THEME:
                themeColor = '#1E3A5F';
                break;
            case CLASSIC_THEME:
                themeColor = '#888888';
                break;
            case BASIC_THEME:
                themeColor = '#BBBBBB';
                break;
        }
        (document.querySelector("meta[name='theme-color']") as HTMLMetaElement).setAttribute(
            'content',
            themeColor
        );
        this.currentTheme = theme;
        this.backgroundManager.switchTheme(theme);
    }
}
