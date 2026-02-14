import {
    GameState,
    initGame,
    newGame,
    GameOptions,
    setDebugEnabled,
    GamePersistentState,
    EventHandler,
} from './game';
import { BrowserGameStorage } from './storage/browser';
import {
    createDialogContentFromTemplate,
    renderBoard,
    renderDialog,
    renderDigits,
    renderPromptDialog,
    setThemeManager,
} from './render';
import * as feather from 'feather-icons';
import confetti from 'canvas-confetti';
import { ActionIconManager } from './manager/action-icon';
import { AssetManager } from './manager/asset';
import { FullscreenManager } from './manager/fullscreen';
import { BackgroundManager } from './manager/background';
import { TransformManager } from './manager/transform';
import { InteractionSubsystem, setupInteractionSubsystem } from './subsystem/interaction';

import './styles/global.css';
import { SettingsSubsystem, setupSettingsSubsystem } from './subsystem/settings';
import { DebugSubsystem, setupDebugSubsystem } from './subsystem/debug';
import { AudioManager, SoundEffect } from './manager/audio';
import { Theme, ThemeManager } from './manager/theme';
import {
    BASIC_THEME,
    SMILEY_NORMAL,
    SMILEY_PROUD,
    SMILEY_SAD,
    THEME_PREFERENCE_NAME,
} from './consts';

import { loadConfig } from './config/index';
import type { Config } from './config';
import { getPreferenceValue } from './preferences';
import { updateNavLayout } from './nav-layout';

export type FrontendState = {
    gameOptions: GameOptions;
    isPrompted: boolean;
};

let frontendState: FrontendState = {
    gameOptions: {
        boardHeight: 10,
        boardWidth: 10,
        numberOfMines: 15,
        revealBoardOnLoss: true,
        difficultyKey: 'easy',
    },
    isPrompted: false,
}; // initialized with defaults, will be updated from game config

console.info(`minesweeper-clone v${GAME_VERSION}`);

// Helper to format time in "45s (0:45)" format
const formatTime = (timeMS: number): string => {
    const timeSeconds = Math.floor(timeMS / 1000);
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = timeSeconds % 60;
    return `${timeSeconds}s (${minutes}:${seconds.toString().padStart(2, '0')})`;
};

// Helper to set the smiley face image
const setSmileyImage = (
    imageElement: HTMLImageElement,
    smileyPath: string,
    assetManager: AssetManager,
) => {
    const pre = assetManager.getImage(smileyPath);
    imageElement.src = pre ? pre.src : smileyPath;
    imageElement.dataset.asset = smileyPath;
};

