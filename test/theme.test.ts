import { jest, expect, describe, it, beforeEach, afterEach } from '@jest/globals';

// Mock the background module to avoid pulling in pixi.js in node environment
jest.mock('../src/manager/background', () => ({
    BackgroundManager: jest.fn(),
}));

import { ThemeManager } from '../src/manager/theme';
import { getThemeLabel } from '../src/config/index';
import type { Config, ThemeConfig } from '../src/config/index';

const normalColor = '#BBBBBB';
const winColor = '#2ECC71';
const loseColor = '#E74C3C';

// Computed dimmed normal color: blend of rgb(0,0,0) at alpha=0.5 over rgb(187,187,187)
// r=g=b = round(0.5*0 + 0.5*187) = 94 = 0x5e
const dimmedNormalColor = '#5e5e5e';

const mockGameConfig = {
    theme: {
        basic: {
            metaThemeColor: normalColor,
            winStatusBarColor: winColor,
            loseStatusBarColor: loseColor,
        },
    },
} as unknown as Config;

describe('ThemeManager status bar color', () => {
    let mockMetaTag: { setAttribute: ReturnType<typeof jest.fn> };
    let consoleWarnSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        mockMetaTag = {
            setAttribute: jest.fn(),
        };

        global.document = {
            querySelector: jest.fn((selector: string) => {
                if (selector === "meta[name='theme-color']") {
                    return mockMetaTag;
                }
                return null;
            }),
            documentElement: {
                style: {
                    setProperty: jest.fn(),
                    removeProperty: jest.fn(),
                },
            },
            body: {
                style: {},
                classList: {
                    remove: jest.fn(),
                    add: jest.fn(),
                },
            },
        } as unknown as Document;

        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    function createThemeManager(): ThemeManager {
        return new ThemeManager({} as never, {} as never, mockGameConfig);
    }

    it('should revert to normal theme color after win state when applyNormalThemeColor is called', () => {
        const themeManager = createThemeManager();

        themeManager.applyWinThemeColor();
        expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', winColor);

        themeManager.applyNormalThemeColor();
        expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', normalColor);
    });

    it('should revert to normal theme color after lose state when applyNormalThemeColor is called', () => {
        const themeManager = createThemeManager();

        themeManager.applyLoseThemeColor();
        expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', loseColor);

        themeManager.applyNormalThemeColor();
        expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', normalColor);
    });

    it('should apply normal theme color via applyCurrentThemeColor after applyNormalThemeColor resets game state', () => {
        const themeManager = createThemeManager();

        themeManager.applyWinThemeColor();
        themeManager.applyNormalThemeColor();

        // After resetting to normal, applyCurrentThemeColor should also apply normal color
        themeManager.applyCurrentThemeColor();
        expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', normalColor);
    });

    describe('applyNormalGameStateColor', () => {
        it('should apply normal theme color after win state when not dimmed', () => {
            const themeManager = createThemeManager();

            themeManager.applyWinThemeColor();
            expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', winColor);

            themeManager.applyNormalGameStateColor();
            expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', normalColor);
        });

        it('should apply normal theme color after lose state when not dimmed', () => {
            const themeManager = createThemeManager();

            themeManager.applyLoseThemeColor();
            expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', loseColor);

            themeManager.applyNormalGameStateColor();
            expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', normalColor);
        });

        it('should apply dimmed normal color after win state when dialog is open (dimmed)', () => {
            const themeManager = createThemeManager();

            // Simulate: player wins, then a dialog opens (dimming the status bar)
            themeManager.applyWinThemeColor();
            themeManager.applyDimmedColorForCurrentState();

            // Simulate: new game starts while dialog is still open
            themeManager.applyNormalGameStateColor();

            // Should apply the dimmed version of normal color, not the win color
            expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', dimmedNormalColor);
            expect(mockMetaTag.setAttribute).not.toHaveBeenLastCalledWith('content', winColor);
        });

        it('should apply dimmed normal color after lose state when dialog is open (dimmed)', () => {
            const themeManager = createThemeManager();

            // Simulate: player loses, then a dialog opens (dimming the status bar)
            themeManager.applyLoseThemeColor();
            themeManager.applyDimmedColorForCurrentState();

            // Simulate: new game starts while dialog is still open
            themeManager.applyNormalGameStateColor();

            // Should apply the dimmed version of normal color, not the lose color
            expect(mockMetaTag.setAttribute).toHaveBeenLastCalledWith('content', dimmedNormalColor);
            expect(mockMetaTag.setAttribute).not.toHaveBeenLastCalledWith('content', loseColor);
        });
    });
});

