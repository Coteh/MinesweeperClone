/// <reference types="cypress" />

import { GameState, GamePersistentState, MineBlock } from '../../../src/game';
import { Preferences } from '../../../src/preferences';

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
        adjMinesCount,
    };
};

describe('difficulty', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {
                const gameState: GameState = {
                    board: [
                        [
                            standardMineBlock(0, 0, false, 1),
                            standardMineBlock(1, 0, false, 1),
                            standardMineBlock(2, 0, false, 1),
                            standardMineBlock(3, 0, false, 0),
                        ],
                        [
                            standardMineBlock(0, 1, false, 1),
                            standardMineBlock(1, 1, true, 0),
                            standardMineBlock(2, 1, false, 1),
                            standardMineBlock(3, 1, false, 0),
                        ],
                        [
                            standardMineBlock(0, 2, false, 2),
                            standardMineBlock(1, 2, false, 2),
                            standardMineBlock(2, 2, false, 1),
                            standardMineBlock(3, 2, false, 0),
                        ],
                        [
                            standardMineBlock(0, 3, true, 0),
                            standardMineBlock(1, 3, false, 1),
                            standardMineBlock(2, 3, false, 0),
                            standardMineBlock(3, 3, false, 0),
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
                    spareMineSpot: { x: 0, y: 0 },
                };
                const persistentState: GamePersistentState = {
                    highscore: 0,
                    unlockables: {},
                    hasPlayedBefore: true,
                };
                const preferences: Preferences = {
                    highlight: 'disabled',
                    difficulty: 'easy',
                };
                window.localStorage.setItem('game-state', JSON.stringify(gameState));
                window.localStorage.setItem('persistent-state', JSON.stringify(persistentState));
                window.localStorage.setItem('preferences', JSON.stringify(preferences));
            },
        });
        cy.waitForGameReady();
    });

    it('should toggle between different difficulties', () => {
        // Restart game
        cy.get('.button.new-game').should('be.visible').click();
        cy.contains('Yes').click();

        // Verify it's on easy to start
        cy.get('.game-board > .row').eq(0).children().should('have.length', 9);
        cy.get('.game-board > .row').should('have.length', 9);

        cy.get('.settings-link').click();

        // Verify dropdown default value
        cy.get('#difficulty-selector').should('have.value', 'easy');

        // Change to medium difficulty using dropdown
        cy.get('#difficulty-selector').select('medium');
        cy.get('#difficulty-selector').should('have.value', 'medium');

        cy.get('.overlay-back').click('left');

        // Verify game board changed to medium difficulty
        cy.get('.game-board > .row').eq(0).children().should('have.length', 16);
        cy.get('.game-board > .row').should('have.length', 16);

        cy.get('.settings-link').click();

        // Change to hard difficulty using dropdown
        cy.get('#difficulty-selector').select('hard');
        cy.get('#difficulty-selector').should('have.value', 'hard');

        cy.get('.overlay-back').click('left');

        // Verify game board changed to hard difficulty
        cy.get('.game-board > .row').eq(0).children().should('have.length', 30);
        cy.get('.game-board > .row').should('have.length', 16);

        cy.get('.settings-link').click();

        // Change back to easy difficulty using dropdown
        cy.get('#difficulty-selector').select('easy');
        cy.get('#difficulty-selector').should('have.value', 'easy');

        cy.get('.overlay-back').click('left');

        // Verify game board changed back to easy difficulty
        cy.get('.game-board > .row').eq(0).children().should('have.length', 9);
        cy.get('.game-board > .row').should('have.length', 9);
    });

    it('should retain selected difficulty upon refresh', () => {
        cy.get('.settings-link').click();

        // Change to medium difficulty using dropdown
        cy.get('#difficulty-selector').should('have.value', 'easy');
        cy.get('#difficulty-selector').select('medium');
        cy.get('#difficulty-selector').should('have.value', 'medium');

        cy.get('.overlay-back').click('left');

        // Verify game board changed to medium difficulty
        cy.get('.game-board > .row').eq(0).children().should('have.length', 16);
        cy.get('.game-board > .row').should('have.length', 16);

        // Reload and verify persistence
        cy.reload();

        cy.get('.settings-link').click();
        cy.get('#difficulty-selector').should('have.value', 'medium');
    });
});
