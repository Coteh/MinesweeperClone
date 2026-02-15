/// <reference types="cypress" />

import { GamePersistentState, GameState } from '../../../src/game';
import { Preferences } from '../../../src/preferences';

describe('misc', () => {
    beforeEach(() => {
        cy.clearBrowserCache();
        cy.visit('/', {
            onBeforeLoad: () => {
                const boardLayout = [
                    '111.......',
                    '2F2.......',
                    '3F3.111.11',
                    '2F2.1F222F',
                    '111.1UUUU2',
                    '....1U221F',
                    '11..1F1.11',
                    'F1..111.1F',
                    '11......11',
                    '..........',
                ];
                const boardWidth = boardLayout[0].length;
                const boardHeight = boardLayout.length;
                const flagCount = boardLayout.reduce(
                    (acc, row) => acc + row.split('').filter((cell) => cell === 'F').length,
                    0,
                );
                const board = boardLayout.map((row, y) =>
                    row.split('').map((cell, x) => {
                        const isFlagged = cell === 'F';
                        const isMine = isFlagged;
                        const isUnrevealed = cell === 'U' || isFlagged;
                        const isRevealed = !isUnrevealed;
                        const adjMinesCount = cell >= '0' && cell <= '8' ? Number(cell) : 0;
                        return {
                            x,
                            y,
                            isMine,
                            isRevealed,
                            isLosingSpot: false,
                            isFlagged,
                            isQuestionMark: false,
                            adjMinesCount,
                        };
                    }),
                );
                const gameState: GameState = {
                    board,
                    ended: false,
                    won: false,
                    firstBlockClicked: true,
                    score: 0,
                    didUndo: false,
                    achievedHighscore: false,
                    gameOptions: {
                        boardHeight,
                        boardWidth,
                        numberOfMines: flagCount + 10,
                        revealBoardOnLoss: true,
                        difficultyKey: 'easy',
                    },
                    elapsedTimeMS: 56000,
                    spareMineSpot: { x: 9, y: 9 },
                };
                const persistentState: GamePersistentState = {
                    highscore: {},
                    unlockables: {},
                    hasPlayedBefore: true,
                };
                const preferences: Preferences = {
                    debugHudEnabled: true,
                    debugHudVisible: false,
                };
                window.localStorage.setItem('ms-game-state', JSON.stringify(gameState));
                window.localStorage.setItem('ms-persistent-state', JSON.stringify(persistentState));
                window.localStorage.setItem('ms-preferences', JSON.stringify(preferences));
            },
        });
        cy.waitForGameReady();
    });

    specify('gameplay screenshot', () => {
        cy.viewport('iphone-6');

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
