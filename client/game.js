var errors = require('./errors');

var gameBoard;
var isRevealed;
var isFlagged;
var adjMinesCount;
var boardWidth;
var boardHeight;
var amountOfMines;
var didWin = false;
var firstBlockClicked = false;
var firstBlockCallbacks = [];

var init = function(gameOptions){
  didWin = false;
  firstBlockClicked = false;
  boardWidth = (gameOptions != null && gameOptions.width != null) ? gameOptions.width : 10;
  boardHeight = (gameOptions != null && gameOptions.height != null) ? gameOptions.height : 10;
  amountOfMines = (gameOptions != null && gameOptions.mines != null) ? gameOptions.mines : 10;
  gameBoard = new Array(boardHeight);
  isRevealed = new Array(boardHeight);
  isFlagged = new Array(boardHeight);
  adjMinesCount = new Array(boardHeight);
  for (var i = 0; i < gameBoard.length; i++){
    gameBoard[i] = new Array(boardWidth);
    isRevealed[i] = new Array(boardWidth);
    isFlagged[i] = new Array(boardWidth);
    adjMinesCount[i] = new Array(boardWidth);
    for (var j = 0; j < gameBoard.length; j++){
      gameBoard[i][j] = false;
      isRevealed[i][j] = false;
      isFlagged[i][j] = false;
      adjMinesCount[i][j] = 0;
    }
  }
  var determinedMines = determineMineSpots(boardWidth * boardHeight, amountOfMines);
  //Spot 1 is at [0,0], Spot (boardWidth * boardHeight) is at [boardWidth - 1, boardHeight - 1]
  for (var k = 0; k < determinedMines.length; k++){
    var yCoord = Math.floor(determinedMines[k] / boardWidth);
    var xCoord = determinedMines[k] % boardWidth;
    gameBoard[yCoord][xCoord] = true;
  }
}

var determineMineSpots = function(amountOfBoardPieces, amountOfMines){
  var mineSpots = [];

  if (amountOfMines < amountOfBoardPieces){
    var i = 0;
    while (i < amountOfMines){
      var randomSelection = Math.floor(Math.random() * (amountOfBoardPieces - 1)); //from 0 to amountOfBoardPieces - 1
      var isAlreadyThere = false;
      for (var j = 0; j < mineSpots.length; j++){
        if (randomSelection == mineSpots[j]){
          isAlreadyThere = true; //already have a mine at this location, generate a new number
          break;
        }
      }
      if (isAlreadyThere){
        continue; //regenerate if we came across a number that's already in the list
      }
      mineSpots.push(randomSelection);
      i++;
    }
  }else if (amountOfMines == amountOfBoardPieces){
    //It'd be an impossible game, but whatever, you asked for it...
    //Skip randomization entirely and just add each possible spot for amountOfBoardPieces
    for (var i = 0; i < amountOfMines; i++){
      mineSpots.push(i);
    }
  }else{ //amountOfMines > amountOfBoardPieces
    throw new errors.BoardOverfillException("Amount of mines to generate exceeds amount of board pieces.");
  }

  return mineSpots;
}

var getBoardInfo = function(){
  return {board: gameBoard,
          width: boardWidth,
          height: boardHeight,
          mineCount: amountOfMines,
          revealed: isRevealed,
          flagged: isFlagged,
          adjMinesCount: adjMinesCount};
}

var selectSpot = function(x, y){
  if ((x == null || y == null) || (x < 0 || x >= boardWidth) || (y < 0 || y >= boardHeight)){
    //don't select a piece that doesn't exist on the board
    return {hitInfo: "nonexistent"};
  }
  if (didWin || isRevealed[y][x]){
    //don't select if piece is already selected or if player won already
    return {hitInfo: "alreadyhit"};
  }
  var boardPiece = gameBoard[y][x];
  revealSpot(x, y);
  if (!firstBlockClicked){
      for (var i = 0; i < firstBlockCallbacks.length; i++){
          firstBlockCallbacks[i]();
      }
  }
  firstBlockClicked = true;
  if (boardPiece){
    return {hitInfo: "mine", win: false};
  }
  return {hitInfo: "land", win: checkForWin()};
}

