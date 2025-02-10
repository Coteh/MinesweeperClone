/// <reference types="cypress" />

import { GamePersistentState, GameState } from '../../../src/game';
import { Preferences } from '../../../src/preferences';

describe('misc', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            // TODO: Use a pre-generated game board by setting local storage game state
            onBeforeLoad: () => {
                const persistentState: GamePersistentState = {
                    highscore: 0,
                    unlockables: {},
                    hasPlayedBefore: true,
                };
                const preferences: Preferences = {
                    debugHudEnabled: true,
                    debugHudVisible: false,
                };
                window.localStorage.setItem('persistent-state', JSON.stringify(persistentState));
                window.localStorage.setItem('preferences', JSON.stringify(preferences));
            },
        });
    });

    specify('gameplay screenshot', () => {
        cy.viewport('iphone-6');

        // Hide debug elements from the screenshot
        cy.get('.debug-link').then((elem) => {
            elem.remove();
        });

        // TODO: Create a video screenshot for the readme.
        // What needs to be fixed:
        // - screenshot.sh needs to reposition the ffmpeg crop to where the game is located on the page
        // - Animations look very choppy on the video taken by Cypress

        // After this delay, the video screenshot should start.
        cy.wait(1000);

        // Static screenshot taken for now
        cy.screenshot('readme/screenshot', {
            capture: 'viewport',
            overwrite: true,
        });
    });
});
