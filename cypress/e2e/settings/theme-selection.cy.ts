/// <reference types="cypress" />
import * as configData from '../../../src/config.json';
import type { Config } from '../../../src/config';

const config = configData as Config;

const themeKeys = Object.keys(config.theme);

// Helper function to convert hex to an rgb() string as reported by computed styles
const hexToRgbString = (hex: string): string => {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
};

describe('Theme Selection Pane', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.waitForGameReady();
        cy.get('.settings-link').click();
    });

    it('should show the active theme on the theme settings row', () => {
        cy.get('.theme-selector-value').should('have.text', config.theme['basic'].displayName);
    });

    it('should open the theme selection pane from the theme settings row', () => {
        cy.get('.theme-selection-grid').should('not.exist');

        cy.get('#theme-selector').click();

        cy.get('.theme-selection-grid').should('be.visible');
        cy.get('.theme-card').should('have.length', themeKeys.length);
    });

    it('should render a card per theme using that theme own colours', () => {
        cy.get('#theme-selector').click();

        themeKeys.forEach((theme) => {
            const themeConfig = config.theme[theme];
            cy.get(`.theme-card[data-theme="${theme}"]`)
                .should('exist')
                .and('have.css', 'background-color', hexToRgbString(themeConfig.backgroundColor));

            // The preview board is drawn from the theme's own block colours
            cy.get(`.theme-card[data-theme="${theme}"] .theme-card-preview-tile`)
                .first()
                .should(
                    'have.css',
                    'background-color',
                    hexToRgbString(themeConfig.blockRevealedColor),
                );
        });
    });

    it('should highlight the active theme card', () => {
        cy.get('#theme-selector').click();

        cy.get('.theme-card.selected').should('have.length', 1);
        cy.get('.theme-card[data-theme="basic"]')
            .should('have.class', 'selected')
            .and('have.attr', 'aria-checked', 'true');

        cy.get('.theme-card[data-theme="ocean"]').click();

        cy.get('.theme-card.selected').should('have.length', 1);
        cy.get('.theme-card[data-theme="ocean"]')
            .should('have.class', 'selected')
            .and('have.attr', 'aria-checked', 'true');
        cy.get('.theme-card[data-theme="basic"]').should('have.attr', 'aria-checked', 'false');
    });

    it('should apply the theme immediately when a card is clicked', () => {
        cy.get('#theme-selector').click();
        cy.get('.theme-card[data-theme="cloudy"]').click();

        // Pane stays open so themes can be compared
        cy.get('.theme-selection-grid').should('be.visible');
        cy.get('body').should('have.class', 'cloudy');
    });

    it('should persist the selected theme across reloads', () => {
        cy.get('#theme-selector').click();
        cy.get('.theme-card[data-theme="desert"]').click();
        cy.get('body').should('have.class', 'desert');

        cy.reload();
        cy.waitForGameReady();

        cy.get('body').should('have.class', 'desert');
        cy.get('.settings-link').click();
        cy.get('.theme-selector-value').should('have.text', config.theme['desert'].displayName);
    });

    it('should return to the settings pane with the updated theme when Back is clicked', () => {
        cy.get('#theme-selector').click();
        cy.get('.theme-card[data-theme="ocean"]').click();
        cy.get('.theme-selection-back').click();

        cy.get('.theme-selection-grid').should('not.exist');
        cy.get('.settings').should('be.visible');
        cy.get('.theme-selector-value').should('have.text', config.theme['ocean'].displayName);
    });

    it('should close the whole dialog when the close button is clicked', () => {
        cy.get('#theme-selector').click();
        cy.get('.dialog button.close').click();

        cy.get('.dialog').should('not.exist');
    });

    it('should allow selecting a theme with the keyboard', () => {
        cy.get('#theme-selector').click();

        cy.get('.theme-card[data-theme="classic"]').focus().should('be.focused');
        cy.realPress('Enter');

        cy.get('body').should('have.class', 'classic');
        cy.get('.theme-card[data-theme="classic"]').should('have.class', 'selected');
    });
});
