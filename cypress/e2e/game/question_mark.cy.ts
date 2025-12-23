/// <reference types="cypress" />

describe('question mark input mode', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {
                const gameState = {
                    board: [
                        [
                            {
                                x: 0,
                                y: 0,
                                isMine: false,
                                isRevealed: false,
                                isLosingSpot: false,
                                isFlagged: false,
                                isQuestionMark: false,
                                adjMinesCount: 1,
                            },
                            {
                                x: 1,
                                y: 0,
                                isMine: false,
                                isRevealed: false,
                                isLosingSpot: false,
                                isFlagged: false,
                                isQuestionMark: false,
                                adjMinesCount: 1,
                            },
                        ],
                        [
                            {
                                x: 0,
                                y: 1,
                                isMine: false,
                                isRevealed: false,
                                isLosingSpot: false,
                                isFlagged: false,
                                isQuestionMark: false,
                                adjMinesCount: 1,
                            },
                            {
                                x: 1,
                                y: 1,
                                isMine: true,
                                isRevealed: false,
                                isLosingSpot: false,
                                isFlagged: false,
                                isQuestionMark: false,
                                adjMinesCount: 0,
                            },
                        ],
                    ],
                    ended: false,
                    won: false,
                    firstBlockClicked: false,
                    score: 0,
                    didUndo: false,
                    achievedHighscore: false,
                    gameOptions: {
                        boardWidth: 2,
                        boardHeight: 2,
                        numberOfMines: 1,
                        revealBoardOnLoss: true,
                    },
                    elapsedTimeMS: 0,
                    spareMineSpot: { x: 0, y: 0 },
                };
                const persistentState = { highscore: 0, unlockables: {}, hasPlayedBefore: true };
                window.localStorage.setItem('game-state', JSON.stringify(gameState));
                window.localStorage.setItem('persistent-state', JSON.stringify(persistentState));
            },
        });
        cy.waitForGameReady();
    });

    it('left click sets a question mark when question-mode is active', () => {
        // enable question mode
        cy.get('#question-mode').click();
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).click();
                cy.get('.box').eq(0).find('.question-mark').should('contain.text', '?');
            });
    });

    it('toggles its icon when question mode is enabled/disabled', () => {
        // initial state (disabled): question svg hidden, tile svg visible
        cy.get('#question-mode svg').first().should('not.be.visible');
        cy.get('#question-mode svg').last().should('be.visible');
        // enable
        cy.get('#question-mode').click();
        cy.get('#question-mode svg').first().should('be.visible');
        cy.get('#question-mode svg').last().should('not.be.visible');
        // disable
        cy.get('#question-mode').click();
        cy.get('#question-mode svg').first().should('not.be.visible');
        cy.get('#question-mode svg').last().should('be.visible');
    });

    it('right click still flags while question-mode is active', () => {
        cy.get('#question-mode').click();
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(1).rightclick();
                cy.get('.box').eq(1).find('img[src*="Flag.png"]').should('exist');
            });
    });

    it('question marks persist across reloads', () => {
        cy.get('#question-mode').click();
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).click();
                cy.get('.box').eq(0).find('.question-mark').should('exist');
            });
        cy.reload();
        cy.waitForGameReady();
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(0).find('.question-mark').should('exist');
            });
    });

    it('question mark cannot replace a flag and flagging replaces a question mark', () => {
        // flag a tile first
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(1).rightclick();
                cy.get('.box').eq(1).find('img[src*="Flag.png"]').should('exist');
            });
        // enable question-mode and try to set question mark on flagged tile
        cy.get('#question-mode').click();
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box').eq(1).click();
                // still should be a flag and no question mark
                cy.get('.box').eq(1).find('img[src*="Flag.png"]').should('exist');
                cy.get('.box').eq(1).find('.question-mark').should('not.exist');
            });

        // Now set a question mark on another tile then flag it
        cy.get('.game-board > .row')
            .eq(1)
            .within(() => {
                cy.get('.box').eq(0).click();
                cy.get('.box').eq(0).find('.question-mark').should('exist');
                // flag it now
                cy.get('.box').eq(0).rightclick();
                cy.get('.box').eq(0).find('img[src*="Flag.png"]').should('exist');
                cy.get('.box').eq(0).find('.question-mark').should('not.exist');
            });
    });
});
