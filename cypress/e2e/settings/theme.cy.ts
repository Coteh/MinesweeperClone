/// <reference types="cypress" />
import * as configData from '../../../src/config.json';
import type { Config } from '../../../src/config';

const config = configData as Config;

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
};

// Helper function to calculate dimmed color
const calculateDimmedColor = (normalHex: string, overlayAlpha: number = 0.5): string => {
    const normal = hexToRgb(normalHex);
    const overlay = { r: 0, g: 0, b: 0 }; // Black overlay

    const r = Math.round(overlayAlpha * overlay.r + (1 - overlayAlpha) * normal.r);
    const g = Math.round(overlayAlpha * overlay.g + (1 - overlayAlpha) * normal.g);
    const b = Math.round(overlayAlpha * overlay.b + (1 - overlayAlpha) * normal.b);

    const toHex = (n: number) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

describe('Theme Selector', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.waitForGameReady();
    });

    it('should change the theme when a new theme is selected', () => {
        cy.get('.settings-link').click();

        cy.selectTheme('ocean');
        cy.get('body').should('have.class', 'ocean');

        cy.selectTheme('classic');
        cy.get('body').should('have.attr', 'class', 'classic');

        cy.selectTheme('basic');
        cy.get('body').should('have.class', 'basic');
    });

    it('should load the stored theme upon game load', () => {
        cy.visit('/', {
            onBeforeLoad: (win) => {
                const preferences = {
                    theme: 'ocean',
                };
                win.localStorage.setItem('preferences', JSON.stringify(preferences));
            },
        });
        cy.waitForGameReady();
        cy.get('body').should('have.class', 'ocean');
        // meta theme color should be set from config
        cy.get("meta[name='theme-color']").should(
            'have.attr',
            'content',
            config.theme['ocean'].metaThemeColor
        );
    });

    it('should apply dimmed theme color when settings dialog is opened', () => {
        // Get the normal theme color for basic theme
        const normalColor = config.theme['basic'].metaThemeColor;
        const expectedDimmedColor = calculateDimmedColor(normalColor);

        // Initially should have normal color
        cy.get("meta[name='theme-color']").should('have.attr', 'content', normalColor);

        // Open settings dialog
        cy.get('.settings-link').click();

        // Should now have dimmed color
        cy.get("meta[name='theme-color']").should('have.attr', 'content', expectedDimmedColor);
    });

    it('should restore normal theme color when dialog is closed', () => {
        const normalColor = config.theme['basic'].metaThemeColor;
        const expectedDimmedColor = calculateDimmedColor(normalColor);

        // Open dialog
        cy.get('.settings-link').click();
        cy.get("meta[name='theme-color']").should('have.attr', 'content', expectedDimmedColor);

        // Close dialog by clicking close button
        cy.get('.dialog button.close').click();

        // Should restore normal color
        cy.get("meta[name='theme-color']").should('have.attr', 'content', normalColor);
    });

    it('should apply dimmed color for the new theme when switching themes with dialog open', () => {
        // Open settings dialog
        cy.get('.settings-link').click();

        // Switch to ocean theme
        cy.selectTheme('ocean');

        const oceanNormalColor = config.theme['ocean'].metaThemeColor;
        const expectedOceanDimmedColor = calculateDimmedColor(oceanNormalColor);

        // Should have dimmed ocean color immediately
        cy.get("meta[name='theme-color']").should('have.attr', 'content', expectedOceanDimmedColor);
    });

    it('should show normal color for new theme after closing dialog following theme switch', () => {
        // Open settings dialog
        cy.get('.settings-link').click();

        // Switch to classic theme
        cy.selectTheme('classic');

        const classicNormalColor = config.theme['classic'].metaThemeColor;
        const expectedClassicDimmedColor = calculateDimmedColor(classicNormalColor);

        // Should have dimmed color while dialog is open
        cy.get("meta[name='theme-color']").should(
            'have.attr',
            'content',
            expectedClassicDimmedColor
        );

        // Close dialog
        cy.get('.dialog button.close').click();

        // Should show normal classic color
        cy.get("meta[name='theme-color']").should('have.attr', 'content', classicNormalColor);
    });

    it('should apply dimmed theme color when help dialog is opened', () => {
        const normalColor = config.theme['basic'].metaThemeColor;
        const expectedDimmedColor = calculateDimmedColor(normalColor);

        // Open help dialog
        cy.get('.help-link').click();

        // Should have dimmed color
        cy.get("meta[name='theme-color']").should('have.attr', 'content', expectedDimmedColor);

        // Close dialog
        cy.get('.dialog button.close').click();

        // Should restore normal color
        cy.get("meta[name='theme-color']").should('have.attr', 'content', normalColor);
    });

    it('should verify color blending calculation accuracy', () => {
        // Test the dimming calculation for different theme colors
        const themes = ['basic', 'ocean', 'classic'];

        themes.forEach((themeName) => {
            const themeConfig = config.theme[themeName];
            if (themeConfig && themeConfig.metaThemeColor) {
                const normalColor = themeConfig.metaThemeColor;
                const expectedDimmedColor = calculateDimmedColor(normalColor);

                // Verify that the calculated dimmed color is darker than normal
                const normalRgb = hexToRgb(normalColor);
                const dimmedRgb = hexToRgb(expectedDimmedColor);

                // Each RGB component should be darker (smaller) or equal
                expect(dimmedRgb.r).to.be.lte(normalRgb.r);
                expect(dimmedRgb.g).to.be.lte(normalRgb.g);
                expect(dimmedRgb.b).to.be.lte(normalRgb.b);

                // At least one component should be darker (since we're applying a 50% black overlay)
                const isDarker =
                    dimmedRgb.r < normalRgb.r ||
                    dimmedRgb.g < normalRgb.g ||
                    dimmedRgb.b < normalRgb.b;
                expect(isDarker).to.be.true;
            }
        });
    });

    it('should restore normal theme color when overlay is clicked', () => {
        const normalColor = config.theme['basic'].metaThemeColor;
        const expectedDimmedColor = calculateDimmedColor(normalColor);

        // Open dialog
        cy.get('.settings-link').click();
        cy.get("meta[name='theme-color']").should('have.attr', 'content', expectedDimmedColor);

        // Close dialog by clicking overlay
        cy.get('.overlay-back').click('left');

        // Should restore normal color
        cy.get("meta[name='theme-color']").should('have.attr', 'content', normalColor);
    });

    it('should set body background color for iOS 26+ compatibility', () => {
        const normalColor = config.theme['basic'].metaThemeColor;

        // Body background should match meta theme color
        cy.get('body').should(
            'have.css',
            'background-color',
            `rgb(${hexToRgb(normalColor).r}, ${hexToRgb(normalColor).g}, ${
                hexToRgb(normalColor).b
            })`
        );
    });

    it('should update body background color when dialog is opened and closed', () => {
        const normalColor = config.theme['basic'].metaThemeColor;
        const expectedDimmedColor = calculateDimmedColor(normalColor);

        // Initially body background should be normal color
        const normalRgb = hexToRgb(normalColor);
        cy.get('body').should(
            'have.css',
            'background-color',
            `rgb(${normalRgb.r}, ${normalRgb.g}, ${normalRgb.b})`
        );

        // Open dialog
        cy.get('.settings-link').click();

        // Body background should be dimmed
        const dimmedRgb = hexToRgb(expectedDimmedColor);
        cy.get('body').should(
            'have.css',
            'background-color',
            `rgb(${dimmedRgb.r}, ${dimmedRgb.g}, ${dimmedRgb.b})`
        );

        // Close dialog
        cy.get('.dialog button.close').click();

        // Body background should be restored to normal
        cy.get('body').should(
            'have.css',
            'background-color',
            `rgb(${normalRgb.r}, ${normalRgb.g}, ${normalRgb.b})`
        );
    });

    it('should update body background color when switching themes', () => {
        // Switch to ocean theme
        cy.get('.settings-link').click();
        cy.selectTheme('ocean');

        const oceanColor = config.theme['ocean'].metaThemeColor;
        const oceanRgb = hexToRgb(oceanColor);

        // Close dialog to see the normal ocean color
        cy.get('.dialog button.close').click();

        // Body background should match ocean theme color
        cy.get('body').should(
            'have.css',
            'background-color',
            `rgb(${oceanRgb.r}, ${oceanRgb.g}, ${oceanRgb.b})`
        );
    });
});
