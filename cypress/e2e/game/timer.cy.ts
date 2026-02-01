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
            .each(($img) => {
                // All digits should be 0 initially
                cy.wrap($img).should('have.attr', 'src').and('include', 'digits/0.png');
            });

        // Click a block to start the timer
        cy.get('.box').first().click();

        // Wait for at least 1 second (1000ms + 100ms buffer for timing precision)
        const TIMER_TICK_WITH_BUFFER = 1100;
        cy.wait(TIMER_TICK_WITH_BUFFER);

        // Check that time is at least 1 second (rightmost digit should be at least 1)
        cy.get('#time-board')
            .find('img')
            .last()
            .should('have.attr', 'src')
            .and('match', /digits\/[1-9].png/);

        // Wait for another second
        cy.wait(1000);

        // Check that time is at least 2 seconds
        // Since timer could show values like "002", we check if last digit is >= 2
        // or if it wrapped around (e.g., "010" means 10 seconds)
        cy.get('#time-board')
            .find('img')
            .then(($imgs) => {
                // Get all three digit image sources
                const digits = $imgs.toArray().map((img) => {
                    const src = img.getAttribute('src') || '';
                    const match = src.match(/digits\/(\d+|-)\.png/);
                    return match ? match[1] : '0';
                });
                
                // Parse the full time value
                const timeValue = parseInt(digits.join(''), 10);
                
                // Verify time is at least 2 seconds
                expect(timeValue).to.be.gte(2);
            });
    });
});
