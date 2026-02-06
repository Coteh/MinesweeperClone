/// <reference types="cypress" />

import { GameState, GamePersistentState, MineBlock } from '../../../src/game';
import { ZOOM_ANIMATION_DURATION } from '../../../src/manager/transform';

const standardMineBlock: (
    x: number,
    y: number,
    isMine: boolean,
    adjMinesCount: number
) => MineBlock = (x, y, isMine, adjMinesCount) => {
    return {
        x,
        y,
        isMine,
        isRevealed: false,
        isLosingSpot: false,
        isFlagged: false,
        isQuestionMark: false,
        adjMinesCount,
    };
};

const createSmallBoard = (hasMine: boolean): MineBlock[][] => {
    return [
        [
            standardMineBlock(0, 0, hasMine, hasMine ? 0 : 1),
            standardMineBlock(1, 0, false, hasMine ? 1 : 0),
            standardMineBlock(2, 0, false, 0),
            standardMineBlock(3, 0, false, 0),
        ],
        [
            standardMineBlock(0, 1, false, hasMine ? 1 : 0),
            standardMineBlock(1, 1, false, 0),
            standardMineBlock(2, 1, false, 0),
            standardMineBlock(3, 1, false, 0),
        ],
        [
            standardMineBlock(0, 2, false, 0),
            standardMineBlock(1, 2, false, 0),
            standardMineBlock(2, 2, false, 0),
            standardMineBlock(3, 2, false, 0),
        ],
        [
            standardMineBlock(0, 3, false, 0),
            standardMineBlock(1, 3, false, 0),
            standardMineBlock(2, 3, false, 0),
            standardMineBlock(3, 3, false, 0),
        ],
    ];
};

const createLargeBoard = (): MineBlock[][] => {
    // Create a 30x16 board (hard difficulty)
    const board: MineBlock[][] = [];
    for (let y = 0; y < 16; y++) {
        const row: MineBlock[] = [];
        for (let x = 0; x < 30; x++) {
            // Place a mine at (0, 0) for loss testing
            row.push(standardMineBlock(x, y, x === 0 && y === 0, x === 0 && y === 0 ? 0 : 1));
        }
        board.push(row);
    }
    return board;
};

const getBoardTransform = (): { x: number; y: number; scale: number } => {
    return cy.window().then((win) => {
        const middle = win.document.querySelector('#middle') as HTMLElement;
        const transform = middle.style.transform;
        
        // Parse "translate(0px, 0px)scale(1)" format
        const translateMatch = transform.match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
        const scaleMatch = transform.match(/scale\((-?\d+(?:\.\d+)?)\)/);
        
        const x = translateMatch ? parseFloat(translateMatch[1]) : 0;
        const y = translateMatch ? parseFloat(translateMatch[2]) : 0;
        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        
        return { x, y, scale };
    });
};

const getCornerPositions = (boardWidth: number, boardHeight: number, scale: number) => {
    const cellSize = 30;
    const scaledCellSize = cellSize * scale;
    const boardPixelWidth = boardWidth * scaledCellSize;
    const boardPixelHeight = boardHeight * scaledCellSize;
    
    return {
        topLeft: { x: window.innerWidth / 2 - boardPixelWidth / 2, y: window.innerHeight / 2 - boardPixelHeight / 2 },
        topRight: { x: window.innerWidth / 2 + boardPixelWidth / 2, y: window.innerHeight / 2 - boardPixelHeight / 2 },
        bottomLeft: { x: window.innerWidth / 2 - boardPixelWidth / 2, y: window.innerHeight / 2 + boardPixelHeight / 2 },
        bottomRight: { x: window.innerWidth / 2 + boardPixelWidth / 2, y: window.innerHeight / 2 + boardPixelHeight / 2 },
    };
};

