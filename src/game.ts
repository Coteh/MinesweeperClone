import { BoardOverfillException } from './errors';
import { IGameStorage } from './storage';

let debugEnabled = true;

export type GameOptions = {
    boardWidth: number;
    boardHeight: number;
    numberOfMines: number;
    revealBoardOnLoss: boolean;
};

export type MineBlock = {
    x: number;
    y: number;
    isMine: boolean;
    isRevealed: boolean;
    isLosingSpot: boolean;
    isFlagged: boolean;
    adjMinesCount: number;
};

export type GameBoard = MineBlock[][];

export type GameState = {
    board: GameBoard;
    ended: boolean;
    won: boolean;
    firstBlockClicked: boolean;
    score: number;
    didUndo: boolean;
    achievedHighscore: boolean;
    gameOptions: GameOptions;
    elapsedTimeMS: number;
};

// Game state to last between games
export type GamePersistentState = {
    highscore: number;
    unlockables: {
        [key: string]: boolean;
    };
    hasPlayedBefore: boolean;
};

export type EventHandler = (eventID: string, data?: any) => void;

let gameState: GameState = {} as GameState;
let persistentState: GamePersistentState = {} as GamePersistentState;
let eventHandler: EventHandler = () => {};
let gameStorage: IGameStorage;
let gameTimer: NodeJS.Timeout;

const newState: (options: GameOptions) => GameState = (options) => {
    const board = new Array<MineBlock[]>(options.boardHeight);
    for (let i = 0; i < board.length; i++) {
        board[i] = new Array<MineBlock>(options.boardWidth);
        for (let j = 0; j < board[i].length; j++) {
            board[i][j] = {
                x: j,
                y: i,
                isMine: false, // piece
                isRevealed: false,
                isLosingSpot: false,
                isFlagged: false,
                adjMinesCount: 0,
            };
        }
    }

    return {
        board,
        ended: false,
        won: false,
        firstBlockClicked: false,
        score: 0,
        didUndo: false,
        achievedHighscore: false,
        gameOptions: options,
        elapsedTimeMS: 0,
    };
};

const initState = (options: GameOptions) => {
    if (gameStorage.gameExists()) {
        gameState = gameStorage.loadGame();
    } else {
        gameState = newState(options);
    }
};

const initPersistentState = () => {
    if (gameStorage.persistentStateExists()) {
        persistentState = gameStorage.loadPersistentState();
    } else {
        persistentState = {
            highscore: 0,
            unlockables: {},
            hasPlayedBefore: false,
        };
    }
};

export const initGame = async (
    gameOptions: GameOptions,
    _eventHandler: EventHandler,
    _gameStorage: IGameStorage
) => {
    eventHandler = _eventHandler;
    gameStorage = _gameStorage;

    if (!gameStorage.gameExists()) {
        newGame(gameOptions);
    } else {
        initState(gameOptions);
        initPersistentState();

        eventHandler('init', { gameState, persistentState });

        if (debugEnabled) console.log(gameState);

        // TODO: Should game state be passed into the draw?
        eventHandler('draw', { gameState, persistentState });

        if (gameState.firstBlockClicked) {
            // TODO: Setup a more accurate game timer that can count by the MS
            gameTimer = setInterval(() => {
                gameState.elapsedTimeMS = Math.min(gameState.elapsedTimeMS + 1000, 999 * 1000);
                gameStorage.saveGame(gameState);
            }, 1000);
        }
    }

    if (gameState.ended) {
        if (gameState.won) {
            eventHandler('win');
        } else {
            eventHandler('lose');
        }
        clearInterval(gameTimer);
    }
};

