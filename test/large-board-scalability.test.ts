import { jest, expect } from '@jest/globals';
import { initGame, GameOptions, getGameState, selectSpot } from '../src/game';
import { NonexistentMockGameStorage } from './util';
import { Mock } from 'jest-mock';

/**
 * Scalability regression test for large board flood fill.
 *
 * The current implementation uses a mutually-recursive flood fill
 * (revealSpot → revealMultiple → revealSpot …) whose executors run
 * synchronously inside Promise constructors. On a large board this exhausts
 * the JavaScript call stack with "RangeError: Maximum call stack size
 * exceeded". The RangeError is silently swallowed by the Promise machinery,
 * so the flood fill terminates early and leaves most tiles unrevealed.
 *
 * On a 1 000×1 000 board with only 10 mines, a flood fill from (0, 0) should
 * reveal all 999 990 non-mine cells and immediately win the game. If the
 * recursive implementation stack-overflows mid-fill, far fewer cells will be
 * revealed and the game will NOT be won — which is how this test catches the
 * bug.
 *
 * This test is intentionally RED. It documents the known failure so that a
 * future iterative implementation can turn it GREEN.
 */
describe('large board scalability', () => {
    let eventHandlerStub: Mock;

    beforeEach(() => {
        eventHandlerStub = jest.fn();
    });

    it('should complete a flood fill on a 1000x1000 board without stack overflow', async () => {
        // 1 000 000 cells, 10 mines → 999 990 safe cells.
        // With so few mines the entire safe region is almost certainly a single
        // connected component, so one click should reveal every safe cell and
        // immediately win the game.
        const gameOptions: GameOptions = {
            boardWidth: 1000,
            boardHeight: 1000,
            numberOfMines: 10,
            revealBoardOnLoss: false,
            difficultyKey: 'custom',
        };

        await initGame(gameOptions, eventHandlerStub, new NonexistentMockGameStorage());

        // The recursive flood fill silently overflows the call stack inside a
        // Promise constructor, leaving most tiles unrevealed. The game is
        // therefore never won. This assertion exposes that failure.
        const result = selectSpot(0, 0);
        expect(result.win).toBe(true);

        // Double-check via game state: every non-mine cell must be revealed.
        const state = getGameState();
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