document.addEventListener('DOMContentLoaded', async () => {
    const middleElem = document.querySelector('#middle') as HTMLElement;
    const gameBoard = middleElem.querySelector('#board') as HTMLElement;
    const newGameButton = document.querySelector('#new-game') as HTMLElement;
    const newGameImage = newGameButton.querySelector('img') as HTMLImageElement;
    const mineCountBoard = document.getElementById('mine-count-board') as HTMLElement;
    const timeBoard = document.getElementById('time-board') as HTMLElement;

    let gameState: GameState;
    let persistentState: GamePersistentState;
    const gameStorage = new BrowserGameStorage();
    const fullscreenManager = new FullscreenManager();
    const assetManager = new AssetManager(document.querySelector('.loader-wrapper') as HTMLElement);
    const actionIconManager = new ActionIconManager();
    const backgroundManager = new BackgroundManager(assetManager);

    // Load config (public/config.json)
    const gameConfig: Config = await loadConfig();

    // Create transformManager early so we can set bounds immediately after loading config
    const transformManager = new TransformManager(middleElem);
    const themeManager = new ThemeManager(backgroundManager, assetManager, gameConfig);
    const audioManager = new AudioManager(assetManager);

    // Set the theme manager reference for dialog dimming
    setThemeManager(themeManager);

    // Initialize frontend state from the first difficulty in the config, fallback to hardcoded values
    const difficultyKeys = Object.keys(gameConfig.difficulty);
    if (difficultyKeys.length > 0) {
        const firstKey = difficultyKeys[0];
        const firstSetting = gameConfig.difficulty[firstKey];
        frontendState = {
            gameOptions: {
                boardHeight: firstSetting.boardHeight,
                boardWidth: firstSetting.boardWidth,
                numberOfMines: firstSetting.numberOfMines,
                revealBoardOnLoss: true,
                difficultyKey: firstKey,
            },
            isPrompted: false,
        };
        transformManager.setBounds(firstSetting.bounds);
    } else {
        // fallback hard-coded
        frontendState = {
            gameOptions: {
                boardHeight: 10,
                boardWidth: 10,
                numberOfMines: 15,
                revealBoardOnLoss: true,
                difficultyKey: 'easy',
            },
            isPrompted: false,
        };
    }

    let timeBoardInterval: NodeJS.Timeout;

    let settingsSubsystem: SettingsSubsystem;
    let interactionSubsystem: InteractionSubsystem;
    let debugSubsystem: DebugSubsystem;

    const eventHandler: EventHandler = (event) => {
        switch (event.type) {
            case 'init': {
                gameState = event.data.gameState;
                persistentState = event.data.persistentState;
                setSmileyImage(newGameImage, SMILEY_NORMAL, assetManager);
                clearInterval(timeBoardInterval);
                timeBoardInterval = setInterval(() => {
                    renderDigits(timeBoard, gameState.elapsedTimeMS / 1000, assetManager);
                }, 500);
                renderDigits(timeBoard, gameState.elapsedTimeMS / 1000, assetManager);
                backgroundManager.renderInitial();
                themeManager.applyNormalThemeColor();
                if (!interactionSubsystem) {
                    interactionSubsystem = setupInteractionSubsystem(
                        transformManager,
                        fullscreenManager,
                        audioManager,
                        gameState,
                        promptNewGame,
                        settingsSubsystem.toggleSettings,
                        debugSubsystem.toggleDebugHud,
                        closeDialog,
                        frontendState,
                    );
                }
                settingsSubsystem.setGameState(gameState);
                break;
            }
            case 'draw': {
                renderBoard(gameBoard, gameState, assetManager);
                const unflaggedCount =
                    gameState.gameOptions.numberOfMines -
                    gameState.board.reduce(
                        (acc, row) =>
                            acc + row.reduce((acc, val) => acc + (val.isFlagged ? 1 : 0), 0),
                        0,
                    );
                renderDigits(mineCountBoard, unflaggedCount, assetManager);
                break;
            }
            case 'reveal':
                if (!gameState.ended) {
                    audioManager.playSoundEffect(SoundEffect.Reveal);
                }
                break;
            case 'flag':
                audioManager.playSoundEffect(SoundEffect.Flag, {
                    volume: 0.25,
                });
                break;
            case 'question_mark':
                audioManager.playSoundEffect(SoundEffect.Click);
                break;
            case 'error':
                break;
            case 'lose': {
                console.log('Player loses!');
                setSmileyImage(newGameImage, SMILEY_SAD, assetManager);
                clearInterval(timeBoardInterval);
                transformManager.resetZoom(true);
                backgroundManager.renderLose();
                themeManager.applyLoseThemeColor();
                if (!event.data.onInitialization) {
                    audioManager.playSoundEffect(SoundEffect.Explode);
                }
                break;
            }
            case 'win': {
                console.log('Player wins!');
                setSmileyImage(newGameImage, SMILEY_PROUD, assetManager);
                transformManager.resetZoom(true);
                backgroundManager.renderWin();
                themeManager.applyWinThemeColor();
                if (!event.data.onInitialization) {
                    audioManager.playSoundEffect(SoundEffect.Win, {
                        seek: 0.3,
                    });

                    // Show high score dialog after a short delay if achieved
                    if (gameState.achievedHighscore) {
                        setTimeout(() => {
                            const dialogElem = createDialogContentFromTemplate(
                                '#high-score-dialog-content',
                            );
                            const timeFormatted = formatTime(gameState.elapsedTimeMS);

                            (
                                dialogElem.querySelector('.high-score-time') as HTMLElement
                            ).innerText = timeFormatted;

                            renderDialog(dialogElem, {
                                fadeIn: true,
                                effect: 'pop',
                            });

                            // Trigger confetti effect
                            confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 },
                                zIndex: 200,
                            });

                            const buttons = document.querySelectorAll('dialog button');
                            buttons.forEach((button) => {
                                button.addEventListener('click', () => {
                                    audioManager.playSoundEffect(SoundEffect.Click);
                                });
                            });
                        }, 300);
                    }
                }
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
            newGame(frontendState.gameOptions);
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
            effect: 'expand',
            onConfirm: () => {
                newGame(frontendState.gameOptions);
                if (onNewGameStarted) {
                    onNewGameStarted();
                }
            },
        });
        const buttons = document.querySelectorAll('dialog button');
        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                audioManager.playSoundEffect(SoundEffect.Click);
            });
        });
    };

    newGameButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (gameState.ended) {
            newGame(frontendState.gameOptions);
            return;
        }
        promptNewGame(() => {
            newGame(frontendState.gameOptions);
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
        // Restore appropriate theme color based on current game state when dialog closes
        themeManager.applyNormalColorForCurrentState();
    };

    const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;
    overlayBackElem.addEventListener('click', () => {
        // Do not allow player to close the dialog if they're presented with a prompt dialog asking for Yes/No
        if (frontendState.isPrompted) {
            return;
        }
        const dialog = document.querySelector('.dialog') as HTMLDialogElement;
        closeDialog(dialog, overlayBackElem);
    });

    // (document.querySelector("[data-feather='help-circle']") as HTMLElement).innerText = '?';
    (document.querySelector("[data-feather='settings']") as HTMLElement).innerText = '⚙';
    feather.replace();

    const helpLink = document.querySelector('.help-link') as HTMLElement;
    helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        const howToPlayElem = createDialogContentFromTemplate('#how-to-play');

        // Apply asset manager URLs to template images
        assetManager.applyDataAssets(howToPlayElem);

        renderDialog(howToPlayElem, {
            fadeIn: true,
            effect: 'pop',
            style: {
                width: '75%',
                height: '75%',
                maxWidth: '600px',
            },
        });
        helpLink.blur();
        audioManager.playSoundEffect(SoundEffect.Click);
        const buttons = document.querySelectorAll('dialog button');
        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                audioManager.playSoundEffect(SoundEffect.Click);
            });
        });
    });

    const leaderboardLink = document.querySelector('.leaderboard-link') as HTMLElement;
    leaderboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        const leaderboardElem = createDialogContentFromTemplate('#leaderboard-dialog-content');
        const tbody = leaderboardElem.querySelector('.leaderboard-body') as HTMLElement;

        // Populate table with scores for each difficulty
        const difficultyKeys = Object.keys(gameConfig.difficulty);
        difficultyKeys.forEach((key) => {
            const row = document.createElement('tr');

            const difficultyCell = document.createElement('td');
            difficultyCell.innerText = gameConfig.difficulty[key].displayName;
            row.appendChild(difficultyCell);

            const timeCell = document.createElement('td');
            const highScore = persistentState.highscore[key];
            timeCell.innerText = highScore !== undefined ? formatTime(highScore) : '—';
            row.appendChild(timeCell);

            tbody.appendChild(row);
        });

        renderDialog(leaderboardElem, {
            fadeIn: true,
            effect: 'pop',
            style: {
                maxWidth: '500px',
            },
        });
        leaderboardLink.blur();
        audioManager.playSoundEffect(SoundEffect.Click);
        const buttons = document.querySelectorAll('dialog button');
        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                audioManager.playSoundEffect(SoundEffect.Click);
            });
        });
    });

    const buttons = document.querySelectorAll('.button');
    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            audioManager.playSoundEffect(SoundEffect.Click);
        });
    });

    try {
        // Get stored theme early so we can apply the correct theme class before loading assets
        const storedTheme: Theme = getPreferenceValue(THEME_PREFERENCE_NAME) || BASIC_THEME;
        
        // Remove all theme classes from body, then add the stored theme class
        // This ensures only one theme class is present
        const selectableThemes = Object.keys(gameConfig.theme) as Theme[];
        selectableThemes.forEach(theme => document.body.classList.remove(theme));
        document.body.classList.add(storedTheme);
        
        // Load assets via import.meta.glob via theme-assets helper
        const mod = await import('./manager/theme-assets');
        const { getThemeAssets } = mod;
        // Load assets for the stored theme, not the default theme
        const assetsMap = getThemeAssets(storedTheme);

        // loadAssets will show loader UI and preload/register logical keys
        await assetManager.loadAssets(assetsMap);

        // Apply assets to any DOM elements that have data-asset attributes
        assetManager.applyDataAssets();

        // Update nav layout to ensure elements are in the correct container for the theme
        // This must be done before theme initialization to ensure CSS is applied correctly
        updateNavLayout(storedTheme);

        await backgroundManager.initialize();

        settingsSubsystem = setupSettingsSubsystem(
            gameConfig,
            gameStorage,
            fullscreenManager,
            themeManager,
            backgroundManager,
            audioManager,
            actionIconManager,
            transformManager,
            frontendState,
            closeDialog,
            updateNavLayout,
        );
        // Debug subsystem needs settings subsystem to be set up first to ensure that preferences are loaded
        debugSubsystem = setupDebugSubsystem(
            actionIconManager,
            transformManager,
            audioManager,
            closeDialog,
        );

        // Pass debug subsystem to settings so it can set up the debug button
        settingsSubsystem.setDebugSubsystem(debugSubsystem);

        setDebugEnabled(import.meta.env.VITE_DEBUG_ENABLED);

        // Complete the theme setup (this will update theme colors and background)
        // The theme class was already added to body earlier to ensure correct CSS during asset loading.
        // switchTheme will handle the rest: theme colors, background, CSS variables, etc.
        await themeManager.switchTheme(storedTheme);

        const loaderWrapper = document.querySelector('.loader-wrapper') as HTMLElement;
        const loaderElem = loaderWrapper.querySelector('.loader') as HTMLElement;

        loaderElem.style.display = 'none';
        loaderWrapper.style.backgroundColor = 'rgba(0,0,0,0)';
        setTimeout(() => {
            loaderWrapper.style.display = 'none';
        }, 1000);

        await initGame(frontendState.gameOptions, eventHandler, gameStorage);
    } catch (e) {
        // if (typeof Sentry !== 'undefined') Sentry.captureException(e);
        const elem = createDialogContentFromTemplate('#error-dialog-content');
        const errorContent = elem.querySelector('.error-text') as HTMLElement;

        console.error('Unknown error occurred', e);
        if (e instanceof Error) {
            errorContent.innerText = e.message;
        } else {
            errorContent.innerText = 'Unknown error occurred';
        }

        renderDialog(elem, {
            fadeIn: true,
            effect: 'expand',
            closable: false,
        });
    }
});
