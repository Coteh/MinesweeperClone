/// <reference types="cypress" />

import { GameState, GamePersistentState, MineBlock } from '../../../src/game';

const standardMineBlock: (
    x: number,
    y: number,
    isMine: boolean,
    adjMinesCount: number,
    isRevealed: boolean,
) => MineBlock = (x, y, isMine, adjMinesCount, isRevealed) => {
    return {
        x,
        y,
        isMine,
        isRevealed: isRevealed,
        isFlagged: false,
        adjMinesCount,
    };
};

describe('gameplay', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {
                const gameState: GameState = {
                    board: [
                        [
                            standardMineBlock(0, 0, false, 1, false),
                            standardMineBlock(0, 1, false, 1, false),
                            standardMineBlock(0, 2, false, 1, false),
                            standardMineBlock(0, 3, false, 0, false),
                        ],
                        [
                            standardMineBlock(1, 0, false, 1, false),
                            standardMineBlock(1, 1, true, 0, false),
                            standardMineBlock(1, 2, false, 1, false),
                            standardMineBlock(1, 3, false, 0, false),
                        ],
                        [
                            standardMineBlock(2, 0, false, 2, false),
                            standardMineBlock(2, 1, false, 2, false),
                            standardMineBlock(2, 2, false, 1, false),
                            standardMineBlock(2, 3, false, 0, false),
                        ],
                        [
                            standardMineBlock(3, 0, true, 0, false),
                            standardMineBlock(3, 1, false, 1, false),
                            standardMineBlock(3, 2, false, 0, false),
                            standardMineBlock(3, 3, false, 0, false),
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

    it('should allow player to click on a tile', () => {
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, false),
                standardMineBlock(0, 1, false, 1, false),
                standardMineBlock(0, 2, false, 1, false),
                standardMineBlock(0, 3, false, 0, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false),
                standardMineBlock(1, 1, true, 0, false),
                standardMineBlock(1, 2, false, 1, false),
                standardMineBlock(1, 3, false, 0, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false),
                standardMineBlock(2, 1, false, 2, false),
                standardMineBlock(2, 2, false, 1, false),
                standardMineBlock(2, 3, false, 0, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false),
                standardMineBlock(3, 1, false, 1, false),
                standardMineBlock(3, 2, false, 0, false),
                standardMineBlock(3, 3, false, 0, false),
            ],
        ]);
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).click();
            });
        cy.verifyBoardMatches([
            [
                standardMineBlock(0, 0, false, 1, true),
                standardMineBlock(0, 1, false, 1, false),
                standardMineBlock(0, 2, false, 1, false),
                standardMineBlock(0, 3, false, 0, false),
            ],
            [
                standardMineBlock(1, 0, false, 1, false),
                standardMineBlock(1, 1, true, 0, false),
                standardMineBlock(1, 2, false, 1, false),
                standardMineBlock(1, 3, false, 0, false),
            ],
            [
                standardMineBlock(2, 0, false, 2, false),
                standardMineBlock(2, 1, false, 2, false),
                standardMineBlock(2, 2, false, 1, false),
                standardMineBlock(2, 3, false, 0, false),
            ],
            [
                standardMineBlock(3, 0, true, 0, false),
                standardMineBlock(3, 1, false, 1, false),
                standardMineBlock(3, 2, false, 0, false),
                standardMineBlock(3, 3, false, 0, false),
            ],
        ]);
    });

    it('should allow player to tap on a tile', () => {
        throw new Error('TODO: Implement this test');
    });

    it('should allow player to right click to flag/unflag a tile', () => {
        throw new Error('TODO: Implement this test');
    });

    it('should allow player to hold tap to flag/unflag a tile', () => {
        throw new Error('TODO: Implement this test');
    });
});
