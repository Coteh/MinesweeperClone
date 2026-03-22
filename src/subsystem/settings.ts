import MobileDetect from 'mobile-detect';
import { getPreferenceValue, initPreferences, savePreferenceValue } from '../preferences';
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
    SOUND_SETTING_NAME,
    SOUND_PREFERENCE_NAME,
    SOUND_VOLUME_PREFERENCE_NAME,
    CUSTOM_DIFFICULTIES_PREFERENCE_NAME,
    THEME_SETTING_NAME,
    DIFFICULTY_CUSTOM,
} from '../consts';
import { BackgroundManager } from '../manager/background';
import { AudioManager, SoundEffect } from '../manager/audio';
import { Theme, ThemeManager } from '../manager/theme';
import { ActionIconManager } from '../manager/action-icon';
import type { DebugSubsystem } from './debug';

export type SwitchDifficultyOptions = {
    startNewGame: boolean;
};

export type SettingsSubsystem = {
    toggleSettings: (enabled: boolean) => void;
    setGameState: (gameState: GameState) => void;
    setDebugSubsystem: (debugSubsystem: DebugSubsystem) => void;
};

import type { Config } from '../config';
import { createDialogContentFromTemplate } from '../util';
import { ComponentMap } from '../components';

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
    { renderDialog, renderPromptDialog }: ComponentMap,
    closeDialog: (dialog: HTMLDialogElement, overlayBackElem: HTMLElement) => void,
    onThemeSwitch?: (theme: string) => void,
): SettingsSubsystem {
    let gameState: GameState;
    let _debugSubsystem: DebugSubsystem | null = null;

    const setGameState = (_gameState: GameState) => {
        gameState = _gameState;
    };

    const setDebugSubsystem = (debugSubsystem: DebugSubsystem) => {
        _debugSubsystem = debugSubsystem;
    };

    const selectableDifficulties = Object.keys(gameConfig.difficulty);

    // Get elements for settings
    const settingsButton = document.querySelector('.settings-link') as HTMLElement;

    // Initialize settings based on stored preferences
    initPreferences(gameStorage, {
        [SOUND_PREFERENCE_NAME]: SETTING_ENABLED,
        [SOUND_VOLUME_PREFERENCE_NAME]: '100',
    });

    // Apply stored audio preferences on page load
    const soundsEnabled = getPreferenceValue<string>(SOUND_PREFERENCE_NAME);
    audioManager.toggleSoundEffects(soundsEnabled === SETTING_ENABLED);

    const storedVolume = parseInt(getPreferenceValue(SOUND_VOLUME_PREFERENCE_NAME) || '100', 10);
    audioManager.setSoundEffectsVolume(storedVolume / 100);

    // Get stored difficulty or default to easy
    let currDifficulty = getPreferenceValue<string>(DIFFICULTY_PREFERENCE_NAME) || DIFFICULTY_EASY;

    type CustomDifficultyConfig = {
        id: string;
        name: string;
        width: number;
        height: number;
        mines: number;
    };

    function getCustomDifficulties(): CustomDifficultyConfig[] {
        const stored = getPreferenceValue<string>(CUSTOM_DIFFICULTIES_PREFERENCE_NAME);
        if (!stored) return [];
        try {
            return JSON.parse(stored) as CustomDifficultyConfig[];
        } catch {
            return [];
        }
    }

    function saveCustomDifficulties(diffs: CustomDifficultyConfig[]) {
        savePreferenceValue(CUSTOM_DIFFICULTIES_PREFERENCE_NAME, JSON.stringify(diffs));
    }

    function generateCustomDifficultyName(width: number, height: number, mines: number): string {
        return `${width}x${height}x${mines}`;
    }

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
            const customDiff = getCustomDifficulties().find((d) => d.id === difficulty);
            if (customDiff) {
                frontendState.gameOptions.boardWidth = customDiff.width;
                frontendState.gameOptions.boardHeight = customDiff.height;
                frontendState.gameOptions.numberOfMines = customDiff.mines;
                frontendState.gameOptions.difficultyKey = difficulty;
                transformManager.setBounds(
                    computeCustomBounds(customDiff.width, customDiff.height),
                );
            } else {
                // fallback to previous hardcoded defaults for safety
                frontendState.gameOptions.boardWidth = 9;
                frontendState.gameOptions.boardHeight = 9;
                frontendState.gameOptions.numberOfMines = 10;
                frontendState.gameOptions.difficultyKey = 'easy';
                transformManager.setBounds(null);
            }
        }
        if (options.startNewGame) {
            newGame(frontendState.gameOptions);
        }
        currDifficulty = difficulty;
    }

    function computeCustomBounds(width: number, height: number) {
        const maxX = Math.max(200, width * 23);
        const maxY = Math.max(200, height * 19);
        return { minX: -maxX, minY: -maxY, maxX, maxY };
    }

    function openCustomDifficultyDialog() {
        const dialogElem = createDialogContentFromTemplate('#custom-difficulty-dialog-content');

        const listContainer = dialogElem.querySelector('#custom-difficulty-list') as HTMLElement;
        const widthSlider = dialogElem.querySelector('#custom-width-slider') as HTMLInputElement;
        const heightSlider = dialogElem.querySelector('#custom-height-slider') as HTMLInputElement;
        const minesSlider = dialogElem.querySelector('#custom-mines-slider') as HTMLInputElement;
        const widthValue = dialogElem.querySelector('#custom-width-value') as HTMLElement;
        const heightValue = dialogElem.querySelector('#custom-height-value') as HTMLElement;
        const minesValue = dialogElem.querySelector('#custom-mines-value') as HTMLElement;
        const minesMaxLabel = dialogElem.querySelector('#custom-mines-max-label') as HTMLElement;
        const densityDisplay = dialogElem.querySelector('#custom-density-display') as HTMLElement;

        let selectedId: string | null = null;
        let pendingEntry: { id: string; name: string } | null = null;

        const updateMinesMax = (width: number, height: number) => {
            // TODO: Remove the 50% density cap once the board generation hang is fixed
            // (generation can loop indefinitely at very high densities)
            const maxMines = Math.floor(width * height * 0.5);
            minesSlider.max = String(maxMines);
            minesMaxLabel.innerText = `Max: ${maxMines}`;
            if (parseInt(minesSlider.value, 10) > maxMines) {
                minesSlider.value = String(maxMines);
                minesValue.innerText = String(maxMines);
            }
        };

        const updateDensity = (width: number, height: number, mines: number) => {
            const density = (mines / (width * height)) * 100;
            densityDisplay.innerText = `Density: ${density.toFixed(1)}%`;
        };

        const setSliders = (width: number, height: number, mines: number) => {
            widthSlider.value = String(width);
            heightSlider.value = String(height);
            widthValue.innerText = String(width);
            heightValue.innerText = String(height);
            updateMinesMax(width, height);
            const clampedMines = Math.min(mines, Math.floor(width * height * 0.5));
            minesSlider.value = String(clampedMines);
            minesValue.innerText = String(clampedMines);
            updateDensity(width, height, clampedMines);
        };

        const renderList = () => {
            const diffs = getCustomDifficulties();
            listContainer.innerHTML = '';

            if (diffs.length === 0 && !pendingEntry) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'custom-difficulty-empty';
                emptyMsg.innerText = 'No saved configurations yet.';
                listContainer.appendChild(emptyMsg);
                return;
            }

            if (pendingEntry) {
                const pending = pendingEntry;
                const item = document.createElement('div');
                item.className = 'custom-difficulty-list-item';
                if (selectedId === pending.id) item.classList.add('selected');

                const mainArea = document.createElement('div');
                mainArea.className = 'custom-difficulty-list-item-main';

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'custom-difficulty-list-item-name-input';
                nameInput.value = pending.name;
                nameInput.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (selectedId !== pending.id) {
                        selectedId = pending.id;
                        setSliders(16, 16, 40);
                        listContainer
                            .querySelectorAll('.custom-difficulty-list-item')
                            .forEach((el) => el.classList.remove('selected'));
                        item.classList.add('selected');
                    }
                });
                nameInput.addEventListener('blur', () => {
                    const newName = nameInput.value.trim();
                    pending.name = newName || 'New Difficulty';
                    nameInput.value = pending.name;
                });

                const specEl = document.createElement('div');
                specEl.className = 'custom-difficulty-list-item-spec';
                specEl.innerText = 'Unsaved';

                mainArea.appendChild(nameInput);
                mainArea.appendChild(specEl);
                mainArea.addEventListener('click', () => {
                    selectedId = pending.id;
                    setSliders(16, 16, 40);
                    renderList();
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'custom-difficulty-delete-btn';
                deleteBtn.innerText = '✕';
                deleteBtn.title = 'Delete';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    pendingEntry = null;
                    if (selectedId === pending.id) selectedId = null;
                    renderList();
                });

                item.appendChild(mainArea);
                item.appendChild(deleteBtn);
                listContainer.appendChild(item);
            }

            diffs.forEach((diff) => {
                const item = document.createElement('div');
                item.className = 'custom-difficulty-list-item';
                if (diff.id === selectedId) item.classList.add('selected');

                const mainArea = document.createElement('div');
                mainArea.className = 'custom-difficulty-list-item-main';

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'custom-difficulty-list-item-name-input';
                nameInput.value = diff.name;
                nameInput.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Select item without full re-render so focus isn't lost
                    if (selectedId !== diff.id) {
                        selectedId = diff.id;
                        setSliders(diff.width, diff.height, diff.mines);
                        listContainer
                            .querySelectorAll('.custom-difficulty-list-item')
                            .forEach((el) => el.classList.remove('selected'));
                        item.classList.add('selected');
                    }
                });
                nameInput.addEventListener('blur', () => {
                    const newName = nameInput.value.trim();
                    if (!newName) {
                        nameInput.value = diff.name;
                        return;
                    }
                    const diffs = getCustomDifficulties();
                    const idx = diffs.findIndex((d) => d.id === diff.id);
                    if (idx >= 0 && diffs[idx].name !== newName) {
                        diffs[idx] = { ...diffs[idx], name: newName };
                        saveCustomDifficulties(diffs);
                    }
                });

                const specEl = document.createElement('div');
                specEl.className = 'custom-difficulty-list-item-spec';
                specEl.innerText = `${diff.width}x${diff.height}, ${diff.mines} mines`;

                mainArea.appendChild(nameInput);
                mainArea.appendChild(specEl);
                mainArea.addEventListener('click', () => {
                    selectedId = diff.id;
                    setSliders(diff.width, diff.height, diff.mines);
                    renderList();
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'custom-difficulty-delete-btn';
                deleteBtn.innerText = '✕';
                deleteBtn.title = 'Delete';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const updated = getCustomDifficulties().filter((d) => d.id !== diff.id);
                    saveCustomDifficulties(updated);
                    if (selectedId === diff.id) selectedId = null;
                    renderList();
                });

                item.appendChild(mainArea);
                item.appendChild(deleteBtn);
                listContainer.appendChild(item);
            });
        };

        // Pre-select the active custom difficulty if one is being played
        const activeDiff = getCustomDifficulties().find((d) => d.id === currDifficulty);
        if (activeDiff) {
            selectedId = activeDiff.id;
            setSliders(activeDiff.width, activeDiff.height, activeDiff.mines);
        } else {
            setSliders(16, 16, 40);
        }
        renderList();

        const addBtn = dialogElem.querySelector('.custom-difficulty-add-btn') as HTMLElement;
        addBtn.addEventListener('click', () => {
            pendingEntry = { id: 'pending-' + Date.now(), name: 'New Difficulty' };
            selectedId = pendingEntry.id;
            setSliders(16, 16, 40);
            renderList();
            const nameInput = listContainer.querySelector(
                '.custom-difficulty-list-item.selected .custom-difficulty-list-item-name-input',
            ) as HTMLInputElement | null;
            nameInput?.focus();
            nameInput?.select();
        });

        widthSlider.addEventListener('input', () => {
            const w = parseInt(widthSlider.value, 10);
            const h = parseInt(heightSlider.value, 10);
            widthValue.innerText = String(w);
            updateMinesMax(w, h);
            updateDensity(w, h, parseInt(minesSlider.value, 10));
        });

        heightSlider.addEventListener('input', () => {
            const w = parseInt(widthSlider.value, 10);
            const h = parseInt(heightSlider.value, 10);
            heightValue.innerText = String(h);
            updateMinesMax(w, h);
            updateDensity(w, h, parseInt(minesSlider.value, 10));
        });

        minesSlider.addEventListener('input', () => {
            const mines = parseInt(minesSlider.value, 10);
            minesValue.innerText = String(mines);
            updateDensity(parseInt(widthSlider.value, 10), parseInt(heightSlider.value, 10), mines);
        });

        const startBtn = dialogElem.querySelector('.custom-difficulty-start') as HTMLElement;
        const cancelBtn = dialogElem.querySelector('.custom-difficulty-cancel') as HTMLElement;

        startBtn.addEventListener('click', () => {
            const w = parseInt(widthSlider.value, 10);
            const h = parseInt(heightSlider.value, 10);
            const mines = parseInt(minesSlider.value, 10);

            const diffs = getCustomDifficulties();
            let configId: string;

            if (selectedId && selectedId === pendingEntry?.id) {
                // Saving the pending new entry — use the custom name if set, otherwise auto-generate
                configId = Date.now().toString();
                const name =
                    pendingEntry.name !== 'New Difficulty'
                        ? pendingEntry.name
                        : generateCustomDifficultyName(w, h, mines);
                diffs.push({ id: configId, name, width: w, height: h, mines });
                saveCustomDifficulties(diffs);
                pendingEntry = null;
            } else if (selectedId) {
                const idx = diffs.findIndex((d) => d.id === selectedId);
                if (idx >= 0) {
                    diffs[idx] = { ...diffs[idx], width: w, height: h, mines };
                    saveCustomDifficulties(diffs);
                    configId = selectedId;
                } else {
                    configId = Date.now().toString();
                    diffs.push({
                        id: configId,
                        name: generateCustomDifficultyName(w, h, mines),
                        width: w,
                        height: h,
                        mines,
                    });
                    saveCustomDifficulties(diffs);
                }
            } else {
                configId = Date.now().toString();
                diffs.push({
                    id: configId,
                    name: generateCustomDifficultyName(w, h, mines),
                    width: w,
                    height: h,
                    mines,
                });
                saveCustomDifficulties(diffs);
            }

            frontendState.gameOptions.boardWidth = w;
            frontendState.gameOptions.boardHeight = h;
            frontendState.gameOptions.numberOfMines = mines;
            frontendState.gameOptions.difficultyKey = configId;
            transformManager.setBounds(computeCustomBounds(w, h));
            savePreferenceValue(DIFFICULTY_PREFERENCE_NAME, configId);
            currDifficulty = configId;
            newGame(frontendState.gameOptions);

            audioManager.playSoundEffect(SoundEffect.Click);
            const dialog = document.querySelector('.dialog') as HTMLDialogElement;
            const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;
            closeDialog(dialog, overlayBackElem);
        });

        cancelBtn.addEventListener('click', () => {
            pendingEntry = null;
            audioManager.playSoundEffect(SoundEffect.Click);
            const dialog = document.querySelector('.dialog') as HTMLDialogElement;
            const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;
            closeDialog(dialog, overlayBackElem);
        });

        renderDialog({
            content: dialogElem,
            fadeIn: true,
            effect: 'pop',
            style: {
                width: '85%',
                maxWidth: '440px',
            },
        });
    }

    function promptFullscreen() {
        const dialogElem = createDialogContentFromTemplate('#prompt-dialog-content');
        (dialogElem.querySelector('.prompt-text') as HTMLSpanElement).innerText =
            'Fullscreen mode was previously enabled. Do you want to re-enter fullscreen mode?';
        renderPromptDialog({
            content: dialogElem,
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
                '#settings-dialog-content',
            );
            renderDialog({
                content: settingsTemplateElem,
                fadeIn: true,
                effect: 'pop',
                style: {
                    width: '75%',
                    height: '75%',
                    maxWidth: '600px',
                },
            });

            const settingsDialogContent = document.querySelector(
                '.dialog-content > .settings',
            ) as HTMLElement;

            const versionElem = settingsDialogContent.querySelector(
                '.version-number',
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
                '#changelog-link',
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
                    const changelogElem = dialogElem.querySelector(
                        '#changelog-text',
                    ) as HTMLElement;
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
                    renderDialog({
                        content: dialogElem,
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

            // Set up credits button
            const creditsButton = settingsDialogContent.querySelector(
                '.credits-link',
            ) as HTMLElement;
            if (creditsButton) {
                creditsButton.addEventListener('click', () => {
                    audioManager.playSoundEffect(SoundEffect.Click);
                    const creditsElem = createDialogContentFromTemplate('#credits-dialog-content');
                    renderDialog({
                        content: creditsElem,
                        fadeIn: true,
                        effect: 'pop',
                        style: {
                            width: '75%',
                            height: '60vh',
                            maxWidth: '500px',
                        },
                    });
                });
            }

            // Set up debug button (if debug subsystem is available)
            if (_debugSubsystem) {
                _debugSubsystem.setupDebugButton();
            }

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
            if (volume === 0) return 'volume';
            if (volume <= 33) return 'volume-1';
            return 'volume-2';
        };

        // Helper function to enable/disable transitions on all knobs
        const setKnobTransitions = (enabled: boolean) => {
            const allKnobs = document.querySelectorAll('.knob');
            allKnobs.forEach((knob) => {
                (knob as HTMLElement).style.transition = enabled ? '' : 'none';
                const knobInside = knob.querySelector('.knob-inside') as HTMLElement;
                if (knobInside) {
                    knobInside.style.transition = enabled ? '' : 'none';
                }
            });
        };

        // Disable transitions on all knobs during initialization
        // This prevents animation when the dialog opens with settings already enabled
        setKnobTransitions(false);

        // Initialize the difficulty UI element
        const difficultySelector = document.getElementById(
            'difficulty-selector',
        ) as HTMLSelectElement;
        // Populate options: presets, saved custom configs, then "Custom..." trigger
        difficultySelector.innerHTML = '';
        selectableDifficulties.forEach((key) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.innerText = gameConfig.difficulty[key].displayName || key;
            difficultySelector.appendChild(opt);
        });
        getCustomDifficulties().forEach((cd) => {
            const opt = document.createElement('option');
            opt.value = cd.id;
            opt.innerText = cd.name;
            difficultySelector.appendChild(opt);
        });
        const customOpt = document.createElement('option');
        customOpt.value = DIFFICULTY_CUSTOM;
        customOpt.innerText = 'Custom...';
        difficultySelector.appendChild(customOpt);

        difficultySelector.addEventListener('change', (e) => {
            const difficultyValue = (e.target as HTMLSelectElement).value;
            if (difficultyValue === DIFFICULTY_CUSTOM) {
                // Revert selector to active difficulty, then open dialog
                const prevIdx = [...difficultySelector.options].findIndex(
                    (o) => o.value === currDifficulty,
                );
                difficultySelector.selectedIndex = prevIdx >= 0 ? prevIdx : 0;
                openCustomDifficultyDialog();
            } else {
                switchDifficulty(difficultyValue, { startNewGame: true });
                savePreferenceValue(DIFFICULTY_PREFERENCE_NAME, difficultyValue);
            }
        });

        // Set selected index by matching value
        const allOptions = [...difficultySelector.options];
        const selectedIdx = allOptions.findIndex((o) => o.value === currDifficulty);
        if (selectedIdx >= 0) {
            difficultySelector.selectedIndex = selectedIdx;
        } else {
            difficultySelector.selectedIndex = 0;
            currDifficulty = selectableDifficulties[0];
        }

        // Set initial state for settings knobs BEFORE setting up event listeners
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

        const soundEffectsSettingElem = document.querySelector(`.setting.${SOUND_SETTING_NAME}`);
        if (soundEffectsSettingElem) {
            const soundsEnabled = getPreferenceValue(SOUND_PREFERENCE_NAME);

            // Get stored volume or default to 100
            const storedVolume = parseInt(
                getPreferenceValue(SOUND_VOLUME_PREFERENCE_NAME) || '100',
                10,
            );

            const knob = soundEffectsSettingElem.querySelector('.knob') as HTMLElement;

            actionIconManager.changeIcon(
                knob,
                getVolumeIcon(audioManager.isSoundEffectsEnabled(), storedVolume),
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

                    // Auto-enable sound effects when adjusting volume while muted
                    if (!audioManager.isSoundEffectsEnabled() && volume > 0) {
                        audioManager.toggleSoundEffects(true);
                        savePreferenceValue(SOUND_PREFERENCE_NAME, SETTING_ENABLED);
                        knob.classList.add('enabled');
                    }

                    // Update icon based on volume level (only if sound is enabled)
                    if (audioManager.isSoundEffectsEnabled()) {
                        actionIconManager.changeIcon(knob, getVolumeIcon(true, volume));
                    }
                });

                // Play click sound when releasing slider
                // The 'change' event fires on both mouse and touch interactions when the value changes
                volumeSlider.addEventListener('change', () => {
                    if (audioManager.isSoundEffectsEnabled()) {
                        audioManager.playSoundEffect(SoundEffect.Click);
                    }
                });
            }
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
                        !canHighlight ? SETTING_ENABLED : SETTING_DISABLED,
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
                        audioManager.isSoundEffectsEnabled() ? SETTING_ENABLED : SETTING_DISABLED,
                    );
                    const knob = setting.querySelector('.knob') as HTMLElement;
                    if (audioManager.isSoundEffectsEnabled()) {
                        knob.classList.add('enabled');
                    } else {
                        knob.classList.remove('enabled');
                    }

                    // Get current volume for icon selection
                    const volumeSlider = document.getElementById(
                        'volume-slider',
                    ) as HTMLInputElement;
                    const currentVolume = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;

                    actionIconManager.changeIcon(
                        knob,
                        getVolumeIcon(audioManager.isSoundEffectsEnabled(), currentVolume),
                    );
                }
            });
        });

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
            onThemeSwitch?.(themeValue);
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
                    'difficulty-selector',
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
                    'theme-selector',
                ) as HTMLSelectElement;
                if (themeSelector) {
                    themeSelector.focus();
                    themeSelector.showPicker();
                }
            });

        // Re-enable transitions after initial state is set
        // Use requestAnimationFrame to ensure DOM has settled
        requestAnimationFrame(() => {
            setKnobTransitions(true);
        });
    }

    // Set up settings pane toggling
    settingsButton?.addEventListener('click', () => {
        toggleSettings(true);
        audioManager.playSoundEffect(SoundEffect.Click);
    });

    // Set up game difficulty based on current setting.
    // switchDifficulty handles presets, saved custom configs, and falls back to easy.
    if (
        !selectableDifficulties.includes(currDifficulty) &&
        currDifficulty !== DIFFICULTY_CUSTOM &&
        !getCustomDifficulties().some((d) => d.id === currDifficulty)
    ) {
        currDifficulty =
            selectableDifficulties.length > 0 ? selectableDifficulties[0] : DIFFICULTY_EASY;
    }
    if (currDifficulty !== DIFFICULTY_CUSTOM) {
        switchDifficulty(currDifficulty, { startNewGame: false });
    }

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
        setDebugSubsystem,
    };
}
