import { ComponentMap } from '../components';
import {
    DEBUG_HUD_ENABLED_PREFERENCE_NAME,
    DEBUG_HUD_VISIBLE_PREFERENCE_NAME,
    SETTING_DISABLED,
    SETTING_ENABLED,
} from '../consts';
import { newGame } from '../game';
import { ActionIconManager } from '../manager/action-icon';
import { AudioManager, SoundEffect } from '../manager/audio';
import { TransformManager } from '../manager/transform';
import { getPreferenceValue, savePreferenceValue } from '../preferences';
import { createDialogContentFromTemplate } from '../util';

export type DebugSubsystem = {
    toggleDebugHud: (isVisible: boolean) => void;
    setupDebugButton: () => void;
};

export function setupDebugSubsystem(
    actionIconManager: ActionIconManager,
    transformManager: TransformManager,
    audioManager: AudioManager,
    {
        renderDialog,
        renderPromptDialog,
        renderNotification,
    }: ComponentMap,
    closeDialog: (dialog: HTMLDialogElement, overlayBackElem: HTMLElement) => void,
): DebugSubsystem {
    const debugOverlay = document.querySelector('#debug-overlay') as HTMLDivElement;
    const debugHudButton = document.querySelector('.link-icon#debug-hud') as HTMLElement;

    const setupDebugButton = () => {
        const debugButton = document.querySelector('#debug') as HTMLElement;
        if (!debugButton) {
            return;
        }

        // Show the debug button in dev mode
        if (import.meta.env.DEV && !import.meta.env.VITE_DEBUG_OFF) {
            debugButton.style.display = '';
        }

        debugButton.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.playSoundEffect(SoundEffect.Click);
            renderDialog({
                content: createDialogContentFromTemplate('#debug-dialog-content'),
                fadeIn: true,
                effect: 'pop',
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
                        difficultyKey: 'debug',
                    });
                    closeDialogAndOverlay();
                },
            );
            (document.querySelector('.button.prompt-dialog') as HTMLElement).addEventListener(
                'click',
                (e) => {
                    e.preventDefault();
                    const dialogElem = createDialogContentFromTemplate('#prompt-dialog-content');
                    (dialogElem.querySelector('.prompt-text') as HTMLSpanElement).innerText =
                        'Answer?';
                    renderPromptDialog({
                        content: dialogElem,
                        fadeIn: true,
                        effect: 'expand',
                        onConfirm: () => {
                            const dialogElem = document.createElement('span');
                            dialogElem.innerText = 'Confirmed';
                            renderDialog({
                                content: dialogElem,
                                fadeIn: true,
                                effect: 'expand',
                            });
                        },
                    });
                },
            );
            (document.querySelector('.button.non-closable-dialog') as HTMLElement).addEventListener(
                'click',
                (e) => {
                    e.preventDefault();
                    const dialogElem = document.createElement('span');
                    dialogElem.innerText =
                        'Testing a dialog that does not close. You will need to refresh the page.';
                    renderDialog({
                        content: dialogElem,
                        fadeIn: true,
                        effect: 'expand',
                        closable: false,
                    });
                },
            );
            (document.querySelector('.button.show-notification') as HTMLElement).addEventListener(
                'click',
                (e) => {
                    e.preventDefault();
                    renderNotification({
                        msg: 'This is a test notification',
                        timeoutMS: 2500,
                    });
                },
            );
            debugButton.blur();
        });
    };

    const updateDebugHudState = (isEnabled: boolean, isVisible: boolean) => {
        debugHudButton.style.display = isEnabled ? '' : 'none';
        debugOverlay.style.display = isVisible ? '' : 'none';
        actionIconManager.changeIcon(debugHudButton, isVisible ? 'eye' : 'eye-off');
        (document.querySelector('#x') as HTMLSpanElement).innerText =
            transformManager.boardTransform.x.toString();
        (document.querySelector('#y') as HTMLSpanElement).innerText =
            transformManager.boardTransform.y.toString();
        (document.querySelector('#zoom') as HTMLSpanElement).innerText =
            transformManager.boardTransform.scale.toString();
    };

    debugHudButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDebugHud(debugOverlay.style.display !== 'none');
    });

    const toggleDebugHud = (isVisible: boolean) => {
        debugOverlay.style.display = isVisible ? 'none' : '';
        savePreferenceValue(
            DEBUG_HUD_VISIBLE_PREFERENCE_NAME,
            !isVisible ? SETTING_ENABLED : SETTING_DISABLED,
        );
        updateDebugHudState(isDebugHudEnabled, !isVisible);
    };

    let isDebugHudEnabled =
        getPreferenceValue(DEBUG_HUD_ENABLED_PREFERENCE_NAME) === SETTING_ENABLED;
    let isDebugHudVisible =
        getPreferenceValue(DEBUG_HUD_VISIBLE_PREFERENCE_NAME) === SETTING_ENABLED;

    updateDebugHudState(isDebugHudEnabled, isDebugHudVisible);

    if (import.meta.env.DEV && !import.meta.env.VITE_DEBUG_OFF) {
        // If no hud enabled preference is set, set it to enabled and visible
        if (getPreferenceValue(DEBUG_HUD_ENABLED_PREFERENCE_NAME) == null) {
            savePreferenceValue(DEBUG_HUD_ENABLED_PREFERENCE_NAME, SETTING_ENABLED);
            isDebugHudEnabled = true;
            savePreferenceValue(DEBUG_HUD_VISIBLE_PREFERENCE_NAME, SETTING_ENABLED);
            isDebugHudVisible = true;
        }
        updateDebugHudState(isDebugHudEnabled, isDebugHudVisible);
    }

    // Return helper functions needed by other subsystems
    return {
        toggleDebugHud,
        setupDebugButton,
    };
}
