jest.dontMock('../client/game');

describe('select', function () {
    it('will select a spot on the board by marking it as revealed.', function () {
        var app = require('../client/game');

        app.init({ width: 10, height: 10, mines: 10 });
        app.selectSpot(2, 2);
        var boardInfo = app.getBoardInfo();

        expect(boardInfo.revealed[2][2]).toBe(true);
    });
});

describe('already-select', function () {
    it('will prevent the user from selecting the same spot on the board twice.', function () {
        var app = require('../client/game');

        app.init({ width: 10, height: 10, mines: 10 });
        app.selectSpot(2, 2);

        expect(app.selectSpot(2, 2).hitInfo).toBe('alreadyhit');
    });
});

//TODO
//Export all modules from app.js somehow
// describe("reveal", function(){
//   it("will reveal a spot on the board using a direct call to revealSpot.", function(){
//       var app = require('../client/game');
//
//       app.init({width: 10, height: 10, mines: 10});
//       app.revealSpot
//   });
// });

describe('flag', function () {
    it('will flag a spot on the board by marking it as flagged.', function () {
        var app = require('../client/game');

        app.init({ width: 10, height: 10, mines: 10 });
        expect(app.flagSpot(2, 2).flagInfo).toBe('flagged');
        var boardInfo = app.getBoardInfo();

        expect(boardInfo.flagged[2][2]).toBe(true);
    });
});

describe('unflag', function () {
    it('will unflag a spot on the board by calling the flag function twice.', function () {
        var app = require('../client/game');

        app.init({ width: 10, height: 10, mines: 10 });
        expect(app.flagSpot(2, 2).flagInfo).toBe('flagged');
        expect(app.flagSpot(2, 2).flagInfo).toBe('unflagged');
        var boardInfo = app.getBoardInfo();

        expect(boardInfo.flagged[2][2]).toBe(false);
    });
});
