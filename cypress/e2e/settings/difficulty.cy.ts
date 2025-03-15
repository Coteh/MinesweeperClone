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

        cy.get('.settings-item.difficulty .toggle').should('contain.text', 'easy');
        cy.get('.settings-item.difficulty').click();
        cy.get('.settings-item.difficulty .toggle').should('contain.text', 'medium');

        cy.get('.overlay-back').click('left');

        // Verify game board changed to medium difficulty
        cy.get('.game-board > .row').eq(0).children().should('have.length', 16);
        cy.get('.game-board > .row').should('have.length', 16);

        cy.get('.settings-link').click();

        cy.get('.settings-item.difficulty .toggle').should('contain.text', 'medium');
        cy.get('.settings-item.difficulty').click();
        cy.get('.settings-item.difficulty .toggle').should('contain.text', 'hard');

        cy.get('.overlay-back').click('left');

        // Verify game board changed to hard difficulty
        cy.get('.game-board > .row').eq(0).children().should('have.length', 30);
        cy.get('.game-board > .row').should('have.length', 16);

        cy.get('.settings-link').click();

        cy.get('.settings-item.difficulty .toggle').should('contain.text', 'hard');
        cy.get('.settings-item.difficulty').click();
        cy.get('.settings-item.difficulty .toggle').should('contain.text', 'easy');

        cy.get('.overlay-back').click('left');

        // Verify game board changed to easy difficulty
        cy.get('.game-board > .row').eq(0).children().should('have.length', 9);
        cy.get('.game-board > .row').should('have.length', 9);
    });

    it('should retain selected difficulty upon refresh', () => {
        cy.get('.settings-link').click();

        cy.get('.settings-item.difficulty .toggle').should('contain.text', 'easy');
        cy.get('.settings-item.difficulty').click();
        cy.get('.settings-item.difficulty .toggle').should('contain.text', 'medium');

        cy.get('.overlay-back').click('left');

        // Verify game board changed to medium difficulty
        cy.get('.game-board > .row').eq(0).children().should('have.length', 16);
        cy.get('.game-board > .row').should('have.length', 16);

        cy.reload();

        // Verify game board still on medium difficulty
        cy.get('.game-board > .row').eq(0).children().should('have.length', 16);
        cy.get('.game-board > .row').should('have.length', 16);
    });
});
