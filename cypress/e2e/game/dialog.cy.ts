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
        isLosingSpot: false,
        isFlagged: false,
        adjMinesCount,
    };
};

describe('dialogs', () => {
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
                window.localStorage.setItem('game-state', JSON.stringify(gameState));
                window.localStorage.setItem('persistent-state', JSON.stringify(persistentState));
            },
        });
        cy.waitForGameReady();
    });

    describe('general dialog behaviour', () => {
        it('should be visible', () => {
            // The Debug dialog is an example of a closable dialog that can be triggered in normal usage (during debug mode)
            cy.get('.debug-link#debug').click();

            cy.get('.dialog').should('be.visible');
            cy.get('.overlay-back').should('be.visible');
        });
    });

    describe('closable dialogs', () => {
        beforeEach(() => {
            // The Debug dialog is an example of a closable dialog that can be triggered in normal usage (during debug mode)
            cy.get('.debug-link#debug').click();
        });

        it('can be closed by clicking on the X button', () => {
            cy.get('.dialog').should('be.visible');
            cy.get('.overlay-back').should('be.visible');

            cy.get('.dialog > .close').click();

            cy.get('.dialog').should('not.exist');
            cy.get('.overlay-back').should('not.be.visible');
        });

        it('can be closed by clicking elsewhere besides the dialog', () => {
            cy.get('.dialog').should('be.visible');
            cy.get('.overlay-back').should('be.visible');

            cy.get('body').click('left');

            cy.get('.dialog').should('not.exist');
            cy.get('.overlay-back').should('not.be.visible');
        });

        it('can not be closed by pressing enter key', () => {
            cy.get('.dialog').should('be.visible');
            cy.get('.overlay-back').should('be.visible');

            // Remove focus from the close button first, as pressing enter while it's focused will trigger the close button
            cy.get('.dialog > button.close').blur();
            cy.get('body').type('{enter}');

            cy.get('.dialog').should('be.visible');
            cy.get('.overlay-back').should('be.visible');
        });

        it('can be closed by pressing escape key', () => {
            cy.get('.dialog').should('be.visible');
            cy.get('.overlay-back').should('be.visible');

            cy.get('body').type('{esc}');

            cy.get('.dialog').should('not.exist');
            cy.get('.overlay-back').should('not.be.visible');
        });
    });

    describe('prompt dialogs', () => {
        beforeEach(() => {
            cy.clearBrowserCache();
            cy.reload();
            cy.get('.debug-link#debug').click();
            cy.contains('Prompt Dialog').click();
        });

        it('allows user to either confirm or cancel, blocking game input until choice is made', () => {
            cy.get('.dialog').should('be.visible');
            cy.get('.overlay-back').should('be.visible');

            cy.get('.dialog > .close').should('not.be.visible').click({
                force: true,
            });
            cy.get('body').click('left');
            cy.get('body').type('{enter}');
            cy.get('body').type('{esc}');

            cy.get('.dialog').should('be.visible');

            cy.contains('Cancel').click();

            cy.get('.dialog').should('not.exist');
            cy.get('.overlay-back').should('not.be.visible');

            cy.get('.debug-link#debug').click();
            cy.contains('Prompt Dialog').click();

            cy.contains('Yes').click();

            cy.get('.dialog').should('be.visible');
            cy.get('.overlay-back').should('be.visible');

            cy.contains('Confirmed').should('be.visible');

            cy.get('.dialog > .close').should('be.visible').click();

            cy.get('.dialog').should('not.exist');
            cy.get('.overlay-back').should('not.be.visible');
        });
    });

    describe('non-closable dialogs', () => {
        beforeEach(() => {
            cy.clearBrowserCache();
            cy.reload();
            cy.get('.debug-link#debug').click();
            cy.contains('Non-Closable Dialog').click();
        });

        it('hides X button and cannot be clicked', () => {
            cy.get('.dialog').should('be.visible');

            cy.get('.dialog > .close').should('not.be.visible').click({
                force: true,
            });

            cy.get('.dialog').should('be.visible');
        });

        it('can not be closed by clicking elsewhere besides the dialog', () => {
            cy.get('.dialog').should('be.visible');

            cy.get('body').click('left');

            cy.get('.dialog').should('be.visible');
        });

        it('can not be closed using escape key or enter key', () => {
            cy.get('.dialog').should('be.visible');

            // Need realType rather than type because Cypress does not consider dialog element a typeable element
            cy.get('body').realType('{enter}');
            cy.get('body').realType('{esc}');

            cy.get('.dialog').should('be.visible');
        });
    });
});
