/// <reference types="cypress" />

describe('Theme Color Meta Tag', () => {
  beforeEach(() => {
    cy.visit('/');
    // Wait for the page to load
    cy.wait(1000);
  });

  it('should have the theme-color meta tag in the document', () => {
    cy.document().then((doc) => {
      const metaTag = doc.querySelector('meta[name="theme-color"]');
      expect(metaTag).to.exist;
    });
  });

  it('should initially set dimmed theme color when main menu is shown', () => {
    cy.document().then((doc) => {
      const metaTag = doc.querySelector('meta[name="theme-color"]');
      // Dimmed color: rgb(136, 136, 136) with 30% black overlay = rgb(95, 95, 95)
      expect(metaTag?.getAttribute('content')).to.equal('rgb(95, 95, 95)');
    });
  });

  it('should update theme color to normal when applying normal theme', () => {
    cy.window().then(async (win) => {
      // Apply normal theme color
      cy.wrap(null).then(() => {
        return win.eval(`
          import('/client/theme-manager.js').then(m => {
            m.applyNormalThemeColor();
          })
        `);
      });
      
      cy.document().then((doc) => {
        const metaTag = doc.querySelector('meta[name="theme-color"]');
        // Normal color: rgb(136, 136, 136)
        expect(metaTag?.getAttribute('content')).to.equal('rgb(136, 136, 136)');
      });
    });
  });

  it('should update theme color to dimmed when applying dimmed theme', () => {
    cy.window().then(async (win) => {
      // First apply normal
      await win.eval(`
        import('/client/theme-manager.js').then(m => {
          m.applyNormalThemeColor();
        })
      `);
      
      // Then apply dimmed
      await win.eval(`
        import('/client/theme-manager.js').then(m => {
          m.applyDimmedThemeColor();
        })
      `);
      
      cy.document().then((doc) => {
        const metaTag = doc.querySelector('meta[name="theme-color"]');
        // Dimmed color: rgb(95, 95, 95)
        expect(metaTag?.getAttribute('content')).to.equal('rgb(95, 95, 95)');
      });
    });
  });

  it('should correctly blend colors using the blendColors function', () => {
    cy.window().then(async (win) => {
      const result = await win.eval(`
        import('/client/theme-manager.js').then(m => {
          return m.blendColors('rgba(255, 0, 0, 0.5)', 'rgb(0, 0, 255)', 0.5);
        })
      `);
      
      // Expected: rgb(128, 0, 128) - half red, half blue
      expect(result).to.equal('rgb(128, 0, 128)');
    });
  });

  it('should handle theme switching and apply dimmed color immediately', () => {
    cy.window().then(async (win) => {
      // Switch to a new theme (simulating theme change in settings)
      await win.eval(`
        import('/client/theme-manager.js').then(m => {
          m.setTheme({
            name: 'red',
            backgroundColor: 'rgb(200, 50, 50)',
            overlayColor: 'rgba(0, 0, 0, 0.3)',
            overlayAlpha: 0.3
          });
        })
      `);
      
      cy.document().then((doc) => {
        const metaTag = doc.querySelector('meta[name="theme-color"]');
        // Should apply dimmed color for new theme: rgb(140, 35, 35)
        // 200 * 0.7 = 140, 50 * 0.7 = 35
        expect(metaTag?.getAttribute('content')).to.equal('rgb(140, 35, 35)');
      });
    });
  });

  it('should apply normal theme color after switching themes and closing dialog', () => {
    cy.window().then(async (win) => {
      // Switch to a new theme
      await win.eval(`
        import('/client/theme-manager.js').then(m => {
          m.setTheme({
            name: 'blue',
            backgroundColor: 'rgb(50, 50, 200)',
            overlayColor: 'rgba(0, 0, 0, 0.3)',
            overlayAlpha: 0.3
          });
        })
      `);
      
      // Apply normal theme color (simulating closing the dialog)
      await win.eval(`
        import('/client/theme-manager.js').then(m => {
          m.applyNormalThemeColor();
        })
      `);
      
      cy.document().then((doc) => {
        const metaTag = doc.querySelector('meta[name="theme-color"]');
        // Should apply normal color for new theme: rgb(50, 50, 200)
        expect(metaTag?.getAttribute('content')).to.equal('rgb(50, 50, 200)');
      });
    });
  });

  it('should convert hex colors to RGB correctly', () => {
    cy.window().then(async (win) => {
      const result = await win.eval(`
        import('/client/theme-manager.js').then(m => {
          return m.hexToRgb(0x888888);
        })
      `);
      
      expect(result).to.equal('rgb(136, 136, 136)');
    });
  });

  it('should maintain correct theme state when toggling between dimmed and normal', () => {
    cy.window().then(async (win) => {
      // Apply dimmed
      await win.eval(`
        import('/client/theme-manager.js').then(m => {
          m.applyDimmedThemeColor();
        })
      `);
      
      cy.document().then((doc) => {
        let metaTag = doc.querySelector('meta[name="theme-color"]');
        expect(metaTag?.getAttribute('content')).to.equal('rgb(95, 95, 95)');
      });
      
      // Apply normal
      await win.eval(`
        import('/client/theme-manager.js').then(m => {
          m.applyNormalThemeColor();
        })
      `);
      
      cy.document().then((doc) => {
        let metaTag = doc.querySelector('meta[name="theme-color"]');
        expect(metaTag?.getAttribute('content')).to.equal('rgb(136, 136, 136)');
      });
      
      // Apply dimmed again
      await win.eval(`
        import('/client/theme-manager.js').then(m => {
          m.applyDimmedThemeColor();
        })
      `);
      
      cy.document().then((doc) => {
        let metaTag = doc.querySelector('meta[name="theme-color"]');
        expect(metaTag?.getAttribute('content')).to.equal('rgb(95, 95, 95)');
      });
    });
  });
});
