/// <reference types="cypress" />
import * as config from '../../../src/config.json';

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
        cy.get('body').should('have.attr', 'class', '');

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
            (config as any).theme['ocean'].metaThemeColor
        );
    });
});
