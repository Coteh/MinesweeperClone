/// <reference types="cypress" />

// Time to wait for zoom animation/update to complete
const ZOOM_UPDATE_DELAY = 300;

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
                cy.wait(ZOOM_UPDATE_DELAY);

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
        cy.wait(ZOOM_UPDATE_DELAY);
        cy.get('#zoom-in').click();
        cy.wait(ZOOM_UPDATE_DELAY);

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
        cy.wait(ZOOM_UPDATE_DELAY);

        // Get current zoom level
        cy.get('#zoom')
            .invoke('text')
            .then((initialZoom) => {
                const initialZoomValue = parseFloat(initialZoom);

                // Click zoom out button
                cy.get('#zoom-out').click();

                // Wait for zoom to update
                cy.wait(ZOOM_UPDATE_DELAY);

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
        cy.wait(ZOOM_UPDATE_DELAY);

        // Verify zoom level is at minimum (0.5)
        cy.get('#zoom')
            .invoke('text')
            .then((zoom) => {
                expect(parseFloat(zoom)).to.equal(0.5);
            });

        // Verify zoom out button is disabled
        cy.get('#zoom-out').should('have.class', 'disabled');
    });

    it('resets zoom, position, and button states when zoom reset is clicked', () => {
        // Zoom in to max, then zoom out to min
        cy.get('#zoom-in').click();
        cy.wait(ZOOM_UPDATE_DELAY);
        cy.get('#zoom-in').click();
        cy.wait(ZOOM_UPDATE_DELAY);
        cy.get('#zoom-in').should('have.class', 'disabled');

        cy.get('#zoom-out').click();
        cy.wait(ZOOM_UPDATE_DELAY);
        cy.get('#zoom-in').should('not.have.class', 'disabled');

        // Verify zoom is not at default (1)
        cy.get('#zoom')
            .invoke('text')
            .then((zoom) => {
                expect(parseFloat(zoom)).to.not.equal(1);
            });

        // Verify position is set to (0, 0)
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

        cy.realPress('ArrowLeft');

        // Verify position is not at default
        cy.get('#x')
            .invoke('text')
            .then((x) => {
                expect(parseFloat(x)).to.not.equal(0);
            });
        cy.get('#y')
            .invoke('text')
            .then((y) => {
                expect(parseFloat(y)).to.equal(0);
            });

        // Click reset zoom button
        cy.get('#zoom-reset').click();
        cy.wait(ZOOM_UPDATE_DELAY);

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

        // Verify zoom buttons are enabled again
        cy.get('#zoom-in').should('not.have.class', 'disabled');
        cy.get('#zoom-out').should('not.have.class', 'disabled');
    });
});