export const newGame = (gameOptions: GameOptions, debugState?: GameState) => {
    if (debugState) {
        gameState = debugState;
    } else {
        gameState = newState(gameOptions);
    }

    eventHandler('init', { gameState, persistentState });

    if (debugEnabled) console.log(gameState);

    gameStorage.clearGame();

    const amountOfMines = gameOptions.numberOfMines;
    const determinedMines = determineMineSpots(
        gameOptions.boardWidth * gameOptions.boardHeight,
        amountOfMines
    );
    console.log(determinedMines);
    //Spot 1 is at [0,0], Spot (boardWidth * boardHeight) is at [boardWidth - 1, boardHeight - 1]
    for (var k = 0; k < determinedMines.length; k++) {
        var yCoord = Math.floor(determinedMines[k] / gameOptions.boardWidth);
        var xCoord = determinedMines[k] % gameOptions.boardWidth;
        gameState.board[yCoord][xCoord].isMine = true;
    }

    console.log(gameState);

    // @ts-ignore TODO: Fix gameTimer used before assigned
    clearInterval(gameTimer);

    // TODO: Should game state be passed into the draw?
    eventHandler('draw', {
        gameState,
        persistentState,
    });
};

const determineMineSpots = (amountOfBoardPieces: number, amountOfMines: number) => {
    var mineSpots = new Array<number>();

    if (amountOfMines < amountOfBoardPieces) {
        var i = 0;
        while (i < amountOfMines) {
            var randomSelection = Math.floor(Math.random() * (amountOfBoardPieces - 1)); //from 0 to amountOfBoardPieces - 1
            var isAlreadyThere = false;
            for (var j = 0; j < mineSpots.length; j++) {
                if (randomSelection == mineSpots[j]) {
                    isAlreadyThere = true; //already have a mine at this location, generate a new number
                    break;
                }
            }
            if (isAlreadyThere) {
                continue; //regenerate if we came across a number that's already in the list
            }
            mineSpots.push(randomSelection);
            i++;
        }
    } else if (amountOfMines == amountOfBoardPieces) {
        //It'd be an impossible game, but whatever, you asked for it...
        //Skip randomization entirely and just add each possible spot for amountOfBoardPieces
        for (var i = 0; i < amountOfMines; i++) {
            mineSpots.push(i);
        }
    } else {
        //amountOfMines > amountOfBoardPieces
        throw new BoardOverfillException(
            'Amount of mines to generate exceeds amount of board pieces.'
        );
    }

    return mineSpots;
};

export const selectSpot = function (x: number, y: number) {
    //don't select a piece that doesn't exist on the board
    if (
        x == null ||
        y == null ||
        x < 0 ||
        x >= gameState.gameOptions.boardWidth ||
        y < 0 ||
        y >= gameState.gameOptions.boardHeight
    ) {
        return { hitInfo: 'nonexistent' };
    }
    //don't select if piece is already selected or if game ended already
    if (gameState.ended || gameState.board[y][x].isRevealed) {
        return { hitInfo: 'alreadyhit' };
    }
    let isMine = gameState.board[y][x].isMine;
    revealSpot(x, y);
    if (!gameState.firstBlockClicked) {
        // TODO: Setup a more accurate game timer that can count by the MS
        gameTimer = setInterval(() => {
            gameState.elapsedTimeMS = Math.min(gameState.elapsedTimeMS + 1000, 999 * 1000);
            gameStorage.saveGame(gameState);
        }, 1000);
        eventHandler('first_block_click', { gameState, persistentState });
    }
    gameState.firstBlockClicked = true;
    if (isMine) {
        // Unflag the block if a flag has been placed on it
        gameState.board[y][x].isFlagged = false;
        // Mark the mine as a losing spot
        gameState.board[y][x].isLosingSpot = true;
        gameState.ended = true;
        clearInterval(gameTimer);
        eventHandler('lose', { gameState, persistentState });
        gameStorage.saveGame(gameState);
        // TODO: Should game state be passed into the draw?
        eventHandler('draw', { gameState, persistentState });
        return { hitInfo: 'mine', win: false };
    }
    const won = checkForWin();
    if (won) {
        gameState.won = true;
        gameState.ended = true;
        clearInterval(gameTimer);
        eventHandler('win', { gameState, persistentState });
    }
    // TODO: Should game state be passed into the draw?
    eventHandler('draw', { gameState, persistentState });
    gameStorage.saveGame(gameState);
    return { hitInfo: 'land', win: won };
};

