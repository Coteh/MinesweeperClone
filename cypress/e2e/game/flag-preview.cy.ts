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
    isQuestionMark: boolean,
) => MineBlock = (
    x,
    y,
    isMine,
    adjMinesCount,
    isRevealed,
    isFlagged,
    isLosingSpot,
    isQuestionMark,
) => {
    return { x, y, isMine, isRevealed, isLosingSpot, isFlagged, isQuestionMark, adjMinesCount };
};

const defaultBoard = [
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
];

const persistentState: GamePersistentState = {
    highscore: {},
    unlockables: {},
    hasPlayedBefore: true,
};

const visitWithBoard = (board = defaultBoard, ended = false) => {
    cy.visit('/', {
        onBeforeLoad: () => {
            const gameState: GameState = {
                board,
                ended,
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
            window.localStorage.setItem('ms-game-state', JSON.stringify(gameState));
            window.localStorage.setItem('ms-persistent-state', JSON.stringify(persistentState));
        },
    });
    cy.waitForGameReady();
};

describe('flag preview functionality', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
    });

    describe('touch — flag add preview (happy path)', () => {
        it('shows flag preview after hold threshold and places flag on release', () => {
            visitWithBoard();
            cy.clock();

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                });

            // Advance past threshold
            cy.tick(250);

            // Preview element should be visible
            cy.get('.flag-preview').should('exist');

            // Release
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Preview element should be gone
            cy.get('.flag-preview').should('not.exist');

            // Tile should now have a flag
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).find('img[data-asset="img/Flag.png"]').should('exist');
                });

            // Mine counter should update (was 2, now 1 flag placed)
            cy.get('#mine-count-board').should('have.attr', 'data-count', '1');
        });
    });

    describe('touch — flag removal preview (happy path)', () => {
        it('shows removal preview after hold threshold and removes flag on release', () => {
            visitWithBoard();

            // Pre-flag a tile via right-click
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).rightclick();
                });

            // Verify it's flagged
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).find('img[data-asset="img/Flag.png"]').should('exist');
                });

            cy.clock();

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                });

            // Advance past threshold
            cy.tick(250);

            // Preview element should be visible (flag removal)
            cy.get('.flag-preview').should('exist');

            // Release
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Preview element should be gone
            cy.get('.flag-preview').should('not.exist');

            // Tile should no longer have a flag
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).find('img[data-asset="img/Flag.png"]').should('not.exist');
                });

            // Mine counter should be back to 2
            cy.get('#mine-count-board').should('have.attr', 'data-count', '2');
        });
    });

    describe('touch — hold released before threshold', () => {
        it('does not show preview and does not place flag if released early', () => {
            visitWithBoard();
            cy.clock();

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                });

            // Advance only 100ms — below threshold
            cy.tick(100);

            // Release before threshold
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // No preview element
            cy.get('.flag-preview').should('not.exist');

            // Tile was revealed (normal tap), not flagged
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'revealed');
                    cy.get('.box').eq(0).find('img[data-asset="img/Flag.png"]').should('not.exist');
                });
        });
    });

    describe('touch — hold cancelled by pointer movement before threshold', () => {
        it('does not show preview if touch moves beyond threshold before 250ms', () => {
            visitWithBoard();
            cy.clock();

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                });

            // Move more than 15px before threshold fires
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchmove', { touches: [{ clientX: 120, clientY: 100 }] });
                });

            // Advance past threshold — preview should NOT appear because interaction was cancelled
            cy.tick(300);
            cy.get('.flag-preview').should('not.exist');

            // Tile should not be flagged
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).find('img[data-asset="img/Flag.png"]').should('not.exist');
                });
        });
    });

    describe('touch — hold cancelled by pointer movement during preview', () => {
        it('cancels preview when touch moves beyond threshold after preview starts', () => {
            visitWithBoard();
            cy.clock();

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                });

            // Advance past threshold — preview appears
            cy.tick(250);
            cy.get('.flag-preview').should('exist');

            // Move touch beyond 15px to cancel
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchmove', { touches: [{ clientX: 120, clientY: 100 }] });
                });

            // Preview should be gone
            cy.get('.flag-preview').should('not.exist');

            // Tile should not be flagged
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).find('img[data-asset="img/Flag.png"]').should('not.exist');
                });
        });
    });

    describe('touch — hold cancelled by touchcancel', () => {
        it('cancels preview on touchcancel', () => {
            visitWithBoard();
            cy.clock();

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                });

            cy.tick(250);
            cy.get('.flag-preview').should('exist');

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).trigger('touchcancel');
                });

            cy.get('.flag-preview').should('not.exist');

            // No flag placed
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).find('img[data-asset="img/Flag.png"]').should('not.exist');
                });
        });
    });

    describe('desktop mouse — flag preview', () => {
        it('shows flag preview after mouse hold threshold and places flag on release', () => {
            visitWithBoard();
            cy.clock();

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mousedown', { button: 0 });
                });

            cy.tick(250);

            cy.get('.flag-preview').should('exist');

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mouseup', { button: 0 });
                });

            cy.get('.flag-preview').should('not.exist');

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).find('img[data-asset="img/Flag.png"]').should('exist');
                });
        });

        it('cancels preview when mouse leaves tile during hold', () => {
            visitWithBoard();
            cy.clock();

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mousedown', { button: 0 });
                });

            cy.tick(250);
            cy.get('.flag-preview').should('exist');

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mouseleave');
                });

            cy.get('.flag-preview').should('not.exist');

            // No flag placed
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).find('img[data-asset="img/Flag.png"]').should('not.exist');
                });
        });
    });

    describe('no preview when game has already ended', () => {
        it('does not show preview when game is ended', () => {
            visitWithBoard(defaultBoard, true);
            cy.clock();

            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                });

            cy.tick(300);

            cy.get('.flag-preview').should('not.exist');
        });
    });
});
