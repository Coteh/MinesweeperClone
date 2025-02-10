/// <reference types="cypress" />

import { GamePersistentState, GameState, MineBlock } from '../../../src/game';

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
        isFlagged: false,
        adjMinesCount,
    };
};

describe('retrieving saved progress', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {
                const gameState: GameState = {
                    board: [
                        [
                            standardMineBlock(0, 0, false, 1),
                            standardMineBlock(0, 1, false, 1),
                            standardMineBlock(0, 2, false, 1),
                            standardMineBlock(0, 3, false, 0),
                        ],
                        [
                            standardMineBlock(1, 0, false, 1),
                            standardMineBlock(1, 1, true, 0),
                            standardMineBlock(1, 2, false, 1),
                            standardMineBlock(1, 3, false, 0),
                        ],
                        [
                            standardMineBlock(2, 0, false, 2),
                            standardMineBlock(2, 1, false, 2),
                            standardMineBlock(2, 2, false, 1),
                            standardMineBlock(2, 3, false, 0),
                        ],
                        [
                            standardMineBlock(3, 0, true, 0),
                            standardMineBlock(3, 1, false, 1),
                            standardMineBlock(3, 2, false, 0),
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
    });

    it('should load saved state', () => {
        throw new Error('TODO: Implement this test');

        // First check to see if game state loads up
        cy.verifyBoardMatches([
            [2, 0, 0, 0],
            [4, 0, 0, 0],
            [8, 0, 0, 0],
            [16, 0, 0, 0],
        ]);

        // Then check if persistent state loads up
        cy.contains('Best 1234').should('be.visible');

        // Finally check if preferences are loaded
        cy.get('body').should('have.class', 'dark');
        cy.get('body').should('have.class', 'tileset-dark');

        // Now load up a game state where the player lost, a lose popup should appear as well.
        cy.contains('You lose!').should('not.exist');

        cy.get('.debug-link#debug').click();
        cy.contains('New Losing Game').click();
        cy.get('body').type('{rightArrow}');

        cy.contains('You lose!').should('be.visible');

        cy.reload();

        cy.contains('You lose!').should('be.visible');
    });
});
