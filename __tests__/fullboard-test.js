import { jest } from '@jest/globals';
import { init, getBoardInfo, } from '../client/game';
import { BoardOverfillException } from '../client/errors';

jest.dontMock('../client/game');
jest.dontMock('../client/errors');

describe('fullboard', function () {
    it('contains a full board with default values of 10 wide, 10 high, and 10 mines.', function () {
        init();
        var boardInfo = getBoardInfo();
        expect(boardInfo.width).toBe(10);
        expect(boardInfo.height).toBe(10);
        var mineCount = 0;
        for (var i = 0; i < boardInfo.height; i++) {
            for (var j = 0; j < boardInfo.width; j++) {
                if (boardInfo.board[j][i]) {
                    mineCount++;
                }
            }
        }
        expect(mineCount).toBe(10);
    });
});

describe('overfill', function () {
    it('should be able to throw an error if the board has more mines than it can physically handle.', function () {
        expect(function () {
            init({ width: 10, height: 10, mines: 101 });
        }).toThrow(
            new BoardOverfillException(
                'Amount of mines to generate exceeds amount of board pieces.'
            )
        );
    });
});
