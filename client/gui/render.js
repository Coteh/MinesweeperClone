var helpers = require('./display_helpers');
var game = require('../game');
var MineBlock = require('./mineblock');
var DigitBoard = require('./digitboard');
var Timer = require('./timer');
var Menu = require('./menu');
var MenuOption = require('./menuoption');
var CheckBox = require('./checkbox');
var FontPrefs = require('./fontprefs');

//Initializing renderer
var renderer = new PIXI.autoDetectRenderer(800, 600);

//Interaction Manager Init
var interactionManager = new PIXI.interaction.InteractionManager(renderer);

//Attach renderer onto the page
document.body.appendChild(renderer.view);

//PIXI Variable declarations
var stage = null;
var background = null;

//Grab loader from PIXI
var loader = PIXI.loader;

//Background tile
var tilingTile = null;
var tileDelta = null;

//Filters and other effects
var normalBGFilters = null;
var pixelateFilter = null;
var pixelIntensity = null;
var pixelBackgroundFilters = null;
var blurFilter = null;
var blurIntensity = 0;
var gameInactiveFilters = null;

//Board Info from game.js
var boardInfo = null;

//Mine board and mine tile renderable declarations
var mineBoard = null;
var mineTiles = null;
var mineTileArr = null;

//Board offset vector
var boardOffsetX = 0;
var boardOffsetY = 0;

//Background colors
var regularBackgroundColor = 0x888888;
var gameOverBackgroundColor = 0x3D0000;

//Flag hold feature variable declarations
var holdToFlag = true;
var flagTimer = 0.0;
var MAX_FLAG_HOLD_TIME = 30.0; //amount of time to hold down select in order to flag a tile

//Highlight effect
var highlightEffect = false;

/* Declaring Textures */
var logoTex = null;
var blockTex = null;
var blockSelectedTex = null;
var blockHeldTex = null;
var blockHighlightedTex = null;
var buttonTex = null;
var tileTex = null;
var mineTex = null;
var flagTex = null;
var smileyTex = null;
var smileyWinTex = null;
var smileyLoseTex = null;
var uncheckedTex = null;
var checkedTex = null;
var starTex = null;

/* Digit Textures */
var digitTex = new Array(10);

/* Menus */
var titleMenu = null;
var playBtn = null;
var highlightBtn = null;
var holdToFlagBtn = null;

/* Timers */
var gameTimer = null;
var gameSeconds = 0;

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

/* Game Ticker */
var ticker = null;

