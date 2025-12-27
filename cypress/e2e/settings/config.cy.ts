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
            // ensure number of options equals keys
            cy.get('#difficulty-selector').find('option').should('have.length', keys.length);
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

    it('persists selected difficulty across reload', () => {
        cy.changeDifficulty('medium');

        cy.get('.game-board > .row').eq(0).children().should('have.length', 16);
        cy.reload();
        cy.waitForGameReady();
        cy.get('.settings-link').click();
        cy.get('#difficulty-selector').should('have.value', 'medium');
    });
});
