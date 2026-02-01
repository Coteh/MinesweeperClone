/// <reference types="cypress" />

import { GameState, GamePersistentState } from '../../../src/game';

describe('timer', () => {
    it('increases time counter by 1 second when 1 second passes', () => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {
                const gameState: GameState = {
                    board: [
                        [
                            {
                                x: 0,
                                y: 0,
                                isMine: false,
                                adjMinesCount: 0,
                                isRevealed: false,
                                isFlagged: false,
                                isLosingSpot: false,
                                isQuestionMark: false,
                            },
                            {
                                x: 1,
                                y: 0,
                                isMine: false,
                                adjMinesCount: 0,
                                isRevealed: false,
                                isFlagged: false,
                                isLosingSpot: false,
                                isQuestionMark: false,
                            },
                        ],
                        [
                            {
                                x: 0,
                                y: 1,
                                isMine: false,
                                adjMinesCount: 0,
                                isRevealed: false,
                                isFlagged: false,
                                isLosingSpot: false,
                                isQuestionMark: false,
                            },
                            {
                                x: 1,
                                y: 1,
                                isMine: false,
                                adjMinesCount: 0,
                                isRevealed: false,
                                isFlagged: false,
                                isLosingSpot: false,
                                isQuestionMark: false,
                            },
                        ],
                    ],
                    ended: false,
                    win: false,
                    firstBlockClicked: false,
                    didUndo: false,
                    achievedHighscore: false,
                    gameOptions: {
                        width: 2,
                        height: 2,
                        numberOfMines: 0,
                        revealBoardOnLoss: true,
                    },
                    elapsedTimeMS: 0,
                    spareMineSpot: { x: 0, y: 0 },
                };
                const persistentState: GamePersistentState = {
                    highscore: 0,
                    unlockables: {},
                    hasPlayedBefore: true,
                };

                window.localStorage.setItem('game-state', JSON.stringify(gameState));
                window.localStorage.setItem('persistent-state', JSON.stringify(persistentState));
            },
        });

        cy.waitForGameReady();

        // Check that timer starts at 0
        cy.get('#time-board')
            .find('img')
            .should('have.length', 3)
            .each(($img, index) => {
                // All digits should be 0 initially
                cy.wrap($img).should('have.attr', 'src').and('include', 'digits/0.png');
            });

        // Click a block to start the timer
        cy.get('.box').first().click();

        // Wait for at least 1 second
        cy.wait(1100);

        // Check that at least one digit has changed (time should be >= 1)
        cy.get('#time-board')
            .find('img')
            .last()
            .should('have.attr', 'src')
            .and('match', /digits\/[1-9].png/);

        // Wait for another second
        cy.wait(1000);

        // Check that time has increased further (time should be >= 2)
        cy.get('#time-board')
            .find('img')
            .last()
            .should('have.attr', 'src')
            .and('match', /digits\/[2-9].png/);
    });
});
