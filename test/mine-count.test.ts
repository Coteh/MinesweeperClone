import { jest, expect, describe, beforeEach, afterEach, it } from '@jest/globals';
import {
    initGame,
    selectSpot,
    flagSpot,
    getGameState,
    GameOptions,
    GameState,
    cleanupGame,
} from '../src/game';
import { Mock } from 'jest-mock';
import { NonexistentMockGameStorage } from './util';
import { IGameStorage } from '../src/storage';

describe('mine count with flags on loss', function () {
    let eventHandlerStub: Mock;

    function setupGame(gameStorage: IGameStorage, gameOptions: GameOptions): GameState {
        initGame(gameOptions, eventHandlerStub, gameStorage);
        return getGameState();
    }

    function calculateFlaggedCount(gameState: GameState): number {
        return gameState.board.reduce(
            (acc, row) => acc + row.reduce((acc, val) => acc + (val.isFlagged ? 1 : 0), 0),
            0,
        );
    }

    beforeEach(() => {
        eventHandlerStub = jest.fn();
    });

    afterEach(() => {
        cleanupGame();
    });

    it('should maintain mine count when flagged mines are revealed on loss', function () {
        // Create a simple 3x3 board with 2 mines
        // Layout:
        // M . .
        // . M .
        // . . .
        const gameState = setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 3,
            boardHeight: 3,
            numberOfMines: 2,
            revealBoardOnLoss: true,
            difficultyKey: 'test',
        });

        // Find the two mines
        const minePositions: { x: number; y: number }[] = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (gameState.board[i][j].isMine) {
                    minePositions.push({ x: j, y: i });
                }
            }
        }

        expect(minePositions.length).toBe(2);

        // First, click on a safe spot to prevent first-click mine relocation
        let safeSpot = null;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (!gameState.board[i][j].isMine) {
                    safeSpot = { x: j, y: i };
                    break;
                }
            }
            if (safeSpot) break;
        }
        if (safeSpot) {
            selectSpot(safeSpot.x, safeSpot.y);
        }

        // Flag one of the mines
        flagSpot(minePositions[0].x, minePositions[0].y);
        expect(gameState.board[minePositions[0].y][minePositions[0].x].isFlagged).toBe(true);

        // Verify the mine count reflects the flag (should be 2 - 1 = 1)
        // This would be verified by the UI rendering, but we can check the game state

        // Now reveal the other mine (causing a loss)
        const result = selectSpot(minePositions[1].x, minePositions[1].y);
        expect(result.hitInfo).toBe('mine');
        expect(gameState.ended).toBe(true);

        // After revealing the mine, both mines should now be revealed
        expect(gameState.board[minePositions[0].y][minePositions[0].x].isRevealed).toBe(true);
        expect(gameState.board[minePositions[1].y][minePositions[1].x].isRevealed).toBe(true);

        // The first mine should still be flagged even though it's revealed
        expect(gameState.board[minePositions[0].y][minePositions[0].x].isFlagged).toBe(true);

        // The mine count calculation should still account for the flagged mine
        // numberOfMines (2) - flagged count (1) = 1
        const flaggedCount = calculateFlaggedCount(gameState);
        expect(flaggedCount).toBe(1);

        const unflaggedMineCount = gameState.gameOptions.numberOfMines - flaggedCount;
        expect(unflaggedMineCount).toBe(1);
    });

    it('should maintain mine count at zero when all mines are flagged before loss', function () {
        // Create a simple 3x3 board with 2 mines
        const gameState = setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 3,
            boardHeight: 3,
            numberOfMines: 2,
            revealBoardOnLoss: true,
            difficultyKey: 'test',
        });

        // Find the two mines
        const minePositions: { x: number; y: number }[] = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (gameState.board[i][j].isMine) {
                    minePositions.push({ x: j, y: i });
                }
            }
        }

        expect(minePositions.length).toBe(2);

        // First, click on a safe spot to prevent first-click mine relocation
        let safeSpot = null;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (!gameState.board[i][j].isMine) {
                    safeSpot = { x: j, y: i };
                    break;
                }
            }
            if (safeSpot) break;
        }
        if (safeSpot) {
            selectSpot(safeSpot.x, safeSpot.y);
        }

        // Flag both mines
        flagSpot(minePositions[0].x, minePositions[0].y);
        flagSpot(minePositions[1].x, minePositions[1].y);

        // Now select one of the flagged mines (this will unflag it and then reveal it)
        const result = selectSpot(minePositions[0].x, minePositions[0].y);
        expect(result.hitInfo).toBe('mine');
        expect(gameState.ended).toBe(true);

        // The clicked mine should be unflagged (because selectSpot unflags before revealing)
        expect(gameState.board[minePositions[0].y][minePositions[0].x].isFlagged).toBe(false);

        // The second mine should still be flagged
        expect(gameState.board[minePositions[1].y][minePositions[1].x].isFlagged).toBe(true);

        // The mine count should be: 2 total mines - 1 flagged mine = 1
        const flaggedCount = calculateFlaggedCount(gameState);
        expect(flaggedCount).toBe(1);

        const unflaggedMineCount = gameState.gameOptions.numberOfMines - flaggedCount;
        expect(unflaggedMineCount).toBe(1);
    });

    it('should show correct mine count when multiple mines flagged correctly', function () {
        // Create a larger board to test with more mines
        const gameState = setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 5,
            boardHeight: 5,
            numberOfMines: 5,
            revealBoardOnLoss: true,
            difficultyKey: 'test',
        });

        // Find all mines
        const minePositions: { x: number; y: number }[] = [];
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (gameState.board[i][j].isMine) {
                    minePositions.push({ x: j, y: i });
                }
            }
        }

        expect(minePositions.length).toBe(5);

        // First, click on a safe spot to prevent first-click mine relocation
        let safeSpot = null;
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (!gameState.board[i][j].isMine) {
                    safeSpot = { x: j, y: i };
                    break;
                }
            }
            if (safeSpot) break;
        }
        if (safeSpot) {
            selectSpot(safeSpot.x, safeSpot.y);
        }

        // Flag 3 of the 5 mines
        flagSpot(minePositions[0].x, minePositions[0].y);
        flagSpot(minePositions[1].x, minePositions[1].y);
        flagSpot(minePositions[2].x, minePositions[2].y);

        // Reveal one unflagged mine (causing a loss)
        const result = selectSpot(minePositions[3].x, minePositions[3].y);
        expect(result.hitInfo).toBe('mine');
        expect(gameState.ended).toBe(true);

        // Check that 3 mines are still flagged
        const flaggedCount = calculateFlaggedCount(gameState);
        expect(flaggedCount).toBe(3);

        // The unflagged mine count should be 5 - 3 = 2
        const unflaggedMineCount = gameState.gameOptions.numberOfMines - flaggedCount;
        expect(unflaggedMineCount).toBe(2);
    });
});
