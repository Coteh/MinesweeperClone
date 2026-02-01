/**
 * E2E tests for Dialog Stack System
 */

describe('Dialog Stack System', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should show a dialog when opened', () => {
        // Open debug menu to access dialog test buttons
        cy.get('#debug').click({ force: true });

        // Check if debug dialog opens
        cy.get('[data-dialog-id]').should('have.length', 1);
        cy.get('.dialog-content').should('be.visible');
    });

    it('should close dialog when close button is clicked', () => {
        // Open a dialog
        cy.get('#debug').click({ force: true });

        cy.get('[data-dialog-id]').should('exist');

        // Click close button
        cy.get('.dialog-close').first().click();

        // Dialog should be removed
        cy.get('[data-dialog-id]').should('not.exist');
    });

    it('should close dialog when overlay is clicked for closable dialogs', () => {
        // Open a closable dialog
        cy.get('#debug').click({ force: true });

        cy.get('[data-dialog-id]').should('exist');

        // Click overlay
        cy.get('.overlay-back').click({ force: true });

        // Dialog should be removed
        cy.get('[data-dialog-id]').should('not.exist');
    });

    it('should stack dialogs (LIFO behavior)', () => {
        // This test requires the ability to programmatically open multiple dialogs
        // We'll need to use the debug menu or create a test harness

        // Open first dialog
        cy.get('#debug').click({ force: true });
        cy.get('[data-dialog-id]').should('have.length', 1);

        // Get the first dialog ID
        cy.get('[data-dialog-id]')
            .invoke('attr', 'data-dialog-id')
            .then((firstId) => {
                // Open another dialog from within (if available in debug menu)
                cy.get('.button.prompt-dialog').click();

                // Should now have a different dialog visible
                cy.get('[data-dialog-id]').should('have.length', 1);
                cy.get('[data-dialog-id]')
                    .invoke('attr', 'data-dialog-id')
                    .should('not.equal', firstId);
            });
    });

    it('should restore previous dialog when current is closed', () => {
        // Open first dialog
        cy.get('#debug').click({ force: true });
        cy.get('[data-dialog-id]').should('have.length', 1);

        // Get first dialog's ID
        cy.get('[data-dialog-id]')
            .invoke('attr', 'data-dialog-id')
            .then((firstId) => {
                // Open second dialog
                cy.get('.button.prompt-dialog').click();
                cy.get('[data-dialog-id]').should('have.length', 1);

                // Get second dialog's ID
                cy.get('[data-dialog-id]')
                    .invoke('attr', 'data-dialog-id')
                    .then((secondId) => {
                        expect(secondId).to.not.equal(firstId);

                        // Close second dialog
                        cy.get('.cancel').click();

                        // First dialog should be visible again
                        cy.get('[data-dialog-id]').should('have.attr', 'data-dialog-id', firstId);
                    });
            });
    });

    it('should handle prompt dialog with confirm action', () => {
        // Open debug dialog
        cy.get('#debug').click({ force: true });

        // Open prompt dialog
        cy.get('.button.prompt-dialog').click();

        // Verify prompt content
        cy.get('.dialog-content').should('contain', 'Are you sure');

        // Click confirm
        cy.get('.confirm').click();

        // Prompt should close (verify by checking if previous dialog is visible or no dialog)
        cy.get('.dialog-content').should('not.contain', 'Are you sure');
    });

    it('should handle prompt dialog with cancel action', () => {
        // Open debug dialog
        cy.get('#debug').click({ force: true });

        // Open prompt dialog
        cy.get('.button.prompt-dialog').click();

        // Click cancel
        cy.get('.cancel').click();

        // Should return to debug dialog
        cy.get('.dialog-content').should('contain', 'Debug');
    });

    it('should hide overlay when all dialogs are closed', () => {
        // Overlay should not be visible initially
        cy.get('.overlay-back').should('not.have.class', 'visible');

        // Open dialog
        cy.get('#debug').click({ force: true });

        // Overlay should be visible
        cy.get('.overlay-back').should('have.class', 'visible');

        // Close dialog
        cy.get('.dialog-close').first().click();

        // Overlay should be hidden
        cy.get('.overlay-back').should('not.have.class', 'visible');
    });

    it('should manage focus correctly', () => {
        // Focus an element before opening dialog
        cy.get('#new-game').focus();
        cy.get('#new-game').should('have.focus');

        // Open dialog
        cy.get('#debug').click({ force: true });

        // Focus should move into the dialog
        cy.focused().should('exist');
        cy.focused().parents('[data-dialog-id]').should('exist');

        // Close dialog
        cy.get('.dialog-close').first().click();

        // Focus should return (though we can't guarantee exact element)
        cy.focused().should('exist');
    });

    it('should not close non-closable dialog when overlay is clicked', () => {
        // This test requires a non-closable dialog
        // We'll need to use the debug menu's non-closable dialog button

        cy.get('#debug').click({ force: true });
        cy.get('.button.non-closable-dialog').click();

        // Verify close button is hidden
        cy.get('.dialog-close').should('not.be.visible');

        // Click overlay
        cy.get('.overlay-back').click({ force: true });

        // Dialog should still exist
        cy.get('[data-dialog-id]').should('exist');
    });
});
