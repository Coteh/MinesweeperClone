/// <reference types="cypress" />

context('settings JSON integration', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {
                // keep default localStorage values minimal
            },
        });
        cy.waitForGameReady();
    });

    it('populates difficulty dropdown from config.json and applies values', () => {
        cy.get('.settings-link').click();

        // Check that dropdown options match config.json display names
        cy.fixture('config.json').then((settings) => {
            const keys = Object.keys(settings.difficulty);
            // +1 for the "Custom..." option appended at the end
            cy.get('#difficulty-selector')
                .find('option')
                .should('have.length', keys.length + 1);
            keys.forEach((k: string) => {
                const displayName = settings.difficulty[k].displayName;
                cy.get('#difficulty-selector')
                    .find('option[value="' + k + '"]')
                    .should('contain', displayName);
            });

            // Change to medium and verify board dimensions
            if (settings.difficulty.medium) {
                cy.selectDifficulty('medium');
                cy.get('.overlay-back').click('left');

                // Verify board changed (16x16)
                cy.get('.game-board > .row').eq(0).children().should('have.length', 16);
                cy.get('.game-board > .row').should('have.length', 16);
            }
        });
    });

    it('should populate the theme selector from config', () => {
        cy.get('.settings-link').click();
        // Check that theme options use the label if present, otherwise the capitalized key
        cy.fixture('config.json').then((config) => {
            Object.keys(config.theme).forEach((theme) => {
                const themeEntry = config.theme[theme];
                const expectedLabel =
                    themeEntry.label && themeEntry.label.trim().length > 0
                        ? themeEntry.label.trim()
                        : theme.charAt(0).toUpperCase() + theme.slice(1);
                cy.get(`#theme-selector option[value="${theme}"]`)
                    .should('exist')
                    .and('contain.text', expectedLabel);
            });
        });
    });
});
