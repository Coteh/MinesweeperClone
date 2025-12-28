import { jest } from '@jest/globals';
import { initGame, selectSpot, flagSpot, getGameState, GameOptions, GameState } from '../src/game';
import { Mock } from 'jest-mock';
import { NonexistentMockGameStorage } from './util';
import { IGameStorage } from '../src/storage';

describe('selecting tiles', function () {
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

    it('will select a spot on the board by marking it as revealed', async function () {
        const gameState = await setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 10,
            boardHeight: 10,
            numberOfMines: 10,
            revealBoardOnLoss: true,
        });

        expect(gameState.board[2][2].isRevealed).toBe(false);
        selectSpot(2, 2);
        expect(gameState.board[2][2].isRevealed).toBe(true);
    });

    it('will prevent the user from selecting the same spot on the board twice', async function () {
        const gameState = await setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 10,
            boardHeight: 10,
            numberOfMines: 10,
            revealBoardOnLoss: true,
        });

        expect(gameState.board[2][2].isRevealed).toBe(false);
        let result = selectSpot(2, 2);
        expect(result.hitInfo).not.toBe('alreadyhit');
        expect(gameState.board[2][2].isRevealed).toBe(true);
        result = selectSpot(2, 2);
        expect(result.hitInfo).toBe('alreadyhit');
        expect(gameState.board[2][2].isRevealed).toBe(true);
    });
});

describe('flagging tiles', function () {
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

    it('will flag a spot on the board by marking it as flagged', async function () {
        const gameState = await setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 10,
            boardHeight: 10,
            numberOfMines: 10,
            revealBoardOnLoss: true,
        });

        expect(gameState.board[2][2].isFlagged).toBe(false);
        let result = flagSpot(2, 2);
        expect(result).not.toBe(undefined);
        if (result) {
            expect(result.flagInfo).toBe('flagged');
        }
        expect(gameState.board[2][2].isFlagged).toBe(true);
    });
});

describe('unflagging tiles', function () {
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

    it('will unflag a spot on the board by calling the flag function twice', async function () {
        const gameState = await setupGame(new NonexistentMockGameStorage(), {
            boardWidth: 10,
            boardHeight: 10,
            numberOfMines: 10,
            revealBoardOnLoss: true,
        });

        let result = flagSpot(2, 2);
        expect(result).not.toBe(undefined);
        if (result) {
            expect(result.flagInfo).toBe('flagged');
        }
        result = flagSpot(2, 2);
        expect(result).not.toBe(undefined);
        if (result) {
            expect(result.flagInfo).toBe('unflagged');
        }

        expect(gameState.board[2][2].isFlagged).toBe(false);
    });
});
