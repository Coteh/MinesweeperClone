import { GameState, initGame, newGame, GameOptions, setDebugEnabled } from './game';
import { BrowserGameStorage } from './storage/browser';
import {
    createDialogContentFromTemplate,
    renderBoard,
    renderDialog,
    renderDigits,
    renderPromptDialog,
} from './render';
import * as feather from 'feather-icons';
import { ActionIconManager } from './manager/action-icon';
import { AssetManager } from './manager/asset';
import { FullscreenManager } from './manager/fullscreen';
import { BackgroundManager } from './manager/background';
import { TransformManager } from './manager/transform';
import { InteractionSubsystem, setupInteractionSubsystem } from './subsystem/interaction';

import './styles/global.css';
import { SettingsSubsystem, setupSettingsSubsystem } from './subsystem/settings';
import { DebugSubsystem, setupDebugSubsystem } from './subsystem/debug';

export type FrontendState = {
    gameOptions: GameOptions;
    isPrompted: boolean;
};

const frontendState: FrontendState = {
    gameOptions: {
        boardHeight: 10,
        boardWidth: 10,
        numberOfMines: 15,
        revealBoardOnLoss: true,
    },
    isPrompted: false,
};

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
    let fullscreenManager = new FullscreenManager();
    let assetManager = new AssetManager(document.querySelector('.loader-wrapper') as HTMLElement);
    let actionIconManager = new ActionIconManager();
    let backgroundManager = new BackgroundManager(assetManager);
    let transformManager = new TransformManager(middleElem);

    let timeBoardInterval: NodeJS.Timeout;

    let settingsSubsystem: SettingsSubsystem;
    let interactionSubsystem: InteractionSubsystem;
    let debugSubsystem: DebugSubsystem;

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
                if (!interactionSubsystem) {
                    interactionSubsystem = setupInteractionSubsystem(
                        transformManager,
                        fullscreenManager,
                        gameState,
                        promptNewGame,
                        settingsSubsystem.toggleSettings,
                        debugSubsystem.toggleDebugHud,
                        closeDialog,
                        frontendState
                    );
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
    };

    const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;
    overlayBackElem.addEventListener('click', (e) => {
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
    });

    (document.querySelector('.loader-wrapper') as HTMLElement).style.display = 'none';

    try {
        await assetManager.loadAssets([
            'img/digits/0.png',
            'img/digits/1.png',
            'img/digits/2.png',
            'img/digits/3.png',
            'img/digits/4.png',
            'img/digits/5.png',
            'img/digits/6.png',
            'img/digits/7.png',
            'img/digits/8.png',
            'img/digits/9.png',
            'img/digits/-.png',
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

        settingsSubsystem = setupSettingsSubsystem(
            gameStorage,
            fullscreenManager,
            frontendState,
            closeDialog
        );
        // Debug subsystem needs settings subsystem to be set up first to ensure that preferences are loaded
        debugSubsystem = setupDebugSubsystem(actionIconManager, transformManager, closeDialog);

        setDebugEnabled(import.meta.env.VITE_DEBUG_ENABLED);

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
