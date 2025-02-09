import { jest } from '@jest/globals';
import { GameState, initGame, GameOptions, getGameState } from '../src/game';
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

    it('should be able to throw an error if the board has more mines than it can physically handle', function () {
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
});
