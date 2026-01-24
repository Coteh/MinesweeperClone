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

describe('hold-to-reveal functionality', () => {
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

    describe('desktop mousedown/mouseup behavior', () => {
        it('should reveal adjacent tiles on mousedown and mouseup on a revealed tile', () => {
            // First reveal a tile by clicking it
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });

            // Flag both mines adjacent to (0,2): mines at (1,1) and (0,3)
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).rightclick();
                });

            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(0).rightclick();
                });

            // Now verify that (0,2) is revealed
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'revealed');
                });

            // Mousedown and mouseup on the revealed tile should reveal adjacent tiles
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mousedown', { button: 0 });
                    cy.get('.box').eq(0).trigger('mouseup', { button: 0 });
                });

            // Verify that adjacent non-flagged tiles are revealed
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'revealed');
                });
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(1).should('have.class', 'revealed');
                });
        });

        it('should show preview state and surprised smiley during mousedown', () => {
            // First reveal a tile
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });

            // Flag the mine
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).rightclick();
                });

            // Check initial smiley face
            cy.get('#new-game img').should('have.attr', 'src').and('include', 'Smiley.png');

            // Mousedown on the revealed tile
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mousedown', { button: 0 });
                });

            // Wait for the preview delay (100ms)
            cy.wait(150);

            // Check that adjacent non-revealed, non-flagged tiles have preview class
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'preview');
                });

            // The flagged tile should NOT have preview class
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).should('not.have.class', 'preview');
                });

            // Check that smiley face changed to surprised
            cy.get('#new-game img')
                .should('have.attr', 'src')
                .and('include', 'Smiley_surprised.png');

            // Release mouse
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mouseup', { button: 0 });
                });

            // Verify preview state is cleared
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('not.have.class', 'preview');
                });

            // Verify smiley face is restored
            cy.get('#new-game img').should('have.attr', 'src').and('include', 'Smiley.png');
        });

        it('should cancel reveal if mouse leaves before mouseup', () => {
            // First reveal a tile
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });

            // Flag the mine
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).rightclick();
                });

            // Mousedown on the revealed tile
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mousedown', { button: 0 });
                });

            // Wait for the preview delay (100ms)
            cy.wait(150);

            // Verify preview class is applied
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'preview');
                });

            // Check that smiley face changed to surprised
            cy.get('#new-game img')
                .should('have.attr', 'src')
                .and('include', 'Smiley_surprised.png');

            // Trigger mouseleave
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mouseleave');
                });

            // Verify preview class is removed
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('not.have.class', 'preview');
                });

            // Verify smiley face is restored
            cy.get('#new-game img').should('have.attr', 'src').and('include', 'Smiley.png');

            // Adjacent tiles should NOT be revealed
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('not.have.class', 'revealed');
                });

            // Trigger mouseup after leaving
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mouseup', { button: 0 });
                });

            // Verify preview class is still removed
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('not.have.class', 'preview');
                });

            // Verify smiley face is still restored
            cy.get('#new-game img').should('have.attr', 'src').and('include', 'Smiley.png');

            // Adjacent tiles should still NOT be revealed
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('not.have.class', 'revealed');
                });
        });
    });

    describe('mobile touch behavior', () => {
        it('should reveal adjacent tiles on touch hold and release', () => {
            // First reveal a tile
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Flag both mines adjacent to (0,2): mines at (1,1) and (0,3)
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box')
                        .eq(1)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    cy.wait(300);
                    cy.get('.box')
                        .eq(1)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    cy.wait(300);
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Touch and release on revealed tile
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Verify adjacent tiles are revealed
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'revealed');
                });
        });

        it('should show preview state and surprised smiley during touch hold', () => {
            // First reveal a tile
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Flag the mine at row 1, col 1
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box')
                        .eq(1)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    cy.wait(300);
                    cy.get('.box')
                        .eq(1)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Flag the other mine at row 3, col 0
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                    cy.wait(300);
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Touch on revealed tile at row 2, col 0
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
                });

            // Wait for the preview delay (100ms)
            cy.wait(150);

            // Verify preview state is applied to adjacent tiles
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'preview');
                });

            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(1).should('have.class', 'preview');
                });

            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(1).should('have.class', 'preview');
                });

            // Verify surprised face is shown
            cy.get('#new-game img')
                .should('have.attr', 'src')
                .and('include', 'Smiley_surprised.png');

            // Release
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });
                });

            // Verify preview state is cleared
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('not.have.class', 'preview');
                });

            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(1).should('not.have.class', 'preview');
                });

            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(1).should('not.have.class', 'preview');
                });

            // Verify smiley face is restored
            cy.get('#new-game img').should('have.attr', 'src').and('include', 'Smiley.png');
        });

        it('should cancel reveal if touch moves beyond threshold', () => {
            // First reveal a tile
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', {
                            touches: [
                                {
                                    clientX: 100,
                                    clientY: 100,
                                },
                            ],
                        });
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', {
                            changedTouches: [
                                {
                                    clientX: 100,
                                    clientY: 100,
                                },
                            ],
                        });
                });

            // Flag the mine
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box')
                        .eq(1)
                        .trigger('touchstart', {
                            touches: [
                                {
                                    clientX: 100,
                                    clientY: 100,
                                },
                            ],
                        });
                    cy.wait(300);
                    cy.get('.box')
                        .eq(1)
                        .trigger('touchend', {
                            changedTouches: [
                                {
                                    clientX: 100,
                                    clientY: 100,
                                },
                            ],
                        });
                });

            // Touch on revealed tile, then move beyond threshold
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchstart', {
                            touches: [
                                {
                                    clientX: 100,
                                    clientY: 100,
                                },
                            ],
                        });
                });

            // Wait for the preview delay (100ms)
            cy.wait(150);

            // Verify preview class exists
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'preview');
                });

            // Check that smiley face changed to surprised
            cy.get('#new-game img')
                .should('have.attr', 'src')
                .and('include', 'Smiley_surprised.png');

            // Move touch >15px
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchmove', {
                            touches: [
                                {
                                    clientX: 120,
                                    clientY: 120,
                                },
                            ],
                        });
                });

            // Verify preview class is removed
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('not.have.class', 'preview');
                });

            // Verify smiley face is restored
            cy.get('#new-game img').should('have.attr', 'src').and('include', 'Smiley.png');

            // Adjacent tiles should NOT be revealed
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(2).should('not.have.class', 'revealed');
                });

            // End the touch
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box')
                        .eq(0)
                        .trigger('touchend', {
                            changedTouches: [
                                {
                                    clientX: 120,
                                    clientY: 120,
                                },
                            ],
                        });
                });

            // Verify preview class is still removed
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('not.have.class', 'preview');
                });

            // Verify smiley face is still restored
            cy.get('#new-game img').should('have.attr', 'src').and('include', 'Smiley.png');

            // Adjacent tiles should still NOT be revealed
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(2).should('not.have.class', 'revealed');
                });
        });
    });

    describe('preview clears on board re-render', () => {
        it('should clear preview classes when a move is made', () => {
            // First reveal a tile
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).click();
                });

            // Flag the mine
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(1).rightclick();
                });

            // Mousedown on the revealed tile to trigger preview
            cy.get('.game-board > .row')
                .eq(2)
                .within(() => {
                    cy.get('.box').eq(0).trigger('mousedown', { button: 0 });
                });

            // Wait for the preview delay (100ms)
            cy.wait(150);

            // Verify preview class exists
            cy.get('.game-board > .row')
                .eq(1)
                .within(() => {
                    cy.get('.box').eq(0).should('have.class', 'preview');
                });

            // Now make a different move (flag another tile) which triggers board re-render
            cy.get('.game-board > .row')
                .eq(3)
                .within(() => {
                    cy.get('.box').eq(3).rightclick();
                });

            // Preview classes should be cleared
            cy.get('.box.preview').should('not.exist');
        });
    });
});
