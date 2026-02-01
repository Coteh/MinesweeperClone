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
    FULLSCREEN_SETTING_NAME,
    DIFFICULTY_SETTING_NAME,
    HIGHLIGHT_SETTING_NAME,
    HIGHLIGHT_PREFERENCE_NAME,
    SETTING_ENABLED,
    SETTING_DISABLED,
    FULLSCREEN_PREFERENCE_NAME,
    THEME_PREFERENCE_NAME,
    BASIC_THEME,
    SOUND_SETTING_NAME,
    SOUND_PREFERENCE_NAME,
    SOUND_VOLUME_PREFERENCE_NAME,
    THEME_SETTING_NAME,
} from '../consts';
import { BackgroundManager } from '../manager/background';
import { AudioManager, SoundEffect } from '../manager/audio';
import { Theme, ThemeManager } from '../manager/theme';
import { ActionIconManager } from '../manager/action-icon';

export type SwitchDifficultyOptions = {
    startNewGame: boolean;
};

export type SettingsSubsystem = {
    toggleSettings: (enabled: boolean) => void;
    setGameState: (gameState: GameState) => void;
};

import type { Config } from '../config';

export function setupSettingsSubsystem(
    gameConfig: Config,
    gameStorage: IGameStorage,
    fullscreenManager: FullscreenManager,
    themeManager: ThemeManager,
    backgroundManager: BackgroundManager,
    audioManager: AudioManager,
    actionIconManager: ActionIconManager,
    transformManager: import('../manager/transform').TransformManager,
    frontendState: FrontendState,
    closeDialog: (dialog: HTMLDialogElement, overlayBackElem: HTMLElement) => void
): SettingsSubsystem {
    let gameState: GameState;

    const setGameState = (_gameState: GameState) => {
        gameState = _gameState;
    };

    const selectableDifficulties = Object.keys(gameConfig.difficulty);

    // Get elements for settings
    const settingsButton = document.querySelector('.settings-link') as HTMLElement;

    // Initialize settings based on stored preferences
    initPreferences(gameStorage, {
        [SOUND_PREFERENCE_NAME]: SETTING_ENABLED,
        [SOUND_VOLUME_PREFERENCE_NAME]: '100',
    });

    // Get stored difficulty or default to easy
    let currDifficulty = getPreferenceValue(DIFFICULTY_PREFERENCE_NAME) || DIFFICULTY_EASY;

    // Helper to update game options based on difficulty
    function switchDifficulty(difficulty: string, options: SwitchDifficultyOptions) {
        const setting = gameConfig.difficulty[difficulty];
        if (setting) {
            frontendState.gameOptions.boardWidth = setting.boardWidth;
            frontendState.gameOptions.boardHeight = setting.boardHeight;
            frontendState.gameOptions.numberOfMines = setting.numberOfMines;
            frontendState.gameOptions.difficultyKey = difficulty;
            // set bounds on transform manager so panning gets clamped
            transformManager.setBounds(setting.bounds);
        } else {
            // fallback to previous hardcoded defaults for safety
            frontendState.gameOptions.boardWidth = 9;
            frontendState.gameOptions.boardHeight = 9;
            frontendState.gameOptions.numberOfMines = 10;
            frontendState.gameOptions.difficultyKey = 'easy';
            transformManager.setBounds(null);
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

            // State variables for changelog
            let changelogFetchSuccess = false;
            let changelogHTML: string;

            // Changelog link click handler
            const changelogLink = settingsDialogContent.querySelector(
                '#changelog-link'
            ) as HTMLAnchorElement;
            if (changelogLink) {
                changelogLink.addEventListener('click', async (e) => {
                    e.preventDefault();

                    audioManager.playSoundEffect(SoundEffect.Click);

                    // Fetch changelog (or use cached version if already fetched)
                    if (!changelogFetchSuccess) {
                        try {
                            const res = await fetch('CHANGELOG.html');
                            if (!res.ok) {
                                console.error('Could not fetch changelog:', res.statusText);
                                changelogHTML = `<p class="changelog-error">Could not retrieve changelog.</p>`;
                            } else {
                                changelogHTML = await res.text();
                                changelogFetchSuccess = true;
                            }
                        } catch (e) {
                            console.error('Could not fetch changelog:', e);
                            changelogHTML = `<p class="changelog-error">Could not retrieve changelog.</p>`;
                        }
                    }

                    // Create dialog content from template
                    const dialogElem = createDialogContentFromTemplate('#changelog-content');
                    const changelogElem = dialogElem.querySelector('#changelog-text') as HTMLElement;
                    changelogElem.innerHTML = changelogHTML;

                    if (changelogFetchSuccess) {
                        // Capitalize title
                        (changelogElem.children.item(0) as HTMLElement).style.textTransform =
                            'uppercase';

                        // Remove "Keep a Changelog" preamble and "Unreleased" sections (optional cleanup)
                        changelogElem.children.item(1)?.remove();
                        changelogElem.children.item(1)?.remove();
                        changelogElem.children.item(1)?.remove();

                        // All links in this section should open a new tab
                        changelogElem
                            .querySelectorAll('a')
                            .forEach((elem) => (elem.target = '_blank'));
                    }

                    // Render the dialog
                    renderDialog(dialogElem, {
                        fadeIn: true,
                        closable: true,
                        style: {
                            width: '75%',
                            height: '75%',
                            maxWidth: '600px',
                        },
                    });
                });
            }

            initializeSettingsContent();

            const buttons = document.querySelectorAll('dialog button');
            buttons.forEach((button) => {
                button.addEventListener('click', () => {
                    audioManager.playSoundEffect(SoundEffect.Click);
                });
            });

            const settingsItems = document.querySelectorAll('.settings-item');
            settingsItems.forEach((settingsItem) => {
                settingsItem.addEventListener('click', () => {
                    audioManager.playSoundEffect(SoundEffect.Click);
                });
            });

            const inputElems = document.querySelectorAll('input');
            inputElems.forEach((inputElem) => {
                inputElem.addEventListener('select', () => {
                    audioManager.playSoundEffect(SoundEffect.Click);
                });
            });
        } else {
            const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;
            const dialog = document.querySelector('.dialog') as HTMLDialogElement;
            closeDialog(dialog, overlayBackElem);
        }
    }

    function initializeSettingsContent() {
        // Helper function to get the appropriate volume icon
        const getVolumeIcon = (enabled: boolean, volume: number): string => {
            if (!enabled) return 'volume-x';
            if (volume <= 33) return 'volume-1';
            return 'volume-2';
        };

        // Initialize the difficulty UI element
        const difficultySelector = document.getElementById(
            'difficulty-selector'
        ) as HTMLSelectElement;
        // Populate options dynamically from gameConfig
        difficultySelector.innerHTML = '';
        selectableDifficulties.forEach((key) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.innerText = gameConfig.difficulty[key].displayName || key;
            difficultySelector.appendChild(opt);
        });
        difficultySelector.addEventListener('change', (e) => {
            const difficultyValue = (e.target as HTMLSelectElement).value;
            switchDifficulty(difficultyValue, {
                startNewGame: true,
            });
            savePreferenceValue(DIFFICULTY_PREFERENCE_NAME, difficultyValue);
        });
        // Ensure selectedIndex matches current difficulty (currDifficulty may come from preferences)
        const idx = selectableDifficulties.indexOf(currDifficulty);
        if (idx >= 0) {
            difficultySelector.selectedIndex = idx;
        } else {
            difficultySelector.selectedIndex = 0;
            currDifficulty = selectableDifficulties[0];
        }

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
                } else if (elem.classList.contains(SOUND_SETTING_NAME)) {
                    audioManager.toggleSoundEffects();
                    savePreferenceValue(
                        SOUND_PREFERENCE_NAME,
                        audioManager.isSoundEffectsEnabled() ? SETTING_ENABLED : SETTING_DISABLED
                    );
                    const knob = setting.querySelector('.knob') as HTMLElement;
                    if (audioManager.isSoundEffectsEnabled()) {
                        knob.classList.add('enabled');
                    } else {
                        knob.classList.remove('enabled');
                    }
                    
                    // Get current volume for icon selection
                    const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
                    const currentVolume = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
                    
                    actionIconManager.changeIcon(
                        knob,
                        getVolumeIcon(audioManager.isSoundEffectsEnabled(), currentVolume)
                    );
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
        // Populate theme options from config
        themeSelector.innerHTML = '';
        themeManager.getSelectableThemes().forEach((t) => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.innerText = gameConfig.theme[t].displayName || t;
            themeSelector.appendChild(opt);
        });
        themeSelector.addEventListener('change', async (e) => {
            const themeValue = (e.target as HTMLSelectElement).value as Theme;

            await themeManager.switchTheme(themeValue);
            if (gameState.ended) {
                if (gameState.won) {
                    backgroundManager.renderWin();
                } else {
                    backgroundManager.renderLose();
                }
            }
            savePreferenceValue(THEME_PREFERENCE_NAME, themeValue);
        });
        const currTheme = themeManager.getCurrentTheme();
        const themeIdx = themeManager.getSelectableThemes().indexOf(currTheme);
        themeSelector.selectedIndex = themeIdx >= 0 ? themeIdx : 0;

        document
            .querySelector(`.settings-item.${DIFFICULTY_SETTING_NAME}`)
            ?.addEventListener('click', () => {
                const difficultySelector = document.getElementById(
                    'difficulty-selector'
                ) as HTMLSelectElement;
                if (difficultySelector) {
                    difficultySelector.focus();
                    difficultySelector.showPicker();
                }
            });

        document
            .querySelector(`.settings-item.${THEME_SETTING_NAME}`)
            ?.addEventListener('click', () => {
                const themeSelector = document.getElementById(
                    'theme-selector'
                ) as HTMLSelectElement;
                if (themeSelector) {
                    themeSelector.focus();
                    themeSelector.showPicker();
                }
            });

        const soundEffectsSettingElem = document.querySelector(`.setting.${SOUND_SETTING_NAME}`);
        if (soundEffectsSettingElem) {
            const soundsEnabled = getPreferenceValue(SOUND_PREFERENCE_NAME);
            audioManager.toggleSoundEffects(soundsEnabled === SETTING_ENABLED);
            
            // Get stored volume or default to 100
            const storedVolume = parseInt(getPreferenceValue(SOUND_VOLUME_PREFERENCE_NAME) || '100', 10);
            audioManager.setSoundEffectsVolume(storedVolume / 100);
            
            const knob = soundEffectsSettingElem.querySelector('.knob') as HTMLElement;
            
            actionIconManager.changeIcon(
                knob,
                getVolumeIcon(audioManager.isSoundEffectsEnabled(), storedVolume)
            );
            if (soundsEnabled === SETTING_ENABLED) {
                knob.classList.add('enabled');
            }
            
            // Set up volume slider
            const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
            if (volumeSlider) {
                volumeSlider.value = storedVolume.toString();
                
                volumeSlider.addEventListener('input', (e) => {
                    const volume = parseInt((e.target as HTMLInputElement).value, 10);
                    audioManager.setSoundEffectsVolume(volume / 100);
                    savePreferenceValue(SOUND_VOLUME_PREFERENCE_NAME, volume.toString());
                    
                    // Update icon based on volume level (only if sound is enabled)
                    if (audioManager.isSoundEffectsEnabled()) {
                        actionIconManager.changeIcon(
                            knob,
                            getVolumeIcon(true, volume)
                        );
                    }
                });
            }
        }
    }

    // Set up settings pane toggling
    settingsButton?.addEventListener('click', () => {
        toggleSettings(true);
        audioManager.playSoundEffect(SoundEffect.Click);
    });

    // Set up game difficulty based on current setting
    if (!selectableDifficulties.includes(currDifficulty)) {
        currDifficulty =
            selectableDifficulties.length > 0 ? selectableDifficulties[0] : DIFFICULTY_EASY;
    }
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
        setGameState,
    };
}
