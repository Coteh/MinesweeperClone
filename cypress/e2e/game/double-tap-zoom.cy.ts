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

describe('double-tap zoom', () => {
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

    it('should zoom in when double-tapping on the board', () => {
        // Get initial transform scale
        cy.get('#zoomable').then(($zoomable) => {
            const initialTransform = $zoomable.css('transform');
            cy.log('Initial transform:', initialTransform);

            // Perform double-tap on the board
            cy.get('#zoomable').then((elem) => {
                const x = elem.offset().left + elem.width() / 2;
                const y = elem.offset().top + elem.height() / 2;

                // First tap
                cy.get('#zoomable').trigger('touchstart', {
                    touches: [{ clientX: x, clientY: y }],
                });
                cy.get('#zoomable').trigger('touchend', {
                    changedTouches: [{ clientX: x, clientY: y }],
                });

                // Small delay
                cy.wait(100);

                // Second tap
                cy.get('#zoomable').trigger('touchstart', {
                    touches: [{ clientX: x, clientY: y }],
                });
                cy.get('#zoomable').trigger('touchend', {
                    changedTouches: [{ clientX: x, clientY: y }],
                });
            });

            // Wait for animation to complete
            cy.wait(300);

            // Check that zoom has increased
            cy.get('#zoomable').then(($zoomable) => {
                const finalTransform = $zoomable.css('transform');
                cy.log('Final transform:', finalTransform);
                
                // Extract scale from matrix
                const initialMatrix = initialTransform.match(/matrix\(([^)]+)\)/);
                const finalMatrix = finalTransform.match(/matrix\(([^)]+)\)/);
                
                if (initialMatrix && finalMatrix) {
                    const initialScale = parseFloat(initialMatrix[1].split(',')[0]);
                    const finalScale = parseFloat(finalMatrix[1].split(',')[0]);
                    
                    cy.log('Initial scale:', initialScale);
                    cy.log('Final scale:', finalScale);
                    
                    // Verify that scale increased
                    expect(finalScale).to.be.greaterThan(initialScale);
                }
            });
        });
    });

    it('should zoom in when double-clicking with mouse', () => {
        // Get initial transform scale
        cy.get('#zoomable').then(($zoomable) => {
            const initialTransform = $zoomable.css('transform');
            cy.log('Initial transform:', initialTransform);

            // Perform double-click on the board
            cy.get('#zoomable').dblclick();

            // Wait for animation to complete
            cy.wait(300);

            // Check that zoom has increased
            cy.get('#zoomable').then(($zoomable) => {
                const finalTransform = $zoomable.css('transform');
                cy.log('Final transform:', finalTransform);
                
                // Extract scale from matrix
                const initialMatrix = initialTransform.match(/matrix\(([^)]+)\)/);
                const finalMatrix = finalTransform.match(/matrix\(([^)]+)\)/);
                
                if (initialMatrix && finalMatrix) {
                    const initialScale = parseFloat(initialMatrix[1].split(',')[0]);
                    const finalScale = parseFloat(finalMatrix[1].split(',')[0]);
                    
                    cy.log('Initial scale:', initialScale);
                    cy.log('Final scale:', finalScale);
                    
                    // Verify that scale increased
                    expect(finalScale).to.be.greaterThan(initialScale);
                }
            });
        });
    });

    it('should not zoom if taps are too far apart in time', () => {
        // Get initial transform scale
        cy.get('#zoomable').then(($zoomable) => {
            const initialTransform = $zoomable.css('transform');
            cy.log('Initial transform:', initialTransform);

            // Perform taps with long delay
            cy.get('#zoomable').then((elem) => {
                const x = elem.offset().left + elem.width() / 2;
                const y = elem.offset().top + elem.height() / 2;

                // First tap
                cy.get('#zoomable').trigger('touchstart', {
                    touches: [{ clientX: x, clientY: y }],
                });
                cy.get('#zoomable').trigger('touchend', {
                    changedTouches: [{ clientX: x, clientY: y }],
                });

                // Long delay (more than double-tap threshold)
                cy.wait(400);

                // Second tap
                cy.get('#zoomable').trigger('touchstart', {
                    touches: [{ clientX: x, clientY: y }],
                });
                cy.get('#zoomable').trigger('touchend', {
                    changedTouches: [{ clientX: x, clientY: y }],
                });
            });

            // Wait a bit
            cy.wait(300);

            // Check that zoom has NOT increased
            cy.get('#zoomable').then(($zoomable) => {
                const finalTransform = $zoomable.css('transform');
                cy.log('Final transform:', finalTransform);
                
                // Transform should be the same (or very similar due to rounding)
                expect(finalTransform).to.equal(initialTransform);
            });
        });
    });

    it('should not zoom if taps are too far apart in distance', () => {
        // Get initial transform scale
        cy.get('#zoomable').then(($zoomable) => {
            const initialTransform = $zoomable.css('transform');
            cy.log('Initial transform:', initialTransform);

            // Perform taps at different locations
            cy.get('#zoomable').then((elem) => {
                const x1 = elem.offset().left + 50;
                const y1 = elem.offset().top + 50;
                const x2 = elem.offset().left + 150;
                const y2 = elem.offset().top + 150;

                // First tap
                cy.get('#zoomable').trigger('touchstart', {
                    touches: [{ clientX: x1, clientY: y1 }],
                });
                cy.get('#zoomable').trigger('touchend', {
                    changedTouches: [{ clientX: x1, clientY: y1 }],
                });

                // Small delay
                cy.wait(100);

                // Second tap at different location
                cy.get('#zoomable').trigger('touchstart', {
                    touches: [{ clientX: x2, clientY: y2 }],
                });
                cy.get('#zoomable').trigger('touchend', {
                    changedTouches: [{ clientX: x2, clientY: y2 }],
                });
            });

            // Wait a bit
            cy.wait(300);

            // Check that zoom has NOT increased
            cy.get('#zoomable').then(($zoomable) => {
                const finalTransform = $zoomable.css('transform');
                cy.log('Final transform:', finalTransform);
                
                // Transform should be the same (or very similar due to rounding)
                expect(finalTransform).to.equal(initialTransform);
            });
        });
    });

    it('should not reveal tiles when double-tapping', () => {
        // Get initial transform scale
        cy.get('#zoomable').then(($zoomable) => {
            const initialTransform = $zoomable.css('transform');
            cy.log('Initial transform:', initialTransform);

            // Perform double-tap on an unrevealed tile
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(1).then((elem) => {
                        const x = elem.offset().left + elem.width() / 2;
                        const y = elem.offset().top + elem.height() / 2;

                        // First tap
                        cy.get('.box').eq(1).trigger('touchstart', {
                            touches: [{ clientX: x, clientY: y }],
                        });
                        cy.get('.box').eq(1).trigger('touchend', {
                            changedTouches: [{ clientX: x, clientY: y }],
                        });

                        // Small delay
                        cy.wait(100);

                        // Second tap
                        cy.get('.box').eq(1).trigger('touchstart', {
                            touches: [{ clientX: x, clientY: y }],
                        });
                        cy.get('.box').eq(1).trigger('touchend', {
                            changedTouches: [{ clientX: x, clientY: y }],
                        });
                    });
                });

            // Wait for animation to complete
            cy.wait(300);

            // Verify zoom increased
            cy.get('#zoomable').then(($zoomable) => {
                const finalTransform = $zoomable.css('transform');
                const initialMatrix = initialTransform.match(/matrix\(([^)]+)\)/);
                const finalMatrix = finalTransform.match(/matrix\(([^)]+)\)/);
                
                if (initialMatrix && finalMatrix) {
                    const initialScale = parseFloat(initialMatrix[1].split(',')[0]);
                    const finalScale = parseFloat(finalMatrix[1].split(',')[0]);
                    expect(finalScale).to.be.greaterThan(initialScale);
                }
            });

            // Verify tile was NOT revealed
            cy.get('.game-board > .row')
                .eq(0)
                .within(() => {
                    cy.get('.box').eq(1).should('not.have.class', 'revealed');
                });
        });
    });

    it('should not show preview mode when double-tapping on revealed tile', () => {
        // First reveal a tile
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).then((elem) => {
                    const x = elem.offset().left + elem.width() / 2;
                    const y = elem.offset().top + elem.height() / 2;

                    cy.get('.box').eq(0).trigger('touchstart', {
                        touches: [{ clientX: x, clientY: y }],
                    });
                    cy.get('.box').eq(0).trigger('touchend', {
                        changedTouches: [{ clientX: x, clientY: y }],
                    });
                });
            });

        // Wait for reveal
        cy.wait(350);

        // Verify tile is revealed
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).should('have.class', 'revealed');
            });

        // Now double-tap on the revealed tile
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).then((elem) => {
                    const x = elem.offset().left + elem.width() / 2;
                    const y = elem.offset().top + elem.height() / 2;

                    // First tap
                    cy.get('.box').eq(0).trigger('touchstart', {
                        touches: [{ clientX: x, clientY: y }],
                    });
                    cy.get('.box').eq(0).trigger('touchend', {
                        changedTouches: [{ clientX: x, clientY: y }],
                    });

                    // Small delay
                    cy.wait(100);

                    // Second tap
                    cy.get('.box').eq(0).trigger('touchstart', {
                        touches: [{ clientX: x, clientY: y }],
                    });
                    cy.get('.box').eq(0).trigger('touchend', {
                        changedTouches: [{ clientX: x, clientY: y }],
                    });
                });
            });

        // Wait for animation
        cy.wait(300);

        // Verify no tiles have preview class
        cy.get('.game-board .box.preview').should('have.length', 0);
    });

    it('should still allow single tap to reveal tiles', () => {
        // Verify initial board state
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

        // Perform single tap on a tile
        cy.get('.game-board > .row')
            .eq(0)
            .within((elem) => {
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

        // Verify that tile was revealed
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
});
