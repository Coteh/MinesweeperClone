(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var render = require('./client/gui/render');

},{"./client/gui/render":10}],2:[function(require,module,exports){
function BoardOverfillException(message) {
   this.message = message;
   this.name = "BoardOverfillException";
}

module.exports = {
  BoardOverfillException
}

},{}],3:[function(require,module,exports){
var errors = require('./errors');

var gameBoard;
var isRevealed;
var isFlagged;
var adjMinesCount;
var boardWidth;
var boardHeight;
var amountOfMines;
var didWin = false;

var init = function(gameOptions){
  didWin = false;
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

module.exports = {
  init, getBoardInfo, selectSpot, flagSpot
}

},{"./errors":2}],4:[function(require,module,exports){
var MenuOption = require('./menuoption');

function CheckBox(title, titleOptions){
  this.menuOption = new MenuOption(title, titleOptions);
  this.container = this.menuOption.container;
  this.uncheckedTex = null;
  this.checkedTex = null;
  this.checkBoxSprite = new PIXI.Sprite(null);
  this.menuOption.graphic.addChild(this.checkBoxSprite);
  this.checkBoxSprite.x = -32 - 4;
  this.isChecked = false;
  this.checkBoxAction = null;
  var self = this;
  this.menuOption.setPressAction(function(){
    self.setCheck(!self.isChecked);
  });
}

CheckBox.prototype.setCheckTextures = function(uncheckedTex, checkedTex){
  this.uncheckedTex = uncheckedTex;
  this.checkedTex = checkedTex;
  this.checkBoxSprite.texture = (this.isChecked) ? this.checkedTex : this.uncheckedTex;
}

CheckBox.prototype.setCheckBoxAction = function(action){
  this.checkBoxAction = action;
}

CheckBox.prototype.setCheck = function(expression){
  if (typeof(this.checkBoxAction) == "function") this.checkBoxAction(expression);
  this.checkBoxSprite.texture = (expression) ? this.checkedTex : this.uncheckedTex;
  this.isChecked = expression;
}

module.exports = CheckBox;

},{"./menuoption":8}],5:[function(require,module,exports){
function DigitBoard(x, y, amtOfDigits, textureArr){
  this.container = new PIXI.Container();
  this.setPosition(x, y);
  this.amtOfDigits = 0;
  this.digitArr = new Array();
  this.digitSpriteArr = new Array();
  this.digitBackGraphic = new PIXI.Graphics();
  this.digitBackGraphic.beginFill(0x000000);
  this.container.addChild(this.digitBackGraphic);
  this.digitBackGraphic.drawRect(0, 0, 0, 0);
  this.setDigitAmount(amtOfDigits);
  this.textureArr = null;
  this.setTextureSet(textureArr);
}

/* Set the position of the entire digit board. */
DigitBoard.prototype.setPosition = function(x, y){
  this.container.x = x;
  this.container.y = y;
}

/* Set amount of digits on this digit board. */
DigitBoard.prototype.setDigitAmount = function(amt){
  //Grabbing previous amount (should be 0 on initialization)
  var prevAmt = this.amtOfDigits;
  //Saving the new amount
  this.amtOfDigits = amt;
  // console.log("New amount of digit sprites: " + this.amtOfDigits + " and old amount of digit sprites: " + prevAmt);
  //Checking if there's any digits to add/remove
  if (this.amtOfDigits > prevAmt){
    //If there's more digits now than before, add the new ones
    for (var i = prevAmt; i < this.amtOfDigits; i++){
      var digit = 0;
      this.digitArr.push(digit);
      var digitSprite = new PIXI.Sprite((this.textureArr != null) ? this.textureArr[this.digitArr[i]] : null);
      this.digitSpriteArr.push(digitSprite);
      digitSprite.x += (i * 32) + (i * 2);
      this.container.addChild(digitSprite);
      // console.log("Added digit sprite " + i + " at X: " + digitSprite.x + ", Y: " + digitSprite.y);
    }
  }else if (this.amtOfDigits < prevAmt){
    //Else, if there's less digits now than before, delete the excess
    for (var i = this.amtOfDigits; i < prevAmt; i++){
      this.container.removeChild(this.digitSpriteArr[i]);
    }
    this.digitArr.splice(this.amtOfDigits, prevAmt - this.amtOfDigits);
    this.digitSpriteArr.splice(this.amtOfDigits, prevAmt - this.amtOfDigits);
  }
  //Else, if we just set it to the same amount as before, don't do anything
  //Now, adjust the back graphic
  //TODO unhardcode the height of digit back graphic
  this.digitBackGraphic.width = (this.amtOfDigits * 32) + (this.amtOfDigits * 2);
  this.digitBackGraphic.height = 57;
}

/* Set the array of textures this digit board will be using.
  The array will have ten elements from 0-9, which line up with
  the possible digits it can be. */
DigitBoard.prototype.setTextureSet = function(textureArr){
  //Save the texture
  this.textureArr = textureArr;
  //Set the texture for all digits currently
  for (var i = 0; i < this.amtOfDigits; i++){
    this.digitSpriteArr[i].texture = this.textureArr[this.digitArr[i]];
  }
  //Now, adjust the back graphic TODO unhardcode the height
  this.digitBackGraphic.drawRect(0, 0, (this.amtOfDigits * 32) + (this.amtOfDigits * 2), 57);
}

/* Set the number that the digit board will display.
  Will be truncated depending on how many digits are available. */
DigitBoard.prototype.setDisplayNumber = function(num){
  //Check for negative numbers, make them 0
  if (num < 0){
    num = 0;
  }
  //Get number of digits in num
  var numDigitCount = Math.floor(Math.log10(num) + 1);
  //Check for numbers too big for the digitboard to handle, make the num 999...n
  if (numDigitCount > this.amtOfDigits){
    num = Math.pow(10, this.amtOfDigits) - 1;
    numDigitCount = this.amtOfDigits;
  }
  //Cut each digit off from num and place it onto the digit board
  var digits = [];
  var tenPow = 0;
  for (var p = this.amtOfDigits - 1; p >= 0; p--){
    if (num > 0){
      tenPow = Math.pow(10, p);
      digits.push(Math.floor(num / tenPow));
      num = num % tenPow;
    }else{
      digits.push(0);
    }
  }
  // console.log(digits);
  for (var i = 0; i < this.amtOfDigits; i++){
    this.digitSpriteArr[i].texture = this.textureArr[digits[i]];
  }
}

module.exports = DigitBoard;

},{}],6:[function(require,module,exports){
var getAdjMinesTextColor = function(adjMinesCount){
  switch (adjMinesCount) {
    case 1:
      return "#0099FF"; //blue
    case 2:
      return "#00FF00"; //green
    case 3:
      return "#FF0000"; //red
    case 4:
      return "#0000FF"; //dark blue
    case 5:
      return "#442200"; //brown
    case 6:
      return "#00FFFF"; //cyan
    case 7:
      return "#000000"; //black
    case 8:
      return "#858585"; //grey
  }
  return "#FF9900"; //fallback color
}

/* num is a number from 0-9 */
var determineDigitFormation = function(num, callback){
  if (num < 0 || num > 9){
    return;
  }
  switch (num) {
    case 1:
      callback([0, 0, 1, 0, 0, 1, 0]);
      break;
    case 2:
      callback([1, 0, 1, 1, 1, 0, 1]);
      break;
    case 3:
      callback([1, 0, 1, 1, 0, 1, 1]);
      break;
    case 4:
      break;
    case 5:
      break;
    case 6:
      break;
    case 7:
      break;
    case 8:
      break;
    case 9:
      break;
    default:
      callback([0, 0, 0, 0, 0, 0, 0]);
      break;
  }
}

module.exports = {
  getAdjMinesTextColor
}

},{}],7:[function(require,module,exports){
function Menu(x, y, title){
  this.container = new PIXI.Container();
  this.setPosition(x, y);
  this.menuList = new Array();
  this.title = title;
}

Menu.prototype.setPosition = function(x, y){
  this.container.x = x;
  this.container.y = y;
}

Menu.prototype.addMenuOption = function(menuOption) {
  this.menuList.push(menuOption);
  this.container.addChild(menuOption.container);
  menuOption.setPosition(this.container.x, this.container.y + (32 * this.container.children.length));
}

Menu.prototype.setVisibility = function(expression){
  this.container.visible = expression;
}

module.exports = Menu;

},{}],8:[function(require,module,exports){
function MenuOption(title, titleOptions){
  this.container = new PIXI.Container();
  this.actionCallback = null;
  this.graphic = new PIXI.Graphics();
  //TODO
  //Let user configure appearance of button
  this.graphic.beginFill(0xFFFF00);
  this.graphic.interactive = true;
  var self = this;
  this.graphic.click = function(mouseData){
    self.performSelect(mouseData);
  };
  this.setPressAction(null);
  this.title = "";
  this.titleGraphic = null;
  this.setTitleText(title, titleOptions);
  this.setRect(0, 0, this.titleGraphic.width + 10, this.titleGraphic.height + 10);
  this.container.addChild(this.graphic);
  this.container.addChild(this.titleGraphic);
}

MenuOption.prototype.setPosition = function(x, y){
  this.container.x = x;
  this.container.y = y;
  this.graphic.x = x;
  this.graphic.y = y;
  this.titleGraphic.x = x + 4;
  this.titleGraphic.y = y + 4;
}

MenuOption.prototype.setRect = function(x, y, width, height){
  this.graphic.lineStyle(5, 0x000000);
  this.graphic.drawRect(x, y, width, height);
}

MenuOption.prototype.setTitleText = function(text, textOptions){
  this.titleGraphic = new PIXI.Text(text, textOptions);
}

MenuOption.prototype.setPressAction = function(callback){
  this.actionCallback = callback;
}

MenuOption.prototype.performSelect = function(mouseData){
  if (this.actionCallback != null){
    this.actionCallback();
  }
}

MenuOption.prototype.setGraphic = function(texture){
  this.graphic.texture = texture;
}

module.exports = MenuOption;

},{}],9:[function(require,module,exports){
function MineBlock(x, y){
  this.x = x;
  this.y = y;
  this.container = new PIXI.Container();
  this.container.interactive = false;
  this.sprite = new PIXI.Sprite(null);
  this.numberIndicator = new PIXI.Text("", {font: "bold 24px Arial", fill: "#ff0000", align: "right"});
  this.indicatorSprite = new PIXI.Sprite(null);
  this.setPosition(x, y);
  this.resetNumberIndicator();
  this.numberIndicator.visible = false;
  this.indicatorSprite.visible = false;
  this.sprite.interactive = true;
  this.numberIndicator.interactive = false;
  this.container.addChild(this.sprite);
  this.container.addChild(this.numberIndicator);
  this.container.addChild(this.indicatorSprite);
}

MineBlock.prototype.setPosition = function(x, y){
  this.x = x;
  this.y = y;
  this.container.x = x * 32;
  this.container.y = y * 32;
  this.numberIndicator.x = 8;
  this.numberIndicator.y = 4;
  this.indicatorSprite.x = 0;
  this.indicatorSprite.y = 0;
}

MineBlock.prototype.resetNumberIndicator = function(){
  this.numberIndicator.text = 'F';
  this.numberIndicator.style.fill = "#ff0000";
}

MineBlock.prototype.setIndicatorSpriteVisibility = function(expression){
  this.indicatorSprite.visible = expression;
}

MineBlock.prototype.setTexture = function(tex){
  this.sprite.texture = tex;
}

MineBlock.prototype.setIndicatorTexture = function(tex){
  this.indicatorSprite.texture = tex;
}

MineBlock.prototype.setLeftDown = function(func){
  var block = this;
  this.sprite.mousedown = function(mouseData){
    func(block, mouseData);
  };
}

MineBlock.prototype.setLeftRelease = function(func){
  var block = this;
  this.sprite.click = function(mouseData){
    func(block, mouseData);
  }
}

MineBlock.prototype.setRightRelease = function(func){
  var block = this;
  this.sprite.rightclick = function(mouseData){
    func(block, mouseData);
  }
}

MineBlock.prototype.setMouseEnter = function(func){
  var block = this;
  this.sprite.mouseover = function(mouseData){
    func(block, mouseData);
  }
}

MineBlock.prototype.setMouseOut = function(func){
  var block = this;
  this.sprite.mouseout = function(mouseData){
    func(block, mouseData);
  }
}

MineBlock.prototype.enableInteraction = function(expression){
  this.sprite.interactive = expression;
}

module.exports = MineBlock;

},{}],10:[function(require,module,exports){
var helpers = require('./display_helpers');
var game = require('../game');
var MineBlock = require('./mineblock');
var DigitBoard = require('./digitboard');
var Timer = require('./timer');
var Menu = require('./menu');
var MenuOption = require('./menuoption');
var CheckBox = require('./checkbox');

//Initializing renderer
var renderer = new PIXI.autoDetectRenderer(800, 600);

//Interaction Manager Init
var interactionManager = new PIXI.interaction.InteractionManager(renderer);

//Attach renderer onto the page
document.body.appendChild(renderer.view);

//Other Variable declarations
var stage = null;
var background = null;

var tilingTile = null;
var tileDelta = null;
var normalBGFilters = null;
var pixelateFilter = null;
var pixelIntensity = null;
var pixelBackgroundFilters = null;
var blurFilter = null;
var blurIntensity = 0;
var gameInactiveFilters = null;

var boardInfo = null;
var mineBoard = null;
var mineTiles = null;
var mineTileArr = null;

var boardOffsetX = 120 + (renderer.width / 2) - (10 * 32);
var boardOffsetY = 100 + (renderer.height / 2) - (10 * 32);

var regularBackgroundColor = 0x888888;
var gameOverBackgroundColor = 0x3D0000;

var holdToFlag = true;
var flagTimer = 0.0;
var MAX_FLAG_HOLD_TIME = 30.0; //amount of time to hold down select in order to flag a tile

var highlightEffect = false;

/* Textures */
var logoTex = PIXI.Texture.fromImage("img/Logo.png");
var blockTex = PIXI.Texture.fromImage("img/Block.png");
var blockSelectedTex = PIXI.Texture.fromImage("img/Block_selected.png");
var blockHeldTex = PIXI.Texture.fromImage("img/Block_held.png");
var blockHighlightedTex = PIXI.Texture.fromImage("img/Block_highlighted.png");
var buttonTex = PIXI.Texture.fromImage("img/Button.png");
var tileTex = PIXI.Texture.fromImage("img/Tiles.png");
var mineTex = PIXI.Texture.fromImage("img/Mine.png");
var flagTex = PIXI.Texture.fromImage("img/Flag.png");
var smileyTex = PIXI.Texture.fromImage("img/Smiley.png");
var smileyWinTex = PIXI.Texture.fromImage("img/Smiley_proud.png");
var smileyLoseTex = PIXI.Texture.fromImage("img/Smiley_sad.png");
var uncheckedTex = PIXI.Texture.fromImage("img/Checkbox_unchecked.png");
var checkedTex = PIXI.Texture.fromImage("img/Checkbox_checked.png");
var starTex = PIXI.Texture.fromImage("img/Star.png");

/* Digit Textures */
var digitTex = new Array(10);
for (var i = 0; i <= 9; i++){
  digitTex[i] = PIXI.Texture.fromImage("img/digits/" + i + ".png");
}

/* Menus */
var titleMenu = null;
var playBtn = null;
var highlightBtn = null;
var holdToFlagBtn = null;

/* Timers */
var gameTimer = null;
var gameSeconds = 0;

//Initialize timers
gameTimer = new Timer(window);
gameTimer.setTickCallback(function(seconds){
  //Update seconds
  gameSeconds = seconds;
  //Timer digit board update
  timeDigitBoard.setDisplayNumber(gameSeconds);
});

/* Game Screens */
var titleScreen = null;
var gameScreen = null;

/* Board Etc. */
var smileyButton = null;
var mineDigitBoard = null;
var timeDigitBoard = null;

/* Other */
var gameLogoSprite = null;
var starSprite = null;
var copyrightText = null;

var initRenderElements = function(){
  //Setting background color of game
  renderer.backgroundColor = regularBackgroundColor;

  //Initialize stage container
  stage = new PIXI.Container();

  //Initialize screen containers
  gameScreen = new PIXI.Container();
  titleScreen = new PIXI.Container();

  //Initializing tiling background sub-container
  background = new PIXI.Container();
  tilingTile = new PIXI.extras.TilingSprite(tileTex, renderer.width, renderer.height);
  tileDelta = 1;
  stage.addChild(background);
  background.addChild(tilingTile);

  //Background filter setup
  normalBGFilters = background.filters;
  pixelateFilter = new PIXI.filters.PixelateFilter();
  pixelIntensity = 10;
  pixelateFilter.size.x = pixelIntensity;
  pixelateFilter.size.y = pixelIntensity;
  pixelBackgroundFilters = [pixelateFilter];
  blurFilter = new PIXI.filters.BlurFilter();
  blurFilter.blur = 20;
  gameInactiveFilters = [blurFilter];

  //Smiley Face
  smileyButton = new MineBlock(0, 0);
  smileyButton.setTexture(blockTex);
  smileyButton.setIndicatorTexture(smileyTex);
  smileyButton.setIndicatorSpriteVisibility(true);
  gameScreen.addChild(smileyButton.container);

  smileyButton.setLeftRelease(function(block, mouseData){
    gameTimer.stop();
    startGame();
    updateBoard();
    displayGameOver(false);
    displayGameWin(false);
  });

  smileyButton.setMouseEnter(function(block, mouseData){
    if (smileyButton.sprite.interactive && highlightEffect){
      smileyButton.setTexture(blockHighlightedTex);
    }
  });

  smileyButton.setMouseOut(function(block, mouseData){
    if (smileyButton.sprite.interactive){
      smileyButton.setTexture(blockTex);
    }
  });

  //Digit displays
  mineDigitBoard = new DigitBoard(0, 0, 3, digitTex);
  gameScreen.addChild(mineDigitBoard.container);

  timeDigitBoard = new DigitBoard(0, 0, 3, digitTex);
  gameScreen.addChild(timeDigitBoard.container);

  //Initializing mine board
  mineBoard = new PIXI.Container();
  mineBoard.x = boardOffsetX;
  mineBoard.y = boardOffsetY;
  mineTiles = new PIXI.Container();
  gameScreen.addChild(mineBoard);
  mineBoard.addChild(mineTiles);

  //Initializing menus
  titleMenu = new Menu(100, 100, "Title Menu");
  titleScreen.addChild(titleMenu.container);

  //Initializing menu buttons
  playBtn = new MenuOption("Play Game");
  playBtn.setPressAction(function(){
    startGame();
    setupBoard(boardInfo);
    displayGameOver(false);
    displayGameWin(false);
    updateBoard();
    titleScreen.visible = false;
    gameScreen.visible = true;
    background.filters = normalBGFilters;
  });
  playBtn.setGraphic(uncheckedTex);

  highlightBtn = new CheckBox("Highlight Effect?", {font: "18px Arial"});
  highlightBtn.setCheck(highlightEffect);
  highlightBtn.setCheckTextures(uncheckedTex, checkedTex);
  highlightBtn.setCheckBoxAction(function(expression){
    highlightEffect = expression;
  });
  titleMenu.addMenuOption(highlightBtn.menuOption);

  holdToFlagBtn = new CheckBox("Hold left click to flag?", {font: "18px Arial"});
  holdToFlagBtn.setCheck(holdToFlag);
  holdToFlagBtn.setCheckTextures(uncheckedTex, checkedTex);
  holdToFlagBtn.setCheckBoxAction(function(expression){
    holdToFlag = expression;
  });
  titleMenu.addMenuOption(holdToFlagBtn.menuOption);

  titleMenu.addMenuOption(playBtn);

  //Add Logo
  gameLogoSprite = new PIXI.Sprite(logoTex);
  titleScreen.addChild(gameLogoSprite);
  gameLogoSprite.x = 150;

  //Add star sprite
  starSprite = new PIXI.Sprite(starTex);
  titleScreen.addChild(starSprite);
  starSprite.anchor.x = 0.5;
  starSprite.anchor.y = 0.5;
  starSprite.x = 535;
  starSprite.y = 155;

  //Add copyright text
  copyrightText = new PIXI.Text(String.fromCharCode(169) + " 2015 James Cote", {font: "18px Arial"});
  titleScreen.addChild(copyrightText);
  copyrightText.x = 300;
  copyrightText.y = renderer.height - 24;

  stage.addChild(gameScreen);
  stage.addChild(titleScreen);
  gameScreen.visible = false;
}

var setupBoard = function(boardInfo){
  //Removing all elements of mineTileArr from mineTiles if there are any
  if (mineTiles.children.length > 0){
    mineTiles.removeChildren(0, mineTiles.children.length - 1);
  }
  //Setting up mine board
  mineTileArr = new Array(boardInfo.height);
  for (var i = 0; i < boardInfo.height; i++){
    mineTileArr[i] = new Array(boardInfo.width);
    for (var j = 0; j < boardInfo.width; j++){
      mineTileArr[i][j] = new MineBlock(j, i);

      resetBlockSprites(mineTileArr[i][j]);

      mineTileArr[i][j].setLeftDown(function(block, mouseData){
        if (holdToFlag){
          flagTimer = 0.001;
        }
        block.setTexture(blockHeldTex);
      });

      mineTileArr[i][j].setLeftRelease(function(block, mouseData){
        var result = (flagTimer > MAX_FLAG_HOLD_TIME) ? game.flagSpot(block.x, block.y) : game.selectSpot(block.x, block.y);
        if (result.hitInfo == "nonexistent" || result.flagInfo == "nonexistent"){
          console.log("The spot at x: " + block.x + ", y: " + block.y + " does not exist.");
        }
        updateBoard(result);
        if (!holdToFlag || flagTimer <= MAX_FLAG_HOLD_TIME){
          block.enableInteraction(false);
        }
        flagTimer = 0.0;
      });

      mineTileArr[i][j].setRightRelease(function(block, mouseData){
        var result = game.flagSpot(block.x, block.y);
        if (result.flagInfo == "nonexistent"){
          console.log("The spot at x: " + block.x + ", y: " + block.y + " does not exist.");
        }
        updateBoard(result);
      });

      mineTileArr[i][j].setMouseEnter(function(block, mouseData){
        if (block.sprite.interactive && highlightEffect){
          block.setTexture(blockHighlightedTex);
        }
      });

      mineTileArr[i][j].setMouseOut(function(block, mouseData){
        if (block.sprite.interactive){
          block.setTexture(blockTex);
        }
        flagTimer = 0.0;
      });

      mineTiles.addChild(mineTileArr[i][j].container);
    }
  }

  //Repositioning smiley button (always on top of the board at the center)
  smileyButton.setPosition(boardInfo.width / 2, -1);
  smileyButton.container.x += boardOffsetX - (((boardInfo.width / 2) % 2) * 16);
  smileyButton.container.y += boardOffsetY;

  //Setting up mine digits display
  mineDigitBoard.setPosition(boardOffsetX, boardOffsetY - 64);
  mineDigitBoard.setDisplayNumber(boardInfo.mineCount);

  //Setting up time digits display
  timeDigitBoard.setPosition(boardOffsetX + boardInfo.width * 32 - (3 * 32), boardOffsetY - 64);
}

var resetBlockSprites = function(block){
  block.setTexture(blockTex);
  block.setIndicatorTexture(flagTex);
}

var startGame = function() {
  game.init({width: 10, height: 10, mines: 10});
  boardInfo = game.getBoardInfo();
  if (mineTileArr != null){
    for (var i = 0; i < boardInfo.height; i++){
      for (var j = 0; j < boardInfo.width; j++){
        mineTileArr[i][j].resetNumberIndicator();
        mineTileArr[i][j].numberIndicator.visible = false;
        resetBlockSprites(mineTileArr[i][j]);
        mineTileArr[i][j].enableInteraction(true);
      }
    }
  }
  gameSeconds = 0;
  gameTimer.start();
}

var enableBoardInteraction = function(expression){
  if (mineTileArr != null){
    for (var i = 0; i < boardInfo.height; i++){
      for (var j = 0; j < boardInfo.width; j++){
        mineTileArr[i][j].enableInteraction(expression);
      }
    }
  }
}

var showMinesOnBoard = function(){
  if (mineTileArr == null) return;
  for (var i = 0; i < boardInfo.height; i++){
    for (var j = 0; j < boardInfo.width; j++){
      if (boardInfo.board[j][i]){
        mineTileArr[j][i].setIndicatorSpriteVisibility(true);
        mineTileArr[j][i].setIndicatorTexture(mineTex);
      }
    }
  }
}

/* Function that displays/hides Game Over */
var displayGameOver = function(expression){
  enableBoardInteraction(!expression);
  if (expression){
    renderer.backgroundColor = gameOverBackgroundColor;
    background.filters = pixelBackgroundFilters;
    tileDelta = 0.25;
    showMinesOnBoard();
    smileyButton.setIndicatorTexture(smileyLoseTex);
    gameTimer.stop();
  }else{
    renderer.backgroundColor = regularBackgroundColor;
    background.filters = normalBGFilters;
    tileDelta = 1;
    smileyButton.setIndicatorTexture(smileyTex);
  }
}

/* Function that displays/hides game win screen */
var displayGameWin = function(expression){
  enableBoardInteraction(!expression);
  if (expression){
    tileDelta = 0.25;
    smileyButton.setIndicatorTexture(smileyWinTex);
    gameTimer.stop();
  }else{
    tileDelta = 1;
    smileyButton.setIndicatorTexture(smileyTex);
  }
}

renderer.view.oncontextmenu = function(e){
  e.preventDefault();
}

var updateBoard = function(updateInfo){
  boardInfo = game.getBoardInfo();
  if (updateInfo != null){
    if (updateInfo.hitInfo == "mine"){
      displayGameOver(true);
      // console.log("GAME OVER!");
    }
  }
  for (var i = 0; i < boardInfo.height; i++){
    for (var j = 0; j < boardInfo.width; j++){
      mineTileArr[i][j].sprite.texture = (boardInfo.revealed[i][j]) ? blockSelectedTex : blockTex;
      if (boardInfo.revealed[i][j]){
        mineTileArr[i][j].numberIndicator.text = boardInfo.adjMinesCount[i][j].toString();
        var fill = "#FFFFFF"
        try {
          fill = helpers.getAdjMinesTextColor(boardInfo.adjMinesCount[i][j])
        }catch (e){
          console.log("ERROR: A critical error occurred. Error info: \nName: " + e.name + "\nMessage: " + e.message);
        }
        mineTileArr[i][j].numberIndicator.style.fill = fill;
        mineTileArr[i][j].numberIndicator.visible = (boardInfo.adjMinesCount[i][j]) ? true : false;
        mineTileArr[i][j].setIndicatorSpriteVisibility(boardInfo.board[i][j]);
        mineTileArr[i][j].enableInteraction(false);
      }else{
        mineTileArr[i][j].setIndicatorSpriteVisibility(boardInfo.flagged[i][j]);
      }
    }
  }
  /* Check for Win */
  if (updateInfo != null && updateInfo.win){
    displayGameWin(true);
    // console.log("WIN!");
  }else{
    // console.log("No win");
  }
  // console.log("Board updated.");
}

function update(){
  //Holdng left to flag functionality
  if (flagTimer > 0.0){
    flagTimer += ticker.deltaTime;
    // console.log(flagTimer);
  }
  //Tiling Sprite update
  tilingTile.tilePosition.x -= tileDelta;
  tilingTile.tilePosition.y -= tileDelta;

  //Rotating star
  starSprite.rotation += 0.015;

  //Blur Filter update
  blurIntensity += 0.005;
  blurFilter.blur = Math.sin(blurIntensity) * 20;
}

function render(){
  //Render the stage
  renderer.render(stage);
}

var ticker = new PIXI.ticker.Ticker();
ticker.add(update);
ticker.add(render);
ticker.start();

initRenderElements();

},{"../game":3,"./checkbox":4,"./digitboard":5,"./display_helpers":6,"./menu":7,"./menuoption":8,"./mineblock":9,"./timer":11}],11:[function(require,module,exports){
function Timer(domWindow){
  this.domWindow = domWindow;
  this.seconds = 0;
  this.callback = null;
  this.intervalID = 0;
}

Timer.prototype.start = function(){
  var self = this;
  this.intervalID = this.domWindow.setInterval(function(){
    self.performTick();
  }, 1000);
  this.callback(this.seconds);
}

Timer.prototype.stop = function(){
  this.domWindow.clearInterval(this.intervalID);
  this.seconds = 0;
}

Timer.prototype.performTick = function(){
  this.seconds++;
  if (typeof(this.callback) == "function"){
    this.callback(this.seconds);
  }
}

Timer.prototype.setTickCallback = function(callback){
  this.callback = callback;
}

module.exports = Timer;

},{}]},{},[1]);
