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
});
