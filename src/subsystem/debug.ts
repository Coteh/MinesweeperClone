import {
    DEBUG_HUD_ENABLED_PREFERENCE_NAME,
    DEBUG_HUD_VISIBLE_PREFERENCE_NAME,
    SETTING_DISABLED,
    SETTING_ENABLED,
} from '../consts';
import { newGame } from '../game';
import { ActionIconManager } from '../manager/action-icon';
import { TransformManager } from '../manager/transform';
import { getPreferenceValue, savePreferenceValue } from '../preferences';
import {
    createDialogContentFromTemplate,
    renderDialog,
    renderNotification,
    renderPromptDialog,
} from '../render';

export type DebugSubsystem = {
    toggleDebugHud: (isVisible: boolean) => void;
};

export function setupDebugSubsystem(
    actionIconManager: ActionIconManager,
    transformManager: TransformManager,
    closeDialog: (dialog: HTMLDialogElement, overlayBackElem: HTMLElement) => void
): DebugSubsystem {
    const debugOverlay = document.querySelector('#debug-overlay') as HTMLDivElement;
    const debugMenuButton = document.querySelector('.link-icon#debug') as HTMLElement;
    const debugHudButton = document.querySelector('.link-icon#debug-hud') as HTMLElement;

    const debugButton = document.querySelector('.link-icon#debug') as HTMLElement;
    debugButton.addEventListener('click', (e) => {
        e.preventDefault();
        renderDialog(createDialogContentFromTemplate('#debug-dialog-content'), {
            fadeIn: true,
            effect: 'expand',
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
                    effect: 'expand',
                    onConfirm: () => {
                        const dialogElem = document.createElement('span');
                        dialogElem.innerText = 'Confirmed';
                        renderDialog(dialogElem, {
                            fadeIn: true,
                            effect: 'expand',
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
                    effect: 'expand',
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

    // Return helper functions needed by other subsystems
    return {
        toggleDebugHud,
    };
}
