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

// Expected standard block background colour for basic theme
const STANDARD_BLOCK_BACKGROUND_COLOR = 'rgb(108, 122, 137)';

// Expected losing block background colour for basic theme
const LOSING_BLOCK_BACKGROUND_COLOR = 'rgb(231, 76, 60)';

describe('gameplay', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {
                const gameState: GameState = {
                    // TODO: Expand the board used for testing from 4x4 to 9x9 easy mode board
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

    it('should allow player to click on a tile to reveal it', () => {
        cy.verifyBoardMatches([
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
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).click();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, true, false, false, false),
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
        ]);
        // Cannot click on a revealed tile to unreveal it
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).click();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, true, false, false, false),
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
        ]);
    });

    it('should allow player to tap on a tile to reveal it', () => {
        cy.verifyBoardMatches([
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
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within((elem) => {
                const offset = elem.offset();

                if (!offset) {
                    throw new Error('Expected element to have a valid offset.');
                }
                // NOTE: Calling realTouch will flag the tile instead of revealing it, but in real
                //       gameplay it won't do that unless the player holds it down for 0.25 seconds.
                // cy.get('.box').eq(0).realTouch();
                cy.get('.box')
                    .eq(0)
                    .trigger('touchstart', {
                        touches: [{ clientX: offset.left, clientY: offset.top }],
                    });
                cy.get('.box')
                    .eq(0)
                    .trigger('touchend', {
                        changedTouches: [{ clientX: offset.left, clientY: offset.top }],
                    });
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, true, false, false, false),
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
        ]);
        // Cannot tap on a revealed tile to unreveal it
        cy.get('.game-board > .row')
            .eq(0)
            .within((elem) => {
                const offset = elem.offset();

                if (!offset) {
                    throw new Error('Expected element to have a valid offset.');
                }
                // NOTE: Calling realTouch will flag the tile instead of revealing it, but in real
                //       gameplay it won't do that unless the player holds it down for 0.25 seconds.
                // cy.get('.box').eq(0).realTouch();
                cy.get('.box')
                    .eq(0)
                    .trigger('touchstart', {
                        touches: [{ clientX: offset.left, clientY: offset.top }],
                    });
                cy.get('.box')
                    .eq(0)
                    .trigger('touchend', {
                        changedTouches: [{ clientX: offset.left, clientY: offset.top }],
                    });
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, true, false, false, false),
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
        ]);
    });

    it('should allow player to right click to flag/unflag a tile', () => {
        cy.verifyBoardMatches([
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
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).rightclick();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, true, false, false),
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
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).rightclick();
            });
        cy.verifyBoardMatches([
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
        ]);
    });

    it('should allow player to hold tap to flag/unflag a tile', () => {
        cy.verifyBoardMatches([
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
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within((elem) => {
                const offset = elem.offset();

                if (!offset) {
                    throw new Error('Expected element to have a valid offset.');
                }
                cy.get('.box')
                    .eq(0)
                    .trigger('touchstart', {
                        touches: [{ clientX: offset.left, clientY: offset.top }],
                    });
                cy.wait(250); // Hold for 0.25 seconds
                cy.get('.box')
                    .eq(0)
                    .trigger('touchend', {
                        changedTouches: [{ clientX: offset.left, clientY: offset.top }],
                    });
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, true, false, false),
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
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within((elem) => {
                const offset = elem.offset();

                if (!offset) {
                    throw new Error('Expected element to have a valid offset.');
                }
                cy.get('.box')
                    .eq(0)
                    .trigger('touchstart', {
                        touches: [{ clientX: offset.left, clientY: offset.top }],
                    });
                cy.wait(250); // Hold for 0.25 seconds
                cy.get('.box')
                    .eq(0)
                    .trigger('touchend', {
                        changedTouches: [{ clientX: offset.left, clientY: offset.top }],
                    });
            });
        cy.verifyBoardMatches([
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
        ]);
    });

    it('should allow player to click on a tile to reveal it if it was flagged', () => {
        cy.verifyBoardMatches([
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
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(1).rightclick();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false, false),
                standardMineBlock(1, 0, false, 1, false, true, false, false),
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
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(1).click();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false, false),
                standardMineBlock(1, 0, false, 1, true, false, false, false),
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
        ]);
    });

    it('should not reveal flagged blocks if revealed adjacently', () => {
        cy.verifyBoardMatches([
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
        ]);
        cy.get('.game-board > .row')
            .eq(3)
            .within(() => {
                cy.get('.box').eq(3).rightclick();
            });
        cy.verifyBoardMatches([
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
                standardMineBlock(3, 3, false, 0, false, true, false, false),
            ],
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(3).click();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false, false),
                standardMineBlock(1, 0, false, 1, false, false, false, false),
                standardMineBlock(2, 0, false, 1, true, false, false, false),
                standardMineBlock(3, 0, false, 0, true, false, false, false),
            ],
            [
                standardMineBlock(0, 1, false, 1, false, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false, false),
                standardMineBlock(2, 1, false, 1, true, false, false, false),
                standardMineBlock(3, 1, false, 0, true, false, false, false),
            ],
            [
                standardMineBlock(0, 2, false, 2, false, false, false, false),
                standardMineBlock(1, 2, false, 2, true, false, false, false),
                standardMineBlock(2, 2, false, 1, true, false, false, false),
                standardMineBlock(3, 2, false, 0, true, false, false, false),
            ],
            [
                standardMineBlock(0, 3, true, 0, false, false, false, false),
                standardMineBlock(1, 3, false, 1, true, false, false, false),
                standardMineBlock(2, 3, false, 0, true, false, false, false),
                standardMineBlock(3, 3, false, 0, false, true, false, false),
            ],
        ]);
        // Clicking the flagged block should now reveal it
        cy.get('.game-board > .row')
            .eq(3)
            .within(() => {
                cy.get('.box').eq(3).click();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false, false),
                standardMineBlock(1, 0, false, 1, false, false, false, false),
                standardMineBlock(2, 0, false, 1, true, false, false, false),
                standardMineBlock(3, 0, false, 0, true, false, false, false),
            ],
            [
                standardMineBlock(0, 1, false, 1, false, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false, false),
                standardMineBlock(2, 1, false, 1, true, false, false, false),
                standardMineBlock(3, 1, false, 0, true, false, false, false),
            ],
            [
                standardMineBlock(0, 2, false, 2, false, false, false, false),
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
        ]);
    });

    it('should not reveal incorrectly flagged mines until the game is over', () => {
        cy.verifyBoardMatches([
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
        ]);
        cy.get('.game-board > .row')
            .eq(3)
            .within(() => {
                cy.get('.box').eq(1).rightclick();
            });
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(3).click();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false, false),
                standardMineBlock(1, 0, false, 1, false, false, false, false),
                standardMineBlock(2, 0, false, 1, true, false, false, false),
                standardMineBlock(3, 0, false, 0, true, false, false, false),
            ],
            [
                standardMineBlock(0, 1, false, 1, false, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false, false),
                standardMineBlock(2, 1, false, 1, true, false, false, false),
                standardMineBlock(3, 1, false, 0, true, false, false, false),
            ],
            [
                standardMineBlock(0, 2, false, 2, false, false, false, false),
                standardMineBlock(1, 2, false, 2, true, false, false, false),
                standardMineBlock(2, 2, false, 1, true, false, false, false),
                standardMineBlock(3, 2, false, 0, true, false, false, false),
            ],
            [
                standardMineBlock(0, 3, true, 0, false, false, false, false),
                standardMineBlock(1, 3, false, 1, true, true, false, false),
                standardMineBlock(2, 3, false, 0, true, false, false, false),
                standardMineBlock(3, 3, false, 0, true, false, false, false),
            ],
        ]);
        // The incorrect flag (should not appear)
        cy.get('.game-board > .row')
            .eq(3)
            .within(() => {
                cy.get('.box')
                    .eq(1)
                    .then(($el) => {
                        const win = $el[0].ownerDocument.defaultView;

                        if (!win) {
                            throw new Error('Expected element to have a valid window.');
                        }
                        const before = win.getComputedStyle($el[0], '::before');
                        const background = before.getPropertyValue('background');
                        expect(background).to.not.contain(
                            'linear-gradient(45deg, rgba(0, 0, 0, 0) 45%, rgb(255, 0, 0) 45%, rgb(255, 0, 0) 55%, rgba(0, 0, 0, 0) 55%)'
                        );
                    });
            });
        // Trigger game over
        cy.get('.game-board > .row')
            .eq(1)
            .within(() => {
                cy.get('.box').eq(1).click();
            });
        cy.verifyBoardMatches(
            [
                [
                    standardMineBlock(0, 0, false, 1, true, false, false, false),
                    standardMineBlock(1, 0, false, 1, true, false, false, false),
                    standardMineBlock(2, 0, false, 1, true, false, false, false),
                    standardMineBlock(3, 0, false, 0, true, false, false, false),
                ],
                [
                    standardMineBlock(0, 1, false, 1, true, false, false, false),
                    standardMineBlock(1, 1, true, 0, true, false, true, false),
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
                    standardMineBlock(0, 3, true, 0, true, false, false, false),
                    standardMineBlock(1, 3, false, 1, true, true, false, false),
                    standardMineBlock(2, 3, false, 0, true, false, false, false),
                    standardMineBlock(3, 3, false, 0, true, false, false, false),
                ],
            ],
            {
                isGameOver: true,
            }
        );
        // The incorrect flag (should now appear)
        cy.get('.game-board > .row')
            .eq(3)
            .within(() => {
                cy.get('.box')
                    .eq(1)
                    .then(($el) => {
                        const win = $el[0].ownerDocument.defaultView;

                        if (!win) {
                            throw new Error('Expected element to have a valid window.');
                        }
                        const before = win.getComputedStyle($el[0], '::before');
                        const background = before.getPropertyValue('background');
                        expect(background).to.contain(
                            'linear-gradient(45deg, rgba(0, 0, 0, 0) 45%, rgb(255, 0, 0) 45%, rgb(255, 0, 0) 55%, rgba(0, 0, 0, 0) 55%)'
                        );
                    });
            });
    });

    it('should unflag the block if player clicks on it to reveal the mine', () => {
        cy.verifyBoardMatches([
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
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).click();
            });
        cy.get('.game-board > .row')
            .eq(1)
            .within(() => {
                cy.get('.box').eq(1).rightclick();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, true, false, false, false),
                standardMineBlock(1, 0, false, 1, false, false, false, false),
                standardMineBlock(2, 0, false, 1, false, false, false, false),
                standardMineBlock(3, 0, false, 0, false, false, false, false),
            ],
            [
                standardMineBlock(0, 1, false, 1, false, false, false, false),
                standardMineBlock(1, 1, true, 0, false, true, false, false),
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
        ]);
        cy.get('.game-board > .row')
            .eq(1)
            .within(() => {
                cy.get('.box').eq(1).click();
            });
        cy.verifyBoardMatches(
            [
                [
                    standardMineBlock(0, 0, false, 1, true, false, false, false),
                    standardMineBlock(1, 0, false, 1, true, false, false, false),
                    standardMineBlock(2, 0, false, 1, true, false, false, false),
                    standardMineBlock(3, 0, false, 0, true, false, false, false),
                ],
                [
                    standardMineBlock(0, 1, false, 1, true, false, false, false),
                    standardMineBlock(1, 1, true, 0, true, false, true, false),
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
                    standardMineBlock(0, 3, true, 0, true, false, false, false),
                    standardMineBlock(1, 3, false, 1, true, false, false, false),
                    standardMineBlock(2, 3, false, 0, true, false, false, false),
                    standardMineBlock(3, 3, false, 0, true, false, false, false),
                ],
            ],
            {
                isGameOver: true,
            }
        );
    });

    describe('lose from direct click', () => {
        beforeEach(() => {
            cy.verifyBoardMatches([
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
            ]);
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).click();
                });
            cy.verifyBoardMatches(
                [
                    [
                        standardMineBlock(0, 0, false, 1, true, false, false, false),
                        standardMineBlock(1, 0, false, 1, true, false, false, false),
                        standardMineBlock(2, 0, false, 1, true, false, false, false),
                        standardMineBlock(3, 0, false, 0, true, false, false, false),
                    ],
                    [
                        standardMineBlock(0, 1, false, 1, true, false, false, false),
                        standardMineBlock(1, 1, true, 0, true, false, true, false),
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
                        standardMineBlock(0, 3, true, 0, true, false, false, false),
                        standardMineBlock(1, 3, false, 1, true, false, false, false),
                        standardMineBlock(2, 3, false, 0, true, false, false, false),
                        standardMineBlock(3, 3, false, 0, true, false, false, false),
                    ],
                ],
                {
                    isGameOver: true,
                }
            );
            // Cannot click on a revealed tile to unreveal it
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).click();
                });
            cy.verifyBoardMatches(
                [
                    [
                        standardMineBlock(0, 0, false, 1, true, false, false, false),
                        standardMineBlock(1, 0, false, 1, true, false, false, false),
                        standardMineBlock(2, 0, false, 1, true, false, false, false),
                        standardMineBlock(3, 0, false, 0, true, false, false, false),
                    ],
                    [
                        standardMineBlock(0, 1, false, 1, true, false, false, false),
                        standardMineBlock(1, 1, true, 0, true, false, true, false),
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
                        standardMineBlock(0, 3, true, 0, true, false, false, false),
                        standardMineBlock(1, 3, false, 1, true, false, false, false),
                        standardMineBlock(2, 3, false, 0, true, false, false, false),
                        standardMineBlock(3, 3, false, 0, true, false, false, false),
                    ],
                ],
                {
                    isGameOver: true,
                }
            );
        });

        it('should highlight the spot where player lost', () => {
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box')
                        .eq(1)
                        .should('have.css', 'background-color', LOSING_BLOCK_BACKGROUND_COLOR);
                });

            // Even after refresh, it should still be there
            cy.reload();

            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box')
                        .eq(1)
                        .should('have.css', 'background-color', LOSING_BLOCK_BACKGROUND_COLOR);
                });
        });
    });

    describe('lose from adjacent click', () => {
        beforeEach(() => {
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box')
                        .eq(1)
                        .should('have.css', 'background-color', STANDARD_BLOCK_BACKGROUND_COLOR);
                });
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .should('have.css', 'background-color', STANDARD_BLOCK_BACKGROUND_COLOR);
                });
            cy.verifyBoardMatches([
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
            ]);
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
            cy.verifyBoardMatches(
                [
                    [
                        standardMineBlock(0, 0, false, 1, true, false, false, false),
                        standardMineBlock(1, 0, false, 1, true, false, false, false),
                        standardMineBlock(2, 0, false, 1, true, false, false, false),
                        standardMineBlock(3, 0, false, 0, true, false, false, false),
                    ],
                    [
                        standardMineBlock(0, 1, false, 1, true, true, false, false),
                        standardMineBlock(1, 1, true, 0, true, false, true, false),
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
                        standardMineBlock(0, 3, true, 0, true, false, true, false),
                        standardMineBlock(1, 3, false, 1, true, true, false, false),
                        standardMineBlock(2, 3, false, 0, true, false, false, false),
                        standardMineBlock(3, 3, false, 0, true, false, false, false),
                    ],
                ],
                {
                    isGameOver: true,
                }
            );
        });

        it('should highlight the spots where player lost', () => {
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box')
                        .eq(1)
                        .should('have.css', 'background-color', LOSING_BLOCK_BACKGROUND_COLOR);
                });
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .should('have.css', 'background-color', LOSING_BLOCK_BACKGROUND_COLOR);
                });

            // Even after refresh, it should still be there
            cy.reload();

            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box')
                        .eq(1)
                        .should('have.css', 'background-color', LOSING_BLOCK_BACKGROUND_COLOR);
                });
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .should('have.css', 'background-color', LOSING_BLOCK_BACKGROUND_COLOR);
                });
        });
    });

    it('should highlight which tiles were flagged correctly and which ones were not when player loses', () => {
        cy.verifyBoardMatches([
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
        ]);
        // Correct flag
        cy.get('.game-board > .row')
            .eq(3)
            .within(() => {
                cy.get('.box').eq(0).rightclick();
            });
        // Incorrect flag
        cy.get('.game-board > .row')
            .eq(3)
            .within(() => {
                cy.get('.box').eq(3).rightclick();
            });
        cy.verifyBoardMatches([
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
                standardMineBlock(0, 3, true, 0, false, true, false, false),
                standardMineBlock(1, 3, false, 1, false, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false, false),
                standardMineBlock(3, 3, false, 0, false, true, false, false),
            ],
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).click();
            });
        // Mine click
        cy.get('.game-board > .row')
            .eq(1)
            .within(() => {
                cy.get('.box').eq(1).click();
            });
        cy.verifyBoardMatches(
            [
                [
                    standardMineBlock(0, 0, false, 1, true, false, false, false),
                    standardMineBlock(1, 0, false, 1, true, false, false, false),
                    standardMineBlock(2, 0, false, 1, true, false, false, false),
                    standardMineBlock(3, 0, false, 0, true, false, false, false),
                ],
                [
                    standardMineBlock(0, 1, false, 1, true, false, false, false),
                    standardMineBlock(1, 1, true, 0, true, false, true, false),
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
                    standardMineBlock(0, 3, true, 0, true, true, false, false),
                    standardMineBlock(1, 3, false, 1, true, false, false, false),
                    standardMineBlock(2, 3, false, 0, true, false, false, false),
                    standardMineBlock(3, 3, false, 0, true, true, false, false),
                ],
            ],
            {
                isGameOver: true,
            }
        );

        cy.get('.game-board > .row')
            .eq(3)
            .within(() => {
                // The correct flag
                cy.get('.box')
                    .eq(0)
                    .within(() => {
                        cy.get('img').should('have.attr', 'data-asset', 'img/Flag.png');
                    });
                // The incorrect flag
                cy.get('.box')
                    .eq(3)
                    .then(($el) => {
                        const win = $el[0].ownerDocument.defaultView;

                        if (!win) {
                            throw new Error('Expected element to have a valid window.');
                        }
                        const before = win.getComputedStyle($el[0], '::before');
                        const background = before.getPropertyValue('background');
                        expect(background).to.contain(
                            'linear-gradient(45deg, rgba(0, 0, 0, 0) 45%, rgb(255, 0, 0) 45%, rgb(255, 0, 0) 55%, rgba(0, 0, 0, 0) 55%)'
                        );
                    });
            });

        // Even after refresh, it should still be there
        cy.reload();

        cy.get('.game-board > .row')
            .eq(3)
            .within(() => {
                // The correct flag
                cy.get('.box')
                    .eq(0)
                    .within(() => {
                        cy.get('img').should('have.attr', 'data-asset', 'img/Flag.png');
                    });
                // The incorrect flag
                cy.get('.box')
                    .eq(3)
                    .then(($el) => {
                        const win = $el[0].ownerDocument.defaultView;

                        if (!win) {
                            throw new Error('Expected element to have a valid window.');
                        }
                        const before = win.getComputedStyle($el[0], '::before');
                        const background = before.getPropertyValue('background');
                        expect(background).to.contain(
                            'linear-gradient(45deg, rgba(0, 0, 0, 0) 45%, rgb(255, 0, 0) 45%, rgb(255, 0, 0) 55%, rgba(0, 0, 0, 0) 55%)'
                        );
                    });
            });
    });

    describe('negative mine count', () => {
        describe('low negative mine count', () => {
            it('should display it with a minus sign', () => {
                cy.get('#mine-count-board > img')
                    .eq(0)
                    .should('have.attr', 'data-asset', 'img/digits/0.png');
                cy.get('#mine-count-board > img')
                    .eq(1)
                    .should('have.attr', 'data-asset', 'img/digits/0.png');
                cy.get('#mine-count-board > img')
                    .eq(2)
                    .should('have.attr', 'data-asset', 'img/digits/2.png');
                cy.get('#mine-count-board[data-count="2"]').should('exist');
                cy.get('.game-board > .row')
                    .eq(0)
                    .within(() => {
                        cy.get('.box').eq(0).rightclick();
                    });
                cy.get('#mine-count-board > img')
                    .eq(0)
                    .should('have.attr', 'data-asset', 'img/digits/0.png');
                cy.get('#mine-count-board > img')
                    .eq(1)
                    .should('have.attr', 'data-asset', 'img/digits/0.png');
                cy.get('#mine-count-board > img')
                    .eq(2)
                    .should('have.attr', 'data-asset', 'img/digits/1.png');
                cy.get('#mine-count-board[data-count="1"]').should('exist');
                cy.get('.game-board > .row')
                    .eq(0)
                    .within(() => {
                        cy.get('.box').eq(1).rightclick();
                    });
                cy.get('#mine-count-board > img')
                    .eq(0)
                    .should('have.attr', 'data-asset', 'img/digits/0.png');
                cy.get('#mine-count-board > img')
                    .eq(1)
                    .should('have.attr', 'data-asset', 'img/digits/0.png');
                cy.get('#mine-count-board > img')
                    .eq(2)
                    .should('have.attr', 'data-asset', 'img/digits/0.png');
                cy.get('#mine-count-board[data-count="0"]').should('exist');
                cy.get('.game-board > .row')
                    .eq(0)
                    .within(() => {
                        cy.get('.box').eq(2).rightclick();
                    });
                cy.get('#mine-count-board > img')
                    .eq(0)
                    .should('have.attr', 'data-asset', 'img/digits/-.png');
                cy.get('#mine-count-board > img')
                    .eq(1)
                    .should('have.attr', 'data-asset', 'img/digits/0.png');
                cy.get('#mine-count-board > img')
                    .eq(2)
                    .should('have.attr', 'data-asset', 'img/digits/1.png');
                cy.get('#mine-count-board[data-count="-1"]').should('exist');
                cy.get('.game-board > .row')
                    .eq(0)
                    .within(() => {
                        cy.get('.box').eq(3).rightclick();
                    });
                cy.get('#mine-count-board > img')
                    .eq(0)
                    .should('have.attr', 'data-asset', 'img/digits/-.png');
                cy.get('#mine-count-board > img')
                    .eq(1)
                    .should('have.attr', 'data-asset', 'img/digits/0.png');
                cy.get('#mine-count-board > img')
                    .eq(2)
                    .should('have.attr', 'data-asset', 'img/digits/2.png');
                cy.get('#mine-count-board[data-count="-2"]').should('exist');
            });
        });

        describe('high negative mine count', () => {
            beforeEach(() => {
                cy.fixture('high-negative-mine-count-game-state.json').then((gameState) => {
                    cy.visit('/', {
                        onBeforeLoad: () => {
                            const persistentState: GamePersistentState = {
                                highscore: {},
                                unlockables: {},
                                hasPlayedBefore: true,
                            };
                            window.localStorage.setItem('game-state', JSON.stringify(gameState));
                            window.localStorage.setItem(
                                'persistent-state',
                                JSON.stringify(persistentState)
                            );
                        },
                    });
                    cy.waitForGameReady();
                });
            });

            describe('digit board', () => {
                it('should handle three digit negative number by trimming the first digit, and the full digit value should be in data attribute', () => {
                    cy.get('#mine-count-board > img')
                        .eq(0)
                        .should('have.attr', 'data-asset', 'img/digits/-.png');
                    cy.get('#mine-count-board > img')
                        .eq(1)
                        .should('have.attr', 'data-asset', 'img/digits/9.png');
                    cy.get('#mine-count-board > img')
                        .eq(2)
                        .should('have.attr', 'data-asset', 'img/digits/8.png');
                    cy.get('#mine-count-board[data-count="-98"]').should('exist');
                    cy.get('.game-board > .row')
                        .eq(5)
                        .within(() => {
                            cy.get('.box').eq(17).rightclick();
                        });
                    cy.get('#mine-count-board > img')
                        .eq(0)
                        .should('have.attr', 'data-asset', 'img/digits/-.png');
                    cy.get('#mine-count-board > img')
                        .eq(1)
                        .should('have.attr', 'data-asset', 'img/digits/9.png');
                    cy.get('#mine-count-board > img')
                        .eq(2)
                        .should('have.attr', 'data-asset', 'img/digits/9.png');
                    cy.get('#mine-count-board[data-count="-99"]').should('exist');
                    cy.get('.game-board > .row')
                        .eq(6)
                        .within(() => {
                            cy.get('.box').eq(17).rightclick();
                        });
                    cy.get('#mine-count-board > img')
                        .eq(0)
                        .should('have.attr', 'data-asset', 'img/digits/-.png');
                    cy.get('#mine-count-board > img')
                        .eq(1)
                        .should('have.attr', 'data-asset', 'img/digits/0.png');
                    cy.get('#mine-count-board > img')
                        .eq(2)
                        .should('have.attr', 'data-asset', 'img/digits/0.png');
                    cy.get('#mine-count-board[data-count="-100"]').should('exist');
                    cy.get('.game-board > .row')
                        .eq(7)
                        .within(() => {
                            cy.get('.box').eq(17).rightclick();
                        });
                    cy.get('#mine-count-board > img')
                        .eq(0)
                        .should('have.attr', 'data-asset', 'img/digits/-.png');
                    cy.get('#mine-count-board > img')
                        .eq(1)
                        .should('have.attr', 'data-asset', 'img/digits/0.png');
                    cy.get('#mine-count-board > img')
                        .eq(2)
                        .should('have.attr', 'data-asset', 'img/digits/1.png');
                    cy.get('#mine-count-board[data-count="-101"]').should('exist');
                });
            });
        });
    });

    describe('impossible scenarios', () => {
        it('should win instantly on first click when no mines exist', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 0, false, false, false, false),
                                standardMineBlock(1, 0, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 1, false, 0, false, false, false, false),
                                standardMineBlock(1, 1, false, 0, false, false, false, false),
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
                            numberOfMines: 0,
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
                    window.localStorage.setItem(
                        'persistent-state',
                        JSON.stringify(persistentState)
                    );
                },
            });

            cy.waitForGameReady();

            cy.get('.box').first().click();

            cy.get('#new-game img').should('have.attr', 'data-asset', 'img/Smiley_proud.png');

            cy.window().then((win) => {
                const storedState = win.localStorage.getItem('game-state');
                expect(storedState).to.not.equal(null);
                const gameState = JSON.parse(storedState as string) as GameState;
                expect(gameState.won).to.equal(true);
                expect(gameState.ended).to.equal(true);
            });
        });
    });
});
