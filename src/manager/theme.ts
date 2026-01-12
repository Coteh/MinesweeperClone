import * as config from '../config.json';
import { CLASSIC_THEME, BASIC_THEME } from '../consts';
import { BackgroundManager } from './background';
import type { AssetManager } from './asset';
import { Config, ThemeConfig } from '../config';

export type Theme = Extract<keyof typeof config.theme, string>;

// Overlay alpha for dialog dimming (matches .overlay-back opacity)
const OVERLAY_ALPHA = 0.3;

export class ThemeManager {
    private currentTheme: Theme;
    private selectableThemes: Theme[];
    private isDialogOpen: boolean = false;

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

    /**
     * Convert hex color to RGB format
     * @param hex - Hex color string (e.g., '#BBBBBB')
     * @returns RGB color string (e.g., 'rgb(187, 187, 187)')
     */
    private hexToRgb(hex: string): string {
        // Remove # if present
        hex = hex.replace(/^#/, '');
        
        // Parse hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Convert RGB color to hex format
     * @param rgb - RGB color string (e.g., 'rgb(187, 187, 187)')
     * @returns Hex color string (e.g., '#BBBBBB')
     */
    private rgbToHex(rgb: string): string {
        const match = rgb.match(/\d+/g);
        if (!match || match.length < 3) {
            console.warn(`ThemeManager: Failed to parse RGB color "${rgb}", falling back to #000000`);
            return '#000000';
        }
        
        const r = parseInt(match[0]);
        const g = parseInt(match[1]);
        const b = parseInt(match[2]);
        
        const toHex = (n: number) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Blend two colors together based on alpha transparency
     * @param overlayColor - The overlay color (e.g., 'rgb(0, 0, 0)')
     * @param backgroundColor - The background color (e.g., 'rgb(187, 187, 187)')
     * @param alpha - The alpha value of the overlay (0-1)
     * @returns The blended color in RGB format
     */
    private blendColors(overlayColor: string, backgroundColor: string, alpha: number): string {
        // Extract RGB components
        const overlayMatch = overlayColor.match(/\d+/g);
        const bgMatch = backgroundColor.match(/\d+/g);
        
        if (!overlayMatch || overlayMatch.length < 3 || !bgMatch || bgMatch.length < 3) {
            console.warn(`ThemeManager: Failed to parse colors for blending (overlay: "${overlayColor}", background: "${backgroundColor}"), using background as fallback`);
            return backgroundColor;
        }
        
        const overlay = overlayMatch.map(Number);
        const bg = bgMatch.map(Number);
        
        // Calculate the resulting RGB values using alpha compositing
        const r = Math.round(alpha * overlay[0] + (1 - alpha) * bg[0]);
        const g = Math.round(alpha * overlay[1] + (1 - alpha) * bg[1]);
        const b = Math.round(alpha * overlay[2] + (1 - alpha) * bg[2]);

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Update the meta theme-color tag in the document
     * @param color - The color to set (hex or rgb format)
     */
    private updateMetaThemeColor(color: string) {
        const metaTag = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
        if (metaTag) {
            metaTag.setAttribute('content', color);
        }
    }

    /**
     * Apply the normal (non-dimmed) theme color to the meta tag
     */
    applyNormalThemeColor() {
        this.isDialogOpen = false;
        const cfg = this.getThemeConfig(this.currentTheme);
        const themeColor = (cfg && cfg.metaThemeColor) || '#000';
        this.updateMetaThemeColor(themeColor);
    }

    /**
     * Apply the dimmed theme color (for when dialogs are open) to the meta tag
     */
    applyDimmedThemeColor() {
        this.isDialogOpen = true;
        const cfg = this.getThemeConfig(this.currentTheme);
        const normalColor = (cfg && cfg.metaThemeColor) || '#000';
        
        // Convert to RGB, blend with black overlay, convert back to hex
        const normalRgb = this.hexToRgb(normalColor);
        const overlayRgb = 'rgb(0, 0, 0)'; // Black overlay
        const blendedRgb = this.blendColors(overlayRgb, normalRgb, OVERLAY_ALPHA);
        const dimmedHex = this.rgbToHex(blendedRgb);
        
        this.updateMetaThemeColor(dimmedHex);
    }

    switchTheme(theme: Theme) {
        // Validate incoming theme and fallback to default
        if (!theme || !this.getSelectableThemes().includes(theme)) {
            theme = BASIC_THEME;
        }

        document.body.classList.remove(this.currentTheme);
        document.body.classList.add(theme);

        this.currentTheme = theme;
        
        // Update theme color based on dialog state
        if (this.isDialogOpen) {
            this.applyDimmedThemeColor();
        } else {
            this.applyNormalThemeColor();
        }
        
        const cfg = this.getThemeConfig(theme);
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
