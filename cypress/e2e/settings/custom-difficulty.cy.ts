/// <reference types="cypress" />

import { Preferences } from '../../../src/preferences';

const openCustomDifficultyDialog = () => {
    cy.get('.settings-link').click();
    // Selecting "Custom..." reverts the dropdown and opens the dialog
    cy.get('#difficulty-selector').select('custom');
    cy.get('.custom-difficulty').should('exist');
};

const setSlider = (id: string, value: number) => {
    cy.get(id).scrollIntoView().invoke('val', value).trigger('input');
};

const clickStart = () => {
    cy.get('.custom-difficulty-start').scrollIntoView().click({ force: true });
};

const clickCancel = () => {
    cy.get('.custom-difficulty-cancel').scrollIntoView().click({ force: true });
};

describe('custom difficulty', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: (win) => {
                const preferences: Preferences = {
                    highlight: 'disabled',
                    difficulty: 'easy',
                };
                win.localStorage.setItem('ms-preferences', JSON.stringify(preferences));
            },
        });
        cy.waitForGameReady();
    });

    it('opens the custom difficulty dialog when "Custom..." is selected', () => {
        openCustomDifficultyDialog();
        cy.get('.custom-difficulty h2').should('contain', 'Custom Difficulty');
    });

    it('cancel closes the dialog without creating a config', () => {
        openCustomDifficultyDialog();
        clickCancel();
        cy.get('.custom-difficulty').should('not.exist');

        // No custom config created
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            expect(prefs.customDifficulties).to.equal(undefined);
        });
    });

    it('shows empty state when there are no saved configurations', () => {
        openCustomDifficultyDialog();
        cy.get('.custom-difficulty-empty').should('contain', 'No saved configurations yet');
    });

    it('creates a new config with default name WxHxMines on Start New Game', () => {
        openCustomDifficultyDialog();
        setSlider('#custom-width-slider', 12);
        setSlider('#custom-height-slider', 10);
        setSlider('#custom-mines-slider', 20);

        clickStart();

        // Board should match the custom dimensions
        cy.get('.game-board > .row').eq(0).children().should('have.length', 12);
        cy.get('.game-board > .row').should('have.length', 10);

        // The config should be saved with WxHxMines name
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            const diffs = JSON.parse(prefs.customDifficulties || '[]');
            expect(diffs).to.have.length(1);
            expect(diffs[0].name).to.equal('12x10x20');
            expect(diffs[0].width).to.equal(12);
            expect(diffs[0].height).to.equal(10);
            expect(diffs[0].mines).to.equal(20);
        });
    });

    it('updates the density display as sliders change', () => {
        openCustomDifficultyDialog();
        setSlider('#custom-width-slider', 10);
        setSlider('#custom-height-slider', 10);
        setSlider('#custom-mines-slider', 25);

        // 25 / (10*10) = 25%
        cy.get('#custom-density-display').scrollIntoView().should('contain', '25.0%');
    });

    it('clamps mine max when board size decreases', () => {
        openCustomDifficultyDialog();
        // Start with a bigger board so we can set many mines
        setSlider('#custom-width-slider', 20);
        setSlider('#custom-height-slider', 20);
        setSlider('#custom-mines-slider', 200);

        // Reduce board — max mines = floor(9*9 * 0.5) = 40
        setSlider('#custom-width-slider', 9);
        setSlider('#custom-height-slider', 9);

        // Mine slider value should be clamped to 40
        cy.get('#custom-mines-slider')
            .invoke('val')
            .then((val) => {
                expect(parseInt(val as string, 10)).to.be.at.most(40);
            });
        cy.get('#custom-mines-max-label').scrollIntoView().should('contain', 'Max: 40');
    });

    it('shows saved configs in the list after creation', () => {
        openCustomDifficultyDialog();
        setSlider('#custom-width-slider', 15);
        setSlider('#custom-height-slider', 12);
        setSlider('#custom-mines-slider', 30);
        clickStart();

        // Re-open dialog
        cy.get('.settings-link').click();
        cy.get('#difficulty-selector').select('custom');

        cy.get('.custom-difficulty-list-item').should('have.length', 1);
        cy.get('.custom-difficulty-list-item-name-input').should('have.value', '15x12x30');
        cy.get('.custom-difficulty-list-item-spec').should('contain', '15x12, 30 mines');
    });

    it('newly created difficulty appears in the dropdown selector', () => {
        openCustomDifficultyDialog();
        setSlider('#custom-width-slider', 17);
        setSlider('#custom-height-slider', 13);
        setSlider('#custom-mines-slider', 35);
        clickStart();

        // Reopen settings — the new config should be a named option in the dropdown
        cy.get('.settings-link').click();
        cy.get('#difficulty-selector option')
            .filter(':contains("17x13x35")')
            .should('have.length', 1);
        // And it should be the selected option
        cy.get('#difficulty-selector')
            .invoke('val')
            .then((val) => {
                cy.get(`#difficulty-selector option[value="${val}"]`).should(
                    'contain.text',
                    '17x13x35',
                );
            });
    });

    it('adding a second difficulty via + button appears in the list alongside the first', () => {
        // Create first config
        openCustomDifficultyDialog();
        setSlider('#custom-width-slider', 12);
        setSlider('#custom-height-slider', 10);
        setSlider('#custom-mines-slider', 20);
        clickStart();

        // Reopen and use + to add a second config
        cy.get('.settings-link').click();
        cy.get('#difficulty-selector').select('custom');

        cy.get('.custom-difficulty-add-btn').click({ force: true });
        setSlider('#custom-width-slider', 20);
        setSlider('#custom-height-slider', 18);
        setSlider('#custom-mines-slider', 60);
        clickStart();

        // Reopen dialog — both configs should appear in the list
        cy.get('.settings-link').click();
        cy.get('#difficulty-selector').select('custom');

        cy.get('.custom-difficulty-list-item').should('have.length', 2);
        cy.get('.custom-difficulty-list-item-name-input').eq(0).should('have.value', '12x10x20');
        cy.get('.custom-difficulty-list-item-name-input').eq(1).should('have.value', '20x18x60');
    });

    it('+ button adds a "New Difficulty" entry to the list, selects it, and resets sliders to defaults', () => {
        // Pre-seed one config
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            prefs.customDifficulties = JSON.stringify([
                { id: '1000', name: 'My Config', width: 20, height: 15, mines: 60 },
            ]);
            prefs.difficulty = '1000';
            win.localStorage.setItem('ms-preferences', JSON.stringify(prefs));
        });
        cy.reload();
        cy.waitForGameReady();

        openCustomDifficultyDialog();

        // The saved config should be pre-selected
        cy.get('.custom-difficulty-list-item.selected').should('exist');

        // Click + button
        cy.get('.custom-difficulty-add-btn').click({ force: true });

        // A new "New Difficulty" item should appear and be selected
        cy.get('.custom-difficulty-list-item').should('have.length', 2);
        cy.get(
            '.custom-difficulty-list-item.selected .custom-difficulty-list-item-name-input',
        ).should('have.value', 'New Difficulty');

        // Sliders reset to defaults (16x16x40)
        cy.get('#custom-width-slider').should('have.value', '16');
        cy.get('#custom-height-slider').should('have.value', '16');
        cy.get('#custom-mines-slider').should('have.value', '40');
    });

    it('clicking a saved config loads its values into the sliders', () => {
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            prefs.customDifficulties = JSON.stringify([
                { id: '1001', name: 'Test Config', width: 22, height: 18, mines: 70 },
            ]);
            win.localStorage.setItem('ms-preferences', JSON.stringify(prefs));
        });
        cy.reload();
        cy.waitForGameReady();

        openCustomDifficultyDialog();

        cy.get('.custom-difficulty-list-item-main').first().click({ force: true });

        cy.get('#custom-width-slider').should('have.value', '22');
        cy.get('#custom-height-slider').should('have.value', '18');
        cy.get('#custom-mines-slider').should('have.value', '70');
        cy.get('.custom-difficulty-list-item').first().should('have.class', 'selected');
    });

    it('deletes a saved config', () => {
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            prefs.customDifficulties = JSON.stringify([
                { id: '2000', name: 'To Delete', width: 11, height: 11, mines: 15 },
            ]);
            win.localStorage.setItem('ms-preferences', JSON.stringify(prefs));
        });
        cy.reload();
        cy.waitForGameReady();

        openCustomDifficultyDialog();

        cy.get('.custom-difficulty-list-item').should('have.length', 1);
        cy.get('.custom-difficulty-delete-btn').scrollIntoView().click({ force: true });
        cy.get('.custom-difficulty-empty').should('be.visible');

        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            const diffs = JSON.parse(prefs.customDifficulties || '[]');
            expect(diffs).to.have.length(0);
        });
    });

    it('renames a config via the name input on blur', () => {
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            prefs.customDifficulties = JSON.stringify([
                { id: '3000', name: 'Old Name', width: 14, height: 14, mines: 40 },
            ]);
            win.localStorage.setItem('ms-preferences', JSON.stringify(prefs));
        });
        cy.reload();
        cy.waitForGameReady();

        openCustomDifficultyDialog();

        cy.get('.custom-difficulty-list-item-name-input')
            .first()
            .clear({ force: true })
            .type('New Name', { force: true });
        // Blur to save
        cy.get('.custom-difficulty-list-item-name-input').first().blur({ force: true });

        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            const diffs = JSON.parse(prefs.customDifficulties || '[]');
            expect(diffs[0].name).to.equal('New Name');
        });
    });

    it('reverts name if cleared and blurred', () => {
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            prefs.customDifficulties = JSON.stringify([
                { id: '3001', name: 'Keep Me', width: 14, height: 14, mines: 40 },
            ]);
            win.localStorage.setItem('ms-preferences', JSON.stringify(prefs));
        });
        cy.reload();
        cy.waitForGameReady();

        openCustomDifficultyDialog();

        cy.get('.custom-difficulty-list-item-name-input')
            .first()
            .clear({ force: true })
            .blur({ force: true });

        cy.get('.custom-difficulty-list-item-name-input').first().should('have.value', 'Keep Me');
    });

    it('editing a selected config updates it in-place (no duplicate)', () => {
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            prefs.customDifficulties = JSON.stringify([
                { id: '4000', name: 'Edit Me', width: 16, height: 16, mines: 40 },
            ]);
            win.localStorage.setItem('ms-preferences', JSON.stringify(prefs));
        });
        cy.reload();
        cy.waitForGameReady();

        openCustomDifficultyDialog();

        // Select the item
        cy.get('.custom-difficulty-list-item-main').first().click({ force: true });

        // Change sliders
        setSlider('#custom-width-slider', 20);
        setSlider('#custom-height-slider', 18);
        setSlider('#custom-mines-slider', 50);

        clickStart();

        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            const diffs = JSON.parse(prefs.customDifficulties || '[]');
            // Should still be 1 config, not 2
            expect(diffs).to.have.length(1);
            expect(diffs[0].id).to.equal('4000');
            expect(diffs[0].width).to.equal(20);
            expect(diffs[0].height).to.equal(18);
            expect(diffs[0].mines).to.equal(50);
        });
    });

    it('custom configs appear in the difficulty dropdown', () => {
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            prefs.customDifficulties = JSON.stringify([
                { id: '5000', name: 'My Custom', width: 18, height: 14, mines: 45 },
            ]);
            win.localStorage.setItem('ms-preferences', JSON.stringify(prefs));
        });
        cy.reload();
        cy.waitForGameReady();

        cy.get('.settings-link').click();
        cy.get('#difficulty-selector option[value="5000"]').should('contain', 'My Custom');
    });

    it('selecting a saved custom difficulty from the dropdown starts the correct board', () => {
        cy.window().then((win) => {
            const prefs = JSON.parse(win.localStorage.getItem('ms-preferences') || '{}');
            prefs.customDifficulties = JSON.stringify([
                { id: '6000', name: 'Dropdown Test', width: 13, height: 11, mines: 25 },
            ]);
            win.localStorage.setItem('ms-preferences', JSON.stringify(prefs));
        });
        cy.reload();
        cy.waitForGameReady();

        cy.get('.settings-link').click();
        cy.get('#difficulty-selector').select('6000');
        cy.get('.overlay-back').click('left');

        cy.get('.game-board > .row').eq(0).children().should('have.length', 13);
        cy.get('.game-board > .row').should('have.length', 11);
    });

    it('persists custom difficulty selection across reload', () => {
        openCustomDifficultyDialog();
        setSlider('#custom-width-slider', 14);
        setSlider('#custom-height-slider', 12);
        setSlider('#custom-mines-slider', 28);
        clickStart();

        cy.reload();
        cy.waitForGameReady();

        cy.get('.game-board > .row').eq(0).children().should('have.length', 14);
        cy.get('.game-board > .row').should('have.length', 12);
    });
});
