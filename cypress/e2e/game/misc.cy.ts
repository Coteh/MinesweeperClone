/// <reference types="cypress" />

import { GamePersistentState, GameState } from '../../../src/game';

describe('misc', () => {
    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad: () => {
                const persistentState: GamePersistentState = {
                    highscore: 0,
                    unlockables: {},
                    hasPlayedBefore: true,
                };
                window.localStorage.setItem('persistent-state', JSON.stringify(persistentState));
            },
        });
        cy.waitForGameReady();
    });

    describe('noscript', () => {
        // It's unreasonably difficult in Cypress atm to disable JS for one test, shouldn't have to manipulate the parent iframe just to do it.
        // Putting the open issue URL here in case I want to revisit it: https://github.com/cypress-io/cypress/issues/1611
        // Instead, I'll test for the inverse for now since this isn't critical.
        it("should not display a message telling player to enable JS if it's enabled", () => {
            cy.contains('Please enable JavaScript to play this game.').should('not.be.visible');
        });
    });

    describe('changelog', () => {
        beforeEach(() => {
            cy.get('.settings-link').click();
        });

        it('should successfully toggle the changelog on/off', () => {
            cy.intercept('GET', '/CHANGELOG.html').as('getChangelog');
            cy.contains('Changelog').should('not.exist');
            cy.get('#changelog-link').click({ force: true });
            cy.wait('@getChangelog');
            cy.get('.dialog').contains('Changelog').should('be.visible');
            cy.get('.dialog .close').click();
            cy.contains('Changelog').should('not.exist');
        });

        it('should display an error message if the changelog cannot be retrieved', () => {
            cy.intercept('GET', '/CHANGELOG.html', { statusCode: 404 }).as('getChangelog');
            cy.contains('Changelog').should('not.exist');
            cy.get('.dialog .changelog-error').should('not.exist');
            cy.get('#changelog-link').click({ force: true });
            cy.wait('@getChangelog');
            cy.get('.dialog .changelog-error').should('be.visible');
        });

        it('should display an error message if the changelog cannot be retrieved due to a network error', () => {
            cy.intercept('GET', '/CHANGELOG.html', { forceNetworkError: true }).as('getChangelog');
            cy.contains('Changelog').should('not.exist');
            cy.get('.dialog .changelog-error').should('not.exist');
            cy.get('#changelog-link').click({ force: true });
            cy.wait('@getChangelog');
            cy.get('.dialog .changelog-error').should('be.visible');
        });

        it('should only make one request to the changelog', () => {
            const interceptedRequests = [];

            cy.intercept('GET', '/CHANGELOG.html', (req) => {
                interceptedRequests.push(req);
            }).as('getChangelog');

            cy.contains('Changelog').should('not.exist');

            // First click: Request should be made
            cy.get('#changelog-link').click({ force: true });
            cy.wait('@getChangelog').then(() => {
                expect(interceptedRequests).to.have.length(1);
            });

            cy.get('.dialog').contains('Changelog').should('be.visible');

            // Close the dialog
            cy.get('.dialog .close').click();
            cy.contains('Changelog').should('not.exist');

            // Second click: Request should not fire again (cached)
            cy.get('#changelog-link').click({ force: true });
            cy.get('.dialog').contains('Changelog').should('be.visible');

            cy.then(() => {
                expect(interceptedRequests).to.have.length(1); // Still only one request
            });
        });
    });
});
