import { MineBlock } from "../../../src/game";

Cypress.Commands.add('verifyBoardMatches', (expectedBoard: (MineBlock | undefined)[][]) => {
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
                            expect(boxes.eq(j)).to.have.class('revealed');
                            // Check that the number of mines around the block is correct
                            const numMines = expectedVal.adjMinesCount;
                            if (numMines > 0) {
                                expect(boxes.eq(j)).to.have.text(numMines.toString());
                            } else {
                                expect(boxes.eq(j)).to.have.text('');
                            }
                        }
                        console.log(expectedVal);
                        if (expectedVal && expectedVal.isMine && expectedVal.isRevealed) {
                            // Assert that child element has mine image
                            const child = boxes.eq(j).children();
                            expect(child).to.have.length(1);
                            expect(child).to.have.attr('src', 'img/Mine.png');
                        } else if (expectedVal && expectedVal.isFlagged) {
                            // Assert that child element has flag image
                            const child = boxes.eq(j).children();
                            expect(child).to.have.length(1);
                            expect(child).to.have.attr('src', 'img/Flag.png');
                        } else if (expectedVal && !expectedVal.isRevealed) {
                            expect(boxes.eq(j)).to.not.have.class('revealed');
                            const child = boxes.eq(j).children();
                            expect(child).to.have.length(0);
                        }
                    }
                });
            });
    }
});

Cypress.Commands.add('verifyBoardDoesNotMatch', (expectedBoard: (MineBlock | undefined)[][]) => {
    cy.get('.game-board > .row').should('have.length', expectedBoard.length);
    for (let i = 0; i < expectedBoard.length; i++) {
        cy.get('.game-board > .row')
            .eq(i)
            .within(() => {
                cy.get('.box').then((boxes) => {
                    if (expectedBoard[i].length != boxes.length) {
                        return;
                    }
                    let numMatches = 0;
                    for (let j = 0; j < expectedBoard[i].length; j++) {
                        const expectedVal = expectedBoard[i][j];
                        if (expectedVal && expectedVal.isRevealed) {
                            // Increment number of matches if block is revealed and...
                            if (boxes.eq(j).hasClass('revealed')) {
                                // ...if child element has correct number of mines around the block
                                const numMines = expectedVal.adjMinesCount;
                                if (numMines > 0) {
                                    if (boxes.eq(j).text() === numMines.toString()) {
                                        numMatches++;
                                    }
                                } else {
                                    if (boxes.eq(j).text() === '') {
                                        numMatches++;
                                    }
                                }
                            }
                        }
                        if (expectedVal && expectedVal.isMine) {
                            // Increment number of matches if child element has mine image
                            const child = boxes.eq(j).children();
                            if (child.length === 1 && child.attr('src') === 'img/Mine.png') {
                                numMatches++;
                            }
                        } else if (expectedVal && expectedVal.isFlagged) {
                            // Increment number of matches if child element has flag image
                            const child = boxes.eq(j).children();
                            if (child.length === 1 && child.attr('src') === 'img/Flag.png') {
                                numMatches++;
                            }
                        } else if (expectedVal && !expectedVal.isRevealed) {
                            if (!boxes.eq(j).hasClass('revealed')) {
                                numMatches++;
                            }
                        }
                    }
                    expect(numMatches).to.be.lessThan(expectedBoard[i].length);
                });
            });
    }
});
