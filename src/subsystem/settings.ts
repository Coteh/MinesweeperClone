import MobileDetect from 'mobile-detect';
import { getPreferenceValue, initPreferences, savePreferenceValue } from '../preferences';
import { createDialogContentFromTemplate, renderPromptDialog } from '../render';
import { FrontendState } from '..';
import { FullscreenManager } from '../manager/fullscreen';
import { newGame } from '../game';
import { IGameStorage } from '../storage';
import { DIFFICULTY_PREFERENCE_NAME, DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD, FULLSCREEN_SETTING_NAME, DIFFICULTY_SETTING_NAME, HIGHLIGHT_SETTING_NAME, HIGHLIGHT_PREFERENCE_NAME, SETTING_ENABLED, SETTING_DISABLED, FULLSCREEN_PREFERENCE_NAME } from '../consts';

export type SettingsSubsystem = {
    toggleSettings: (enabled: boolean) => void;
};

export function setupSettingsSubsystem(
    gameStorage: IGameStorage,
    fullscreenManager: FullscreenManager,
    frontendState: FrontendState
): SettingsSubsystem {
    // Get elements for settings
    const domContainer = document.querySelector('div.game-wrapper') as HTMLElement;
    const settingsPane = document.querySelector('.settings.pane') as HTMLElement;
    const gameOverlay = document.querySelector('.game-overlay') as HTMLElement;
    const settingsButton = document.querySelector('.settings-link') as HTMLElement;
    const settingsCloseButton = document.querySelector('#settings .close') as HTMLElement;

    // Initialize settings based on stored preferences
    initPreferences(gameStorage, {});

    // Get stored difficulty or default to easy 
    let currDifficulty = getPreferenceValue(DIFFICULTY_PREFERENCE_NAME) || DIFFICULTY_EASY;

    // Helper to update game options based on difficulty
    function switchDifficulty(difficulty: string, startNewGame: boolean) {
        switch (difficulty) {
            case DIFFICULTY_MEDIUM:
                frontendState.gameOptions.boardWidth = 16;
                frontendState.gameOptions.boardHeight = 16;
                frontendState.gameOptions.numberOfMines = 40;
                break;
            case DIFFICULTY_HARD:
                frontendState.gameOptions.boardWidth = 16;
                frontendState.gameOptions.boardHeight = 30;
                frontendState.gameOptions.numberOfMines = 99;
                break;
            case DIFFICULTY_EASY:
            default:
                frontendState.gameOptions.boardWidth = 9;
                frontendState.gameOptions.boardHeight = 9;
                frontendState.gameOptions.numberOfMines = 10;
                break;
        }
        if (startNewGame) {
            newGame(frontendState.gameOptions);
        }
        currDifficulty = difficulty;
    }

    function promptFullscreen () {
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

    function toggleSettings(enabled: boolean) {
        if (domContainer && settingsPane && gameOverlay) {
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
        }
    }

    // Initialize the difficulty UI element 
    const difficultyToggleElem = document.querySelector(`.setting.${DIFFICULTY_SETTING_NAME} .toggle`) as HTMLElement;
    if (difficultyToggleElem) {
        difficultyToggleElem.innerText = currDifficulty;
    }
    switchDifficulty(currDifficulty, false);

    // Set up event listeners for each settings element 
    const settings = document.querySelectorAll('.setting');
    settings.forEach((setting) => {
        setting.addEventListener('click', (e) => {
            const elem = e.target as HTMLElement;
            const toggle = setting.querySelector('.toggle') as HTMLElement;
            if (elem.classList.contains(DIFFICULTY_SETTING_NAME)) {
                const difficulties = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD];
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

    // Mobile-specific behavior 
    const md = new MobileDetect(window.navigator.userAgent);
    const isMobile = md.mobile() !== null;

    const highlightSettingElem = document.querySelector(`.setting.${HIGHLIGHT_SETTING_NAME}`);
    if (isMobile && highlightSettingElem) {
        highlightSettingElem.remove();
    } else if (highlightSettingElem) {
        const canHighlight = getPreferenceValue(HIGHLIGHT_PREFERENCE_NAME);
        if (canHighlight === SETTING_ENABLED) {
            document.body.dataset.canHighlight = '';
            const knob = highlightSettingElem.querySelector('.knob');
            if (knob) {
                knob.classList.add('enabled');
            }
        }
    }

    const fullscreenOptionElem = document.querySelector(`.setting.${FULLSCREEN_SETTING_NAME}`);
    if (isMobile && fullscreenOptionElem) {
        fullscreenOptionElem.remove();
    } else if (fullscreenOptionElem) {
        if (getPreferenceValue(FULLSCREEN_PREFERENCE_NAME) === SETTING_ENABLED) {
            promptFullscreen();
        }
    }

    // Set up settings pane toggling
    settingsButton?.addEventListener('click', () => {
        toggleSettings(true);
    });
    settingsCloseButton?.addEventListener('click', () => {
        toggleSettings(false);
    });
    gameOverlay?.addEventListener('click', () => {
        if (settingsPane.classList.contains('toggled')) {
            toggleSettings(false);
        }
    });

    // Return helper functions needed by other subsystems
    return {
        toggleSettings
    };
}