describe('camera-zoom-to-fit', () => {
    describe('on loss', () => {
        it('should zoom to fit small board (4x4)', () => {
            const boardWidth = 4;
            const boardHeight = 4;
            const board = createSmallBoard(true);
            board[0][0].isMine = true;

            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board,
                        ended: false,
                        won: false,
                        firstBlockClicked: false,
                        score: 0,
                        didUndo: false,
                        achievedHighscore: false,
                        gameOptions: {
                            boardWidth,
                            boardHeight,
                            numberOfMines: 1,
                            revealBoardOnLoss: true,
                            difficultyKey: 'custom',
                        },
                        elapsedTimeMS: 0,
                        spareMineSpot: { x: -1, y: -1 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {},
                        unlockables: {},
                        hasPlayedBefore: false,
                    };
                    (window as any).gameState = gameState;
                    (window as any).persistentState = persistentState;
                },
            });

            cy.wait(500);

            // Click on the mine to lose
            cy.get('.box').first().click();

            // Wait for zoom animation
            cy.wait(ZOOM_ANIMATION_DURATION + 100);

            // Verify camera is centered
            getBoardTransform().then((transform) => {
                expect(transform.x).to.equal(0);
                expect(transform.y).to.equal(0);
                // For small board, scale should be at or near 1 (no zoom needed)
                expect(transform.scale).to.be.lessThan(1.1);
            });
        });

        it('should zoom to fit large board (30x16)', () => {
            const boardWidth = 30;
            const boardHeight = 16;
            const board = createLargeBoard();
            board[0][0].isMine = true;

            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board,
                        ended: false,
                        won: false,
                        firstBlockClicked: false,
                        score: 0,
                        didUndo: false,
                        achievedHighscore: false,
                        gameOptions: {
                            boardWidth,
                            boardHeight,
                            numberOfMines: 99,
                            revealBoardOnLoss: true,
                            difficultyKey: 'hard',
                        },
                        elapsedTimeMS: 0,
                        spareMineSpot: { x: -1, y: -1 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {},
                        unlockables: {},
                        hasPlayedBefore: false,
                    };
                    (window as any).gameState = gameState;
                    (window as any).persistentState = persistentState;
                },
            });

            cy.wait(500);

            // Click on the mine to lose
            cy.get('.box').first().click();

            // Wait for zoom animation
            cy.wait(ZOOM_ANIMATION_DURATION + 100);

            // Verify camera is centered
            getBoardTransform().then((transform) => {
                expect(transform.x).to.equal(0);
                expect(transform.y).to.equal(0);
                // For large board, scale should be much less than 1
                expect(transform.scale).to.be.lessThan(0.6);
                // Verify it zoomed out more for the larger board
                expect(transform.scale).to.be.greaterThan(0.3);
            });

            // Verify all corners are visible
            getBoardTransform().then((transform) => {
                const corners = getCornerPositions(boardWidth, boardHeight, transform.scale);
                
                // All corners should be within viewport with some padding
                expect(corners.topLeft.x).to.be.greaterThan(0);
                expect(corners.topLeft.y).to.be.greaterThan(0);
                expect(corners.bottomRight.x).to.be.lessThan(window.innerWidth);
                expect(corners.bottomRight.y).to.be.lessThan(window.innerHeight);
            });
        });
    });

    describe('on win', () => {
        it('should zoom to fit board on win', () => {
            const boardWidth = 4;
            const boardHeight = 4;
            const board = createSmallBoard(false);
            // Set all non-mine blocks as revealed for win condition
            for (let y = 0; y < boardHeight; y++) {
                for (let x = 0; x < boardWidth; x++) {
                    if (!board[y][x].isMine) {
                        board[y][x].isRevealed = true;
                    }
                }
            }

            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board,
                        ended: false,
                        won: false,
                        firstBlockClicked: true,
                        score: 0,
                        didUndo: false,
                        achievedHighscore: false,
                        gameOptions: {
                            boardWidth,
                            boardHeight,
                            numberOfMines: 0,
                            revealBoardOnLoss: true,
                            difficultyKey: 'custom',
                        },
                        elapsedTimeMS: 1000,
                        spareMineSpot: { x: -1, y: -1 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {},
                        unlockables: {},
                        hasPlayedBefore: false,
                    };
                    (window as any).gameState = gameState;
                    (window as any).persistentState = persistentState;
                },
            });

            cy.wait(500);

            // Click on the last unrevealed block to win
            cy.get('.box').not('.revealed').first().click();

            // Wait for zoom animation
            cy.wait(ZOOM_ANIMATION_DURATION + 100);

            // Verify camera is centered
            getBoardTransform().then((transform) => {
                expect(transform.x).to.equal(0);
                expect(transform.y).to.equal(0);
            });
        });
    });

    describe('zoom restrictions after zoom-to-fit', () => {
        it('should allow zoom in but prevent zoom out when below MIN_ZOOM', () => {
            const boardWidth = 30;
            const boardHeight = 16;
            const board = createLargeBoard();
            board[0][0].isMine = true;

            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board,
                        ended: false,
                        won: false,
                        firstBlockClicked: false,
                        score: 0,
                        didUndo: false,
                        achievedHighscore: false,
                        gameOptions: {
                            boardWidth,
                            boardHeight,
                            numberOfMines: 99,
                            revealBoardOnLoss: true,
                            difficultyKey: 'hard',
                        },
                        elapsedTimeMS: 0,
                        spareMineSpot: { x: -1, y: -1 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {},
                        unlockables: {},
                        hasPlayedBefore: false,
                    };
                    (window as any).gameState = gameState;
                    (window as any).persistentState = persistentState;
                },
            });

            cy.wait(500);

            // Click on the mine to lose
            cy.get('.box').first().click();

            // Wait for zoom animation
            cy.wait(ZOOM_ANIMATION_DURATION + 100);

            // Record initial scale (should be below MIN_ZOOM)
            let initialScale: number;
            getBoardTransform().then((transform) => {
                initialScale = transform.scale;
                expect(initialScale).to.be.lessThan(0.5);
            });

            // Try to zoom out - should not work
            cy.get('.zoom-controls .zoom-out').click();
            cy.wait(ZOOM_ANIMATION_DURATION + 100);

            getBoardTransform().then((transform) => {
                // Scale should remain the same
                expect(transform.scale).to.equal(initialScale);
            });

            // Zoom in - should work
            cy.get('.zoom-controls .zoom-in').click();
            cy.wait(ZOOM_ANIMATION_DURATION + 100);

            getBoardTransform().then((transform) => {
                // Scale should have increased
                expect(transform.scale).to.be.greaterThan(initialScale);
            });
        });
    });
});
