/// <reference types="cypress" />

import type { Options as ConfettiOptions } from 'canvas-confetti';
import { GameState, GamePersistentState, MineBlock } from '../../../src/game';

declare global {
    interface Window {
        confetti(options?: ConfettiOptions | undefined): Promise<undefined> | null;
    }
}

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

describe('high score system', () => {
    describe('tracking high scores per difficulty', () => {
        it('should save initial high score when winning for the first time on easy', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 0, true, false, false, false),
                                standardMineBlock(1, 0, false, 0, true, false, false, false),
                                standardMineBlock(2, 0, false, 0, true, false, false, false),
                                standardMineBlock(3, 0, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 1, false, 0, true, false, false, false),
                                standardMineBlock(1, 1, true, 0, false, false, false, false),
                                standardMineBlock(2, 1, false, 0, true, false, false, false),
                                standardMineBlock(3, 1, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 2, false, 0, true, false, false, false),
                                standardMineBlock(1, 2, false, 0, true, false, false, false),
                                standardMineBlock(2, 2, false, 0, true, false, false, false),
                                standardMineBlock(3, 2, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 3, true, 0, false, false, false, false),
                                standardMineBlock(1, 3, false, 0, true, false, false, false),
                                standardMineBlock(2, 3, false, 0, true, false, false, false),
                                standardMineBlock(3, 3, false, 0, false, false, false, false),
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
                        elapsedTimeMS: 45000, // 45 seconds
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
                        JSON.stringify(persistentState),
                    );
                },
            });
            cy.waitForGameReady();

            // Click remaining spot to win
            cy.get('#board .row:nth-child(1) .box:nth-child(4)').click();

            // Verify win
            cy.get('.dialog').should('be.visible');

            // Wait for high score dialog to appear (300ms delay)
            cy.wait(400);

            // Verify high score dialog is shown
            cy.get('.dialog h3').should('contain.text', 'New High Score');
            cy.get('.dialog .high-score-time').should('contain.text', '45s (0:45)');

            // Verify persistent state was updated
            cy.window().then((win) => {
                const persistentState = JSON.parse(
                    win.localStorage.getItem('persistent-state') || '{}',
                );
                expect(persistentState.highscore).to.have.property('easy');
                expect(persistentState.highscore.easy).to.equal(45000);
            });
        });

        it('should update high score when achieving a lower time', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 0, true, false, false, false),
                                standardMineBlock(1, 0, false, 0, true, false, false, false),
                                standardMineBlock(2, 0, false, 0, true, false, false, false),
                                standardMineBlock(3, 0, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 1, false, 0, true, false, false, false),
                                standardMineBlock(1, 1, true, 0, false, false, false, false),
                                standardMineBlock(2, 1, false, 0, true, false, false, false),
                                standardMineBlock(3, 1, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 2, false, 0, true, false, false, false),
                                standardMineBlock(1, 2, false, 0, true, false, false, false),
                                standardMineBlock(2, 2, false, 0, true, false, false, false),
                                standardMineBlock(3, 2, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 3, true, 0, false, false, false, false),
                                standardMineBlock(1, 3, false, 0, true, false, false, false),
                                standardMineBlock(2, 3, false, 0, true, false, false, false),
                                standardMineBlock(3, 3, false, 0, false, false, false, false),
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
                        elapsedTimeMS: 30000, // 30 seconds - better than existing 45s
                        spareMineSpot: { x: 0, y: 0 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {
                            easy: 45000, // Existing high score
                        },
                        unlockables: {},
                        hasPlayedBefore: true,
                    };
                    window.localStorage.setItem('game-state', JSON.stringify(gameState));
                    window.localStorage.setItem(
                        'persistent-state',
                        JSON.stringify(persistentState),
                    );
                },
            });
            cy.waitForGameReady();

            // Click remaining spot to win
            cy.get('#board .row:nth-child(1) .box:nth-child(4)').click();

            // Wait for high score dialog
            cy.wait(400);

            // Verify high score dialog is shown with new time
            cy.get('.dialog h3').should('contain.text', 'New High Score');
            cy.get('.dialog .high-score-time').should('contain.text', '30s (0:30)');

            // Verify persistent state was updated with better score
            cy.window().then((win) => {
                const persistentState = JSON.parse(
                    win.localStorage.getItem('persistent-state') || '{}',
                );
                expect(persistentState.highscore.easy).to.equal(30000);
            });
        });

        it('should NOT update high score when achieving a higher time', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 0, true, false, false, false),
                                standardMineBlock(1, 0, false, 0, true, false, false, false),
                                standardMineBlock(2, 0, false, 0, true, false, false, false),
                                standardMineBlock(3, 0, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 1, false, 0, true, false, false, false),
                                standardMineBlock(1, 1, true, 0, false, false, false, false),
                                standardMineBlock(2, 1, false, 0, true, false, false, false),
                                standardMineBlock(3, 1, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 2, false, 0, true, false, false, false),
                                standardMineBlock(1, 2, false, 0, true, false, false, false),
                                standardMineBlock(2, 2, false, 0, true, false, false, false),
                                standardMineBlock(3, 2, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 3, true, 0, false, false, false, false),
                                standardMineBlock(1, 3, false, 0, true, false, false, false),
                                standardMineBlock(2, 3, false, 0, true, false, false, false),
                                standardMineBlock(3, 3, false, 0, false, false, false, false),
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
                        elapsedTimeMS: 60000, // 60 seconds - worse than existing 45s
                        spareMineSpot: { x: 0, y: 0 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {
                            easy: 45000, // Existing high score
                        },
                        unlockables: {},
                        hasPlayedBefore: true,
                    };
                    window.localStorage.setItem('game-state', JSON.stringify(gameState));
                    window.localStorage.setItem(
                        'persistent-state',
                        JSON.stringify(persistentState),
                    );
                },
            });
            cy.waitForGameReady();

            // Click remaining spot to win
            cy.get('#board .row:nth-child(1) .box:nth-child(4)').click();

            // Wait to ensure high score dialog would have appeared if it was going to
            cy.wait(400);

            // Verify high score dialog is NOT shown
            cy.get('.dialog').should('not.exist');

            // Verify persistent state was NOT updated
            cy.window().then((win) => {
                const persistentState = JSON.parse(
                    win.localStorage.getItem('persistent-state') || '{}',
                );
                expect(persistentState.highscore.easy).to.equal(45000); // Still the old score
            });
        });

        it('should NOT display the high score dialog when achieving the same time', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 0, true, false, false, false),
                                standardMineBlock(1, 0, false, 0, true, false, false, false),
                                standardMineBlock(2, 0, false, 0, true, false, false, false),
                                standardMineBlock(3, 0, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 1, false, 0, true, false, false, false),
                                standardMineBlock(1, 1, true, 0, false, false, false, false),
                                standardMineBlock(2, 1, false, 0, true, false, false, false),
                                standardMineBlock(3, 1, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 2, false, 0, true, false, false, false),
                                standardMineBlock(1, 2, false, 0, true, false, false, false),
                                standardMineBlock(2, 2, false, 0, true, false, false, false),
                                standardMineBlock(3, 2, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 3, true, 0, false, false, false, false),
                                standardMineBlock(1, 3, false, 0, true, false, false, false),
                                standardMineBlock(2, 3, false, 0, true, false, false, false),
                                standardMineBlock(3, 3, false, 0, false, false, false, false),
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
                        elapsedTimeMS: 45000, // 45 seconds - same as existing 45s
                        spareMineSpot: { x: 0, y: 0 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {
                            easy: 45000, // Existing high score
                        },
                        unlockables: {},
                        hasPlayedBefore: true,
                    };
                    window.localStorage.setItem('game-state', JSON.stringify(gameState));
                    window.localStorage.setItem(
                        'persistent-state',
                        JSON.stringify(persistentState),
                    );
                },
            });
            cy.waitForGameReady();

            // Click remaining spot to win
            cy.get('#board .row:nth-child(1) .box:nth-child(4)').click();

            // Wait to ensure high score dialog would have appeared if it was going to
            cy.wait(400);

            // Verify high score dialog is NOT shown
            cy.get('.dialog').should('not.exist');

            // Verify persistent state was NOT updated
            cy.window().then((win) => {
                const persistentState = JSON.parse(
                    win.localStorage.getItem('persistent-state') || '{}',
                );
                expect(persistentState.highscore.easy).to.equal(45000); // No change
            });
        });

        it('should maintain separate high scores for different difficulties', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 0, true, false, false, false),
                                standardMineBlock(1, 0, false, 0, true, false, false, false),
                                standardMineBlock(2, 0, false, 0, true, false, false, false),
                                standardMineBlock(3, 0, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 1, false, 0, true, false, false, false),
                                standardMineBlock(1, 1, true, 0, false, false, false, false),
                                standardMineBlock(2, 1, false, 0, true, false, false, false),
                                standardMineBlock(3, 1, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 2, false, 0, true, false, false, false),
                                standardMineBlock(1, 2, false, 0, true, false, false, false),
                                standardMineBlock(2, 2, false, 0, true, false, false, false),
                                standardMineBlock(3, 2, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 3, true, 0, false, false, false, false),
                                standardMineBlock(1, 3, false, 0, true, false, false, false),
                                standardMineBlock(2, 3, false, 0, true, false, false, false),
                                standardMineBlock(3, 3, false, 0, false, false, false, false),
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
                            difficultyKey: 'medium',
                        },
                        elapsedTimeMS: 90000, // 90 seconds on medium
                        spareMineSpot: { x: 0, y: 0 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {
                            easy: 45000, // Existing easy high score
                        },
                        unlockables: {},
                        hasPlayedBefore: true,
                    };
                    window.localStorage.setItem('game-state', JSON.stringify(gameState));
                    window.localStorage.setItem(
                        'persistent-state',
                        JSON.stringify(persistentState),
                    );
                },
            });
            cy.waitForGameReady();

            // Click remaining spot to win
            cy.get('#board .row:nth-child(1) .box:nth-child(4)').click();

            // Wait for high score dialog
            cy.wait(400);

            // Verify high score dialog is shown for medium
            cy.get('.dialog h3').should('contain.text', 'New High Score');
            cy.get('.dialog .high-score-time').should('contain.text', '90s (1:30)');

            // Verify both easy and medium scores are maintained separately
            cy.window().then((win) => {
                const persistentState = JSON.parse(
                    win.localStorage.getItem('persistent-state') || '{}',
                );
                expect(persistentState.highscore.easy).to.equal(45000); // Easy score unchanged
                expect(persistentState.highscore.medium).to.equal(90000); // Medium score added
            });
        });
    });

    describe('leaderboard dialog', () => {
        it('should open leaderboard dialog when clicking leaderboard button', () => {
            cy.clearBrowserCache();
            // Load the page without any persistent state preset,
            // to verify that leaderboard will still open with fresh data.
            cy.visit('/');
            cy.waitForGameReady();

            // Click leaderboard button
            cy.get('.leaderboard-link').click();

            // Verify leaderboard dialog is shown
            cy.get('.dialog').should('be.visible');
            cy.get('.dialog h3').should('contain.text', 'High Scores');
            cy.get('.leaderboard-table').should('be.visible');
        });

        it('should display "—" for difficulties with no high scores', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const persistentState: GamePersistentState = {
                        highscore: {},
                        unlockables: {},
                        hasPlayedBefore: false,
                    };
                    window.localStorage.setItem(
                        'persistent-state',
                        JSON.stringify(persistentState),
                    );
                },
            });
            cy.waitForGameReady();

            // Click leaderboard button
            cy.get('.leaderboard-link').click();

            // Verify all difficulties show "—"
            cy.get('.leaderboard-table tbody tr').each(($row) => {
                cy.wrap($row).find('td').eq(1).should('contain.text', '—');
            });
        });

        it('should display high scores in correct format', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const persistentState: GamePersistentState = {
                        highscore: {
                            easy: 45000, // 45s
                            medium: 125000, // 125s = 2:05
                            hard: 999000, // 999s = 16:39
                        },
                        unlockables: {},
                        hasPlayedBefore: true,
                    };
                    window.localStorage.setItem(
                        'persistent-state',
                        JSON.stringify(persistentState),
                    );
                },
            });
            cy.waitForGameReady();

            // Click leaderboard button
            cy.get('.leaderboard-link').click();

            // Verify leaderboard shows correct values
            cy.get('.leaderboard-table tbody tr')
                .eq(0)
                .find('td')
                .eq(1)
                .should('contain.text', '45s (0:45)');
            cy.get('.leaderboard-table tbody tr')
                .eq(1)
                .find('td')
                .eq(1)
                .should('contain.text', '125s (2:05)');
            cy.get('.leaderboard-table tbody tr')
                .eq(2)
                .find('td')
                .eq(1)
                .should('contain.text', '999s (16:39)');
        });

        it('should display difficulty names with proper capitalization (ie. display name)', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const persistentState: GamePersistentState = {
                        highscore: {
                            easy: 45000, // 45s
                            medium: 125000, // 125s = 2:05
                            hard: 999000, // 999s = 16:39
                        },
                        unlockables: {},
                        hasPlayedBefore: true,
                    };
                    window.localStorage.setItem(
                        'persistent-state',
                        JSON.stringify(persistentState),
                    );
                },
            });
            cy.waitForGameReady();

            // Click leaderboard button
            cy.get('.leaderboard-link').click();

            // Verify difficulty names are capitalized
            cy.get('.leaderboard-table tbody tr')
                .eq(0)
                .find('td')
                .eq(0)
                .should('contain.text', 'Easy');
            cy.get('.leaderboard-table tbody tr')
                .eq(1)
                .find('td')
                .eq(0)
                .should('contain.text', 'Medium');
            cy.get('.leaderboard-table tbody tr')
                .eq(2)
                .find('td')
                .eq(0)
                .should('contain.text', 'Hard');
        });

        it('should close leaderboard dialog when clicking close button', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    const persistentState: GamePersistentState = {
                        highscore: {
                            easy: 45000, // 45s
                            medium: 125000, // 125s = 2:05
                            hard: 999000, // 999s = 16:39
                        },
                        unlockables: {},
                        hasPlayedBefore: true,
                    };
                    window.localStorage.setItem(
                        'persistent-state',
                        JSON.stringify(persistentState),
                    );
                },
            });
            cy.waitForGameReady();

            // Click leaderboard button
            cy.get('.leaderboard-link').click();

            // Dialog should be visible
            cy.get('.dialog').should('be.visible');

            // Click close button
            cy.get('.dialog button.close').click();

            // Dialog should be closed
            cy.get('.dialog').should('not.exist');
        });
    });

    describe('switching difficulties', () => {
        it('should maintain separate high scores after switching difficulties', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: () => {
                    // Start with easy difficulty, almost won state
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 0, true, false, false, false),
                                standardMineBlock(1, 0, false, 0, true, false, false, false),
                                standardMineBlock(2, 0, false, 0, true, false, false, false),
                                standardMineBlock(3, 0, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 1, false, 0, true, false, false, false),
                                standardMineBlock(1, 1, true, 0, false, false, false, false),
                                standardMineBlock(2, 1, false, 0, true, false, false, false),
                                standardMineBlock(3, 1, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 2, false, 0, true, false, false, false),
                                standardMineBlock(1, 2, false, 0, true, false, false, false),
                                standardMineBlock(2, 2, false, 0, true, false, false, false),
                                standardMineBlock(3, 2, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 3, true, 0, false, false, false, false),
                                standardMineBlock(1, 3, false, 0, true, false, false, false),
                                standardMineBlock(2, 3, false, 0, true, false, false, false),
                                standardMineBlock(3, 3, false, 0, false, false, false, false),
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
                        elapsedTimeMS: 50000, // 50 seconds on easy
                        spareMineSpot: { x: 0, y: 0 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {},
                        unlockables: {},
                        hasPlayedBefore: true,
                    };
                    const preferences = {
                        difficulty: 'easy',
                    };
                    window.localStorage.setItem('game-state', JSON.stringify(gameState));
                    window.localStorage.setItem(
                        'persistent-state',
                        JSON.stringify(persistentState),
                    );
                    window.localStorage.setItem('preferences', JSON.stringify(preferences));
                },
            });
            cy.waitForGameReady();

            // Win the easy game
            cy.get('#board .row:nth-child(1) .box:nth-child(4)').click();

            // Wait for high score dialog
            cy.wait(400);

            // Verify high score dialog for easy
            cy.get('.dialog h3').should('contain.text', 'New High Score');
            cy.get('.dialog .high-score-time').should('contain.text', '50s (0:50)');

            // Close the high score dialog
            cy.get('.dialog button.close').click();

            // Verify easy high score was saved
            cy.window().then((win) => {
                const persistentState = JSON.parse(
                    win.localStorage.getItem('persistent-state') || '{}',
                );
                expect(persistentState.highscore.easy).to.equal(50000);
            });

            // Switch to medium difficulty
            cy.changeDifficulty('medium');

            // Set up a near-win state for medium difficulty
            cy.window().then((win) => {
                const mediumGameState: GameState = {
                    board: [
                        [
                            standardMineBlock(0, 0, false, 0, true, false, false, false),
                            standardMineBlock(1, 0, false, 0, true, false, false, false),
                            standardMineBlock(2, 0, false, 0, true, false, false, false),
                            standardMineBlock(3, 0, false, 0, false, false, false, false),
                        ],
                        [
                            standardMineBlock(0, 1, false, 0, true, false, false, false),
                            standardMineBlock(1, 1, true, 0, false, false, false, false),
                            standardMineBlock(2, 1, false, 0, true, false, false, false),
                            standardMineBlock(3, 1, false, 0, false, false, false, false),
                        ],
                        [
                            standardMineBlock(0, 2, false, 0, true, false, false, false),
                            standardMineBlock(1, 2, false, 0, true, false, false, false),
                            standardMineBlock(2, 2, false, 0, true, false, false, false),
                            standardMineBlock(3, 2, false, 0, false, false, false, false),
                        ],
                        [
                            standardMineBlock(0, 3, true, 0, false, false, false, false),
                            standardMineBlock(1, 3, false, 0, true, false, false, false),
                            standardMineBlock(2, 3, false, 0, true, false, false, false),
                            standardMineBlock(3, 3, false, 0, false, false, false, false),
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
                        difficultyKey: 'medium',
                    },
                    elapsedTimeMS: 75000, // 75 seconds on medium
                    spareMineSpot: { x: 0, y: 0 },
                };
                win.localStorage.setItem('game-state', JSON.stringify(mediumGameState));
            });

            // Reload to apply the new game state
            cy.reload();
            cy.waitForGameReady();

            // Win the medium game
            cy.get('#board .row:nth-child(1) .box:nth-child(4)').click();

            // Wait for high score dialog
            cy.wait(400);

            // Verify high score dialog for medium
            cy.get('.dialog h3').should('contain.text', 'New High Score');
            cy.get('.dialog .high-score-time').should('contain.text', '75s (1:15)');

            // Verify both high scores are maintained separately
            cy.window().then((win) => {
                const persistentState = JSON.parse(
                    win.localStorage.getItem('persistent-state') || '{}',
                );
                expect(persistentState.highscore.easy).to.equal(50000);
                expect(persistentState.highscore.medium).to.equal(75000);
            });
        });
    });

    // NOTE: These tests only work if confetti function is attached to `window` object and invoked from there rather than
    // invoked directly, due to how cy.spy only spies on methods of objects rather than standalone functions.
    // I don't really want to add things to `window` for the sole purpose of verifying it in Cypress, especially when I
    // should most likely be verifying this manually anyway to see if the confetti appears correctly on devices.
    // Skipping these tests and testing manually for now.
    describe.skip('confetti animation', () => {
        it('should trigger confetti when achieving a new high score', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: (win) => {
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 0, true, false, false, false),
                                standardMineBlock(1, 0, false, 0, true, false, false, false),
                                standardMineBlock(2, 0, false, 0, true, false, false, false),
                                standardMineBlock(3, 0, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 1, false, 0, true, false, false, false),
                                standardMineBlock(1, 1, true, 0, false, false, false, false),
                                standardMineBlock(2, 1, false, 0, true, false, false, false),
                                standardMineBlock(3, 1, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 2, false, 0, true, false, false, false),
                                standardMineBlock(1, 2, false, 0, true, false, false, false),
                                standardMineBlock(2, 2, false, 0, true, false, false, false),
                                standardMineBlock(3, 2, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 3, true, 0, false, false, false, false),
                                standardMineBlock(1, 3, false, 0, true, false, false, false),
                                standardMineBlock(2, 3, false, 0, true, false, false, false),
                                standardMineBlock(3, 3, false, 0, false, false, false, false),
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
                        elapsedTimeMS: 45000,
                        spareMineSpot: { x: 0, y: 0 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {},
                        unlockables: {},
                        hasPlayedBefore: true,
                    };
                    win.localStorage.setItem('game-state', JSON.stringify(gameState));
                    win.localStorage.setItem('persistent-state', JSON.stringify(persistentState));
                },
            });
            cy.waitForGameReady();

            // Spy on window.confetti after the page loads
            cy.window().then((win) => {
                cy.spy(win, 'confetti').as('confettiSpy');
            });

            // Click remaining spot to win
            cy.get('#board .row:nth-child(1) .box:nth-child(4)').click();

            // Wait for high score dialog to appear (300ms delay)
            cy.wait(400);

            // Verify confetti was called
            cy.get('@confettiSpy').should('have.been.calledOnce');
        });

        it('should NOT trigger confetti when not achieving a high score', () => {
            cy.clearBrowserCache();
            cy.visit('/', {
                onBeforeLoad: (win) => {
                    const gameState: GameState = {
                        board: [
                            [
                                standardMineBlock(0, 0, false, 0, true, false, false, false),
                                standardMineBlock(1, 0, false, 0, true, false, false, false),
                                standardMineBlock(2, 0, false, 0, true, false, false, false),
                                standardMineBlock(3, 0, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 1, false, 0, true, false, false, false),
                                standardMineBlock(1, 1, true, 0, false, false, false, false),
                                standardMineBlock(2, 1, false, 0, true, false, false, false),
                                standardMineBlock(3, 1, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 2, false, 0, true, false, false, false),
                                standardMineBlock(1, 2, false, 0, true, false, false, false),
                                standardMineBlock(2, 2, false, 0, true, false, false, false),
                                standardMineBlock(3, 2, false, 0, false, false, false, false),
                            ],
                            [
                                standardMineBlock(0, 3, true, 0, false, false, false, false),
                                standardMineBlock(1, 3, false, 0, true, false, false, false),
                                standardMineBlock(2, 3, false, 0, true, false, false, false),
                                standardMineBlock(3, 3, false, 0, false, false, false, false),
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
                        elapsedTimeMS: 60000, // Worse than existing 45s
                        spareMineSpot: { x: 0, y: 0 },
                    };
                    const persistentState: GamePersistentState = {
                        highscore: {
                            easy: 45000, // Existing high score
                        },
                        unlockables: {},
                        hasPlayedBefore: true,
                    };
                    win.localStorage.setItem('game-state', JSON.stringify(gameState));
                    win.localStorage.setItem('persistent-state', JSON.stringify(persistentState));
                },
            });
            cy.waitForGameReady();

            // Spy on window.confetti after the page loads
            cy.window().then((win) => {
                cy.spy(win, 'confetti').as('confettiSpy');
            });

            // Click remaining spot to win
            cy.get('#board .row:nth-child(1) .box:nth-child(4)').click();

            // Wait to ensure high score dialog would have appeared if it was going to
            cy.wait(400);

            // Verify high score dialog is NOT shown (which means confetti won't trigger either)
            cy.get('.dialog').should('not.exist');

            // Verify confetti was NOT called
            cy.get('@confettiSpy').should('not.have.been.called');
        });
    });
});
