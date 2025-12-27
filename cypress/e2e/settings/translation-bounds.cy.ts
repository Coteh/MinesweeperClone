/// <reference types="cypress" />

context('translation bounds', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {},
        });
        cy.waitForGameReady();
    });

    it('clamps panning via arrow keys to difficulty bounds', () => {
        // Ensure we're on easy which has known bounds in the fixture
        cy.changeDifficulty('easy');

        cy.fixture('config.json').then((settings) => {
            const bounds = (settings as any).difficulty.easy.bounds;
            const maxX = bounds.maxX; // positive
            const minX = bounds.minX; // negative
            const maxY = bounds.maxY; // positive
            const minY = bounds.minY; // negative

            // Press ArrowLeft many times to try to exceed maxX
            for (let i = 0; i < 50; i++) {
                cy.realPress('ArrowLeft');
            }
            // Give update loop some time
            cy.wait(300);
            cy.get('#x')
                .invoke('text')
                .then((text) => {
                    expect(text).to.equal(`${maxX}`);
                    expect(text).to.not.equal(`-${maxX}`);
                });

            // Press ArrowRight many times to try to exceed minX
            for (let i = 0; i < 100; i++) {
                cy.realPress('ArrowRight');
            }
            cy.wait(300);
            cy.get('#x')
                .invoke('text')
                .then((text) => {
                    expect(text).to.equal(`${minX}`);
                });

            // Now test vertical bounds via arrows: ArrowUp -> increases y towards maxY
            for (let i = 0; i < 50; i++) {
                cy.realPress('ArrowUp');
            }
            cy.wait(300);
            cy.get('#y')
                .invoke('text')
                .then((text) => {
                    expect(text).to.equal(`${maxY}`);
                    expect(text).to.not.equal(`-${maxY}`);
                });

            // ArrowDown -> decreases y towards minY
            for (let i = 0; i < 100; i++) {
                cy.realPress('ArrowDown');
            }
            cy.wait(300);
            cy.get('#y')
                .invoke('text')
                .then((text) => {
                    expect(text).to.equal(`${minY}`);
                });
        });
    });

    it('clamps panning via touch to difficulty bounds', () => {
        // Start on easy
        cy.changeDifficulty('easy');

        cy.fixture('config.json').then((settings) => {
            const bounds = (settings as any).difficulty.easy.bounds;
            const maxX = bounds.maxX; // positive
            const minX = bounds.minX; // negative
            const maxY = bounds.maxY; // positive
            const minY = bounds.minY; // negative

            // Simulate touch pan to the right repeatedly
            const zoomable = cy.get('#zoomable');

            // start touch at x=100
            zoomable.trigger('touchstart', {
                touches: [{ clientX: 100, clientY: 200 }],
            });

            // move to the left (increasing translate x)
            for (let x = 100; x <= 1000; x += 50) {
                zoomable.trigger('touchmove', {
                    touches: [{ clientX: x, clientY: 200 }],
                });
            }
            zoomable.trigger('touchend', {
                changedTouches: [{ clientX: maxX, clientY: 200 }],
            });

            cy.wait(200);
            cy.get('#x')
                .invoke('text')
                .then((text) => {
                    expect(text).to.equal(`${maxX}`);
                    expect(text).to.not.equal(`-${maxX}`);
                });

            // move the other way to minX
            zoomable.trigger('touchstart', {
                touches: [{ clientX: 1000, clientY: 200 }],
            });
            for (let x = 1000; x >= -500; x -= 50) {
                zoomable.trigger('touchmove', {
                    touches: [{ clientX: x, clientY: 200 }],
                });
            }
            zoomable.trigger('touchend', {
                changedTouches: [{ clientX: minX, clientY: 200 }],
            });

            cy.wait(200);
            cy.get('#x')
                .invoke('text')
                .then((text) => {
                    expect(text).to.equal(`${minX}`);
                });

            // Now test vertical touch bounds. Move DOWN (increasing clientY) to reach maxY
            zoomable.trigger('touchstart', {
                touches: [{ clientX: 200, clientY: 200 }],
            });
            for (let y = 200; y <= 2000; y += 100) {
                zoomable.trigger('touchmove', {
                    touches: [{ clientX: 200, clientY: y }],
                });
            }
            zoomable.trigger('touchend', {
                changedTouches: [{ clientX: 200, clientY: maxY }],
            });
            cy.wait(200);
            cy.get('#y')
                .invoke('text')
                .then((text) => {
                    expect(text).to.equal(`${maxY}`);
                    expect(text).to.not.equal(`-${maxY}`);
                });

            // Move UP (decreasing clientY) to reach minY
            zoomable.trigger('touchstart', {
                touches: [{ clientX: 200, clientY: 2000 }],
            });
            for (let y = 2000; y >= -1000; y -= 100) {
                zoomable.trigger('touchmove', {
                    touches: [{ clientX: 200, clientY: y }],
                });
            }
            zoomable.trigger('touchend', {
                changedTouches: [{ clientX: 200, clientY: minY }],
            });
            cy.wait(200);
            cy.get('#y')
                .invoke('text')
                .then((text) => {
                    expect(text).to.equal(`${minY}`);
                });
        });
    });
});
