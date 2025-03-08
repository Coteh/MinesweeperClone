/// <reference types="cypress" />

import { version } from '../../../package.json';

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

describe('settings', () => {
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

    it('should be able to open settings and close it using close button', () => {
        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldNotBeInViewport();

        cy.get('.settings-link').click();
        cy.wait(1000); // need to delay to give the settings pane time to appear fully on screen

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldBeInViewport();

        cy.get('.settings.pane').within(() => {
            cy.get('.close').click();
            cy.wait(1000); // need to delay to give the settings pane time to disappear fully from screen
        });

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldNotBeInViewport();
    });

    it('should be able to open settings and close it using overlay', () => {
        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldNotBeInViewport();

        cy.get('.settings-link').click();
        cy.wait(1000); // need to delay to give the settings pane time to appear fully on screen

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldBeInViewport();

        cy.get('.game-overlay').click('left');
        cy.wait(1000); // need to delay to give the settings pane time to disappear fully from screen

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldNotBeInViewport();
    });

    it('should toggle a setting when clicked', () => {
        cy.get('.settings-link').click();
        cy.wait(1000); // need to delay to give the settings pane time to appear fully on screen

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldBeInViewport();

        cy.get('.settings.pane').within(() => {
            cy.get('.settings-item.highlight .knob').should('not.have.class', 'enabled');

            cy.get('.settings-item.highlight').should('be.visible').click();

            cy.get('.settings-item.highlight .knob').should('have.class', 'enabled');
        });
    });

    it("should reenable a setting if it's set to enabled in local storage and page is reloaded", () => {
        window.localStorage.setItem(
            'preferences',
            JSON.stringify({
                highlight: 'enabled',
            })
        );

        cy.reload();

        cy.get('.settings-link').click();
        cy.wait(1000); // need to delay to give the settings pane time to appear fully on screen

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldBeInViewport();

        cy.get('.settings.pane').within(() => {
            cy.get('.settings-item.highlight .knob').should('have.class', 'enabled');
        });
    });

    it('should show version number at the bottom of the settings pane', () => {
        cy.get('.settings-link').click();

        cy.contains('Settings').should('be.visible');
        cy.contains(`v${version}`).should('be.visible');
    });

    it('should show copyright at the bottom of the settings pane', () => {
        cy.get('.settings-link').click();

        cy.contains('Settings').should('be.visible');
        cy.contains(/© .* James Cote/i).should('be.visible');
    });

    it('should handle preferences value in local storage being in invalid state', () => {
        // Set local storage preferences value to "invalid" to simulate an invalid state
        cy.visit('/', {
            onBeforeLoad: () => {
                window.localStorage.setItem('preferences', 'invalid');
            },
        });

        cy.get('.settings-link').click();

        cy.contains('Settings').should('be.visible');

        cy.get('.settings-item.highlight .knob').should('not.have.class', 'enabled');
        cy.window().then((win) => {
            // The invalid value should be replaced with the default value,
            // which will be set to debug hud options in dev mode
            expect(JSON.parse(win.localStorage.getItem('preferences'))).to.deep.equal({
                debugHudEnabled: 'enabled',
                debugHudVisible: 'enabled',
            });

            // TODO: In production, these two options will not be enabled,
            // so the test will need to check that the preferences are set to the default values.
            // AFAIK, there is no way to turn off Vite dev mode for just one test, so this will have to do for now.
            // expect(win.localStorage.getItem("preferences")).to.deep.equal({});
            // NOTE: The assertion commented above should actually fail atm, because the default values are not set
            // at all upon invalid value in production.
        });

        cy.get('.settings-item.highlight').click();

        cy.get('.settings-item.highlight .knob').should('have.class', 'enabled');
        cy.window().then((win) => {
            expect(JSON.parse(win.localStorage.getItem('preferences'))).to.deep.equal({
                highlight: 'enabled',
                debugHudEnabled: 'enabled',
                debugHudVisible: 'enabled',
            });
        });

        cy.get('.settings-item.highlight').click();

        cy.get('.settings-item.highlight .knob').should('not.have.class', 'enabled');
        cy.window().then((win) => {
            expect(JSON.parse(win.localStorage.getItem('preferences'))).to.deep.equal({
                highlight: 'disabled',
                debugHudEnabled: 'enabled',
                debugHudVisible: 'enabled',
            });
        });
    });
});