export const selectAdjacentSpots = function (x: number, y: number) {
    if (gameState.ended) {
        return { hitInfo: 'game_ended', win: gameState.won };
    }
    var doesMineExist = false;
    //Only selects adjacent spots if there are exactly as many flags in adjacent spots as there are mines
    var adjacentSpots = getAdjacentSpots(x, y);
    var amountOfAdjMines = calculateAdjacentMines(adjacentSpots);
    var amountOfAdjFlags = calculateAdjacentFlags(adjacentSpots);
    if (amountOfAdjMines == amountOfAdjFlags) {
        //Remove spots that have been flagged from the list
        //Also check to see if any of the remaining adjacent spots are mines
        for (var i = 0; i < adjacentSpots.length; i++) {
            if (adjacentSpots[i].isFlagged) {
                adjacentSpots.splice(i, 1);
                i--;
                continue;
            }
            if (adjacentSpots[i].isMine) {
                doesMineExist = true;
                // Mark the mine as a losing spot
                gameState.board[adjacentSpots[i].y][adjacentSpots[i].x].isLosingSpot = true;
            }
        }
        revealMultiple(adjacentSpots);
    }
    if (doesMineExist) {
        gameState.ended = true;
        clearInterval(gameTimer);
        eventHandler('lose', { gameState, persistentState });
        gameStorage.saveGame(gameState);
        // TODO: Should game state be passed into the draw?
        eventHandler('draw', { gameState, persistentState });
        return { hitInfo: 'mine', win: false };
    }
    const won = checkForWin();
    if (won) {
        gameState.won = true;
        gameState.ended = true;
        clearInterval(gameTimer);
        eventHandler('win', { gameState, persistentState });
    }
    // TODO: Should game state be passed into the draw?
    eventHandler('draw', { gameState, persistentState });
    gameStorage.saveGame(gameState);
    return { hitInfo: 'land', win: won };
};

const performSpotReveal = function (x: number, y: number, callback?: Function) {
    gameState.board[y][x].isRevealed = true;
    let adjacentSpots: Array<MineBlock> | null = null;
    let amountOfAdjMines = 0;
    const isMine = gameState.board[y][x].isMine;
    if (!isMine) {
        //If not a mine, determine adjacent mines
        adjacentSpots = getAdjacentSpots(x, y);
        amountOfAdjMines = calculateAdjacentMines(adjacentSpots);
        gameState.board[y][x].adjMinesCount = amountOfAdjMines;
    }
    if (callback) {
        callback(isMine, amountOfAdjMines, adjacentSpots);
    }
};

const revealSpot = function (x: number, y: number) {
    // Don't reveal already revealed spot
    if (gameState.board[y][x].isRevealed) return;
    performSpotReveal(x, y, function (
        isMine: boolean,
        amountOfAdjMines: number,
        adjacentSpots: MineBlock[]
    ) {
        if (!isMine) {
            // If mine count is 0, then recursively call revealSpot on all adjacent spots
            if (amountOfAdjMines <= 0) {
                revealMultiple(adjacentSpots);
            }
        } else {
            for (var a = 0; a < gameState.gameOptions.boardWidth; a++) {
                for (var b = 0; b < gameState.gameOptions.boardHeight; b++) {
                    if (gameState.gameOptions.revealBoardOnLoss || gameState.board[b][a].isMine) {
                        performSpotReveal(a, b);
                    }
                }
            }
        }
    });
};

const revealMultiple = function (spotArr: MineBlock[]) {
    for (var i = 0; i < spotArr.length; i++) {
        revealSpot(spotArr[i].x, spotArr[i].y);
    }
};

