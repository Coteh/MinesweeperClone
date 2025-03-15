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

// Expected block colours for classic theme
const EXPECTED_BLOCK_HIGHLIGHTED_COLOR = 'rgb(255, 255, 0)';
const EXPECTED_BLOCK_UNHIGHLIGHTED_COLOR = 'rgb(128, 128, 128)';

describe('highlight', () => {
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
                };
                window.localStorage.setItem('game-state', JSON.stringify(gameState));
                window.localStorage.setItem('persistent-state', JSON.stringify(persistentState));
                window.localStorage.setItem('preferences', JSON.stringify(preferences));
            },
        });
        cy.waitForGameReady();
    });

    it('should toggle highlight on and off using settings option', () => {
        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box')
                    .eq(0)
                    .realHover()
                    .should('have.css', 'background-color', EXPECTED_BLOCK_UNHIGHLIGHTED_COLOR);
            });

        cy.get('.settings-link').click();

        cy.get('.settings-item.highlight .knob').should('not.have.class', 'enabled');
        cy.get('.settings-item.highlight').click();
        cy.get('.settings-item.highlight .knob').should('have.class', 'enabled');

        cy.get('.overlay-back').click('left');

        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box')
                    .eq(0)
                    .realHover()
                    .should('have.css', 'background-color', EXPECTED_BLOCK_HIGHLIGHTED_COLOR);
            });

        cy.get('.settings-link').click();

        cy.get('.settings-item.highlight .knob').should('have.class', 'enabled');
        cy.get('.settings-item.highlight').click();
        cy.get('.settings-item.highlight .knob').should('not.have.class', 'enabled');
    });

    it('should allow for highlighting blocks on page load if enabled', () => {
        cy.visit('/', {
            onBeforeLoad: (win) => {
                const preferences: Preferences = {
                    highlight: 'enabled',
                };
                win.localStorage.setItem('preferences', JSON.stringify(preferences));
            },
        });
        cy.waitForGameReady();

        cy.get('.game-board > .row')
            .eq(0)
            .within(() => {
                cy.get('.box')
                    .eq(0)
                    .realHover()
                    .should('have.css', 'background-color', EXPECTED_BLOCK_HIGHLIGHTED_COLOR);
            });
    });

    it('should show highlight option on desktop', () => {
        cy.viewport(1024, 768);
        cy.get('.settings-link').click();
        cy.wait(1000); // need to delay to give the settings pane time to appear fully on screen
        cy.contains('Settings').shouldBeInViewport();
        cy.get('.setting.highlight').should('be.visible');
    });

    it('should hide highlight option on phones', () => {
        cy.viewport('iphone-6');
        cy.visit('/', {
            onBeforeLoad: (win) => {
                Object.defineProperty(win.navigator, 'userAgent', {
                    value:
                        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                });
            },
        });
        cy.waitForGameReady();
        cy.get('.settings-link').click();
        cy.wait(1000); // need to delay to give the settings pane time to appear fully on screen
        cy.contains('Settings').shouldBeInViewport();
        cy.get('.setting.highlight').should('not.exist');
    });
});
