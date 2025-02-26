import { VerifyBoardOptions } from '..';
import { MineBlock } from '../../../src/game';

Cypress.Commands.add('waitForGameReady', () => {
    cy.get('.game-board').should('be.visible');
});

Cypress.Commands.add(
    'verifyBoardMatches',
    (expectedBoard: (MineBlock | undefined)[][], options?: VerifyBoardOptions) => {
        cy.get('.game-board > .row').should('have.length', expectedBoard.length);
        for (let i = 0; i < expectedBoard.length; i++) {
            cy.get('.game-board > .row')
                .eq(i)
                .within(() => {
                    cy.get('.box').then((boxes) => {
                        expect(boxes).to.have.length(expectedBoard[i].length);
                        for (let j = 0; j < expectedBoard[i].length; j++) {
                            const expectedVal = expectedBoard[i][j];
                            if (expectedVal && expectedVal.isRevealed) {
                                if (!expectedVal.isFlagged) {
                                    // Assert that this block appears as revealed
                                    expect(boxes.eq(j)).to.have.class('revealed');
                                    // Check that the number of mines around the block is correct
                                    const numAdjMines = expectedVal.adjMinesCount;
                                    if (numAdjMines > 0) {
                                        expect(boxes.eq(j)).to.have.text(numAdjMines.toString());
                                    } else {
                                        expect(boxes.eq(j)).to.have.text('');
                                    }
                                }
                            }
                            if (
                                expectedVal &&
                                expectedVal.isMine &&
                                expectedVal.isFlagged &&
                                expectedVal.isRevealed
                            ) {
                                // Assert that this block does not appear as "revealed"
                                expect(boxes.eq(j)).to.not.have.class('revealed');
                                // Assert that child element has flag image
                                const child = boxes.eq(j).children();
                                expect(child).to.have.length(1);
                                expect(child).to.have.attr('src', 'img/Flag.png');
                            } else if (
                                expectedVal &&
                                expectedVal.isMine &&
                                expectedVal.isRevealed
                            ) {
                                // Assert that this block appears as revealed
                                expect(boxes.eq(j)).to.have.class('revealed');
                                // Assert that child element has mine image
                                const child = boxes.eq(j).children();
                                expect(child).to.have.length(1);
                                expect(child).to.have.attr('src', 'img/Mine.png');
                                // If the mine is the losing mine, assert that the mine has the 'losing' class
                                if (expectedVal.isLosingSpot) {
                                    expect(boxes.eq(j)).to.have.class('losing');
                                } else {
                                    expect(boxes.eq(j)).to.not.have.class('losing');
                                }
                            } else if (expectedVal && expectedVal.isFlagged) {
                                // Assert that child element has flag image
                                const child = boxes.eq(j).children();
                                expect(child).to.have.length(1);
                                if (expectedVal.isRevealed && options && options.isGameOver) {
                                    // Assert that this flag will appear as an incorrect one
                                    expect(child).to.have.attr('src', 'img/Mine.png');
                                    expect(boxes.eq(j)).to.have.class('incorrect');
                                } else {
                                    expect(child).to.have.attr('src', 'img/Flag.png');
                                }
                            } else if (expectedVal && !expectedVal.isRevealed) {
                                expect(boxes.eq(j)).to.not.have.class('revealed');
                                const child = boxes.eq(j).children();
                                expect(child).to.have.length(0);
                            }
                        }
                    });
                });
        }
    }
);
