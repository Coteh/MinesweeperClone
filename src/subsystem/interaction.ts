import MobileDetect from 'mobile-detect';
import { GameState } from '../game';
import { FullscreenManager } from '../manager/fullscreen';
import { TransformManager } from '../manager/transform';
import { getPreferenceValue } from '../preferences';
import { FrontendState } from '..';
import { toggleQuestionMode } from '../inputMode';
import { DEBUG_HUD_ENABLED_PREFERENCE_NAME, SETTING_ENABLED } from '../consts';
import { AudioManager, SoundEffect } from '../manager/audio';

const DIRECTION_LEFT = 'left';
const DIRECTION_RIGHT = 'right';
const DIRECTION_UP = 'up';
const DIRECTION_DOWN = 'down';

export type InteractionSubsystem = Record<string, never>;

export function setupInteractionSubsystem(
    transformManager: TransformManager,
    fullscreenManager: FullscreenManager,
    audioManager: AudioManager,
    gameState: GameState,
    promptNewGame: (onNewGameStarted?: () => void) => void,
    toggleSettings: (enabled: boolean) => void,
    toggleDebugHud: (isVisible: boolean) => void,
    closeDialog: (dialog: HTMLDialogElement, overlayBackElem: HTMLElement) => void,
    frontendState: FrontendState,
): InteractionSubsystem {
    const zoomInButton = document.querySelector('#zoom-in') as HTMLElement;
    const zoomOutButton = document.querySelector('#zoom-out') as HTMLElement;

    const settingsPane = document.querySelector('.settings.pane') as HTMLElement;
    const debugOverlay = document.querySelector('#debug-overlay') as HTMLDivElement;
    const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;

    const md = new MobileDetect(window.navigator.userAgent);
    const isMobile = md.mobile() !== null;

    const directionsPressed = {
        [DIRECTION_LEFT]: false,
        [DIRECTION_RIGHT]: false,
        [DIRECTION_UP]: false,
        [DIRECTION_DOWN]: false,
    };

    const handleKeyInput = (key: string) => {
        console.log(key);
        const dialog = document.querySelector('.dialog') as HTMLDialogElement;
        if (dialog) {
            if (key === 'escape') {
                // Do not allow player to close the dialog if they're presented with a prompt dialog asking for Yes/No
                if (frontendState.isPrompted) {
                    return;
                }
                return closeDialog(dialog, overlayBackElem);
            }
        }
        if (dialog) {
            return;
        }
        if (key === 'r') {
            promptNewGame(() => {
                if (settingsPane.style.display !== 'none') {
                    toggleSettings(false);
                }
            });
            return;
        }
        if (key === 'f' && !isMobile) {
            fullscreenManager.toggleFullscreen();
            const knob = document.querySelector('.setting.fullscreen .knob') as HTMLElement;
            if (fullscreenManager.isFullscreenEnabled()) {
                knob.classList.add('enabled');
            } else {
                knob.classList.remove('enabled');
            }
            return;
        }
        if (gameState.ended) {
            return;
        }
        switch (key) {
            case 'arrowleft':
                console.log('going left');
                directionsPressed[DIRECTION_LEFT] = true;
                break;
            case 'arrowright':
                console.log('going right');
                directionsPressed[DIRECTION_RIGHT] = true;
                break;
            case 'arrowdown':
                console.log('going down');
                directionsPressed[DIRECTION_DOWN] = true;
                break;
            case 'arrowup':
                console.log('going up');
                directionsPressed[DIRECTION_UP] = true;
                break;
            case 'd': {
                // Only toggle the debug HUD if debug HUD is enabled
                const isDebugHudEnabled =
                    getPreferenceValue(DEBUG_HUD_ENABLED_PREFERENCE_NAME) === SETTING_ENABLED;
                if (isDebugHudEnabled) {
                    toggleDebugHud(debugOverlay.style.display !== 'none');
                }
                break;
            }
        }
    };

    const handleKeyUp = (key: string) => {
        switch (key) {
            case 'arrowleft':
                console.log('releasing left');
                directionsPressed[DIRECTION_LEFT] = false;
                break;
            case 'arrowright':
                console.log('releasing right');
                directionsPressed[DIRECTION_RIGHT] = false;
                break;
            case 'arrowdown':
                console.log('releasing down');
                directionsPressed[DIRECTION_DOWN] = false;
                break;
            case 'arrowup':
                console.log('releasing up');
                directionsPressed[DIRECTION_UP] = false;
                break;
        }
    };

    window.addEventListener('keydown', (e) => {
        handleKeyInput(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
        handleKeyUp(e.key.toLowerCase());
    });

    transformManager.addEventListener('zoom-in', () => {
        zoomOutButton.classList.remove('disabled');
    });
    transformManager.addEventListener('zoom-out', () => {
        zoomInButton.classList.remove('disabled');
    });
    transformManager.addEventListener('zoom-in-max', () => {
        zoomInButton.classList.add('disabled');
    });
    transformManager.addEventListener('zoom-out-max', () => {
        zoomOutButton.classList.add('disabled');
    });

    zoomInButton.addEventListener('click', (e) => {
        e.preventDefault();
        const wasDisabled = zoomInButton.classList.contains('disabled');
        transformManager.zoomIn();
        if (!wasDisabled) {
            audioManager.playSoundEffect(SoundEffect.ZoomIn);
        }
    });
    zoomOutButton.addEventListener('click', (e) => {
        e.preventDefault();
        const wasDisabled = zoomOutButton.classList.contains('disabled');
        transformManager.zoomOut();
        if (!wasDisabled) {
            audioManager.playSoundEffect(SoundEffect.ZoomOut);
        }
    });
    (document.querySelector('#zoom-reset') as HTMLElement).addEventListener('click', (e) => {
        e.preventDefault();
        transformManager.resetZoom(false);
        audioManager.playSoundEffect(SoundEffect.ZoomReset);
    });

    // Question mark input mode toggle
    const questionModeButton = document.querySelector('#question-mode') as HTMLElement;
    if (questionModeButton) {
        questionModeButton.addEventListener('click', (e) => {
            e.preventDefault();
            const enabled = toggleQuestionMode();
            if (enabled) {
                questionModeButton.classList.add('enabled');
            } else {
                questionModeButton.classList.remove('enabled');
            }
            audioManager.playSoundEffect(SoundEffect.Click);
        });
    }

    const zoomable = document.getElementById('zoomable') as HTMLElement;
    let startDistance = 0;
    let startMidpoint = { x: 0, y: 0 };

    function getDistance(touches: TouchList) {
        const [touch1, touch2] = touches;
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getMidpoint(touches: TouchList) {
        const [touch1, touch2] = touches;
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
        };
    }

    let isPinching = false;
    let isMoving = false;
    let momentumFrame: number | null = null;
    let lastMoveTime = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let startTouchX = 0;
    let startTouchY = 0;
    let touchVelocityX = 0;
    let touchVelocityY = 0;
    const touchFriction = 0.75;

    zoomable.addEventListener(
        'touchstart',
        (event) => {
            console.log('touch start on zoomable', event.touches);
            if (event.touches.length === 2) {
                if (momentumFrame !== null) {
                    cancelAnimationFrame(momentumFrame);
                    momentumFrame = null;
                }
                isMoving = false;
                startDistance = getDistance(event.touches);
                startMidpoint = getMidpoint(event.touches);
                event.preventDefault();
                event.stopPropagation();
                console.log('stopping propagation');
                // TODO: Prevent taps from being sent to the mine blocks if pinching to zoom
                // event.stopImmediatePropagation();
                isPinching = true;
                (document.querySelector('#pinch') as HTMLSpanElement).innerText =
                    isPinching.toString();
                return;
            } else if (event.touches.length === 1) {
                if (momentumFrame !== null) {
                    cancelAnimationFrame(momentumFrame);
                    momentumFrame = null;
                }
                isMoving = true;
                lastTouchX = event.touches[0].clientX;
                lastTouchY = event.touches[0].clientY;
                startTouchX = lastTouchX;
                startTouchY = lastTouchY;
                lastMoveTime = Date.now();
            }
            // event.stopPropagation();
        },
        true,
    );

    zoomable.addEventListener(
        'touchmove',
        (event) => {
            if (event.touches.length === 2) {
                const currentDistance = getDistance(event.touches);
                const currentMidpoint = getMidpoint(event.touches);

                // Guard against a touchmove arriving without a prior two-finger touchstart
                // (startDistance would be 0, producing an Infinity ratio).
                if (startDistance <= 0) {
                    startDistance = currentDistance;
                    startMidpoint = currentMidpoint;
                }

                // Zoom toward the pinch midpoint and pan with midpoint movement
                transformManager.zoomAtPoint(
                    currentMidpoint.x,
                    currentMidpoint.y,
                    startMidpoint.x,
                    startMidpoint.y,
                    currentDistance / startDistance,
                );

                // Update start values for next frame
                startDistance = currentDistance;
                startMidpoint = currentMidpoint;
                event.preventDefault();
                // event.stopImmediatePropagation();
            } else if (!isPinching && event.touches.length === 1) {
                // Translation based on touch pos

                const touch = event.touches[0];
                const now = Date.now();
                const deltaTime = now - lastMoveTime;

                if (deltaTime > 0) {
                    touchVelocityX = (touch.clientX - lastTouchX) / deltaTime;
                    touchVelocityY = (touch.clientY - lastTouchY) / deltaTime;
                }

                const newBoardTransform = transformManager.boardTransform;
                newBoardTransform.x += touch.clientX - lastTouchX;
                newBoardTransform.y += touch.clientY - lastTouchY;
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
                lastMoveTime = now;

                // Apply translation
                transformManager.boardTransform = newBoardTransform;
                transformManager.adjustBoardTransform(false);
            }
        },
        true,
    );

    zoomable.addEventListener(
        'touchend',
        (event) => {
            // TODO: Properly handle stopping propagation of touch event to mine blocks if pinching to zoom
            console.log('touchend on zoomable', event.touches);
            if (isPinching) {
                event.stopPropagation();
                event.preventDefault();

                if (event.touches.length === 0) {
                    isPinching = false;
                    isMoving = false;
                    console.log('pinch ended');
                    (document.querySelector('#pinch') as HTMLSpanElement).innerText =
                        isPinching.toString();
                    startDistance = 0;
                }
                return;
            }
            console.log('isMoving', isMoving);
            if (isMoving) {
                const momentum = () => {
                    if (!isMoving) {
                        momentumFrame = null;
                        return;
                    }

                    touchVelocityX *= touchFriction;
                    touchVelocityY *= touchFriction;
                    const newBoardTransform = transformManager.boardTransform;
                    newBoardTransform.x += touchVelocityX * 20;
                    newBoardTransform.y += touchVelocityY * 20;

                    console.log(newBoardTransform.x, ',', newBoardTransform.y);

                    transformManager.boardTransform = newBoardTransform;
                    transformManager.adjustBoardTransform(false);

                    if (Math.abs(touchVelocityX) > 0.01 || Math.abs(touchVelocityY) > 0.01) {
                        momentumFrame = requestAnimationFrame(momentum);
                    } else {
                        isMoving = false;
                        momentumFrame = null;
                    }
                };

                momentum();
                console.log('touches', event.touches, event.changedTouches);
                const changedTouch = event.changedTouches[0];
                const touchDiffX = changedTouch.clientX - startTouchX;
                const touchDiffY = changedTouch.clientY - startTouchY;
                console.log(
                    'movement?',
                    Math.sqrt(touchDiffX * touchDiffX + touchDiffY * touchDiffY),
                );
                if (Math.sqrt(touchDiffX * touchDiffX + touchDiffY * touchDiffY) > 1) {
                    event.stopPropagation();
                }
            }
        },
        true,
    );

    function update() {
        if (directionsPressed[DIRECTION_LEFT]) {
            transformManager.boardTransform.x += 10;
        }
        if (directionsPressed[DIRECTION_RIGHT]) {
            transformManager.boardTransform.x -= 10;
        }
        if (directionsPressed[DIRECTION_UP]) {
            transformManager.boardTransform.y += 10;
        }
        if (directionsPressed[DIRECTION_DOWN]) {
            transformManager.boardTransform.y -= 10;
        }

        transformManager.adjustBoardTransform(false);

        requestAnimationFrame(update);
    }

    update();

    return {};
}
