import { jest } from '@jest/globals';
import {
    GameState,
    initGame,
    GameOptions,
    getGameState,
    selectSpot,
    setDebugEnabled,
} from '../src/game';
import { BoardOverfillException } from '../src/errors';
import { NonexistentMockGameStorage } from './util';
import { Mock } from 'jest-mock';
import { IGameStorage } from '../src/storage';

describe('board setup', function () {
    let eventHandlerStub: Mock;

    async function setupGame(
        gameStorage: IGameStorage,
        gameOptions: GameOptions
    ): Promise<GameState> {
        await initGame(gameOptions, eventHandlerStub, gameStorage);
        return getGameState();
    }

    beforeEach(() => {
        eventHandlerStub = jest.fn();
    });

    it('should initialize a game 10 wide, 10 high, with 10 mines', async function () {
        var gameState = await setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 10,
            boardHeight: 10,
            numberOfMines: 10,
            revealBoardOnLoss: true,
        });
        expect(gameState.board[0].length).toBe(10);
        expect(gameState.board.length).toBe(10);
        var mineCount = 0;
        for (var i = 0; i < gameState.board.length; i++) {
            for (var j = 0; j < gameState.board[i].length; j++) {
                if (gameState.board[j][i].isMine) {
                    mineCount++;
                }
            }
        }
        expect(mineCount).toBe(10);
    });
});

describe('board overfill', function () {
    let eventHandlerStub: Mock;

    async function setupGame(
        gameStorage: IGameStorage,
        gameOptions: GameOptions
    ): Promise<GameState> {
        await initGame(gameOptions, eventHandlerStub, gameStorage);
        return getGameState();
    }

    beforeEach(() => {
        eventHandlerStub = jest.fn();
    });

    it('should throw an error if the board has more mines than board tiles', function () {
        expect(
            setupGame(new NonexistentMockGameStorage(), {
                boardWidth: 10,
                boardHeight: 10,
                numberOfMines: 101,
                revealBoardOnLoss: true,
            })
        ).rejects.toThrow(
            new BoardOverfillException(
                'Amount of mines to generate exceeds amount of board pieces.'
            )
        );
    });

    it('should throw an error if the board has as many mines are there are board tiles', function () {
        expect(
            setupGame(new NonexistentMockGameStorage(), {
                boardWidth: 10,
                boardHeight: 10,
                numberOfMines: 100,
                revealBoardOnLoss: true,
            })
        ).rejects.toThrow(
            new BoardOverfillException(
                'Amount of mines to generate is equal to the amount of board pieces.'
            )
        );
    });
});

describe('first click', () => {
    let eventHandlerStub: Mock;

    async function setupGame(
        gameStorage: IGameStorage,
        gameOptions: GameOptions
    ): Promise<GameState> {
        await initGame(gameOptions, eventHandlerStub, gameStorage);
        return getGameState();
    }

    beforeEach(() => {
        eventHandlerStub = jest.fn();
        setDebugEnabled(false);
    });

    it('should never be a mine', async () => {
        for (let i = 0; i < 10000; i++) {
            let gameState = await setupGame(new NonexistentMockGameStorage(), {
                boardWidth: 10,
                boardHeight: 10,
                numberOfMines: 10,
                revealBoardOnLoss: true,
            });
            const result = selectSpot(1, 1);
            expect(result.hitInfo).not.toEqual('mine');
            expect(gameState.board[1][1].isMine).toBeFalsy();
        }
    });

    it('should not generate an automatic win if mine is clicked first', async () => {
        let gameState = await setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 10,
            boardHeight: 10,
            numberOfMines: 10,
            revealBoardOnLoss: true,
        });
        let x = -1,
            y = -1;
        mineLoop: for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (gameState.board[i][j].isMine) {
                    x = j;
                    y = i;
                    break mineLoop;
                }
            }
        }
        let result = selectSpot(x, y);
        expect(result.hitInfo).not.toEqual('mine');
        expect(gameState.board[1][1].isMine).toBeFalsy();
        expect(gameState.won).toBeFalsy();
    });
});
