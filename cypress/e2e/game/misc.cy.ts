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
    });

    describe('noscript', () => {
        // It's unreasonably difficult in Cypress atm to disable JS for one test, shouldn't have to manipulate the parent iframe just to do it.
        // Putting the open issue URL here in case I want to revisit it: https://github.com/cypress-io/cypress/issues/1611
        // Instead, I'll test for the inverse for now since this isn't critical.
        it("should not display a message telling player to enable JS if it's enabled", () => {
            cy.contains('Please enable JavaScript to play this game.').should('not.be.visible');
        });
    });
});
