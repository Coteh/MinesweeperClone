import { GameState, initGame, newGame, GameOptions } from './game';
import { BrowserGameStorage } from './storage/browser';
import {
    createDialogContentFromTemplate,
    renderBoard,
    renderDialog,
    renderDigits,
    renderNotification,
    renderPromptDialog,
} from './render';
import MobileDetect from 'mobile-detect';
import * as feather from 'feather-icons';
// @ts-ignore TODO: Update PIXI.js
import * as PIXI from 'pixi.js';
// @ts-ignore TODO: Update PIXI.js
import { autoDetectRenderer, Container, Texture } from 'pixi.js/lib/core';
// @ts-ignore TODO: Update PIXI.js
import { Ticker } from 'pixi.js/lib/core/ticker';
// @ts-ignore TODO: Update PIXI.js
import * as filters from 'pixi-filters';
import { ActionIconManager } from './manager/action-icon';
import { getPreferenceValue, initPreferences, savePreferenceValue } from './preferences';
import { AssetManager } from './manager/asset';

// Background colors
var regularBackgroundColor = 0x888888;
var gameOverBackgroundColor = 0x3d0000;

const STANDARD_THEME = 'standard';
const CLASSIC_THEME = 'classic';

const THEME_PREFERENCE_NAME = 'theme';
const DIFFICULTY_PREFERENCE_NAME = 'difficulty';
const HIGHLIGHT_PREFERENCE_NAME = 'highlight';
const DEBUG_HUD_ENABLED_PREFERENCE_NAME = 'debugHudEnabled';
const DEBUG_HUD_VISIBLE_PREFERENCE_NAME = 'debugHudVisible';
const FULLSCREEN_PREFERENCE_NAME = 'fullscreen';

const THEME_SETTING_NAME = 'theme-switch';
const DIFFICULTY_SETTING_NAME = 'difficulty';
const HIGHLIGHT_SETTING_NAME = 'highlight';
const CLEAR_DATA_SETTING_NAME = 'clear-all-data';

const SETTING_ENABLED = 'enabled';
const SETTING_DISABLED = 'disabled';

const DIFFICULTY_EASY = 'easy';
const DIFFICULTY_MEDIUM = 'medium';
const DIFFICULTY_HARD = 'hard';

const DIRECTION_LEFT = 'left';
const DIRECTION_RIGHT = 'right';
const DIRECTION_UP = 'up';
const DIRECTION_DOWN = 'down';

console.info(`minesweeper-clone v${GAME_VERSION}`);

