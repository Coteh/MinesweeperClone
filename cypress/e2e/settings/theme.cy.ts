/// <reference types="cypress" />

describe('Theme Selector', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.waitForGameReady();
    });

    it('should change the theme when a new theme is selected', () => {
        cy.get('.settings-link').click();
        cy.get('#theme-selector').select('ocean');
        cy.get('body').should('have.class', 'ocean');

        cy.get('#theme-selector').select('classic');
        cy.get('body').should('have.attr', 'class', '');

        cy.get('#theme-selector').select('basic');
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
    });
});