var revealSpot = function(x, y){
  if (isRevealed[y][x]) return; //don't reveal already revealed spot
  isRevealed[y][x] = true;
  if (!gameBoard[y][x]){
    //If not a mine, determine adjacent mines
    var adjacentSpots = getAdjacentSpots(x, y);
    var amountOfAdjMines = calculateAdjacentMines(adjacentSpots);
    //if mine count is 0, then recursively call revealSpot on all adjacent spots
    if (amountOfAdjMines <= 0){
      for (var i = 0; i < adjacentSpots.length; i++){
        revealSpot(adjacentSpots[i].x, adjacentSpots[i].y);
      }
    }
    adjMinesCount[y][x] = amountOfAdjMines;
  }else{
    //If a mine, reveal whole board
    for (var a = 0; a < boardWidth; a++){
      for (var b = 0; b < boardHeight; b++){
        revealSpot(a, b);
      }
    }
  }
}

var getAdjacentSpots = function(x, y){
  var adjacentList = [];
  //1 2 3
  //4 X 5
  //6 7 8
  // X is the spot on board denoted by x and y coords
  // if x is greater than 0, add 4 spot
  // if x is less than board width - 1, add 5 spot
  // if y is greater than 0, add 2 spot
  // if y is less than board height - 1, add 7 spot
  // if x is greater than 0 AND y is greater than 0, add 1 spot
  // if x is less than board width - 1 AND y is greater than 0, add 3 spot
  // if x is greater than 0 AND y is less than board height - 1, add 6 spot
  // if x is less than board widht - 1 AND y is less than board height - 1, add 8 spot

  var pastLeftEdge = (x > 0);
  var pastRightEdge = (x < boardWidth - 1);
  var pastTopEdge = (y > 0);
  var pastBottomEdge = (y < boardHeight - 1);

  if (pastLeftEdge){
    adjacentList.push({x: x - 1, y: y, piece: gameBoard[y][x - 1]}); //4
    if (pastTopEdge){
      adjacentList.push({x: x - 1, y: y - 1, piece: gameBoard[y - 1][x - 1]}); //1
    }
    if (pastBottomEdge){
      adjacentList.push({x: x - 1, y: y + 1, piece: gameBoard[y + 1][x - 1]}); //6
    }
  }
  if (pastRightEdge){
    adjacentList.push({x: x + 1, y: y, piece: gameBoard[y][x + 1]}); //5
    if (pastTopEdge){
      adjacentList.push({x: x + 1, y: y - 1, piece: gameBoard[y - 1][x + 1]}) //3
    }
    if (pastBottomEdge){
      adjacentList.push({x: x + 1, y: y + 1, piece: gameBoard[y + 1][x + 1]}); //8
    }
  }
  if (pastTopEdge){
    adjacentList.push({x: x, y: y - 1, piece: gameBoard[y - 1][x]}); //2
  }
  if (pastBottomEdge){
    adjacentList.push({x : x, y: y + 1, piece: gameBoard[y + 1][x]}); //7
  }

  return adjacentList;
}

var calculateAdjacentMines = function(adjacentSpots){
  var amountOfAdjMines = 0;

  for (var i = 0; i < adjacentSpots.length; i++){
    if (adjacentSpots[i].piece){
      amountOfAdjMines++;
    }
  }

  return amountOfAdjMines;
}

var flagSpot = function(x, y, expression){
  //only flag the spot if it hasn't been revealed yet and if it exists
  if ((x == null || y == null) || (x < 0 || x >= boardWidth) || (y < 0 || y >= boardHeight)){
    return {flagInfo: "nonexistent"};
  }
  if (didWin || isRevealed[y][x]){
    return {flagInfo: "alreadyrevealed"};
  }
  if (expression == null){ //flag argument not provided
    expression = !isFlagged[y][x];
  }
  isFlagged[y][x] = expression; //spot at x, y is flagged/unflagged
  return {flagInfo: (isFlagged[y][x]) ? "flagged" : "unflagged"};
}

var checkForWin = function(){
  //If player has revealed (boardWidth * boardHeight) - amountOfMines amount of pieces,
  //then they win.
  var amountOfRevealed = 0;

  for (var i = 0; i < boardHeight; i++){
    for (var j = 0; j < boardWidth; j++){
      //If piece revealed AND not a mine
      if (isRevealed[i][j] && !gameBoard[i][j]){
        amountOfRevealed++;
      }
    }
  }

  if (amountOfRevealed == (boardWidth * boardHeight) - amountOfMines){
    didWin = true;
    return true; //they won
  }

  return false; //they didn't win (yet)
}

var addFirstBlockEvent = function(callback){
    firstBlockCallbacks.push(callback);
}

module.exports = {
  init, getBoardInfo, selectSpot, flagSpot, addFirstBlockEvent
}
