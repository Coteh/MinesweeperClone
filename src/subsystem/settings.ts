import MobileDetect from 'mobile-detect';
import { getPreferenceValue, initPreferences, savePreferenceValue } from '../preferences';
import { createDialogContentFromTemplate, renderDialog, renderPromptDialog } from '../render';
import { FrontendState } from '..';
import { FullscreenManager } from '../manager/fullscreen';
import { newGame } from '../game';
import { IGameStorage } from '../storage';
import {
    DIFFICULTY_PREFERENCE_NAME,
    DIFFICULTY_EASY,
    DIFFICULTY_MEDIUM,
    DIFFICULTY_HARD,
    FULLSCREEN_SETTING_NAME,
    DIFFICULTY_SETTING_NAME,
    HIGHLIGHT_SETTING_NAME,
    HIGHLIGHT_PREFERENCE_NAME,
    SETTING_ENABLED,
    SETTING_DISABLED,
    FULLSCREEN_PREFERENCE_NAME,
} from '../consts';

export type SwitchDifficultyOptions = {
    startNewGame: boolean;
};

export type SettingsSubsystem = {
    toggleSettings: (enabled: boolean) => void;
};

export function setupSettingsSubsystem(
    gameStorage: IGameStorage,
    fullscreenManager: FullscreenManager,
    frontendState: FrontendState,
    closeDialog: (dialog: HTMLDialogElement, overlayBackElem: HTMLElement) => void
): SettingsSubsystem {
    // Get elements for settings
    const settingsButton = document.querySelector('.settings-link') as HTMLElement;

    // Initialize settings based on stored preferences
    initPreferences(gameStorage, {});

    // Get stored difficulty or default to easy
    let currDifficulty = getPreferenceValue(DIFFICULTY_PREFERENCE_NAME) || DIFFICULTY_EASY;

    // Helper to update game options based on difficulty
    function switchDifficulty(difficulty: string, options: SwitchDifficultyOptions) {
        switch (difficulty) {
            case DIFFICULTY_MEDIUM:
                frontendState.gameOptions.boardWidth = 16;
                frontendState.gameOptions.boardHeight = 16;
                frontendState.gameOptions.numberOfMines = 40;
                break;
            case DIFFICULTY_HARD:
                frontendState.gameOptions.boardWidth = 30;
                frontendState.gameOptions.boardHeight = 16;
                frontendState.gameOptions.numberOfMines = 99;
                break;
            case DIFFICULTY_EASY:
            default:
                frontendState.gameOptions.boardWidth = 9;
                frontendState.gameOptions.boardHeight = 9;
                frontendState.gameOptions.numberOfMines = 10;
                break;
        }
        if (options.startNewGame) {
            newGame(frontendState.gameOptions);
        }
        currDifficulty = difficulty;
    }

    function promptFullscreen() {
        const dialogElem = createDialogContentFromTemplate('#prompt-dialog-content');
        (dialogElem.querySelector('.prompt-text') as HTMLSpanElement).innerText =
            'Fullscreen mode was previously enabled. Do you want to re-enter fullscreen mode?';
        renderPromptDialog(dialogElem, {
            fadeIn: true,
            onConfirm: () => {
                fullscreenManager.toggleFullscreen(true);
            },
            onCancel: () => {
                fullscreenManager.toggleFullscreen(false);
            },
        });
    }

    function toggleSettings(enabled: boolean) {
        if (enabled) {
            const settingsTemplateElem = createDialogContentFromTemplate(
                '#settings-dialog-content'
            );
            renderDialog(settingsTemplateElem, {
                fadeIn: true,
                effect: 'pop',
                style: {
                    width: '75%',
                    height: '75%',
                    maxWidth: '600px',
                },
            });

            const settingsDialogContent = document.querySelector(
                '.dialog-content > .settings'
            ) as HTMLElement;

            const versionElem = settingsDialogContent.querySelector(
                '.version-number'
            ) as HTMLElement;
            versionElem.innerText = `v${GAME_VERSION}`;

            const commitElem = settingsDialogContent.querySelector('.commit-hash') as HTMLElement;
            commitElem.innerText = COMMIT_HASH;
            (commitElem.parentElement as HTMLAnchorElement).href += COMMIT_HASH;

            initializeSettingsContent();
        } else {
            const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;
            const dialog = document.querySelector('.dialog') as HTMLDialogElement;
            closeDialog(dialog, overlayBackElem);
        }
    }

    function initializeSettingsContent() {
        // Initialize the difficulty UI element
        const difficultyToggleElem = document.querySelector(
            `.setting.${DIFFICULTY_SETTING_NAME} .toggle`
        ) as HTMLElement;
        if (difficultyToggleElem) {
            difficultyToggleElem.innerText = currDifficulty;
        }

        // Set up event listeners for each settings element
        const settings = document.querySelectorAll('.setting');
        settings.forEach((setting) => {
            setting.addEventListener('click', (e) => {
                const elem = e.target as HTMLElement;
                const toggle = setting.querySelector('.toggle') as HTMLElement;
                if (elem.classList.contains(DIFFICULTY_SETTING_NAME)) {
                    const difficulties = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD];
                    const nextIndex =
                        (difficulties.indexOf(currDifficulty) + 1) % difficulties.length;
                    const nextDifficulty = difficulties[nextIndex];
                    switchDifficulty(nextDifficulty, {
                        startNewGame: true,
                    });
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

        const highlightSettingElem = document.querySelector(`.setting.${HIGHLIGHT_SETTING_NAME}`);
        if (highlightSettingElem) {
            if (isMobile) {
                highlightSettingElem.remove();
            } else {
                const canHighlight = getPreferenceValue(HIGHLIGHT_PREFERENCE_NAME);
                if (canHighlight === SETTING_ENABLED) {
                    const knob = highlightSettingElem.querySelector('.knob');
                    if (knob) {
                        knob.classList.add('enabled');
                    }
                }
            }
        }

        const fullscreenOptionElem = document.querySelector(`.setting.${FULLSCREEN_SETTING_NAME}`);
        if (fullscreenOptionElem) {
            if (isMobile) {
                fullscreenOptionElem.remove();
            } else {
                const fullscreenEnabled = getPreferenceValue(FULLSCREEN_PREFERENCE_NAME);
                if (fullscreenEnabled === SETTING_ENABLED) {
                    const knob = fullscreenOptionElem.querySelector('.knob');
                    if (knob) {
                        knob.classList.add('enabled');
                    }
                }
            }
        }
    }

    // Set up settings pane toggling
    settingsButton?.addEventListener('click', () => {
        toggleSettings(true);
    });

    // Set up game difficulty based on current setting
    switchDifficulty(currDifficulty, {
        startNewGame: false,
    });

    // Mobile-specific behavior
    const md = new MobileDetect(window.navigator.userAgent);
    const isMobile = md.mobile() !== null;

    // Enable highlighting if player had it enabled previously
    if (!isMobile && getPreferenceValue(HIGHLIGHT_PREFERENCE_NAME) === SETTING_ENABLED) {
        document.body.dataset.canHighlight = '';
    }

    // Prompt for fullscreen if player had it enabled previously
    if (!isMobile && getPreferenceValue(FULLSCREEN_PREFERENCE_NAME) === SETTING_ENABLED) {
        promptFullscreen();
    }

    // Return helper functions needed by other subsystems
    return {
        toggleSettings,
    };
}
