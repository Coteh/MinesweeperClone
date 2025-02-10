/// <reference types="cypress" />

import { GameState, GamePersistentState, MineBlock } from '../../../src/game';

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

describe('highlight', () => {
    before(() => {
        throw new Error('TODO: Implement these tests');
    });

    beforeEach(() => {
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
        cy.document().then((doc) => {
            cy.stub(doc.documentElement, 'requestFullscreen').as('requestFullscreen');
            cy.stub(doc, 'exitFullscreen').as('exitFullscreen');
        });
    });

    it('should toggle highlight on and off using settings option', () => {
        cy.get('.settings-link').click();
        cy.get('@requestFullscreen').should('not.have.been.called');
        cy.contains('Fullscreen').realClick();
        cy.get('@requestFullscreen').should('have.been.called');
        cy.window().then((win) => {
            cy.stub(win.document, 'fullscreenElement').value(win.document.documentElement);
        });
        cy.get('@exitFullscreen').should('not.have.been.called');
        cy.contains('Fullscreen').realClick();
        cy.get('@exitFullscreen').should('have.been.called');
    });

    it('should show highlight option on desktop', () => {
        cy.viewport(1024, 768);
        cy.get('.settings-link').click();
        cy.get('.setting.highlight').should('be.visible');
    });

    it('should hide highlight option on phones', () => {
        cy.visit('/', {
            onBeforeLoad: (win) => {
                Object.defineProperty(win.navigator, 'userAgent', {
                    value:
                        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                });
            },
        });
        cy.viewport('iphone-6');
        cy.get('.settings-link').click();
        cy.get('.setting.highlight').should('not.exist');
    });
});
