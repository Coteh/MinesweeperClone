/// <reference types="cypress" />

import { GameState, GamePersistentState, MineBlock } from '../../../src/game';

// Animation duration for camera zoom transitions
const ZOOM_ANIMATION_DURATION = 300;

const standardMineBlock: (
    x: number,
    y: number,
    isMine: boolean,
    adjMinesCount: number,
    isRevealed: boolean,
    isFlagged: boolean,
    isLosingSpot: boolean,
    isQuestionMark: boolean
) => MineBlock = (
    x,
    y,
    isMine,
    adjMinesCount,
    isRevealed,
    isFlagged,
    isLosingSpot,
    isQuestionMark
) => {
    return {
        x,
        y,
        isMine,
        isRevealed,
        isLosingSpot,
        isFlagged,
        isQuestionMark,
        adjMinesCount,
    };
};

describe('camera zoom to fit on game end', () => {
    describe('loss scenario', () => {
        beforeEach(() => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 1, false, false, false, false),
                                standardMineBlock(1, 0, false, 1, false, false, false, false),
                                standardMineBlock(2, 0, false, 1, false, false, false, false),
                                standardMineBlock(3, 0, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 1, false, 1, false, false, false, false),
                                standardMineBlock(1, 1, true, 0, false, false, false, false),
                                standardMineBlock(2, 1, false, 1, false, false, false, false),
                                standardMineBlock(3, 1, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 2, false, 2, false, false, false, false),
                                standardMineBlock(1, 2, false, 2, false, false, false, false),
                                standardMineBlock(2, 2, false, 1, false, false, false, false),
                                standardMineBlock(3, 2, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 3, true, 0, false, false, false, false),
                                standardMineBlock(1, 3, false, 1, false, false, false, false),
                                standardMineBlock(2, 3, false, 0, false, false, false, false),
                                standardMineBlock(3, 3, false, 0, false, false, false, false),
                            ],
                        ],
                        ended: false,
                        won: false,
                        firstBlockClicked: false,
                        score: 0,
                        didUndo: false,
                        achievedHighscore: false,
                        gameOptions: {
                            boardWidth: 4,
                            boardHeight: 4,
                            numberOfMines: 2,
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
        });

        it('should zoom to fit entire board when losing', () => {
            // Click on a mine
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).click();
                });

            // Wait for zoom animation
            cy.wait(ZOOM_ANIMATION_DURATION);

            // Verify the losing mine is highlighted
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).should('have.class', 'losing');
                });

            // Verify zoom is at or below 1 (zoomed out or normal)
            cy.get('#zoom')
                .invoke('text')
                .then((text) => {
                    const zoom = parseFloat(text);
                    expect(zoom).to.be.at.most(1);
                });

            // Verify camera is centered
            cy.get('#x')
                .invoke('text')
                .then((text) => {
                    expect(parseFloat(text)).to.equal(0);
                });
            cy.get('#y')
                .invoke('text')
                .then((text) => {
                    expect(parseFloat(text)).to.equal(0);
                });

            // Verify all corners of the board are visible
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).shouldBeInViewport(); // Top-left
                    cy.get('.box').eq(3).shouldBeInViewport(); // Top-right
                });
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(0).shouldBeInViewport(); // Bottom-left
                    cy.get('.box').eq(3).shouldBeInViewport(); // Bottom-right
                });
        });

        it('should zoom out regardless of which mine was clicked', () => {
            // Click on corner mine
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });

            // Wait for zoom animation
            cy.wait(ZOOM_ANIMATION_DURATION);

            // Verify zoom is at or below 1
            cy.get('#zoom')
                .invoke('text')
                .then((text) => {
                    const zoom = parseFloat(text);
                    expect(zoom).to.be.at.most(1);
                });

            // Verify all corners are still visible
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(3).shouldBeInViewport();
                });
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(0).shouldBeInViewport();
                });
        });
    });

    describe('large board zoom behavior', () => {
        const createLargeBoard = (mineX: number, mineY: number): MineBlock[][] => {
            const board: MineBlock[][] = [];
            for (let y = 0; y < 16; y++) {
                const row: MineBlock[] = [];
                for (let x = 0; x < 30; x++) {
                    const isMine = x === mineX && y === mineY;
                    row.push(
                        standardMineBlock(
                            x,
                            y,
                            isMine,
                            isMine ? 0 : 1,
                            false,
                            false,
                            false,
                            false
                        )
                    );
                }
                board.push(row);
            }
            return board;
        };

        it('should zoom out more for larger boards', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const board = createLargeBoard(15, 8);
                    const gameState: GameState = {
                        board,
                        ended: false,
                        won: false,
                        firstBlockClicked: false,
                        score: 0,
                        didUndo: false,
                        achievedHighscore: false,
                        gameOptions: {
                            boardWidth: 30,
                            boardHeight: 16,
                            numberOfMines: 1,
                            revealBoardOnLoss: true,
                            difficultyKey: 'hard',
                        },
                        elapsedTimeMS: 0,
                        spareMineSpot: { x: 1, y: 1 },
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

            // Change to hard difficulty
            cy.changeDifficulty('hard');

            // Click on the mine
            cy.get('.game-board > .row')
                .eq(8)
                .within(() => {
                    cy.get('.box').eq(15).click();
                });

            // Wait for zoom animation
            cy.wait(ZOOM_ANIMATION_DURATION);

            // For a 30x16 board, zoom should be significantly less than 1
            cy.get('#zoom')
                .invoke('text')
                .then((text) => {
                    const zoom = parseFloat(text);
                    expect(zoom).to.be.lessThan(1);
                    // Should be zoomed out significantly for hard difficulty
                    expect(zoom).to.be.greaterThan(0.3);
                });

            // Verify all corners are visible
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).shouldBeInViewport(); // Top-left
                    cy.get('.box').eq(29).shouldBeInViewport(); // Top-right
                });
            cy.get('.game-board > .row')
                .eq(15)
                .within(() => {
                    cy.get('.box').eq(0).shouldBeInViewport(); // Bottom-left
                    cy.get('.box').eq(29).shouldBeInViewport(); // Bottom-right
                });
        });
    });

    describe('win scenario', () => {
        it('should zoom to fit board when winning', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    // Create a nearly-won game with only one tile left to reveal
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 1, true, false, false, false),
                                standardMineBlock(1, 0, false, 1, true, false, false, false),
                                standardMineBlock(2, 0, false, 1, true, false, false, false),
                                standardMineBlock(3, 0, false, 0, false, false, false, false), // Last tile to reveal
                            ],
                            [
                                standardMineBlock(0, 1, false, 1, true, false, false, false),
                                standardMineBlock(1, 1, true, 0, false, false, false, false),
                                standardMineBlock(2, 1, false, 1, true, false, false, false),
                                standardMineBlock(3, 1, false, 0, true, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 2, false, 2, true, false, false, false),
                                standardMineBlock(1, 2, false, 2, true, false, false, false),
                                standardMineBlock(2, 2, false, 1, true, false, false, false),
                                standardMineBlock(3, 2, false, 0, true, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 3, true, 0, false, false, false, false),
                                standardMineBlock(1, 3, false, 1, true, false, false, false),
                                standardMineBlock(2, 3, false, 0, true, false, false, false),
                                standardMineBlock(3, 3, false, 0, true, false, false, false),
                            ],
                        ],
                        ended: false,
                        won: false,
                        firstBlockClicked: true,
                        score: 0,
                        didUndo: false,
                        achievedHighscore: false,
                        gameOptions: {
                            boardWidth: 4,
                            boardHeight: 4,
                            numberOfMines: 2,
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

            // Click the last unrevealed safe tile to win
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(3).click();
                });

            // Wait for zoom animation
            cy.wait(ZOOM_ANIMATION_DURATION);

            // Verify zoom is at or below 1
            cy.get('#zoom')
                .invoke('text')
                .then((text) => {
                    const zoom = parseFloat(text);
                    expect(zoom).to.be.at.most(1);
                });

            // Verify camera is centered
            cy.get('#x')
                .invoke('text')
                .then((text) => {
                    expect(parseFloat(text)).to.equal(0);
                });

            // Verify all corners are visible
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).shouldBeInViewport();
                    cy.get('.box').eq(3).shouldBeInViewport();
                });
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(0).shouldBeInViewport();
                    cy.get('.box').eq(3).shouldBeInViewport();
                });
        });
    });
});
