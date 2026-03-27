import { BoardOverfillException } from './errors';
import { IGameStorage } from './storage';

let debugEnabled = false;

export type GameOptions = {
    boardWidth: number;
    boardHeight: number;
    numberOfMines: number;
    revealBoardOnLoss: boolean;
    difficultyKey: string;
};

export type MineBlock = {
    x: number;
    y: number;
    isMine: boolean;
    isRevealed: boolean;
    isLosingSpot: boolean;
    isFlagged: boolean;
    isQuestionMark: boolean;
    adjMinesCount: number;
};

export type Position = {
    x: number;
    y: number;
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
    spareMineSpot: Position;
};

// Game state to last between games
export type GamePersistentState = {
    highscore: {
        [key: string]: number;
    };
    unlockables: {
        [key: string]: boolean;
    };
    hasPlayedBefore: boolean;
};

export type GameEventDataMap = {
    init: { gameState: GameState; persistentState: GamePersistentState };
    draw: { gameState: GameState; persistentState: GamePersistentState };
    win: { gameState: GameState; persistentState: GamePersistentState; onInitialization?: boolean };
    lose: {
        gameState: GameState;
        persistentState: GamePersistentState;
        onInitialization?: boolean;
    };
    reveal: { x: number; y: number };
    flag: { gameState: GameState };
    question_mark: { gameState: GameState; persistentState: GamePersistentState };
    first_block_click: { gameState: GameState; persistentState: GamePersistentState };
    error: { message?: string };
};

export type GameEvent =
    | { type: 'init'; data: GameEventDataMap['init'] }
    | { type: 'draw'; data: GameEventDataMap['draw'] }
    | { type: 'win'; data: GameEventDataMap['win'] }
    | { type: 'lose'; data: GameEventDataMap['lose'] }
    | { type: 'reveal'; data: GameEventDataMap['reveal'] }
    | { type: 'flag'; data: GameEventDataMap['flag'] }
    | { type: 'question_mark'; data: GameEventDataMap['question_mark'] }
    | { type: 'first_block_click'; data: GameEventDataMap['first_block_click'] }
    | { type: 'error'; data: GameEventDataMap['error'] };

export type EventHandler = (event: GameEvent) => void;

type SpotRevealResult = {
    isMine: boolean;
    amountOfAdjMines: number;
    adjacentSpots: MineBlock[] | null;
};

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
                isQuestionMark: false,
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
        spareMineSpot: { x: -1, y: -1 },
    };
};

const initPersistentState = () => {
    if (gameStorage.persistentStateExists()) {
        persistentState = gameStorage.loadPersistentState();
    } else {
        persistentState = {
            highscore: {},
            unlockables: {},
            hasPlayedBefore: false,
        };
    }
};

