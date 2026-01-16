/// <reference types="cypress" />

import { GameState, GamePersistentState, MineBlock } from '../../../src/game';

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

describe('camera pan on loss', () => {
    describe('4x4 board', () => {
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

        it('should keep center mine visible when losing (already in view after reset)', () => {
            // Click on the mine at (1, 1) - center of the board
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).click();
                });

            // Wait for camera pan animation
            cy.wait(300);

            // Verify the losing mine is highlighted and visible
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).should('have.class', 'losing');
                    cy.get('.box').eq(1).shouldBeInViewport();
                });
        });

        it('should keep corner mine visible when losing (already in view after reset)', () => {
            // Click on the mine at (0, 3) - bottom left corner
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });

            // Wait for camera pan animation
            cy.wait(300);

            // Verify the losing mine is highlighted and visible
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'losing');
                    cy.get('.box').eq(0).shouldBeInViewport();
                });
        });

        it('should pan minimally to show first losing mine when multiple mines revealed', () => {
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).rightclick();
                });
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(1).rightclick();
                });
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });

            // Wait for camera pan animation
            cy.wait(300);

            // There should be two losing spots, verify that at least one is visible
            // The camera should pan to the first one found (1,1 comes before 0,3 in row-major order)
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).should('have.class', 'losing');
                    cy.get('.box').eq(1).shouldBeInViewport();
                });
        });
    });

    describe('large board (30x16) - edge case testing', () => {
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

        it('should pan minimally to show mine on left edge if not in view', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const board = createLargeBoard(0, 8); // Left edge, middle height
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

            // Change to hard difficulty which has larger bounds
            cy.changeDifficulty('hard');

            // Click on the mine
            cy.get('.game-board > .row')
                .eq(8)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });

            // Wait for camera pan animation
            cy.wait(300);

            // Verify the losing mine is visible
            cy.get('.game-board > .row')
                .eq(8)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'losing');
                    cy.get('.box').eq(0).shouldBeInViewport();
                });

            // Verify that the camera position is within bounds
            cy.fixture('config.json').then((settings) => {
                const bounds = (settings as any).difficulty.hard.bounds;
                cy.get('#x')
                    .invoke('text')
                    .then((text) => {
                        const x = parseInt(text);
                        expect(x).to.be.at.least(bounds.minX);
                        expect(x).to.be.at.most(bounds.maxX);
                    });
                cy.get('#y')
                    .invoke('text')
                    .then((text) => {
                        const y = parseInt(text);
                        expect(y).to.be.at.least(bounds.minY);
                        expect(y).to.be.at.most(bounds.maxY);
                    });
            });
        });

        it('should pan minimally to show mine on right edge if not in view', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const board = createLargeBoard(29, 8); // Right edge, middle height
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

            // Change to hard difficulty which has larger bounds
            cy.changeDifficulty('hard');

            // Click on the mine
            cy.get('.game-board > .row')
                .eq(8)
                .within(() => {
                    cy.get('.box').eq(29).click();
                });

            // Wait for camera pan animation
            cy.wait(300);

            // Verify the losing mine is visible
            cy.get('.game-board > .row')
                .eq(8)
                .within(() => {
                    cy.get('.box').eq(29).should('have.class', 'losing');
                    cy.get('.box').eq(29).shouldBeInViewport();
                });

            // Verify that the camera position is within bounds
            cy.fixture('config.json').then((settings) => {
                const bounds = (settings as any).difficulty.hard.bounds;
                cy.get('#x')
                    .invoke('text')
                    .then((text) => {
                        const x = parseInt(text);
                        expect(x).to.be.at.least(bounds.minX);
                        expect(x).to.be.at.most(bounds.maxX);
                    });
                cy.get('#y')
                    .invoke('text')
                    .then((text) => {
                        const y = parseInt(text);
                        expect(y).to.be.at.least(bounds.minY);
                        expect(y).to.be.at.most(bounds.maxY);
                    });
            });
        });

        it('should pan minimally to show mine in top-left corner if not in view', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const board = createLargeBoard(0, 0); // Top-left corner
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

            // Change to hard difficulty which has larger bounds
            cy.changeDifficulty('hard');

            // Click on the mine
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });

            // Wait for camera pan animation
            cy.wait(300);

            // Verify the losing mine is visible
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'losing');
                    cy.get('.box').eq(0).shouldBeInViewport();
                });

            // Verify that the camera position is within bounds
            cy.fixture('config.json').then((settings) => {
                const bounds = (settings as any).difficulty.hard.bounds;
                cy.get('#x')
                    .invoke('text')
                    .then((text) => {
                        const x = parseInt(text);
                        expect(x).to.be.at.least(bounds.minX);
                        expect(x).to.be.at.most(bounds.maxX);
                    });
                cy.get('#y')
                    .invoke('text')
                    .then((text) => {
                        const y = parseInt(text);
                        expect(y).to.be.at.least(bounds.minY);
                        expect(y).to.be.at.most(bounds.maxY);
                    });
            });
        });

        it('should pan minimally to show mine in bottom-right corner if not in view', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const board = createLargeBoard(29, 15); // Bottom-right corner
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

            // Change to hard difficulty which has larger bounds
            cy.changeDifficulty('hard');

            // Click on the mine
            cy.get('.game-board > .row')
                .eq(15)
                .within(() => {
                    cy.get('.box').eq(29).click();
                });

            // Wait for camera pan animation
            cy.wait(300);

            // Verify the losing mine is visible
            cy.get('.game-board > .row')
                .eq(15)
                .within(() => {
                    cy.get('.box').eq(29).should('have.class', 'losing');
                    cy.get('.box').eq(29).shouldBeInViewport();
                });

            // Verify that the camera position is within bounds
            cy.fixture('config.json').then((settings) => {
                const bounds = (settings as any).difficulty.hard.bounds;
                cy.get('#x')
                    .invoke('text')
                    .then((text) => {
                        const x = parseInt(text);
                        expect(x).to.be.at.least(bounds.minX);
                        expect(x).to.be.at.most(bounds.maxX);
                    });
                cy.get('#y')
                    .invoke('text')
                    .then((text) => {
                        const y = parseInt(text);
                        expect(y).to.be.at.least(bounds.minY);
                        expect(y).to.be.at.most(bounds.maxY);
                    });
            });
        });
    });

    describe('different zoom levels', () => {
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

        it('should clamp zoom to 1x or less when losing while zoomed in', () => {
            // Zoom in
            cy.get('.zoom.in').click();
            cy.get('.zoom.in').click();

            // Verify we're zoomed in
            cy.get('#zoom')
                .invoke('text')
                .then((text) => {
                    const zoom = parseFloat(text);
                    expect(zoom).to.be.greaterThan(1);
                });

            // Click on the mine
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).click();
                });

            // Wait for camera pan animation
            cy.wait(300);

            // Verify zoom was clamped to 1 or less
            cy.get('#zoom')
                .invoke('text')
                .then((text) => {
                    const zoom = parseFloat(text);
                    expect(zoom).to.be.at.most(1);
                });

            // Verify the losing mine is still visible
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).should('have.class', 'losing');
                    cy.get('.box').eq(1).shouldBeInViewport();
                });
        });

        it('should maintain zoom level when losing while zoomed out', () => {
            // Zoom out
            cy.get('.zoom.out').click();

            // Get the current zoom level
            let initialZoom: number;
            cy.get('#zoom')
                .invoke('text')
                .then((text) => {
                    initialZoom = parseFloat(text);
                    expect(initialZoom).to.be.lessThan(1);
                });

            // Click on the mine
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).click();
                });

            // Wait for camera pan animation
            cy.wait(300);

            // Verify zoom level remained the same
            cy.get('#zoom')
                .invoke('text')
                .then((text) => {
                    const finalZoom = parseFloat(text);
                    expect(finalZoom).to.equal(initialZoom);
                });

            // Verify the losing mine is visible
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).should('have.class', 'losing');
                    cy.get('.box').eq(1).shouldBeInViewport();
                });
        });
    });
});
