/// <reference types="cypress" />

import { GamePersistentState, GameState, MineBlock } from '../../../src/game';

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

describe('retrieving saved progress', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {
                const gameState: GameState = {
                    // TODO: Expand the board used for testing from 4x4 to 9x9 easy mode board
                    board: [
                        [
                            standardMineBlock(0, 0, false, 1, false, false, false),
                            standardMineBlock(1, 0, false, 1, false, false, false),
                            standardMineBlock(2, 0, false, 1, false, false, false),
                            standardMineBlock(3, 0, false, 0, false, false, false),
                        ],
                        [
                            standardMineBlock(0, 1, false, 1, false, false, false),
                            standardMineBlock(1, 1, true, 0, false, false, false),
                            standardMineBlock(2, 1, false, 1, false, false, false),
                            standardMineBlock(3, 1, false, 0, false, false, false),
                        ],
                        [
                            standardMineBlock(0, 2, false, 2, false, false, false),
                            standardMineBlock(1, 2, false, 2, false, false, false),
                            standardMineBlock(2, 2, false, 1, false, false, false),
                            standardMineBlock(3, 2, false, 0, false, false, false),
                        ],
                        [
                            standardMineBlock(0, 3, true, 0, false, false, false),
                            standardMineBlock(1, 3, false, 1, false, false, false),
                            standardMineBlock(2, 3, false, 0, false, false, false),
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
                    spareMineSpot: { x: 0, y: 0 },
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

    it('should save changes', () => {
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false, false, false),
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(2, 0, false, 1, false, false, false),
                standardMineBlock(3, 0, false, 0, false, false, false),
            ],
            [
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(2, 1, false, 1, false, false, false),
                standardMineBlock(3, 1, false, 0, false, false, false),
            ],
            [
                standardMineBlock(0, 2, false, 2, false, false, false),
                standardMineBlock(1, 2, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
            ],
            [
                standardMineBlock(0, 3, true, 0, false, false, false),
                standardMineBlock(1, 3, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
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
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(2, 0, false, 1, false, false, false),
                standardMineBlock(3, 0, false, 0, false, false, false),
            ],
            [
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(2, 1, false, 1, false, false, false),
                standardMineBlock(3, 1, false, 0, false, false, false),
            ],
            [
                standardMineBlock(0, 2, false, 2, false, false, false),
                standardMineBlock(1, 2, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
            ],
            [
                standardMineBlock(0, 3, true, 0, false, false, false),
                standardMineBlock(1, 3, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);

        cy.reload();

        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, true, false, false),
                standardMineBlock(1, 0, false, 1, false, false, false),
                standardMineBlock(2, 0, false, 1, false, false, false),
                standardMineBlock(3, 0, false, 0, false, false, false),
            ],
            [
                standardMineBlock(0, 1, false, 1, false, false, false),
                standardMineBlock(1, 1, true, 0, false, false, false),
                standardMineBlock(2, 1, false, 1, false, false, false),
                standardMineBlock(3, 1, false, 0, false, false, false),
            ],
            [
                standardMineBlock(0, 2, false, 2, false, false, false),
                standardMineBlock(1, 2, false, 2, false, false, false),
                standardMineBlock(2, 2, false, 1, false, false, false),
                standardMineBlock(3, 2, false, 0, false, false, false),
            ],
            [
                standardMineBlock(0, 3, true, 0, false, false, false),
                standardMineBlock(1, 3, false, 1, false, false, false),
                standardMineBlock(2, 3, false, 0, false, false, false),
                standardMineBlock(3, 3, false, 0, false, false, false),
            ],
        ]);
    });
});