const getAdjacentSpots = function (x: number, y: number) {
    var adjacentList: Array<MineBlock> = [];
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

    var pastLeftEdge = x > 0;
    var pastRightEdge = x < gameState.gameOptions.boardWidth - 1;
    var pastTopEdge = y > 0;
    var pastBottomEdge = y < gameState.gameOptions.boardHeight - 1;

    if (pastLeftEdge) {
        adjacentList.push(gameState.board[y][x - 1]); //4
        if (pastTopEdge) {
            adjacentList.push(gameState.board[y - 1][x - 1]); //1
        }
        if (pastBottomEdge) {
            adjacentList.push(gameState.board[y + 1][x - 1]); //6
        }
    }
    if (pastRightEdge) {
        adjacentList.push(gameState.board[y][x + 1]); //5
        if (pastTopEdge) {
            adjacentList.push(gameState.board[y - 1][x + 1]); //3
        }
        if (pastBottomEdge) {
            adjacentList.push(gameState.board[y + 1][x + 1]); //8
        }
    }
    if (pastTopEdge) {
        adjacentList.push(gameState.board[y - 1][x]); //2
    }
    if (pastBottomEdge) {
        adjacentList.push(gameState.board[y + 1][x]); //7
    }

    return adjacentList;
};

const calculateAdjacentMines = function (adjacentSpots: MineBlock[]) {
    var amountOfAdjMines = 0;

    for (var i = 0; i < adjacentSpots.length; i++) {
        if (adjacentSpots[i].isMine) {
            amountOfAdjMines++;
        }
    }

    return amountOfAdjMines;
};

const calculateAdjacentFlags = function (adjacentSpots: MineBlock[]) {
    var amountOfAdjFlags = 0;

    for (var i = 0; i < adjacentSpots.length; i++) {
        if (adjacentSpots[i].isFlagged) {
            amountOfAdjFlags++;
        }
    }

    return amountOfAdjFlags;
};

export const flagSpot = function (x: number, y: number, expression?: boolean) {
    // if game has ended already, do not perform the action
    if (gameState.ended) {
        return;
    }
    // only flag the spot if it hasn't been revealed yet and if it exists
    if (
        x == null ||
        y == null ||
        x < 0 ||
        x >= gameState.gameOptions.boardWidth ||
        y < 0 ||
        y >= gameState.gameOptions.boardHeight
    ) {
        return { flagInfo: 'nonexistent' };
    }
    if (gameState.won || gameState.board[y][x].isRevealed) {
        return { flagInfo: 'alreadyrevealed' };
    }
    if (expression == null) {
        //flag argument not provided
        expression = !gameState.board[y][x].isFlagged;
    }
    gameState.board[y][x].isFlagged = expression; //spot at x, y is flagged/unflagged
    // TODO: Should game state be passed into the draw?
    eventHandler('draw', { gameState, persistentState });
    gameStorage.saveGame(gameState);
    return { flagInfo: gameState.board[y][x].isFlagged ? 'flagged' : 'unflagged' };
};

const checkForWin = function () {
    // If player revealed all board pieces besides the mines, then they win.
    let amountOfRevealed = 0;

    for (let i = 0; i < gameState.gameOptions.boardHeight; i++) {
        for (let j = 0; j < gameState.gameOptions.boardWidth; j++) {
            // If piece revealed AND not a mine
            if (gameState.board[i][j].isRevealed && !gameState.board[i][j].isMine) {
                amountOfRevealed++;
            }
        }
    }

    if (
        amountOfRevealed ==
        gameState.gameOptions.boardWidth * gameState.gameOptions.boardHeight -
            gameState.gameOptions.numberOfMines
    ) {
        gameState.won = true;
        // Player is a winner!
        return true;
    }

    // Not a winner yet
    return false;
};

// To be used for tests
export const getGameState: () => GameState = () => {
    return gameState;
};
