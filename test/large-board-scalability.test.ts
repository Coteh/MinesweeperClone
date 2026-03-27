import { jest, expect } from '@jest/globals';
import { initGame, GameOptions, getGameState, selectSpot } from '../src/game';
import { NonexistentMockGameStorage } from './util';
import { Mock } from 'jest-mock';

/**
 * Scalability regression tests for large board flood fill.
 *
 * The current implementation uses a mutually-recursive flood fill
 * (revealSpot → revealMultiple → revealSpot …) whose executors run
 * synchronously inside Promise constructors. On a large board this exhausts
 * the JavaScript call stack with "RangeError: Maximum call stack size
 * exceeded". The RangeError is silently swallowed by the Promise machinery,
 * so the flood fill terminates early and leaves most tiles unrevealed.
 *
 * Each test places the single mine at the center of the board so that
 * clicking (0, 0) is guaranteed to trigger a full flood fill. If the
 * recursive implementation stack-overflows mid-fill, far fewer cells will be
 * revealed and the game will NOT be won — which is how these tests catch the
 * bug.
 *
 * These tests are intentionally RED. They document the known failure so that
 * a future iterative implementation can turn them GREEN.
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
loop:
        for (let i = 0; i < gameOptions.boardHeight; i++) {
            for (let j = 0; j < gameOptions.boardWidth; j++) {
                if (state.board[i][j].isMine) {
                    state.board[i][j].isMine = false;
                    break loop;
                }
            }
        }
        state.board[Math.floor(gameOptions.boardHeight / 2)][Math.floor(gameOptions.boardWidth / 2)].isMine = true;

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
        // 1 000 000 cells, 10 mines → 999 990 safe cells.
        // With so few mines the entire safe region is almost certainly a single
        // connected component, so one click should reveal every safe cell and
        // immediately win the game.
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
loop:
        for (let i = 0; i < gameOptions.boardHeight; i++) {
            for (let j = 0; j < gameOptions.boardWidth; j++) {
                if (state.board[i][j].isMine) {
                    state.board[i][j].isMine = false;
                    break loop;
                }
            }
        }
        state.board[Math.floor(gameOptions.boardHeight / 2)][Math.floor(gameOptions.boardWidth / 2)].isMine = true;
        
        // Reveal top left corner
        const result = selectSpot(0, 0);

        // The recursive flood fill silently overflows the call stack inside a
        // Promise constructor, leaving most tiles unrevealed. The game is
        // therefore never won. This assertion exposes that failure.
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
    }, 30000 /* 30 s ceiling — the crash happens well before this */);
});