var initRenderElements = function(){
    resizeGame();

    //Setting background color of game
    renderer.backgroundColor = regularBackgroundColor;

    //Initialize stage container
    stage = new PIXI.Container();

    //Initialize screen containers
    gameScreen = new PIXI.Container();
    titleScreen = new PIXI.Container();

    /* Initializing Textures */
    logoTex = PIXI.Texture.fromImage("img/Logo.png");
    blockTex = PIXI.Texture.fromImage("img/Block.png");
    blockSelectedTex = PIXI.Texture.fromImage("img/Block_selected.png");
    blockHeldTex = PIXI.Texture.fromImage("img/Block_held.png");
    blockHighlightedTex = PIXI.Texture.fromImage("img/Block_highlighted.png");
    buttonTex = PIXI.Texture.fromImage("img/Button.png");
    tileTex = PIXI.Texture.fromImage("img/Tiles.png");
    mineTex = PIXI.Texture.fromImage("img/Mine.png");
    flagTex = PIXI.Texture.fromImage("img/Flag.png");
    smileyTex = PIXI.Texture.fromImage("img/Smiley.png");
    smileyWinTex = PIXI.Texture.fromImage("img/Smiley_proud.png");
    smileyLoseTex = PIXI.Texture.fromImage("img/Smiley_sad.png");
    uncheckedTex = PIXI.Texture.fromImage("img/Checkbox_unchecked.png");
    checkedTex = PIXI.Texture.fromImage("img/Checkbox_checked.png");
    starTex = PIXI.Texture.fromImage("img/Star.png");
    //Initializing digit textures
    for (var i = 0; i <= 9; i++){
        digitTex[i] = PIXI.Texture.fromImage("img/digits/" + i + ".png");
    }

    //Initializing tiling background sub-container
    background = new PIXI.Container();
    tilingTile = new PIXI.extras.TilingSprite(tileTex, renderer.width, renderer.height);
    tileDelta = 1;
    stage.addChild(background);
    background.addChild(tilingTile);

    //Adding resize callback for resizing tiling background
    resizeCallbacks.push(function(){
        tilingTile.width = renderer.width;
        tilingTile.height = renderer.height;
    });

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
    mineTiles = new PIXI.Container();
    mineBoard.addChild(mineTiles);
    gameScreen.addChild(mineBoard);

    var gameScreenPlacement = function(){
        gameScreen.x = boardOffsetX;
        gameScreen.y = boardOffsetY;
    };
    gameScreenPlacement();
    resizeCallbacks.push(gameScreenPlacement);

    //Initializing menus
    titleMenu = new Menu(100, 100, "Title Menu");
    titleScreen.addChild(titleMenu.container);

    //Initializing menu buttons
    playBtn = new MenuOption("Play Game", FontPrefs.bigButtonFont);
    playBtn.setPressAction(function(){
        startGame();
        setupBoard(boardInfo);
        displayGameOver(false);
        displayGameWin(false);
        updateBoard();
        titleScreen.visible = false;
        gameScreen.visible = true;
        background.filters = normalBGFilters;
        resizeGame();
    });
    playBtn.setGraphic(uncheckedTex);

    highlightBtn = new CheckBox("Highlight Effect?", FontPrefs.buttonFont);
    highlightBtn.setCheck(highlightEffect);
    highlightBtn.setCheckTextures(uncheckedTex, checkedTex);
    highlightBtn.setCheckBoxAction(function(expression){
        highlightEffect = expression;
    });
    titleMenu.addMenuOption(highlightBtn.menuOption);

    holdToFlagBtn = new CheckBox("Hold left click to flag?", FontPrefs.buttonFont);
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
    copyrightText = new PIXI.Text(String.fromCharCode(169) + " 2015-2016 James Cote", FontPrefs.copyrightFont);
    titleScreen.addChild(copyrightText);

    stage.addChild(gameScreen);
    stage.addChild(titleScreen);
    gameScreen.visible = false;

    //Title screen placement
    var titleScreenPlacement = function(){
        titleScreen.x = renderer.width / 3.5;
        titleScreen.y = 120;
    }
    titleScreenPlacement();
    resizeCallbacks.push(titleScreenPlacement);

    var copyrightPlacement = function(){
        copyrightText.x = 280;
        copyrightText.y = renderer.height - 24 - titleScreen.y;
    };
    copyrightPlacement();
    resizeCallbacks.push(copyrightPlacement);
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
                var result = null;
                if (block.isRevealed) {
                    result = game.selectAdjacentSpots(block.x, block.y);
                } else {
                    result = (flagTimer > MAX_FLAG_HOLD_TIME) ? game.flagSpot(block.x, block.y) : game.selectSpot(block.x, block.y);
                }
                if (result.hitInfo == "nonexistent" || result.flagInfo == "nonexistent"){
                    console.log("The spot at x: " + block.x + ", y: " + block.y + " does not exist.");
                }
                updateBoard(result);
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
                if (!block.isRevealed && highlightEffect){
                    block.setTexture(blockHighlightedTex);
                }
            });

            mineTileArr[i][j].setMouseOut(function(block, mouseData){
                if (!block.isRevealed){
                    block.setTexture(blockTex);
                }
                flagTimer = 0.0;
            });

            mineTiles.addChild(mineTileArr[i][j].container);
        }
    }

    //Repositioning mine board
    mineBoard.x = boardOffsetX;
    mineBoard.y = boardOffsetY;

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
    game.init({width: 20, height: 20, mines: 35});
    boardInfo = game.getBoardInfo();
    if (mineTileArr != null){
        for (var i = 0; i < boardInfo.height; i++){
            for (var j = 0; j < boardInfo.width; j++){
                mineTileArr[i][j].resetNumberIndicator();
                mineTileArr[i][j].numberIndicator.visible = false;
                resetBlockSprites(mineTileArr[i][j]);
                mineTileArr[i][j].setRevealed(false);
            }
        }
    }
    gameSeconds = 0;
    timeDigitBoard.setDisplayNumber(gameSeconds);
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
    var amtFlagged = 0;
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
                mineTileArr[i][j].setRevealed(boardInfo.revealed[i][j]);
            }else{
                mineTileArr[i][j].setIndicatorSpriteVisibility(boardInfo.flagged[i][j]);
                if (boardInfo.flagged[i][j]){
                    amtFlagged++;
                }
            }
        }
    }
    /* Update Amount of Mines Digit */
    var amtOfUnflaggedMines = boardInfo.mineCount - amtFlagged;
    mineDigitBoard.setDisplayNumber((amtOfUnflaggedMines > 0) ? amtOfUnflaggedMines : 0);
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

function initGame(){
    //Initialize timers
    gameTimer = new Timer(window);
    gameTimer.setTickCallback(function(seconds){
        //Update seconds
        gameSeconds = seconds;
        //Timer digit board update
        timeDigitBoard.setDisplayNumber(gameSeconds);
    });
    //Let the timer start only after the first board click
    game.addFirstBlockEvent(function(){
        gameTimer.start();
    });

    initRenderElements();

    ticker = new PIXI.ticker.Ticker();
    ticker.add(update);
    ticker.add(render);
    ticker.start();
}

//Adding image resources to loader queue
loader.add("Logo", "img/Logo.png");
loader.add("Block", "img/Block.png");
loader.add("Block_selected", "img/Block_selected.png");
loader.add("Block_held", "img/Block_held.png");
loader.add("Block_highlighted", "img/Block_highlighted.png");
loader.add("Button", "img/Button.png");
loader.add("Tiles", "img/Tiles.png");
loader.add("Mine", "img/Mine.png");
loader.add("Flag", "img/Flag.png");
loader.add("Smiley", "img/Smiley.png");
loader.add("Smiley_proud", "img/Smiley_proud.png");
loader.add("Smiley_sad", "img/Smiley_sad.png");
loader.add("Checkbox_unchecked", "img/Checkbox_unchecked.png");
loader.add("Checkbox_checked", "img/Checkbox_checked.png");
loader.add("Star", "img/Star.png");
for (var i = 0; i <= 9; i++){
    loader.add("digit_" + i, "img/digits/" + i + ".png");
}

var resizeGame = function(){
    renderer.resize(window.innerWidth, window.innerHeight);
    boardOffsetX = ((boardInfo) ? boardInfo.width + renderer.width / 3.1 : 1);
    boardOffsetY = ((boardInfo) ? boardInfo.height + renderer.height / 5 : 1);
    // console.log(boardOffsetX);
    // console.log(boardOffsetY);
    for (var i = 0; i < resizeCallbacks.length; i++){
        resizeCallbacks[i]();
    }
}

var resizeCallbacks = [];

window.onresize = resizeGame;

loader.once("complete", function(){
    console.log("Resources loaded.");
    initGame();
});
loader.once("error", function(){
    console.log("There was an error loading resources for the game.");
});
loader.load();
