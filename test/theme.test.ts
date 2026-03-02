import { jest, expect, describe, it, beforeEach } from '@jest/globals';

// Mock the background module to avoid pulling in pixi.js in node environment
jest.mock('../src/manager/background', () => ({
    BackgroundManager: jest.fn(),
}));

import { ThemeManager } from '../src/manager/theme';
import type { Config } from '../src/config';

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