export const initGame = (
    gameOptions: GameOptions,
    _eventHandler: EventHandler,
    _gameStorage: IGameStorage,
) => {
    eventHandler = _eventHandler;
    gameStorage = _gameStorage;

    if (!gameStorage.gameExists()) {
        newGame(gameOptions);
    } else {
        gameState = gameStorage.loadGame();
        initPersistentState();

        eventHandler({ type: 'init', data: { gameState, persistentState } });

        if (debugEnabled) console.log(gameState);

        // TODO: Should game state be passed into the draw?
        eventHandler({ type: 'draw', data: { gameState, persistentState } });

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
            eventHandler({
                type: 'win',
                data: { gameState, persistentState, onInitialization: true },
            });
        } else {
            eventHandler({
                type: 'lose',
                data: { gameState, persistentState, onInitialization: true },
            });
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
    initPersistentState();

    eventHandler({ type: 'init', data: { gameState, persistentState } });

    if (debugEnabled) console.log(gameState);

    gameStorage.clearGame();

    const amountOfMines = gameOptions.numberOfMines;
    const mineSpots = determineMineSpots(
        gameOptions.boardWidth * gameOptions.boardHeight,
        amountOfMines,
    );
    if (debugEnabled) console.log(mineSpots);
    const mineSpotsToUse = mineSpots.slice(0, -1);
    gameState.spareMineSpot = {
        x: mineSpots[mineSpots.length - 1] % gameOptions.boardWidth,
        y: Math.floor(mineSpots[mineSpots.length - 1] / gameOptions.boardWidth),
    };
    //Spot 1 is at [0,0], Spot (boardWidth * boardHeight) is at [boardWidth - 1, boardHeight - 1]
    for (let k = 0; k < mineSpotsToUse.length; k++) {
        const yCoord = Math.floor(mineSpotsToUse[k] / gameOptions.boardWidth);
        const xCoord = mineSpotsToUse[k] % gameOptions.boardWidth;
        gameState.board[yCoord][xCoord].isMine = true;
        if (debugEnabled) console.log('coords of spot', mineSpotsToUse[k], 'are:', xCoord, yCoord);
    }
    if (debugEnabled)
        console.log(
            'coords of replacement spot',
            mineSpots[mineSpots.length - 1],
            'are:',
            gameState.spareMineSpot.x,
            gameState.spareMineSpot.y,
        );

    clearInterval(gameTimer);

    // TODO: Should game state be passed into the draw?
    eventHandler({ type: 'draw', data: { gameState, persistentState } });
};

const determineMineSpots = (amountOfBoardPieces: number, amountOfMines: number) => {
    const mineSpots = new Array<number>();

    if (amountOfMines < amountOfBoardPieces) {
        let i = 0;
        while (i < amountOfMines + 1) {
            const randomSelection = Math.floor(Math.random() * (amountOfBoardPieces - 1)); //from 0 to amountOfBoardPieces - 1
            let isAlreadyThere = false;
            for (let j = 0; j < mineSpots.length; j++) {
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
        throw new BoardOverfillException(
            'Amount of mines to generate is equal to the amount of board pieces.',
        );
    } else {
        //amountOfMines > amountOfBoardPieces
        throw new BoardOverfillException(
            'Amount of mines to generate exceeds amount of board pieces.',
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
    if (!gameState.firstBlockClicked) {
        // If the first block clicked is a mine, then regenerate its location
        if (isMine && gameState.spareMineSpot.x >= 0 && gameState.spareMineSpot.y >= 0) {
            gameState.board[y][x].isMine = false;
            gameState.board[gameState.spareMineSpot.y][gameState.spareMineSpot.x].isMine = true;
            isMine = false;
            if (debugEnabled) console.log('Mine replaced!');
        }
    }
    revealSpot(x, y);
    if (!gameState.firstBlockClicked) {
        // TODO: Setup a more accurate game timer that can count by the MS
        gameTimer = setInterval(() => {
            gameState.elapsedTimeMS = Math.min(gameState.elapsedTimeMS + 1000, 999 * 1000);
            gameStorage.saveGame(gameState);
        }, 1000);
        eventHandler({ type: 'first_block_click', data: { gameState, persistentState } });
    }
    gameState.firstBlockClicked = true;
    // Unflag the block if a flag has been placed on it
    gameState.board[y][x].isFlagged = false;
    if (isMine) {
        // Mark the mine as a losing spot
        gameState.board[y][x].isLosingSpot = true;
        gameState.ended = true;
        clearInterval(gameTimer);
        eventHandler({ type: 'lose', data: { gameState, persistentState } });
        gameStorage.saveGame(gameState);
        // TODO: Should game state be passed into the draw?
        eventHandler({ type: 'draw', data: { gameState, persistentState } });
        return { hitInfo: 'mine', win: false };
    }
    const won = checkForWin();
    if (won) {
        gameState.won = true;
        gameState.ended = true;
        clearInterval(gameTimer);
        checkForHighscore();
        // Auto-flag all remaining unflagged mines
        flagRemainingMines();
        eventHandler({ type: 'win', data: { gameState, persistentState } });
    }
    eventHandler({ type: 'reveal', data: { x, y } });
    // TODO: Should game state be passed into the draw?
    eventHandler({ type: 'draw', data: { gameState, persistentState } });
    gameStorage.saveGame(gameState);
    return { hitInfo: 'land', win: won };
};

export const selectAdjacentSpots = function (x: number, y: number) {
    if (gameState.ended) {
        return { hitInfo: 'game_ended', win: gameState.won };
    }
    let doesMineExist = false;
    //Only selects adjacent spots if there are exactly as many flags in adjacent spots as there are mines
    const adjacentSpots = getAdjacentSpots(x, y);
    const amountOfAdjMines = calculateAdjacentMines(adjacentSpots);
    const amountOfAdjFlags = calculateAdjacentFlags(adjacentSpots);
    if (amountOfAdjMines > 0 && amountOfAdjMines == amountOfAdjFlags) {
        //Remove spots that have been flagged from the list
        //Also check to see if any of the remaining adjacent spots are mines
        for (let i = 0; i < adjacentSpots.length; i++) {
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
        if (revealMultiple(adjacentSpots)) {
            console.log('At least one block was revealed here');
            eventHandler({ type: 'reveal', data: { x, y } });
        } else {
            console.log('No new blocks were revealed');
        }
    }
    if (doesMineExist) {
        gameState.ended = true;
        clearInterval(gameTimer);
        eventHandler({ type: 'lose', data: { gameState, persistentState } });
        gameStorage.saveGame(gameState);
        // TODO: Should game state be passed into the draw?
        eventHandler({ type: 'draw', data: { gameState, persistentState } });
        return { hitInfo: 'mine', win: false };
    }
    const won = checkForWin();
    if (won) {
        gameState.won = true;
        gameState.ended = true;
        clearInterval(gameTimer);
        checkForHighscore();
        // Auto-flag all remaining unflagged mines
        flagRemainingMines();
        eventHandler({ type: 'win', data: { gameState, persistentState } });
    }
    // TODO: Should game state be passed into the draw?
    eventHandler({ type: 'draw', data: { gameState, persistentState } });
    gameStorage.saveGame(gameState);
    return { hitInfo: 'land', win: won };
};

const performSpotReveal: (x: number, y: number) => SpotRevealResult = function (x, y) {
    gameState.board[y][x].isRevealed = true;
    // Clear any question mark when revealing
    gameState.board[y][x].isQuestionMark = false;
    let adjacentSpots: Array<MineBlock> | null = null;
    let amountOfAdjMines = 0;
    const isMine = gameState.board[y][x].isMine;
    if (!isMine) {
        //If not a mine, determine adjacent mines
        adjacentSpots = getAdjacentSpots(x, y);
        amountOfAdjMines = calculateAdjacentMines(adjacentSpots);
        gameState.board[y][x].adjMinesCount = amountOfAdjMines;
    }
    return {
        isMine,
        amountOfAdjMines,
        adjacentSpots,
    };
};

const revealSpot = function (x: number, y: number) {
    const queue = [{ x, y }];
    const visited = new Set([y * gameState.gameOptions.boardWidth + x]);
    let head = 0;

    while (head < queue.length) {
        const coords = queue[head++];

        const { isMine, amountOfAdjMines, adjacentSpots } = performSpotReveal(coords.x, coords.y);

        if (!isMine) {
            if (amountOfAdjMines <= 0) {
                const toAdd =
                    adjacentSpots?.filter((spot) => !spot.isFlagged && !spot.isRevealed) ?? [];
                for (const spot of toAdd) {
                    const key = spot.y * gameState.gameOptions.boardWidth + spot.x;
                    if (!visited.has(key)) {
                        visited.add(key);
                        queue.push({ x: spot.x, y: spot.y });
                    }
                }
            }
        } else {
            for (let a = 0; a < gameState.gameOptions.boardWidth; a++) {
                for (let b = 0; b < gameState.gameOptions.boardHeight; b++) {
                    if (gameState.gameOptions.revealBoardOnLoss || gameState.board[b][a].isMine) {
                        performSpotReveal(a, b);
                    }
                }
            }
        }
    }
};

const revealMultiple: (spotArr: MineBlock[]) => boolean = function (spotArr: MineBlock[]) {
    let hasHitASpot = false;
    for (let i = 0; i < spotArr.length; i++) {
        if (gameState.board[spotArr[i].y][spotArr[i].x].isRevealed) {
            continue;
        }
        revealSpot(spotArr[i].x, spotArr[i].y);
        hasHitASpot = true;
    }
    return hasHitASpot;
};

const getAdjacentSpots = function (x: number, y: number) {
    const adjacentList: Array<MineBlock> = [];
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

    const pastLeftEdge = x > 0;
    const pastRightEdge = x < gameState.gameOptions.boardWidth - 1;
    const pastTopEdge = y > 0;
    const pastBottomEdge = y < gameState.gameOptions.boardHeight - 1;

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
    let amountOfAdjMines = 0;

    for (let i = 0; i < adjacentSpots.length; i++) {
        if (adjacentSpots[i].isMine) {
            amountOfAdjMines++;
        }
    }

    return amountOfAdjMines;
};

const calculateAdjacentFlags = function (adjacentSpots: MineBlock[]) {
    let amountOfAdjFlags = 0;

    for (let i = 0; i < adjacentSpots.length; i++) {
        if (adjacentSpots[i].isFlagged) {
            amountOfAdjFlags++;
        }
    }

    return amountOfAdjFlags;
};

export const questionMarkSpot = function (x: number, y: number) {
    // if game has ended already, do not perform the action
    if (gameState.ended) {
        return;
    }
    // only allow setting a question mark if it hasn't been revealed yet and exists
    if (
        x == null ||
        y == null ||
        x < 0 ||
        x >= gameState.gameOptions.boardWidth ||
        y < 0 ||
        y >= gameState.gameOptions.boardHeight
    ) {
        return { qmInfo: 'nonexistent' };
    }

    if (gameState.board[y][x].isRevealed) {
        return { qmInfo: 'alreadyrevealed' };
    }

    // Do not allow a question mark to replace an existing flag
    if (gameState.board[y][x].isFlagged) {
        return { qmInfo: 'flagged' };
    }

    gameState.board[y][x].isQuestionMark = !gameState.board[y][x].isQuestionMark;

    // Notify event for question mark action
    eventHandler({ type: 'question_mark', data: { gameState, persistentState } });

    // Notify and persist
    eventHandler({ type: 'draw', data: { gameState, persistentState } });
    gameStorage.saveGame(gameState);

    return { qmInfo: gameState.board[y][x].isQuestionMark ? 'questioned' : 'unquestioned' };
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
    // If flagging a spot, clear any question mark it previously had
    if (expression) {
        gameState.board[y][x].isQuestionMark = false;
    }

    gameState.board[y][x].isFlagged = expression; //spot at x, y is flagged/unflagged
    eventHandler({ type: 'flag', data: { gameState } });
    // TODO: Should game state be passed into the draw?
    eventHandler({ type: 'draw', data: { gameState, persistentState } });
    gameStorage.saveGame(gameState);
    return { flagInfo: gameState.board[y][x].isFlagged ? 'flagged' : 'unflagged' };
};

const flagRemainingMines = function () {
    // Auto-flag all unrevealed, unflagged mines when player wins
    for (let i = 0; i < gameState.gameOptions.boardHeight; i++) {
        for (let j = 0; j < gameState.gameOptions.boardWidth; j++) {
            const cell = gameState.board[i][j];
            if (cell.isMine && !cell.isRevealed && !cell.isFlagged) {
                cell.isFlagged = true;
            }
        }
    }
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

const checkForHighscore = function () {
    // Check if current score is a high score for the difficulty
    const difficultyKey = gameState.gameOptions.difficultyKey;
    const currentTime = gameState.elapsedTimeMS;
    const existingHighScore = persistentState.highscore[difficultyKey];

    if (existingHighScore === undefined || currentTime < existingHighScore) {
        gameState.achievedHighscore = true;
        persistentState.highscore[difficultyKey] = currentTime;
        gameStorage.savePersistentState(persistentState);
    }
};

/* Used for toggling debug console logs */

export const setDebugEnabled = (enabled: boolean) => {
    debugEnabled = !!enabled;
};

/* To be used for tests */

export const getGameState: () => GameState = () => {
    return gameState;
};