describe('getThemeLabel', () => {
    const baseConfig = {
        displayName: 'Basic',
        backgroundColor: '#BBBBBB',
        winColor: '#2ECC71',
        loseColor: '#E74C3C',
        highlightColor: '#FFFF00',
        metaThemeColor: '#BBBBBB',
        textColor: '#000000',
        tileBackground: '#BBBBBB',
        tileBorder: '#888888',
        standardBlockColor: '#808080',
        losingBlockColor: '#CC0000',
        blockRevealedColor: '#B3B3B3',
        mineText1: '#0099FF',
        mineText2: '#00FF00',
        mineText3: '#FF0000',
        mineText4: '#0000FF',
        mineText5: '#442200',
        mineText6: '#00FFFF',
        mineText7: '#000000',
        mineText8: '#858585',
    } as ThemeConfig;

    let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should return displayName when it is valid', () => {
        const config = { ...baseConfig, displayName: 'MinesweeperClone' };
        expect(getThemeLabel('classic', config)).toBe('MinesweeperClone');
    });

    it('should return capitalized key and log error when displayName is not a string (runtime safety)', () => {
        const config = { ...baseConfig, displayName: undefined as unknown as string };
        expect(getThemeLabel('classic', config)).toBe('Classic');
        expect(getThemeLabel('ocean', config)).toBe('Ocean');
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('must be a string'));
    });

    it('should return capitalized key and log error when displayName is empty string', () => {
        const config = { ...baseConfig, displayName: '' };
        expect(getThemeLabel('classic', config)).toBe('Classic');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('empty or whitespace-only'),
        );
    });

    it('should return capitalized key and log error when displayName is whitespace only', () => {
        const config = { ...baseConfig, displayName: '   ' };
        expect(getThemeLabel('ocean', config)).toBe('Ocean');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('empty or whitespace-only'),
        );
    });

    it('should return capitalized key and log error when displayName exceeds 30 characters', () => {
        const config = { ...baseConfig, displayName: 'A'.repeat(31) };
        expect(getThemeLabel('basic', config)).toBe('Basic');
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('exceeds 30'));
    });

    it('should return displayName when it is exactly 30 characters', () => {
        const config = { ...baseConfig, displayName: 'A'.repeat(30) };
        expect(getThemeLabel('basic', config)).toBe('A'.repeat(30));
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should return displayName as-is when it contains HTML-like characters (rendered via innerText)', () => {
        const config = { ...baseConfig, displayName: '<b>Bold</b>' };
        expect(getThemeLabel('basic', config)).toBe('<b>Bold</b>');
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should return capitalized key and log error when displayName is a non-string type', () => {
        const config = { ...baseConfig, displayName: 42 as unknown as string };
        expect(getThemeLabel('basic', config)).toBe('Basic');
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('must be a string'));
    });

    it('should trim whitespace from valid displayName', () => {
        const config = { ...baseConfig, displayName: '  MinesweeperClone  ' };
        expect(getThemeLabel('classic', config)).toBe('MinesweeperClone');
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('classic theme renders as MinesweeperClone when displayName is set', () => {
        const classicConfig = { ...baseConfig, displayName: 'MinesweeperClone' };
        expect(getThemeLabel('classic', classicConfig)).toBe('MinesweeperClone');
    });
});