document.addEventListener('DOMContentLoaded', async () => {
    const middleElem = document.querySelector('#middle') as HTMLElement;
    const gameBoard = middleElem.querySelector('#board') as HTMLElement;
    const newGameButton = document.querySelector('#new-game') as HTMLElement;
    const newGameImage = newGameButton.querySelector('img') as HTMLImageElement;
    const mineCountBoard = document.getElementById('mine-count-board') as HTMLElement;
    const timeBoard = document.getElementById('time-board') as HTMLElement;

    let assetManager = new AssetManager(document.querySelector('.loader-wrapper') as HTMLElement);
    let actionIconManager = new ActionIconManager();

    let gameState: GameState;
    let gameStorage = new BrowserGameStorage();

    let timeBoardInterval: NodeJS.Timeout;

    const gameOptions: GameOptions = {
        boardHeight: 10,
        boardWidth: 10,
        numberOfMines: 15,
        revealBoardOnLoss: true,
    };

    const directionsPressed = {
        [DIRECTION_LEFT]: false,
        [DIRECTION_RIGHT]: false,
        [DIRECTION_UP]: false,
        [DIRECTION_DOWN]: false,
    };

    const boardTransform = {
        x: 0,
        y: 0,
        scale: 1,
    };

    const md = new MobileDetect(window.navigator.userAgent);
    const isMobile = md.mobile() !== null;

    const eventHandler = (event: string, data: any) => {
        switch (event) {
            case 'init':
                gameState = data.gameState;
                renderer.backgroundColor = regularBackgroundColor;
                background.filters = normalBGFilters;
                tileDelta = 1;
                newGameImage.src = 'img/Smiley.png';
                clearInterval(timeBoardInterval);
                timeBoardInterval = setInterval(() => {
                    renderDigits(timeBoard, gameState.elapsedTimeMS / 1000);
                }, 500);
                renderDigits(timeBoard, gameState.elapsedTimeMS / 1000);
                break;
            case 'draw':
                renderBoard(gameBoard, gameState);
                let unflaggedCount =
                    gameState.gameOptions.numberOfMines -
                    gameState.board.reduce(
                        (acc, row) =>
                            acc +
                            row.reduce(
                                (acc, val) => acc + (val.isFlagged && !val.isRevealed ? 1 : 0),
                                0
                            ),
                        0
                    );
                if (unflaggedCount < 0) {
                    unflaggedCount = 0;
                }
                renderDigits(mineCountBoard, unflaggedCount);
                break;
            case 'error':
                break;
            case 'lose': {
                console.log('Player loses!');
                renderer.backgroundColor = gameOverBackgroundColor;
                background.filters = pixelBackgroundFilters;
                tileDelta = 0.25;
                newGameImage.src = 'img/Smiley_sad.png';
                clearInterval(timeBoardInterval);
                break;
            }
            case 'win': {
                console.log('Player wins!');
                tileDelta = 0.25;
                newGameImage.src = 'img/Smiley_proud.png';
                break;
            }
        }
    };

    const handleKeyInput = (key: string) => {
        console.log(key);
        const dialog = document.querySelector('.dialog') as HTMLDialogElement;
        if (dialog) {
            return;
        }
        if (gameState.ended) {
            return;
        }
        switch (key) {
            case 'arrowleft':
                console.log('going left');
                directionsPressed[DIRECTION_LEFT] = true;
                break;
            case 'arrowright':
                console.log('going right');
                directionsPressed[DIRECTION_RIGHT] = true;
                break;
            case 'arrowdown':
                console.log('going down');
                directionsPressed[DIRECTION_DOWN] = true;
                break;
            case 'arrowup':
                console.log('going up');
                directionsPressed[DIRECTION_UP] = true;
                break;
            case 'd':
                // Only toggle the debug HUD if debug HUD is enabled
                if (isDebugHudEnabled) {
                    toggleDebugHud(debugOverlay.style.display !== 'none');
                }
                break;
        }
    };

    const handleKeyUp = (key: string) => {
        switch (key) {
            case 'arrowleft':
                console.log('releasing left');
                directionsPressed[DIRECTION_LEFT] = false;
                break;
            case 'arrowright':
                console.log('releasing right');
                directionsPressed[DIRECTION_RIGHT] = false;
                break;
            case 'arrowdown':
                console.log('releasing down');
                directionsPressed[DIRECTION_DOWN] = false;
                break;
            case 'arrowup':
                console.log('releasing up');
                directionsPressed[DIRECTION_UP] = false;
                break;
        }
    };

    window.addEventListener('keydown', (e) => {
        handleKeyInput(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
        handleKeyUp(e.key.toLowerCase());
    });

    const promptNewGame = (onNewGameStarted?: () => void) => {
        // If game ended, no need to prompt
        if (gameState.ended) {
            newGame(gameOptions);
            if (onNewGameStarted) {
                onNewGameStarted();
            }
            return;
        }
        const dialogElem = createDialogContentFromTemplate('#prompt-dialog-content');
        (dialogElem.querySelector('.prompt-text') as HTMLSpanElement).innerText =
            'Are you sure you want to start a new game? All progress will be lost.';
        renderPromptDialog(dialogElem, {
            fadeIn: true,
            onConfirm: () => {
                newGame(gameOptions);
                if (onNewGameStarted) {
                    onNewGameStarted();
                }
            },
        });
    };

    const debugButton = document.querySelector('.link-icon#debug') as HTMLElement;
    debugButton.addEventListener('click', (e) => {
        e.preventDefault();
        renderDialog(createDialogContentFromTemplate('#debug-dialog-content'), {
            fadeIn: true,
        });
        const closeDialogAndOverlay = () => {
            const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;
            const dialog = document.querySelector('.dialog') as HTMLDialogElement;
            closeDialog(dialog, overlayBackElem);
        };
        (document.querySelector('.button.new-debug-game') as HTMLElement).addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                newGame({
                    boardWidth: 10,
                    boardHeight: 10,
                    numberOfMines: 3,
                    revealBoardOnLoss: true,
                });
                // if (settingsPane.style.display !== 'none') {
                //     toggleSettings();
                // }
                closeDialogAndOverlay();
            }
        );
        (document.querySelector('.button.prompt-dialog') as HTMLElement).addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                const dialogElem = createDialogContentFromTemplate('#prompt-dialog-content');
                (dialogElem.querySelector('.prompt-text') as HTMLSpanElement).innerText = 'Answer?';
                renderPromptDialog(dialogElem, {
                    fadeIn: true,
                    onConfirm: () => {
                        const dialogElem = document.createElement('span');
                        dialogElem.innerText = 'Confirmed';
                        renderDialog(dialogElem, {
                            fadeIn: true,
                        });
                    },
                });
            }
        );
        (document.querySelector('.button.non-closable-dialog') as HTMLElement).addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                const dialogElem = document.createElement('span');
                dialogElem.innerText =
                    'Testing a dialog that does not close. You will need to refresh the page.';
                renderDialog(dialogElem, {
                    fadeIn: true,
                    closable: false,
                });
            }
        );
        (document.querySelector('.button.show-notification') as HTMLElement).addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                renderNotification('This is a test notification', 2500);
            }
        );
        debugButton.blur();
    });

    // console.log("document.querySelector('#new-game')", document.querySelector('#new-game'));
    newGameButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (gameState.ended) {
            newGame(gameOptions);
            return;
        }
        promptNewGame(() => {
            // TODO: Add Settings screen
            // if (settingsPane.style.display !== 'none') {
            //     toggleSettings();
            // }
            newGame(gameOptions);
        });
    });

    const closeDialog = (dialog: HTMLDialogElement, overlayBackElem: HTMLElement) => {
        if (dialog) {
            // Check if dialog is closable first before closing (close button would be visible, if so)
            const closeBtn = dialog.querySelector('button.close') as HTMLElement;
            if (closeBtn.style.display === 'none') {
                return;
            }
            dialog.close();
            dialog.remove();
        }
        // NTS: Perhaps it'd make more sense if overlay backdrop only disappeared when a valid dialog is passed,
        // but if an invalid dialog is being passed, it might not be on the screen either.
        // In this case, it may be better to leave this as-is and always have the backdrop close so that players can still play.
        overlayBackElem.style.display = 'none';
    };

    const adjustBoardTransform = () => {
        const translateRule = `translate(${boardTransform.x}px, ${boardTransform.y}px)`;
        const scaleRule = `scale(${boardTransform.scale})`;
        zoomableElement.style.transform = `${translateRule}${scaleRule}`;

        (document.querySelector('#x') as HTMLSpanElement).innerText = boardTransform.x.toString();
        (document.querySelector('#y') as HTMLSpanElement).innerText = boardTransform.y.toString();
        (document.querySelector(
            '#zoom'
        ) as HTMLSpanElement).innerText = boardTransform.scale.toString();
    };

    const zoomableElement = middleElem;

    (document.querySelector('#zoom-in') as HTMLElement).addEventListener('click', (e) => {
        e.preventDefault();
        console.log('zoom in clicked', boardTransform.scale);
        const zoomFactor = 0.5;
        const currentDistance = boardTransform.scale + zoomFactor;

        // Apply the scale transform to the element
        boardTransform.scale = Math.max(0.5, Math.min(2, currentDistance)); // Limit scale between 0.5 and 2
        adjustBoardTransform();
    });
    (document.querySelector('#zoom-out') as HTMLElement).addEventListener('click', (e) => {
        e.preventDefault();
        console.log('zoom out clicked', boardTransform.scale);
        const zoomFactor = -0.5;
        const currentDistance = boardTransform.scale + zoomFactor;

        // Apply the scale transform to the element
        boardTransform.scale = Math.max(0.5, Math.min(2, currentDistance)); // Limit scale between 0.5 and 2
        adjustBoardTransform();
    });
    (document.querySelector('#zoom-reset') as HTMLElement).addEventListener('click', (e) => {
        e.preventDefault();
        console.log('zoom reset clicked', boardTransform.scale);

        boardTransform.scale = 1;
        boardTransform.x = 0;
        boardTransform.y = 0;
        adjustBoardTransform();
    });

    const zoomable = document.getElementById('zoomable') as HTMLElement;
    let startDistance = 0;
    let startMidpoint = { x: 0, y: 0 };

    function getDistance(touches: TouchList) {
        const [touch1, touch2] = touches;
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getMidpoint(touches: TouchList) {
        const [touch1, touch2] = touches;
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
        };
    }

    let isPinching = false;

    zoomable.addEventListener(
        'touchstart',
        (event) => {
            console.log('touch start on zoomable', event.touches);
            if (event.touches.length === 2) {
                startDistance = getDistance(event.touches);
                startMidpoint = getMidpoint(event.touches);
                event.preventDefault();
                event.stopPropagation();
                console.log('stopping propagation');
                // TODO: Prevent taps from being sent to the mine blocks if pinching to zoom
                // event.stopImmediatePropagation();
                isPinching = true;
                (document.querySelector(
                    '#pinch'
                ) as HTMLSpanElement).innerText = isPinching.toString();
                return;
            }
            // event.stopPropagation();
        },
        true
    );

    zoomable.addEventListener(
        'touchmove',
        (event) => {
            if (event.touches.length === 2) {
                const currentDistance = getDistance(event.touches);
                const currentMidpoint = getMidpoint(event.touches);

                // Zoom factor based on distance ratio
                const zoomFactor = currentDistance / startDistance;

                // Translation based on midpoint movement
                boardTransform.x += currentMidpoint.x - startMidpoint.x;
                boardTransform.y += currentMidpoint.y - startMidpoint.y;

                // Apply the zoom
                boardTransform.scale *= zoomFactor;
                boardTransform.scale = Math.max(0.5, Math.min(2, boardTransform.scale)); // Limit scale between 0.5 and 2
                adjustBoardTransform();

                // Update the start distance for smooth scaling
                startDistance = currentDistance;
                startMidpoint = currentMidpoint;
                event.preventDefault();
                // event.stopImmediatePropagation();
            }
        },
        true
    );

    zoomable.addEventListener(
        'touchend',
        (event) => {
            // TODO: Properly handle stopping propagation of touch event to mine blocks if pinching to zoom
            console.log('touchend on zoomable', event.touches);
            if (isPinching) {
                event.stopPropagation();
                event.preventDefault();

                if (event.touches.length === 0) {
                    isPinching = false;
                    console.log('pinch ended');
                    (document.querySelector(
                        '#pinch'
                    ) as HTMLSpanElement).innerText = isPinching.toString();
                    startDistance = 0;
                }
            }
        },
        true
    );

    const difficulties = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD];
    let currDifficulty = DIFFICULTY_EASY;

    const settings = document.querySelectorAll('.setting');
    settings.forEach((setting) => {
        setting.addEventListener('click', (e) => {
            const elem = e.target as HTMLElement;
            const toggle = setting.querySelector('.toggle') as HTMLElement;
            let enabled = false;
            if (elem.classList.contains(DIFFICULTY_SETTING_NAME)) {
                const nextIndex = (difficulties.indexOf(currDifficulty) + 1) % difficulties.length;
                const nextDifficulty = difficulties[nextIndex];
                switchDifficulty(nextDifficulty, true);
                savePreferenceValue(DIFFICULTY_PREFERENCE_NAME, nextDifficulty);
                toggle.innerText = nextDifficulty;
            } else if (elem.classList.contains(HIGHLIGHT_SETTING_NAME)) {
                const canHighlight = document.body.dataset.canHighlight != null;
                if (!canHighlight) {
                    document.body.dataset.canHighlight = '';
                } else {
                    document.body.removeAttribute('data-can-highlight');
                }
                savePreferenceValue(
                    HIGHLIGHT_PREFERENCE_NAME,
                    !canHighlight ? SETTING_ENABLED : SETTING_DISABLED
                );
                const knob = setting.querySelector('.knob') as HTMLElement;
                if (!canHighlight) {
                    knob.classList.add('enabled');
                } else {
                    knob.classList.remove('enabled');
                }
            }
        });
    });

    const switchDifficulty = (difficulty: string, startNewGame: boolean) => {
        switch (difficulty) {
            case DIFFICULTY_MEDIUM:
                gameOptions.boardWidth = 16;
                gameOptions.boardHeight = 16;
                gameOptions.numberOfMines = 40;
                break;
            case DIFFICULTY_HARD:
                gameOptions.boardWidth = 16;
                gameOptions.boardHeight = 30;
                gameOptions.numberOfMines = 99;
                break;
            case DIFFICULTY_EASY:
            default:
                gameOptions.boardWidth = 9;
                gameOptions.boardHeight = 9;
                gameOptions.numberOfMines = 10;
                break;
        }
        if (startNewGame) newGame(gameOptions);
        currDifficulty = difficulty;
    };

    initPreferences(gameStorage, {});
    currDifficulty = getPreferenceValue(DIFFICULTY_PREFERENCE_NAME);
    // Default to easy if no difficulty preference set
    if (!currDifficulty) {
        currDifficulty = DIFFICULTY_EASY;
    }
    const difficultySetting = document.querySelector(
        `.setting.${DIFFICULTY_SETTING_NAME}`
    ) as HTMLElement;
    (difficultySetting.querySelector('.toggle') as HTMLElement).innerText = currDifficulty;
    switchDifficulty(currDifficulty, false);

    // Hide highlight setting on mobile devices
    const highlightSetting = document.querySelector(`.setting.highlight`) as HTMLElement;
    if (isMobile) {
        highlightSetting.remove();
    } else {
        const canHighlight = getPreferenceValue(HIGHLIGHT_PREFERENCE_NAME);
        if (canHighlight === SETTING_ENABLED) {
            document.body.dataset.canHighlight = '';
            const knob = highlightSetting.querySelector('.knob') as HTMLElement;
            knob.classList.add('enabled');
        }
    }

    const gameOverlay = document.querySelector('.game-overlay') as HTMLElement;
    const settingsPane = document.querySelector('.settings.pane') as HTMLElement;
    const settingsButton = document.querySelector('.settings-link') as HTMLElement;
    settingsButton.addEventListener('click', (e) => {
        domContainer.style.filter = 'blur(3px)';
        gameOverlay.style.display = '';
        settingsPane.classList.add('toggled');
        settingsPane.style.opacity = '1';
    });
    const settingsCloseButton = document.querySelector('#settings .close') as HTMLElement;
    settingsCloseButton.addEventListener('click', (e) => {
        domContainer.style.filter = '';
        gameOverlay.style.display = 'none';
        settingsPane.style.opacity = '0';
        settingsPane.classList.remove('toggled');
    });
    gameOverlay.addEventListener('click', (e) => {
        if (!settingsPane.classList.contains('toggled')) {
            return;
        }
        domContainer.style.filter = '';
        gameOverlay.style.display = 'none';
        settingsPane.style.opacity = '0';
        settingsPane.classList.remove('toggled');
    });

    // (document.querySelector("[data-feather='help-circle']") as HTMLElement).innerText = '?';
    (document.querySelector("[data-feather='settings']") as HTMLElement).innerText = '⚙';
    (document.querySelector(".settings [data-feather='x']") as HTMLElement).innerText = 'X';
    feather.replace();

    (document.querySelector('.loader-wrapper') as HTMLElement).style.display = 'none';

    var renderer = autoDetectRenderer(800, 600);
    var regularBackgroundColor = 0x888888;
    var gameOverBackgroundColor = 0x3d0000;

    // Attach renderer onto the page
    const domContainer = document.body.querySelector('div.game-wrapper') as HTMLDivElement;
    renderer.view.style.position = 'absolute';
    renderer.view.style.top = '0';
    renderer.view.style.left = '0';
    renderer.view.style.zIndex = '-10';
    domContainer.appendChild(renderer.view);

    renderer.backgroundColor = regularBackgroundColor;
    var stage = new Container();
    var background = new Container();
    var tileTex = Texture.fromImage('img/Tiles.png');
    var tilingTile = new PIXI.extras.TilingSprite(tileTex, renderer.width, renderer.height);
    var tileDelta = 1;
    stage.addChild(background);
    background.addChild(tilingTile);

    function updateRenderer() {
        //Tiling Sprite update
        tilingTile.tilePosition.x -= tileDelta;
        tilingTile.tilePosition.y -= tileDelta;
    }

    function render() {
        //Render the stage
        renderer.render(stage);
    }

    function update() {
        if (directionsPressed[DIRECTION_LEFT]) {
            boardTransform.x += 10;
        }
        if (directionsPressed[DIRECTION_RIGHT]) {
            boardTransform.x -= 10;
        }
        if (directionsPressed[DIRECTION_UP]) {
            boardTransform.y += 10;
        }
        if (directionsPressed[DIRECTION_DOWN]) {
            boardTransform.y -= 10;
        }

        adjustBoardTransform();

        requestAnimationFrame(update);
    }

    var ticker = new Ticker();
    ticker.add(updateRenderer);
    ticker.add(render);
    ticker.start();

    update();

    //Adding resize callback for resizing tiling background
    var resizeCallbacks = new Array<Function>();
    resizeCallbacks.push(function () {
        tilingTile.width = renderer.width;
        tilingTile.height = renderer.height;
    });

    // Background filter setup
    var normalBGFilters = background.filters;
    var pixelateFilter = new filters.PixelateFilter();
    var pixelIntensity = 10;
    pixelateFilter.size.x = pixelIntensity;
    pixelateFilter.size.y = pixelIntensity;
    var pixelBackgroundFilters = [pixelateFilter];
    // var blurFilter = new filters.BlurFilter();
    // blurFilter.blur = 20;
    // var gameInactiveFilters = [blurFilter];

    var resizeGame = function () {
        renderer.resize(window.innerWidth, window.innerHeight);
        console.log(window.innerWidth, window.innerHeight);
        for (var i = 0; i < resizeCallbacks.length; i++) {
            resizeCallbacks[i]();
        }
    };
    window.onresize = resizeGame;
    resizeGame();

    const debugOverlay = document.querySelector('#debug-overlay') as HTMLDivElement;
    const debugMenuButton = document.querySelector('.link-icon#debug') as HTMLElement;
    const debugHudButton = document.querySelector('.link-icon#debug-hud') as HTMLElement;

    const updateDebugHudState = (isEnabled: boolean, isVisible: boolean) => {
        debugHudButton.style.display = isEnabled ? '' : 'none';
        debugOverlay.style.display = isVisible ? '' : 'none';
        actionIconManager.changeIcon(debugHudButton, isVisible ? 'eye-off' : 'eye');
        (document.querySelector('#x') as HTMLSpanElement).innerText = boardTransform.x.toString();
        (document.querySelector('#y') as HTMLSpanElement).innerText = boardTransform.y.toString();
        (document.querySelector(
            '#zoom'
        ) as HTMLSpanElement).innerText = boardTransform.scale.toString();
        (document.querySelector('#pinch') as HTMLSpanElement).innerText = isPinching.toString();
    };

    debugHudButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDebugHud(debugOverlay.style.display !== 'none');
    });

    const toggleDebugHud = (isVisible: boolean) => {
        debugOverlay.style.display = isVisible ? 'none' : '';
        savePreferenceValue(
            DEBUG_HUD_VISIBLE_PREFERENCE_NAME,
            !isVisible ? SETTING_ENABLED : SETTING_DISABLED
        );
        updateDebugHudState(isDebugHudEnabled, !isVisible);
    };

    let isDebugHudEnabled =
        getPreferenceValue(DEBUG_HUD_ENABLED_PREFERENCE_NAME) === SETTING_ENABLED;
    let isDebugHudVisible =
        getPreferenceValue(DEBUG_HUD_VISIBLE_PREFERENCE_NAME) === SETTING_ENABLED;

    updateDebugHudState(isDebugHudEnabled, isDebugHudVisible);

    if (import.meta.env.DEV && !import.meta.env.VITE_DEBUG_OFF) {
        debugMenuButton.style.display = '';
        // If no hud enabled preference is set, set it to enabled and visible
        if (getPreferenceValue(DEBUG_HUD_ENABLED_PREFERENCE_NAME) == null) {
            savePreferenceValue(DEBUG_HUD_ENABLED_PREFERENCE_NAME, SETTING_ENABLED);
            isDebugHudEnabled = true;
            savePreferenceValue(DEBUG_HUD_VISIBLE_PREFERENCE_NAME, SETTING_ENABLED);
            isDebugHudVisible = true;
        }
        updateDebugHudState(isDebugHudEnabled, isDebugHudVisible);
    }

    const versionElem = document.querySelector('.version-number') as HTMLElement;
    versionElem.innerText = `v${GAME_VERSION}`;

    const commitElem = document.querySelector('.commit-hash') as HTMLElement;
    commitElem.innerText = COMMIT_HASH;
    (commitElem.parentElement as HTMLAnchorElement).href += COMMIT_HASH;

    try {
        await assetManager.loadAssets([
            'img/Flag.png',
            'img/Mine.png',
            'img/Logo.png',
            'img/Smiley.png',
            'img/Smiley_proud.png',
            'img/Smiley_sad.png',
            'img/Checkbox_unchecked.png',
            'img/Checkbox_checked.png',
            'img/Tiles.png',
        ]);

        (document.querySelector('.loader-wrapper') as HTMLElement).style.display = 'none';

        await initGame(gameOptions, eventHandler, gameStorage);
    } catch (e) {
        // if (typeof Sentry !== 'undefined') Sentry.captureException(e);
        const elem = createDialogContentFromTemplate('#error-dialog-content');
        const errorContent = elem.querySelector('.error-text') as HTMLElement;

        console.error('Unknown error occurred', e);
        errorContent.innerText = e.message;

        renderDialog(elem, {
            fadeIn: true,
            closable: false,
        });
    }
});
