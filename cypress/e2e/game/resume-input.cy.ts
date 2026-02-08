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

describe('app resume input handling', () => {
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

    describe('touch input after visibility change', () => {
        it('should reveal tile on quick tap even after app resume (grace period)', () => {
            // Simulate app backgrounding/foregrounding by triggering visibilitychange
            cy.window().then((win) => {
                // Background the app
                Object.defineProperty(win.document, 'visibilityState', {
                    writable: true,
                    configurable: true,
                    value: 'hidden',
                });
                win.document.dispatchEvent(new Event('visibilitychange'));
            });

            // Wait a moment
            cy.wait(100);

            // Foreground the app
            cy.window().then((win) => {
                Object.defineProperty(win.document, 'visibilityState', {
                    writable: true,
                    configurable: true,
                    value: 'visible',
                });
                win.document.dispatchEvent(new Event('visibilitychange'));
            });

            // Immediately after resume, tap a tile (quickly)
            // Even if there's processing delay, it should reveal, not flag
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    // Add a small delay to simulate processing delay after resume
                    // This would normally cause a flag action, but our fix prevents it
                    cy.wait(300);
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Verify the tile is revealed, not flagged
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'revealed');
                    // Ensure no flag image exists
                    cy.get('.box').eq(0).find('img[src*="Flag.png"]').should('not.exist');
                });
        });

        it('should still allow intentional flag action after grace period expires', () => {
            // Simulate app backgrounding/foregrounding
            cy.window().then((win) => {
                Object.defineProperty(win.document, 'visibilityState', {
                    writable: true,
                    configurable: true,
                    value: 'hidden',
                });
                win.document.dispatchEvent(new Event('visibilitychange'));
            });

            cy.wait(100);

            cy.window().then((win) => {
                Object.defineProperty(win.document, 'visibilityState', {
                    writable: true,
                    configurable: true,
                    value: 'visible',
                });
                win.document.dispatchEvent(new Event('visibilitychange'));
            });

            // Wait for grace period to expire (1000ms)
            cy.wait(1100);

            // Now a long press should still work correctly
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box')
                        .eq(1)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    cy.wait(300); // Hold for 300ms (> 250ms threshold)
                    cy.get('.box')
                        .eq(1)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Verify the tile is flagged
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).find('img[src*="Flag.png"]').should('exist');
                    // Tile should not be revealed
                    cy.get('.box').eq(1).should('not.have.class', 'revealed');
                });
        });

        it('should reveal on quick tap within grace period even if held longer than 250ms', () => {
            // This test specifically verifies the bug fix: a tap that crosses the 250ms
            // threshold due to processing delay should still reveal if within grace period

            cy.window().then((win) => {
                Object.defineProperty(win.document, 'visibilityState', {
                    writable: true,
                    configurable: true,
                    value: 'hidden',
                });
                win.document.dispatchEvent(new Event('visibilitychange'));
            });

            cy.wait(100);

            cy.window().then((win) => {
                Object.defineProperty(win.document, 'visibilityState', {
                    writable: true,
                    configurable: true,
                    value: 'visible',
                });
                win.document.dispatchEvent(new Event('visibilitychange'));
            });

            // Immediately tap with a delay that would normally trigger flag
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box')
                        .eq(2)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    // Wait 400ms - normally this would flag, but grace period prevents it
                    cy.wait(400);
                    cy.get('.box')
                        .eq(2)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Verify the tile is revealed, not flagged
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(2).should('have.class', 'revealed');
                    cy.get('.box').eq(2).find('img[src*="Flag.png"]').should('not.exist');
                });
        });
    });

    describe('normal flag behavior without resume', () => {
        it('should still flag on long press in normal operation', () => {
            // Without app resume, long press should still work
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box')
                        .eq(1)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    cy.wait(300); // Hold for 300ms (> 250ms threshold)
                    cy.get('.box')
                        .eq(1)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Verify the tile is flagged
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).find('img[src*="Flag.png"]').should('exist');
                });
        });

        it('should reveal on quick tap in normal operation', () => {
            // Without app resume, quick tap should reveal
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Verify the tile is revealed
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'revealed');
                });
        });
    });
});
