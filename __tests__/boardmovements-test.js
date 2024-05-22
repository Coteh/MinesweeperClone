import { jest } from '@jest/globals';
import { init, selectSpot, flagSpot, getBoardInfo } from '../client/game';

jest.dontMock('../client/game');

describe('select', function () {
    it('will select a spot on the board by marking it as revealed.', function () {
        init({ width: 10, height: 10, mines: 10 });
        selectSpot(2, 2);
        var boardInfo = getBoardInfo();

        expect(boardInfo.revealed[2][2]).toBe(true);
    });
});

describe('already-select', function () {
    it('will prevent the user from selecting the same spot on the board twice.', function () {
        init({ width: 10, height: 10, mines: 10 });
        selectSpot(2, 2);

        expect(selectSpot(2, 2).hitInfo).toBe('alreadyhit');
    });
});

describe('flag', function () {
    it('will flag a spot on the board by marking it as flagged.', function () {
        init({ width: 10, height: 10, mines: 10 });
        expect(flagSpot(2, 2).flagInfo).toBe('flagged');
        var boardInfo = getBoardInfo();

        expect(boardInfo.flagged[2][2]).toBe(true);
    });
});

describe('unflag', function () {
    it('will unflag a spot on the board by calling the flag function twice.', function () {
        init({ width: 10, height: 10, mines: 10 });
        expect(flagSpot(2, 2).flagInfo).toBe('flagged');
        expect(flagSpot(2, 2).flagInfo).toBe('unflagged');
        var boardInfo = getBoardInfo();

        expect(boardInfo.flagged[2][2]).toBe(false);
    });
});
