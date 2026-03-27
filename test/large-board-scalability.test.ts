import { jest, expect, describe, beforeEach, it } from '@jest/globals';
import { initGame, GameOptions, getGameState, selectSpot } from '../src/game';
import { NonexistentMockGameStorage } from './util';
import { Mock } from 'jest-mock';

/**
 * Scalability regression tests for the flood fill reveal logic.
 *
 * The original recursive implementation overflows the JS call stack on boards
 * of 100×100 or larger, aborting the fill mid-way and leaving most tiles
 * unrevealed. Each test places the single mine at the center so that clicking
 * (0, 0) is guaranteed to trigger a full flood fill. The assertion — that the
 * game is won (all safe cells revealed) — serves as the pass/fail signal.
 *
 * See: https://github.com/Coteh/MinesweeperClone/issues/3
 */
describe('large board scalability', () => {
    let eventHandlerStub: Mock;

    beforeEach(() => {
        eventHandlerStub = jest.fn();
    });

    it('should complete a flood fill on a 100x100 board without stack overflow', async () => {
        // 10 000 cells, 1 mine → 9 999 safe cells.
        const gameOptions: GameOptions = {
            boardWidth: 100,
            boardHeight: 100,
            numberOfMines: 1,
            revealBoardOnLoss: false,
            difficultyKey: 'custom',
        };

        await initGame(gameOptions, eventHandlerStub, new NonexistentMockGameStorage());

        // Move the mine to the center so that revealing a spot will always flood fill
        let state = getGameState();
        loop: for (let i = 0; i < gameOptions.boardHeight; i++) {
            for (let j = 0; j < gameOptions.boardWidth; j++) {
                if (state.board[i][j].isMine) {
                    state.board[i][j].isMine = false;
                    break loop;
                }
            }
        }
        const centerX = Math.floor(gameOptions.boardWidth / 2);
        const centerY = Math.floor(gameOptions.boardHeight / 2);
        state.board[centerY][centerX].isMine = true;

        // Reveal top left corner
        const result = selectSpot(0, 0);

        expect(result.win).toBe(true);

        // Double-check via game state: every non-mine cell must be revealed.
        state = getGameState();
        const totalCells = gameOptions.boardWidth * gameOptions.boardHeight;
        const expectedRevealed = totalCells - gameOptions.numberOfMines;
        let revealedCount = 0;
        for (let y = 0; y < gameOptions.boardHeight; y++) {
            for (let x = 0; x < gameOptions.boardWidth; x++) {
                if (state.board[y][x].isRevealed && !state.board[y][x].isMine) {
                    revealedCount++;
                }
            }
        }
        expect(revealedCount).toBe(expectedRevealed);
    }, 10000 /* 10 s ceiling */);

    it('should complete a flood fill on a 1000x1000 board without stack overflow', async () => {
        // 1 000 000 cells, 1 mine → 999 999 safe cells.
        const gameOptions: GameOptions = {
            boardWidth: 1000,
            boardHeight: 1000,
            numberOfMines: 1,
            revealBoardOnLoss: false,
            difficultyKey: 'custom',
        };

        await initGame(gameOptions, eventHandlerStub, new NonexistentMockGameStorage());

        // Move the mine to the center so that revealing a spot will always flood fill
        let state = getGameState();
        loop: for (let i = 0; i < gameOptions.boardHeight; i++) {
            for (let j = 0; j < gameOptions.boardWidth; j++) {
                if (state.board[i][j].isMine) {
                    state.board[i][j].isMine = false;
                    break loop;
                }
            }
        }
        const centerX = Math.floor(gameOptions.boardWidth / 2);
        const centerY = Math.floor(gameOptions.boardHeight / 2);
        state.board[centerY][centerX].isMine = true;

        // Reveal top left corner
        const result = selectSpot(0, 0);

        expect(result.win).toBe(true);

        // Double-check via game state: every non-mine cell must be revealed.
        state = getGameState();
        const totalCells = gameOptions.boardWidth * gameOptions.boardHeight;
        const expectedRevealed = totalCells - gameOptions.numberOfMines;
        let revealedCount = 0;
        for (let y = 0; y < gameOptions.boardHeight; y++) {
            for (let x = 0; x < gameOptions.boardWidth; x++) {
                if (state.board[y][x].isRevealed && !state.board[y][x].isMine) {
                    revealedCount++;
                }
            }
        }
        expect(revealedCount).toBe(expectedRevealed);
    }, 120000 /* 2 min ceiling */);
});
