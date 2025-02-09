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
import { ActionIconManager } from './manager/action-icon';
import { getPreferenceValue, initPreferences, savePreferenceValue } from './preferences';
import { AssetManager } from './manager/asset';
import { FullscreenManager } from './manager/fullscreen';
import { BackgroundManager } from './manager/background';
import { TransformManager } from './manager/transform';
import { interactionSubsystem } from './subsystem/interaction';

import './styles/global.css';

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
const FULLSCREEN_SETTING_NAME = 'fullscreen';
const CLEAR_DATA_SETTING_NAME = 'clear-all-data';

const SETTING_ENABLED = 'enabled';
const SETTING_DISABLED = 'disabled';

const DIFFICULTY_EASY = 'easy';
const DIFFICULTY_MEDIUM = 'medium';
const DIFFICULTY_HARD = 'hard';

console.info(`minesweeper-clone v${GAME_VERSION}`);

document.addEventListener('DOMContentLoaded', async () => {
    const domContainer = document.body.querySelector('div.game-wrapper') as HTMLDivElement;
    const middleElem = document.querySelector('#middle') as HTMLElement;
    const gameBoard = middleElem.querySelector('#board') as HTMLElement;
    const newGameButton = document.querySelector('#new-game') as HTMLElement;
    const newGameImage = newGameButton.querySelector('img') as HTMLImageElement;
    const mineCountBoard = document.getElementById('mine-count-board') as HTMLElement;
    const timeBoard = document.getElementById('time-board') as HTMLElement;

    let gameState: GameState;
    let gameStorage = new BrowserGameStorage();
    let fullscreenManager = new FullscreenManager(gameStorage);
    let assetManager = new AssetManager(document.querySelector('.loader-wrapper') as HTMLElement);
    let actionIconManager = new ActionIconManager();
    let backgroundManager = new BackgroundManager(assetManager);
    let transformManager = new TransformManager(middleElem);

    let timeBoardInterval: NodeJS.Timeout;

    const gameOptions: GameOptions = {
        boardHeight: 10,
        boardWidth: 10,
        numberOfMines: 15,
        revealBoardOnLoss: true,
    };

    const md = new MobileDetect(window.navigator.userAgent);
    const isMobile = md.mobile() !== null;

    let interactionSetup = false;

    const eventHandler = (event: string, data: any) => {
        switch (event) {
            case 'init':
                gameState = data.gameState;
                newGameImage.src = 'img/Smiley.png';
                clearInterval(timeBoardInterval);
                timeBoardInterval = setInterval(() => {
                    renderDigits(timeBoard, gameState.elapsedTimeMS / 1000);
                }, 500);
                renderDigits(timeBoard, gameState.elapsedTimeMS / 1000);
                backgroundManager.renderInitial();
                if (!interactionSetup) {
                    interactionSubsystem(
                        transformManager,
                        fullscreenManager,
                        gameState,
                        promptNewGame,
                        toggleSettings,
                        toggleDebugHud
                    );
                    interactionSetup = true;
                }
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
                newGameImage.src = 'img/Smiley_sad.png';
                clearInterval(timeBoardInterval);
                transformManager.resetZoom(true);
                backgroundManager.renderLose();
                break;
            }
            case 'win': {
                console.log('Player wins!');
                newGameImage.src = 'img/Smiley_proud.png';
                transformManager.resetZoom(true);
                backgroundManager.renderWin();
                break;
            }
        }
    };

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fullscreenManager.setFullscreenPreference(false);
            const knob = document.querySelector('.setting.fullscreen .knob') as HTMLElement;
            knob.classList.remove('enabled');
        }
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

    const promptFullscreen = () => {
        const dialogElem = createDialogContentFromTemplate('#prompt-dialog-content');
        (dialogElem.querySelector('.prompt-text') as HTMLSpanElement).innerText =
            'Fullscreen mode was previously enabled. Do you want to re-enter fullscreen mode?';
        renderPromptDialog(dialogElem, {
            fadeIn: true,
            onConfirm: () => {
                fullscreenManager.toggleFullscreen(true);
                const setting = document.querySelector(
                    `.setting.${FULLSCREEN_SETTING_NAME}`
                ) as HTMLElement;
                const knob = setting.querySelector('.knob') as HTMLElement;
                knob.classList.add('enabled');
            },
            onCancel: () => {
                fullscreenManager.toggleFullscreen(false);
                const setting = document.querySelector(
                    `.setting.${FULLSCREEN_SETTING_NAME}`
                ) as HTMLElement;
                const knob = setting.querySelector('.knob') as HTMLElement;
                knob.classList.remove('enabled');
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

    newGameButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (gameState.ended) {
            newGame(gameOptions);
            return;
        }
        promptNewGame(() => {
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
            } else if (elem.classList.contains(FULLSCREEN_SETTING_NAME)) {
                fullscreenManager.toggleFullscreen();
                const knob = setting.querySelector('.knob') as HTMLElement;
                if (fullscreenManager.isFullscreenEnabled()) {
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

    // Hide fullscreen setting on mobile devices
    const fullscreenOption = document.querySelector('.setting.fullscreen') as HTMLElement;
    if (isMobile) {
        fullscreenOption.remove();
    } else {
        if (getPreferenceValue(FULLSCREEN_PREFERENCE_NAME) === SETTING_ENABLED) {
            promptFullscreen();
        }
    }

    const toggleSettings = (enabled: boolean) => {
        if (enabled) {
            domContainer.style.filter = 'blur(3px)';
            gameOverlay.style.display = '';
            settingsPane.classList.add('toggled');
            settingsPane.style.opacity = '1';
        } else {
            domContainer.style.filter = '';
            gameOverlay.style.display = 'none';
            settingsPane.style.opacity = '0';
            settingsPane.classList.remove('toggled');
        }
    };

    const gameOverlay = document.querySelector('.game-overlay') as HTMLElement;
    const settingsPane = document.querySelector('.settings.pane') as HTMLElement;
    const settingsButton = document.querySelector('.settings-link') as HTMLElement;
    settingsButton.addEventListener('click', (e) => {
        toggleSettings(true);
    });
    const settingsCloseButton = document.querySelector('#settings .close') as HTMLElement;
    settingsCloseButton.addEventListener('click', (e) => {
        toggleSettings(false);
    });
    gameOverlay.addEventListener('click', (e) => {
        if (!settingsPane.classList.contains('toggled')) {
            return;
        }
        toggleSettings(false);
    });

    // (document.querySelector("[data-feather='help-circle']") as HTMLElement).innerText = '?';
    (document.querySelector("[data-feather='settings']") as HTMLElement).innerText = '⚙';
    (document.querySelector(".settings [data-feather='x']") as HTMLElement).innerText = 'X';
    feather.replace();

    (document.querySelector('.loader-wrapper') as HTMLElement).style.display = 'none';

    const debugOverlay = document.querySelector('#debug-overlay') as HTMLDivElement;
    const debugMenuButton = document.querySelector('.link-icon#debug') as HTMLElement;
    const debugHudButton = document.querySelector('.link-icon#debug-hud') as HTMLElement;

    const updateDebugHudState = (isEnabled: boolean, isVisible: boolean) => {
        debugHudButton.style.display = isEnabled ? '' : 'none';
        debugOverlay.style.display = isVisible ? '' : 'none';
        actionIconManager.changeIcon(debugHudButton, isVisible ? 'eye-off' : 'eye');
        (document.querySelector(
            '#x'
        ) as HTMLSpanElement).innerText = transformManager.boardTransform.x.toString();
        (document.querySelector(
            '#y'
        ) as HTMLSpanElement).innerText = transformManager.boardTransform.y.toString();
        (document.querySelector(
            '#zoom'
        ) as HTMLSpanElement).innerText = transformManager.boardTransform.scale.toString();
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

        await backgroundManager.initialize();

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
