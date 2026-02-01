/// <reference types="cypress" />

context('zoom', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {},
        });
        cy.waitForGameReady();
    });

    it('zooms in when zoom in button is clicked', () => {
        // Get initial zoom level
        cy.get('#zoom')
            .invoke('text')
            .then((initialZoom) => {
                const initialZoomValue = parseFloat(initialZoom);

                // Click zoom in button
                cy.get('#zoom-in').click();

                // Wait for zoom to update
                cy.wait(300);

                // Verify zoom level increased
                cy.get('#zoom')
                    .invoke('text')
                    .then((newZoom) => {
                        const newZoomValue = parseFloat(newZoom);
                        expect(newZoomValue).to.be.greaterThan(initialZoomValue);
                        expect(newZoomValue).to.equal(initialZoomValue + 0.5);
                    });
            });
    });

    it('reaches max zoom and disables zoom in button', () => {
        // Click zoom in button multiple times to reach max zoom (MAX_ZOOM = 2)
        // Starting from 1, need to click twice (1 -> 1.5 -> 2)
        cy.get('#zoom-in').click();
        cy.wait(300);
        cy.get('#zoom-in').click();
        cy.wait(300);

        // Verify zoom level is at maximum (2)
        cy.get('#zoom')
            .invoke('text')
            .then((zoom) => {
                expect(parseFloat(zoom)).to.equal(2);
            });

        // Verify zoom in button is disabled
        cy.get('#zoom-in').should('have.class', 'disabled');
    });

    it('zooms out when zoom out button is clicked', () => {
        // First zoom in to have room to zoom out
        cy.get('#zoom-in').click();
        cy.wait(300);

        // Get current zoom level
        cy.get('#zoom')
            .invoke('text')
            .then((initialZoom) => {
                const initialZoomValue = parseFloat(initialZoom);

                // Click zoom out button
                cy.get('#zoom-out').click();

                // Wait for zoom to update
                cy.wait(300);

                // Verify zoom level decreased
                cy.get('#zoom')
                    .invoke('text')
                    .then((newZoom) => {
                        const newZoomValue = parseFloat(newZoom);
                        expect(newZoomValue).to.be.lessThan(initialZoomValue);
                        expect(newZoomValue).to.equal(initialZoomValue - 0.5);
                    });
            });
    });

    it('reaches min zoom and disables zoom out button', () => {
        // Click zoom out button to reach min zoom (MIN_ZOOM = 0.5)
        // Starting from 1, need to click once (1 -> 0.5)
        cy.get('#zoom-out').click();
        cy.wait(300);

        // Verify zoom level is at minimum (0.5)
        cy.get('#zoom')
            .invoke('text')
            .then((zoom) => {
                expect(parseFloat(zoom)).to.equal(0.5);
            });

        // Verify zoom out button is disabled
        cy.get('#zoom-out').should('have.class', 'disabled');
    });

    it('resets zoom when reset zoom button is clicked', () => {
        // Zoom in first
        cy.get('#zoom-in').click();
        cy.wait(300);

        // Verify zoom is not at default (1)
        cy.get('#zoom')
            .invoke('text')
            .then((zoom) => {
                expect(parseFloat(zoom)).to.not.equal(1);
            });

        // Click reset zoom button
        cy.get('#zoom-reset').click();
        cy.wait(300);

        // Verify zoom is back to default (1)
        cy.get('#zoom')
            .invoke('text')
            .then((zoom) => {
                expect(parseFloat(zoom)).to.equal(1);
            });

        // Verify position is also reset to (0, 0)
        cy.get('#x')
            .invoke('text')
            .then((x) => {
                expect(parseFloat(x)).to.equal(0);
            });
        cy.get('#y')
            .invoke('text')
            .then((y) => {
                expect(parseFloat(y)).to.equal(0);
            });
    });

    it('resets state of zoom in button when zoom is reset', () => {
        // Zoom in to max to disable zoom in button
        cy.get('#zoom-in').click();
        cy.wait(300);
        cy.get('#zoom-in').click();
        cy.wait(300);

        // Verify zoom in button is disabled
        cy.get('#zoom-in').should('have.class', 'disabled');

        // Reset zoom
        cy.get('#zoom-reset').click();
        cy.wait(300);

        // Verify zoom in button is no longer disabled
        cy.get('#zoom-in').should('not.have.class', 'disabled');
    });

    it('resets state of zoom out button when zoom is reset', () => {
        // Zoom out to min to disable zoom out button
        cy.get('#zoom-out').click();
        cy.wait(300);

        // Verify zoom out button is disabled
        cy.get('#zoom-out').should('have.class', 'disabled');

        // Reset zoom
        cy.get('#zoom-reset').click();
        cy.wait(300);

        // Verify zoom out button is no longer disabled
        cy.get('#zoom-out').should('not.have.class', 'disabled');
    });
});
