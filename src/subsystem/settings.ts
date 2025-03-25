import MobileDetect from 'mobile-detect';
import { getPreferenceValue, initPreferences, savePreferenceValue } from '../preferences';
import { createDialogContentFromTemplate, renderDialog, renderPromptDialog } from '../render';
import { FrontendState } from '..';
import { FullscreenManager } from '../manager/fullscreen';
import { GameState, newGame } from '../game';
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
    THEME_PREFERENCE_NAME,
    CLASSIC_THEME,
    OCEAN_THEME,
    BASIC_THEME,
} from '../consts';
import { BackgroundManager } from '../manager/background';

export type SwitchDifficultyOptions = {
    startNewGame: boolean;
};

export type SettingsSubsystem = {
    toggleSettings: (enabled: boolean) => void;
    setGameState: (gameState: GameState) => void;
};

export function setupSettingsSubsystem(
    gameStorage: IGameStorage,
    fullscreenManager: FullscreenManager,
    backgroundManager: BackgroundManager,
    frontendState: FrontendState,
    closeDialog: (dialog: HTMLDialogElement, overlayBackElem: HTMLElement) => void
): SettingsSubsystem {
    let gameState: GameState;

    const setGameState = (_gameState: GameState) => {
        gameState = _gameState;
    };

    const selectableDifficulties = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD];
    const selectableThemes = [BASIC_THEME, OCEAN_THEME, CLASSIC_THEME];

    // Get elements for settings
    const settingsButton = document.querySelector('.settings-link') as HTMLElement;

    // Initialize settings based on stored preferences
    initPreferences(gameStorage, {});

    // Get stored difficulty or default to easy
    let currDifficulty = getPreferenceValue(DIFFICULTY_PREFERENCE_NAME) || DIFFICULTY_EASY;

    // Get stored theme
    let selectedTheme = getPreferenceValue(THEME_PREFERENCE_NAME) || BASIC_THEME;

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

    const switchTheme = (theme: string) => {
        if (!theme || !selectableThemes.includes(theme)) {
            theme = BASIC_THEME;
        }
        document.body.classList.remove(selectedTheme);
        if (theme !== CLASSIC_THEME) {
            document.body.classList.add(theme);
        }
        let themeColor = '#000';
        switch (theme) {
            case OCEAN_THEME:
                themeColor = '#1E3A5F';
                break;
            case CLASSIC_THEME:
                themeColor = '#888888';
                break;
            case BASIC_THEME:
                themeColor = '#BBBBBB';
                break;
        }
        (document.querySelector("meta[name='theme-color']") as HTMLMetaElement).setAttribute(
            'content',
            themeColor
        );
        selectedTheme = theme;
        backgroundManager.switchTheme(theme);
    };

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
        const difficultySelector = document.getElementById('difficulty-selector') as HTMLSelectElement;
        difficultySelector.addEventListener('change', (e) => {
            const difficultyValue = (e.target as HTMLSelectElement).value;
            switchDifficulty(difficultyValue, {
                startNewGame: true,
            });
            savePreferenceValue(DIFFICULTY_PREFERENCE_NAME, difficultyValue);
        });
        difficultySelector.selectedIndex = selectableDifficulties.indexOf(currDifficulty);

        // Set up event listeners for each settings element
        const settings = document.querySelectorAll('.setting');
        settings.forEach((setting) => {
            setting.addEventListener('click', (e) => {
                const elem = e.target as HTMLElement;
                if (elem.classList.contains(HIGHLIGHT_SETTING_NAME)) {
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

        const themeSelector = document.getElementById('theme-selector') as HTMLSelectElement;
        themeSelector.addEventListener('change', (e) => {
            const themeValue = (e.target as HTMLSelectElement).value;
            switchTheme(themeValue);
            if (gameState.ended) {
                if (gameState.won) {
                    backgroundManager.renderWin();
                } else {
                    backgroundManager.renderLose();
                }
            }
            savePreferenceValue(THEME_PREFERENCE_NAME, selectedTheme);
        });
        themeSelector.selectedIndex = selectableThemes.indexOf(selectedTheme);
    }

    // Set up settings pane toggling
    settingsButton?.addEventListener('click', () => {
        toggleSettings(true);
    });

    // Set up game difficulty based on current setting
    switchDifficulty(currDifficulty, {
        startNewGame: false,
    });

    // Set up game theme based on current setting
    switchTheme(selectedTheme);

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
        setGameState,
    };
}
