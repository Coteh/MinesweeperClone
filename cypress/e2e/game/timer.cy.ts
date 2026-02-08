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
                                isMine: true,
                                adjMinesCount: 0,
                                isRevealed: false,
                                isFlagged: false,
                                isLosingSpot: false,
                                isQuestionMark: false,
                            },
                        ],
                    ],
                    ended: false,
                    won: false,
                    firstBlockClicked: false,
                    score: 0,
                    didUndo: false,
                    achievedHighscore: false,
                    gameOptions: {
                        boardWidth: 2,
                        boardHeight: 2,
                        numberOfMines: 1,
                        revealBoardOnLoss: true,
                        difficultyKey: 'easy',
                    },
                    elapsedTimeMS: 0,
                    spareMineSpot: { x: 0, y: 0 },
                };
                const persistentState: GamePersistentState = {
                    highscore: {},
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
                cy.wrap($img).should('have.attr', 'src').and('include', 'img/digits/0.png');
                cy.wrap($img).should('have.attr', 'data-asset', 'img/digits/0.png');
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
            .should(($img) => {
                const src = $img.attr('src') || '';
                const asset = $img.attr('data-asset') || '';

                expect(src).to.match(/img\/digits\/[1-9]\.png/);
                expect(asset).to.match(/img\/digits\/[1-9]\.png/);

                const match = src.match(/img\/digits\/(\d+|-)\.png/);
                const expectedAsset = match ? `img/digits/${match[1]}.png` : '';
                expect(asset).to.eq(expectedAsset);
            });

        // Wait for another second
        cy.wait(1000);

        // Check that time is exactly 2 seconds
        cy.get('#time-board')
            .find('img')
            .then(($imgs) => {
                // Get all three digit image sources
                const digits = $imgs.toArray().map((img) => {
                    const src = img.getAttribute('src') || '';
                    const match = src.match(/img\/digits\/(\d+|-)\.png/);
                    return match ? match[1] : '0';
                });

                // Parse the full time value
                const timeValue = parseInt(digits.join(''), 10);

                // Verify time is exactly 2 seconds
                expect(timeValue).to.eq(2);

                $imgs.each((_, img) => {
                    const src = img.getAttribute('src') || '';
                    const match = src.match(/img\/digits\/(\d+|-)\.png/);
                    const asset = match ? `img/digits/${match[1]}.png` : 'img/digits/0.png';
                    expect(img.getAttribute('data-asset')).to.eq(asset);
                });
            });
    });
});
