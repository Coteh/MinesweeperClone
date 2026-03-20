/// <reference types="cypress" />

import { version } from '../../../package.json';

import { GamePersistentState, GameState, MineBlock } from '../../../src/game';

const standardMineBlock: (
    x: number,
    y: number,
    isMine: boolean,
    adjMinesCount: number,
) => MineBlock = (x, y, isMine, adjMinesCount) => {
    return {
        x,
        y,
        isMine,
        isRevealed: false,
        isLosingSpot: false,
        isFlagged: false,
        isQuestionMark: false,
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
                        difficultyKey: 'easy',
                    },
                    elapsedTimeMS: 0,
                    spareMineSpot: { x: 0, y: 0 },
                };
                const persistentState: GamePersistentState = {
                    highscore: {},
                    unlockables: {},
                    hasPlayedBefore: true,
                };
                window.localStorage.setItem('ms-game-state', JSON.stringify(gameState));
                window.localStorage.setItem('ms-persistent-state', JSON.stringify(persistentState));
            },
        });
        cy.waitForGameReady();
    });

    it('should be able to open settings and close it using close button', () => {
        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').should('not.exist');

        cy.get('.settings-link').click();

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldBeInViewport();

        cy.get('.dialog').within(() => {
            cy.get('.close').click();
        });

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').should('not.exist');
    });

    it('should be able to open settings and close it using overlay', () => {
        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').should('not.exist');

        cy.get('.settings-link').click();

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldBeInViewport();

        cy.get('.overlay-back').click('left');

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').should('not.exist');
    });

    it('should toggle a setting when clicked', () => {
        cy.get('.settings-link').click();

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldBeInViewport();

        cy.get('.settings').within(() => {
            cy.get('.settings-item.highlight .knob').should('not.have.class', 'enabled');

            cy.get('.settings-item.highlight').should('be.visible').click();

            cy.get('.settings-item.highlight .knob').should('have.class', 'enabled');
        });
    });

    it("should reenable a setting if it's set to enabled in local storage and page is reloaded", () => {
        window.localStorage.setItem(
            'ms-preferences',
            JSON.stringify({
                highlight: 'enabled',
            }),
        );

        cy.reload();
        cy.waitForGameReady();

        cy.get('.settings-link').click();

        cy.get('.game-board').should('be.visible');
        cy.contains('Settings').shouldBeInViewport();

        cy.get('.settings').within(() => {
            cy.get('.settings-item.highlight .knob').should('have.class', 'enabled');
        });
    });

    it('should show version number at the bottom of the settings pane', () => {
        cy.get('.settings-link').click();

        cy.contains('Settings').should('be.visible');
        cy.get('.dialog-content').scrollTo('bottom');
        cy.contains(`v${version}`).should('be.visible');
    });

    it('should show copyright at the bottom of the settings pane', () => {
        cy.get('.settings-link').click();

        cy.contains('Settings').should('be.visible');
        cy.get('.dialog-content').scrollTo('bottom');
        cy.contains(/© .* James Cote/i).should('be.visible');
    });

    it('should handle preferences value in local storage being in invalid state', () => {
        // Set local storage preferences value to "invalid" to simulate an invalid state
        cy.visit('/', {
            onBeforeLoad: () => {
                window.localStorage.setItem('ms-preferences', 'invalid');
            },
        });
        cy.waitForGameReady();

        cy.get('.settings-link').click();

        cy.contains('Settings').should('be.visible');

        cy.get('.settings-item.highlight .knob').should('not.have.class', 'enabled');
        cy.window().then((win) => {
            // The invalid value should be replaced with the default value,
            // which will be set to debug hud options in dev mode
            const preferences = win.localStorage.getItem('ms-preferences');

            if (!preferences) {
                throw new Error('Expected preferences to exist in localStorage.');
            }

            expect(JSON.parse(preferences)).to.deep.equal({
                debugHudEnabled: 'enabled',
                debugHudVisible: 'enabled',
            });

            // TODO: In production, these two options will not be enabled,
            // so the test will need to check that the preferences are set to the default values.
            // AFAIK, there is no way to turn off Vite dev mode for just one test, so this will have to do for now.
            // expect(win.localStorage.getItem("ms-preferences")).to.deep.equal({});
            // NOTE: The assertion commented above should actually fail atm, because the default values are not set
            // at all upon invalid value in production.
        });

        cy.get('.settings-item.highlight').click();

        cy.get('.settings-item.highlight .knob').should('have.class', 'enabled');
        cy.window().then((win) => {
            const preferences = win.localStorage.getItem('ms-preferences');

            if (!preferences) {
                throw new Error('Expected preferences to exist in localStorage.');
            }

            expect(JSON.parse(preferences)).to.deep.equal({
                highlight: 'enabled',
                debugHudEnabled: 'enabled',
                debugHudVisible: 'enabled',
            });
        });

        cy.get('.settings-item.highlight').click();

        cy.get('.settings-item.highlight .knob').should('not.have.class', 'enabled');
        cy.window().then((win) => {
            const preferences = win.localStorage.getItem('ms-preferences');

            if (!preferences) {
                throw new Error('Expected preferences to exist in localStorage.');
            }

            expect(JSON.parse(preferences)).to.deep.equal({
                highlight: 'disabled',
                debugHudEnabled: 'enabled',
                debugHudVisible: 'enabled',
            });
        });
    });

    it('should open the difficulty selector when clicking on the difficulty settings item', () => {
        cy.get('.settings-link').click();

        cy.get('.settings-item.difficulty').realClick();
        cy.get('#difficulty-selector').should('be.focused');
    });

    it('should open the theme selector when clicking on the theme settings item', () => {
        cy.get('.settings-link').click();

        cy.get('.settings-item.theme-switch').realClick();
        cy.get('#theme-selector').should('be.focused');
    });

    it('should associate labels with their corresponding select elements', () => {
        cy.get('.settings-link').click();

        cy.get('label[for="difficulty-selector"]').realClick();
        cy.get('#difficulty-selector').should('be.focused');

        cy.get('label[for="theme-selector"]').realClick();
        cy.get('#theme-selector').should('be.focused');
    });

    it('should be able to select the cloudy theme', () => {
        cy.get('.settings-link').click();

        cy.get('.settings-item.theme-switch').should('be.visible');
        cy.selectTheme('cloudy');

        // Verify cloudy theme is selected
        cy.get('#theme-selector').should('have.value', 'cloudy');

        // Verify body has cloudy class
        cy.get('body').should('have.class', 'cloudy');
    });

    it('should not animate the sound effects knob when opening settings with sound already enabled', () => {
        // Set sound effects to enabled in local storage
        window.localStorage.setItem(
            'preferences',
            JSON.stringify({
                sound: 'enabled',
            }),
        );

        cy.reload();
        cy.waitForGameReady();

        // Select a non-classic theme to ensure the knob animation would be visible
        cy.get('.settings-link').click();
        cy.selectTheme('cloudy');
        cy.get('.dialog .close').click();

        // Slow the knob transition to 10s so any in-progress animation is clearly detectable
        cy.document().then((doc) => {
            const style = doc.createElement('style');
            style.id = 'test-slow-knob-transition';
            style.textContent = '.knob-inside { transition-duration: 10s !important; }';
            doc.head.appendChild(style);
        });

        // Now open settings again and verify the knob is already in enabled position
        // without animating
        cy.get('.settings-link').click();

        // Check position exactly once (no Cypress retry) — with the fix the knob snaps
        // to 29px before transitions are re-enabled, so it reads 29px immediately.
        // Without the fix it would be mid-animation (~0px) after Cypress's ~100ms overhead
        // on a 10s transition.
        cy.get('.settings-item.sound .knob .knob-inside')
            .should('exist')
            .then(($knobInside) => {
                const left = parseFloat(window.getComputedStyle($knobInside[0]).left);
                expect(left).to.be.closeTo(29, 1);
            });

        cy.document().then((doc) => {
            doc.getElementById('test-slow-knob-transition')?.remove();
        });
    });
});
