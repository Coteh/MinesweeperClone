/// <reference types="cypress" />

import { GameState, GamePersistentState, MineBlock } from '../../../src/game';

const standardMineBlock: (
    x: number,
    y: number,
    isMine: boolean,
    adjMinesCount: number,
    isRevealed: boolean,
    isFlagged: boolean,
    isLosingSpot: boolean
) => MineBlock = (x, y, isMine, adjMinesCount, isRevealed, isFlagged, isLosingSpot) => {
    return {
        x,
        y,
        isMine,
        isRevealed,
        isLosingSpot,
        isFlagged,
        adjMinesCount,
    };
};

describe('gameplay', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {
                const gameState: GameState = {
                    // TODO: Expand the board used for testing from 4x4 to 9x9 easy mode board
                    board: [
                        [
                            standardMineBlock(0, 0, false, 1, false, false, false),
                            standardMineBlock(0, 1, false, 1, false, false, false),
                            standardMineBlock(0, 2, false, 1, false, false, false),
                            standardMineBlock(0, 3, false, 0, false, false, false),
                        ],
                        [
                            standardMineBlock(1, 0, false, 1, false, false, false),
                            standardMineBlock(1, 1, true, 0, false, false, false),
                            standardMineBlock(1, 2, false, 1, false, false, false),
                            standardMineBlock(1, 3, false, 0, false, false, false),
                        ],
                        [
                            standardMineBlock(2, 0, false, 2, false, false, false),
                            standardMineBlock(2, 1, false, 2, false, false, false),
                            standardMineBlock(2, 2, false, 1, false, false, false),
                            standardMineBlock(2, 3, false, 0, false, false, false),
                        ],
                        [
                            standardMineBlock(3, 0, true, 0, false, false, false),
                            standardMineBlock(3, 1, false, 1, false, false, false),
                            standardMineBlock(3, 2, false, 0, false, false, false),
                            standardMineBlock(3, 3, false, 0, false, false, false),
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
                    },
                    elapsedTimeMS: 0,
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
    });

    it('should allow player to click on a tile', () => {
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).click();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, true, false, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
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
                standardMineBlock(0, 0, false, 1, true, false, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
    });

    it('should allow player to tap on a tile', () => {
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within((elem) => {
                // NOTE: Calling realTouch will flag the tile instead of revealing it, but in real
                //       gameplay it won't do that unless the player holds it down for 0.25 seconds.
                // cy.get('.box').eq(0).realTouch();
                cy.get('.box')
                    .eq(0)
                    .trigger('touchstart', {
                        touches: [{ clientX: elem.offset().left, clientY: elem.offset().top }],
                    });
                cy.get('.box')
                    .eq(0)
                    .trigger('touchend', {
                        changedTouches: [
                            { clientX: elem.offset().left, clientY: elem.offset().top },
                        ],
                    });
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, true, false, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
        // Cannot tap on a revealed tile to unreveal it
        cy.get('.game-board > .row')
            .eq(0)
            .within((elem) => {
                // NOTE: Calling realTouch will flag the tile instead of revealing it, but in real
                //       gameplay it won't do that unless the player holds it down for 0.25 seconds.
                // cy.get('.box').eq(0).realTouch();
                cy.get('.box')
                    .eq(0)
                    .trigger('touchstart', {
                        touches: [{ clientX: elem.offset().left, clientY: elem.offset().top }],
                    });
                cy.get('.box')
                    .eq(0)
                    .trigger('touchend', {
                        changedTouches: [
                            { clientX: elem.offset().left, clientY: elem.offset().top },
                        ],
                    });
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, true, false, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
    });

    it('should allow player to right click to flag/unflag a tile', () => {
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).rightclick();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, true, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).rightclick();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
    });

    it('should allow player to hold tap to flag/unflag a tile', () => {
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within((elem) => {
                cy.get('.box')
                    .eq(0)
                    .trigger('touchstart', {
                        touches: [{ clientX: elem.offset().left, clientY: elem.offset().top }],
                    });
                cy.wait(250); // Hold for 0.25 seconds
                cy.get('.box')
                    .eq(0)
                    .trigger('touchend', {
                        changedTouches: [
                            { clientX: elem.offset().left, clientY: elem.offset().top },
                        ],
                    });
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, true, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within((elem) => {
                cy.get('.box')
                    .eq(0)
                    .trigger('touchstart', {
                        touches: [{ clientX: elem.offset().left, clientY: elem.offset().top }],
                    });
                cy.wait(250); // Hold for 0.25 seconds
                cy.get('.box')
                    .eq(0)
                    .trigger('touchend', {
                        changedTouches: [
                            { clientX: elem.offset().left, clientY: elem.offset().top },
                        ],
                    });
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false),
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(0, 2, false, 1, false, false, false),
                standardMineBlock(0, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(1, 2, false, 1, false, false, false),
                standardMineBlock(1, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false, false, false),
                standardMineBlock(2, 1, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false, false, false),
                standardMineBlock(3, 1, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
    });

    describe('lose', () => {
        beforeEach(() => {
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).should('not.have.class', 'losing');
                });
            cy.verifyBoardMatches([
                [
                    standardMineBlock(0, 0, false, 1, false, false, false),
                    standardMineBlock(0, 1, false, 1, false, false, false),
                    standardMineBlock(0, 2, false, 1, false, false, false),
                    standardMineBlock(0, 3, false, 0, false, false, false),
                ],
                [
                    standardMineBlock(1, 0, false, 1, false, false, false),
                    standardMineBlock(1, 1, true, 0, false, false, false),
                    standardMineBlock(1, 2, false, 1, false, false, false),
                    standardMineBlock(1, 3, false, 0, false, false, false),
                ],
                [
                    standardMineBlock(2, 0, false, 2, false, false, false),
                    standardMineBlock(2, 1, false, 2, false, false, false),
                    standardMineBlock(2, 2, false, 1, false, false, false),
                    standardMineBlock(2, 3, false, 0, false, false, false),
                ],
                [
                    standardMineBlock(3, 0, true, 0, false, false, false),
                    standardMineBlock(3, 1, false, 1, false, false, false),
                    standardMineBlock(3, 2, false, 0, false, false, false),
                    standardMineBlock(3, 3, false, 0, false, false, false),
                ],
            ]);
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).click();
                });
            cy.verifyBoardMatches([
                [
                    standardMineBlock(0, 0, false, 1, true, false, false),
                    standardMineBlock(0, 1, false, 1, true, false, false),
                    standardMineBlock(0, 2, false, 1, true, false, false),
                    standardMineBlock(0, 3, false, 0, true, false, false),
                ],
                [
                    standardMineBlock(1, 0, false, 1, true, false, false),
                    standardMineBlock(1, 1, true, 0, true, false, true),
                    standardMineBlock(1, 2, false, 1, true, false, false),
                    standardMineBlock(1, 3, false, 0, true, false, false),
                ],
                [
                    standardMineBlock(2, 0, false, 2, true, false, false),
                    standardMineBlock(2, 1, false, 2, true, false, false),
                    standardMineBlock(2, 2, false, 1, true, false, false),
                    standardMineBlock(2, 3, false, 0, true, false, false),
                ],
                [
                    standardMineBlock(3, 0, true, 0, true, false, false),
                    standardMineBlock(3, 1, false, 1, true, false, false),
                    standardMineBlock(3, 2, false, 0, true, false, false),
                    standardMineBlock(3, 3, false, 0, true, false, false),
                ],
            ]);
            // Cannot click on a revealed tile to unreveal it
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).click();
                });
            cy.verifyBoardMatches([
                [
                    standardMineBlock(0, 0, false, 1, true, false, false),
                    standardMineBlock(0, 1, false, 1, true, false, false),
                    standardMineBlock(0, 2, false, 1, true, false, false),
                    standardMineBlock(0, 3, false, 0, true, false, false),
                ],
                [
                    standardMineBlock(1, 0, false, 1, true, false, false),
                    standardMineBlock(1, 1, true, 0, true, false, true),
                    standardMineBlock(1, 2, false, 1, true, false, false),
                    standardMineBlock(1, 3, false, 0, true, false, false),
                ],
                [
                    standardMineBlock(2, 0, false, 2, true, false, false),
                    standardMineBlock(2, 1, false, 2, true, false, false),
                    standardMineBlock(2, 2, false, 1, true, false, false),
                    standardMineBlock(2, 3, false, 0, true, false, false),
                ],
                [
                    standardMineBlock(3, 0, true, 0, true, false, false),
                    standardMineBlock(3, 1, false, 1, true, false, false),
                    standardMineBlock(3, 2, false, 0, true, false, false),
                    standardMineBlock(3, 3, false, 0, true, false, false),
                ],
            ]);
        });

        it('should highlight the spot where you lost in red', () => {
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).should('have.class', 'losing');
                });

            cy.reload();

            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).should('have.class', 'losing');
                });
        });
    });
});
