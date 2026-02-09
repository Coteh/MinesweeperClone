import { jest, expect } from '@jest/globals';
import {
    initGame,
    selectSpot,
    flagSpot,
    selectAdjacentSpots,
    getGameState,
    GameOptions,
    GameState,
} from '../src/game';
import { Mock } from 'jest-mock';
import { NonexistentMockGameStorage, MockGameStorage } from './util';
import { IGameStorage } from '../src/storage';

describe('auto-flag mines on win', function () {
    let eventHandlerStub: Mock;

    async function setupGame(
        gameStorage: IGameStorage,
        gameOptions: GameOptions,
    ): Promise<GameState> {
        await initGame(gameOptions, eventHandlerStub, gameStorage);
        return getGameState();
    }

    function calculateFlaggedCount(gameState: GameState): number {
        return gameState.board.reduce(
            (acc, row) => acc + row.reduce((acc, val) => acc + (val.isFlagged ? 1 : 0), 0),
            0,
        );
    }

    function countUnflaggedMines(gameState: GameState): number {
        let count = 0;
        for (let i = 0; i < gameState.gameOptions.boardHeight; i++) {
            for (let j = 0; j < gameState.gameOptions.boardWidth; j++) {
                const cell = gameState.board[i][j];
                if (cell.isMine && !cell.isFlagged) {
                    count++;
                }
            }
        }
        return count;
    }

    beforeEach(() => {
        eventHandlerStub = jest.fn();
    });

    it('should auto-flag all remaining unflagged mines when winning', async function () {
        // Create a simple 3x3 board with 2 mines
        const gameState = await setupGame(new NonexistentMockGameStorage(), {
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

        // Reveal all safe spots to win
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (!gameState.board[i][j].isMine && !gameState.board[i][j].isRevealed) {
                    selectSpot(j, i);
                }
            }
        }

        // Verify the player has won
        expect(gameState.won).toBe(true);
        expect(gameState.ended).toBe(true);

        // Verify all mines are now flagged
        const flaggedCount = calculateFlaggedCount(gameState);
        expect(flaggedCount).toBe(2);

        // Verify there are no unflagged mines
        const unflaggedMines = countUnflaggedMines(gameState);
        expect(unflaggedMines).toBe(0);

        // Verify mines are not revealed (only flagged)
        for (const pos of minePositions) {
            expect(gameState.board[pos.y][pos.x].isFlagged).toBe(true);
            expect(gameState.board[pos.y][pos.x].isRevealed).toBe(false);
        }
    });

    it('should auto-flag only unflagged mines when winning with some mines already flagged', async function () {
        // Create a simple 4x4 board with 3 mines
        const gameState = await setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 4,
            boardHeight: 4,
            numberOfMines: 3,
            revealBoardOnLoss: true,
            difficultyKey: 'test',
        });

        // Find all three mines
        const minePositions: { x: number; y: number }[] = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (gameState.board[i][j].isMine) {
                    minePositions.push({ x: j, y: i });
                }
            }
        }

        expect(minePositions.length).toBe(3);

        // Manually flag one of the mines before winning
        flagSpot(minePositions[0].x, minePositions[0].y);
        expect(gameState.board[minePositions[0].y][minePositions[0].x].isFlagged).toBe(true);

        // Reveal all safe spots to win
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (!gameState.board[i][j].isMine && !gameState.board[i][j].isRevealed) {
                    selectSpot(j, i);
                }
            }
        }

        // Verify the player has won
        expect(gameState.won).toBe(true);
        expect(gameState.ended).toBe(true);

        // Verify all mines are now flagged
        const flaggedCount = calculateFlaggedCount(gameState);
        expect(flaggedCount).toBe(3);

        // Verify there are no unflagged mines
        const unflaggedMines = countUnflaggedMines(gameState);
        expect(unflaggedMines).toBe(0);

        // Verify all mines are flagged and not revealed
        for (const pos of minePositions) {
            expect(gameState.board[pos.y][pos.x].isFlagged).toBe(true);
            expect(gameState.board[pos.y][pos.x].isRevealed).toBe(false);
        }
    });

    it('should only auto-flag mines and not affect non-mine cells', async function () {
        // Create a simple 4x4 board with 3 mines
        const gameState = await setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 4,
            boardHeight: 4,
            numberOfMines: 3,
            revealBoardOnLoss: true,
            difficultyKey: 'test',
        });

        // Find a non-mine position that we will incorrectly flag
        let nonMinePos: { x: number; y: number } | null = null;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (!gameState.board[i][j].isMine) {
                    nonMinePos = { x: j, y: i };
                    break;
                }
            }
            if (nonMinePos) break;
        }

        expect(nonMinePos).not.toBeNull();

        // Incorrectly flag a non-mine cell (player makes a mistake)
        if (nonMinePos) {
            flagSpot(nonMinePos.x, nonMinePos.y);
            expect(gameState.board[nonMinePos.y][nonMinePos.x].isFlagged).toBe(true);
        }

        // Reveal all safe spots to win (this will unflag the incorrectly flagged cell when clicked)
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (!gameState.board[i][j].isMine && !gameState.board[i][j].isRevealed) {
                    selectSpot(j, i);
                }
            }
        }

        // Verify the player has won
        expect(gameState.won).toBe(true);
        expect(gameState.ended).toBe(true);

        // All mines should be auto-flagged
        const totalMines = gameState.gameOptions.numberOfMines;
        const unflaggedMines = countUnflaggedMines(gameState);
        expect(unflaggedMines).toBe(0);

        // Verify that only mines are flagged (the incorrectly flagged non-mine was revealed/unflagged)
        let flaggedMineCount = 0;
        let flaggedNonMineCount = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (gameState.board[i][j].isFlagged) {
                    if (gameState.board[i][j].isMine) {
                        flaggedMineCount++;
                    } else {
                        flaggedNonMineCount++;
                    }
                }
            }
        }

        // All mines should be flagged
        expect(flaggedMineCount).toBe(totalMines);
        // No non-mines should be flagged (the incorrect flag was removed when the cell was revealed)
        expect(flaggedNonMineCount).toBe(0);
    });

    it('should set mine counter to 0 after winning', async function () {
        // Create a simple 3x3 board with 2 mines
        const gameState = await setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 3,
            boardHeight: 3,
            numberOfMines: 2,
            revealBoardOnLoss: true,
            difficultyKey: 'test',
        });

        // Reveal all safe spots to win
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (!gameState.board[i][j].isMine && !gameState.board[i][j].isRevealed) {
                    selectSpot(j, i);
                }
            }
        }

        // Verify the player has won
        expect(gameState.won).toBe(true);

        // Calculate the unflagged mine count (should be 0 after auto-flagging)
        const flaggedCount = calculateFlaggedCount(gameState);
        const unflaggedMineCount = gameState.gameOptions.numberOfMines - flaggedCount;
        expect(unflaggedMineCount).toBe(0);
    });

    it('should work correctly with a larger board', async function () {
        // Create a 5x5 board with 8 mines
        const gameState = await setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 5,
            boardHeight: 5,
            numberOfMines: 8,
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

        expect(minePositions.length).toBe(8);

        // Manually flag 3 of the 8 mines
        flagSpot(minePositions[0].x, minePositions[0].y);
        flagSpot(minePositions[1].x, minePositions[1].y);
        flagSpot(minePositions[2].x, minePositions[2].y);

        // Reveal all safe spots to win
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (!gameState.board[i][j].isMine && !gameState.board[i][j].isRevealed) {
                    selectSpot(j, i);
                }
            }
        }

        // Verify the player has won
        expect(gameState.won).toBe(true);
        expect(gameState.ended).toBe(true);

        // Verify all 8 mines are now flagged
        const flaggedCount = calculateFlaggedCount(gameState);
        expect(flaggedCount).toBe(8);

        // Verify there are no unflagged mines
        const unflaggedMines = countUnflaggedMines(gameState);
        expect(unflaggedMines).toBe(0);
    });

    it('should auto-flag remaining mines when winning via selectAdjacentSpots', async function () {
        // Create a preset 3x4 board with specific mine positions
        // Board layout:
        //   0 1 2
        // 0 U M 1
        // 1 U 1 1
        // 2 U U U
        // 3 M U U
        // U is unrevealed safe, 1 is revealed safe with adj count, M is a mine (not revealed)

        const presetBoard: GameState['board'] = [];
        for (let i = 0; i < 4; i++) {
            presetBoard[i] = [];
            for (let j = 0; j < 3; j++) {
                presetBoard[i][j] = {
                    x: j,
                    y: i,
                    isMine: false,
                    isRevealed: false,
                    isLosingSpot: false,
                    isFlagged: false,
                    isQuestionMark: false,
                    adjMinesCount: 0,
                };
            }
        }

        // Place mines at positions [1,0] and [0,3]
        presetBoard[0][1].isMine = true;
        presetBoard[3][0].isMine = true;

        // Set revealed tiles based on layout
        presetBoard[0][2].isRevealed = true;
        presetBoard[0][2].adjMinesCount = 1;
        presetBoard[1][1].isRevealed = true;
        presetBoard[1][1].adjMinesCount = 1;
        presetBoard[1][2].isRevealed = true;
        presetBoard[1][2].adjMinesCount = 1;

        const presetState: GameState = {
            board: presetBoard,
            ended: false,
            won: false,
            firstBlockClicked: true,
            score: 0,
            didUndo: false,
            achievedHighscore: false,
            gameOptions: {
                boardWidth: 3,
                boardHeight: 4,
                numberOfMines: 2,
                revealBoardOnLoss: true,
                difficultyKey: 'test',
            },
            elapsedTimeMS: 0,
            spareMineSpot: { x: -1, y: -1 },
        };

        const gameState = await setupGame(new MockGameStorage(presetState), {
            boardWidth: 3,
            boardHeight: 4,
            numberOfMines: 2,
            revealBoardOnLoss: true,
            difficultyKey: 'test',
        });

        // Verify mines are at expected positions and unrevealed
        expect(gameState.board[0][1].isMine).toBe(true);
        expect(gameState.board[0][1].isRevealed).toBe(false);
        expect(gameState.board[3][0].isMine).toBe(true);
        expect(gameState.board[3][0].isRevealed).toBe(false);

        // Flag the mine at [1,0]
        flagSpot(1, 0);
        expect(gameState.board[0][1].isFlagged).toBe(true);

        // The second mine should still be unflagged at this point
        expect(gameState.board[3][0].isFlagged).toBe(false);

        // Use selectAdjacentSpots on a revealed tile to reveal the remaining safe tiles
        selectAdjacentSpots(1, 1);

        // Wait for async operations
        await Promise.resolve();

        // Verify the player has won
        expect(gameState.won).toBe(true);
        expect(gameState.ended).toBe(true);

        // Verify the final unrevealed safe tile was revealed
        expect(gameState.board[1][0].isRevealed).toBe(true);

        // Verify both mines are flagged and not revealed
        expect(gameState.board[0][1].isFlagged).toBe(true);
        expect(gameState.board[0][1].isRevealed).toBe(false);
        expect(gameState.board[3][0].isFlagged).toBe(true);
        expect(gameState.board[3][0].isRevealed).toBe(false);

        // Verify there are no unflagged mines and the mine counter is 0
        const unflaggedMines = countUnflaggedMines(gameState);
        expect(unflaggedMines).toBe(0);
        const flaggedCount = calculateFlaggedCount(gameState);
        const unflaggedMineCount = gameState.gameOptions.numberOfMines - flaggedCount;
        expect(unflaggedMineCount).toBe(0);
    });
});
