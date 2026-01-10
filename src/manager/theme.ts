import * as config from '../config.json';
import { CLASSIC_THEME, BASIC_THEME } from '../consts';
import { BackgroundManager } from './background';
import type { AssetManager } from './asset';
import { Config, ThemeConfig } from '../config';

export type Theme = Extract<keyof typeof config.theme, string>;

export class ThemeManager {
    private currentTheme: Theme;
    private selectableThemes: Theme[];

    private backgroundManager: BackgroundManager;
    private assetManager: AssetManager;
    private gameConfig: Config;

    constructor(
        backgroundManager: BackgroundManager,
        assetManager: AssetManager,
        gameConfig: Config
    ) {
        this.selectableThemes = Object.keys(gameConfig.theme) as Theme[];
        this.currentTheme =
            this.selectableThemes.length > 0 ? this.selectableThemes[0] : BASIC_THEME;
        this.backgroundManager = backgroundManager;
        this.assetManager = assetManager;
        this.gameConfig = gameConfig;
    }

    getCurrentTheme(): Theme {
        return this.currentTheme;
    }

    getSelectableThemes(): Theme[] {
        return this.selectableThemes;
    }

    getThemeConfig(theme: Theme): ThemeConfig {
        return this.gameConfig.theme[theme] || {};
    }

    private updateThemeVariables(themeConfig: ThemeConfig) {
        // Set checkbox assets for classic theme knobs
        const checkboxUnchecked = this.assetManager.getImage('img/Checkbox_unchecked.png');
        const checkboxChecked = this.assetManager.getImage('img/Checkbox_checked.png');

        if (checkboxUnchecked) {
            document.documentElement.style.setProperty(
                '--checkbox-unchecked-url',
                `url(${checkboxUnchecked.src})`
            );
        }

        if (checkboxChecked) {
            document.documentElement.style.setProperty(
                '--checkbox-checked-url',
                `url(${checkboxChecked.src})`
            );
        }

        // Set color CSS custom properties from theme config
        if (themeConfig.standardBlockColor) {
            document.documentElement.style.setProperty(
                '--standard-block-color',
                themeConfig.standardBlockColor
            );
        } else {
            document.documentElement.style.removeProperty('--standard-block-color');
        }
        if (themeConfig.losingBlockColor) {
            document.documentElement.style.setProperty(
                '--losing-block-color',
                themeConfig.losingBlockColor
            );
        } else {
            document.documentElement.style.removeProperty('--losing-block-color');
        }
        if (themeConfig.blockRevealedColor) {
            document.documentElement.style.setProperty(
                '--block-revealed-color',
                themeConfig.blockRevealedColor
            );
        } else {
            document.documentElement.style.removeProperty('--block-revealed-color');
        }
        if (themeConfig.mineText1) {
            document.documentElement.style.setProperty('--mine-text-1', themeConfig.mineText1);
        } else {
            document.documentElement.style.removeProperty('--mine-text-1');
        }
        if (themeConfig.mineText2) {
            document.documentElement.style.setProperty('--mine-text-2', themeConfig.mineText2);
        } else {
            document.documentElement.style.removeProperty('--mine-text-2');
        }
        if (themeConfig.mineText3) {
            document.documentElement.style.setProperty('--mine-text-3', themeConfig.mineText3);
        } else {
            document.documentElement.style.removeProperty('--mine-text-3');
        }
        if (themeConfig.mineText4) {
            document.documentElement.style.setProperty('--mine-text-4', themeConfig.mineText4);
        } else {
            document.documentElement.style.removeProperty('--mine-text-4');
        }
        if (themeConfig.mineText5) {
            document.documentElement.style.setProperty('--mine-text-5', themeConfig.mineText5);
        } else {
            document.documentElement.style.removeProperty('--mine-text-5');
        }
        if (themeConfig.mineText6) {
            document.documentElement.style.setProperty('--mine-text-6', themeConfig.mineText6);
        } else {
            document.documentElement.style.removeProperty('--mine-text-6');
        }
        if (themeConfig.mineText7) {
            document.documentElement.style.setProperty('--mine-text-7', themeConfig.mineText7);
        } else {
            document.documentElement.style.removeProperty('--mine-text-7');
        }
        if (themeConfig.mineText8) {
            document.documentElement.style.setProperty('--mine-text-8', themeConfig.mineText8);
        } else {
            document.documentElement.style.removeProperty('--mine-text-8');
        }
    }

    switchTheme(theme: Theme) {
        // Validate incoming theme and fallback to default
        if (!theme || !this.getSelectableThemes().includes(theme)) {
            theme = BASIC_THEME;
        }

        document.body.classList.remove(this.currentTheme);
        document.body.classList.add(theme);

        const cfg = this.getThemeConfig(theme);
        const themeColor = (cfg && cfg.metaThemeColor) || '#000';
        (document.querySelector("meta[name='theme-color']") as HTMLMetaElement).setAttribute(
            'content',
            themeColor
        );

        this.currentTheme = theme;
        this.backgroundManager.switchTheme(theme, cfg);

        // Reload theme assets asynchronously (non-blocking)
        (async () => {
            try {
                const mod = await import('./theme-assets');
                const { getThemeAssets } = mod;
                const assetsMap = getThemeAssets(theme);
                await this.assetManager.registerAssets(assetsMap);

                // Re-apply assets to all data-asset elements
                this.assetManager.applyDataAssets();

                // Update CSS custom properties for theme-specific assets and colors
                this.updateThemeVariables(cfg);
            } catch (e) {
                console.error('Failed to reload theme assets', e);
            }
        })();
    }
}
