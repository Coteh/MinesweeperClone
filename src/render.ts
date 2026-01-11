import feather from 'feather-icons';
import { GameState, selectSpot, flagSpot, selectAdjacentSpots, questionMarkSpot } from './game';
import { getQuestionMode } from './inputMode';
import type * as CSS from 'csstype';
import { isAwaitingDoubleTapGesture, registerTileAction, unregisterTileAction } from './doubleTapState';
import { TILE_ACTION_DELAY_MS } from './doubleTapConsts';

import { AssetManager } from './manager/asset';

// Helper function to get adjacent non-revealed, non-flagged tile elements
const getAdjacentTileElements = (
    x: number,
    y: number,
    gameState: GameState,
    parentElem: HTMLElement
): HTMLElement[] => {
    const adjacentElements: HTMLElement[] = [];
    const board = gameState.board;
    const width = gameState.gameOptions.boardWidth;
    const height = gameState.gameOptions.boardHeight;

    const positions = [
        [x - 1, y - 1],
        [x, y - 1],
        [x + 1, y - 1],
        [x - 1, y],
        [x + 1, y],
        [x - 1, y + 1],
        [x, y + 1],
        [x + 1, y + 1],
    ];

    positions.forEach(([adjX, adjY]) => {
        if (adjX >= 0 && adjX < width && adjY >= 0 && adjY < height) {
            const block = board[adjY][adjX];
            if (!block.isRevealed && !block.isFlagged) {
                // Find the corresponding DOM element
                const rows = parentElem.querySelectorAll('.row');
                const row = rows[adjY];
                if (row) {
                    const boxes = row.querySelectorAll('.box');
                    const elem = boxes[adjX] as HTMLElement;
                    if (elem) {
                        adjacentElements.push(elem);
                    }
                }
            }
        }
    });

    return adjacentElements;
};

// Helper to get the appropriate smiley face based on game state
const getSmileyFace = (gameState: GameState): string => {
    if (gameState.ended) {
        return gameState.won ? 'img/Smiley_proud.png' : 'img/Smiley_sad.png';
    }
    return 'img/Smiley.png';
};

// Helper to clear preview classes from all tiles
const clearAllPreviews = () => {
    document.querySelectorAll('.box.preview').forEach((elem) => {
        elem.classList.remove('preview');
    });
};

export const renderBoard = (
    parentElem: HTMLElement,
    gameState: GameState,
    assetManager: AssetManager
) => {
    parentElem.innerHTML = '';
    // console.log('rendering', gameState.board.length);
    for (let i = 0; i < gameState.board.length; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        // console.log('rendering', gameState.board[i], gameState.board[i].length);
        for (let j = 0; j < gameState.board[i].length; j++) {
            const elem = document.createElement('div');
            elem.classList.add('box');
            if (gameState.board[i][j].isRevealed) {
                if (gameState.board[i][j].isFlagged) {
                    if (!gameState.ended || gameState.board[i][j].isMine) {
                        const flagImg = document.createElement('img');
                        const pre = assetManager.getImage('img/Flag.png');
                        flagImg.src = pre ? pre.src : 'img/Flag.png';
                        flagImg.dataset.asset = 'img/Flag.png';
                        elem.appendChild(flagImg);
                    } else {
                        elem.classList.add('incorrect');
                        const mineImg = document.createElement('img');
                        const pre = assetManager.getImage('img/Mine.png');
                        mineImg.src = pre ? pre.src : 'img/Mine.png';
                        mineImg.dataset.asset = 'img/Mine.png';
                        elem.appendChild(mineImg);
                    }
                } else {
                    elem.classList.add('revealed');
                    if (gameState.board[i][j].isMine) {
                        const mineImg = document.createElement('img');
                        const pre = assetManager.getImage('img/Mine.png');
                        mineImg.src = pre ? pre.src : 'img/Mine.png';
                        mineImg.dataset.asset = 'img/Mine.png';
                        elem.appendChild(mineImg);
                        if (gameState.board[i][j].isLosingSpot) {
                            elem.classList.add('losing');
                        }
                    } else if (gameState.board[i][j].adjMinesCount > 0) {
                        const numElem = document.createElement('span');
                        numElem.style.color = `var(--mine-text-${gameState.board[i][j].adjMinesCount})`;
                        numElem.innerText =
                            gameState.board[i][j].adjMinesCount > 0
                                ? gameState.board[i][j].adjMinesCount.toString()
                                : '';
                        elem.appendChild(numElem);
                    }
                }
            } else if (gameState.board[i][j].isFlagged) {
                const flagImg = document.createElement('img');
                const pre = assetManager.getImage('img/Flag.png');
                flagImg.src = pre ? pre.src : 'img/Flag.png';
                flagImg.dataset.asset = 'img/Flag.png';
                elem.appendChild(flagImg);
            } else if (gameState.board[i][j].isQuestionMark) {
                const qm = document.createElement('span');
                qm.classList.add('question-mark');
                qm.innerText = '?';
                elem.appendChild(qm);
            }
            let pressStartTime: number;
            let blockPressed: boolean;
            let touchStartX: number;
            let touchStartY: number;
            let previewTimeout: NodeJS.Timeout | null = null;
            let actionTimeout: NodeJS.Timeout | null = null;

            const applyPreviewState = () => {
                if (!gameState.board[i][j].isRevealed) return;

                // Get adjacent non-revealed, non-flagged tiles
                const previewTiles = getAdjacentTileElements(j, i, gameState, parentElem);

                // Apply preview class to adjacent tiles
                previewTiles.forEach((tile) => tile.classList.add('preview'));

                // Change smiley to surprised
                const newGameImage = document.querySelector('#new-game img') as HTMLImageElement;
                if (newGameImage) {
                    const smileySurprisedImg = 'img/Smiley_surprised.png';
                    const pre = assetManager.getImage(smileySurprisedImg);
                    newGameImage.src = pre ? pre.src : smileySurprisedImg;
                    newGameImage.dataset.asset = smileySurprisedImg;
                }
            };

            const clearPreviewState = () => {
                // Cancel any pending preview timeout
                if (previewTimeout) {
                    clearTimeout(previewTimeout);
                    previewTimeout = null;
                }
                
                // Cancel any pending action timeout
                if (actionTimeout) {
                    clearTimeout(actionTimeout);
                    actionTimeout = null;
                }

                // Use clearAllPreviews to handle any DOM elements with preview class
                clearAllPreviews();

                // Restore smiley face
                const newGameImage = document.querySelector('#new-game img') as HTMLImageElement;
                if (newGameImage) {
                    const smileyFaceImgName = getSmileyFace(gameState);
                    const pre = assetManager.getImage(smileyFaceImgName);
                    newGameImage.src = pre ? pre.src : smileyFaceImgName;
                    newGameImage.dataset.asset = smileyFaceImgName;
                }
            };

            elem.addEventListener('touchstart', (e) => {
                // Don't process if we're waiting for a potential double-tap
                if (isAwaitingDoubleTapGesture()) {
                    return;
                }
                
                e.preventDefault();
                pressStartTime = Date.now();
                blockPressed = true;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                console.log('touch start on mine block');

                // Apply preview state after a short delay (100ms) if tile is revealed
                // This prevents drag gestures from triggering the preview
                if (gameState.board[i][j].isRevealed) {
                    previewTimeout = setTimeout(() => {
                        applyPreviewState();
                    }, 100);
                }
            });

            elem.addEventListener('touchmove', (e) => {
                if (!blockPressed) return;

                // Check if touch moved beyond threshold (15px)
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const deltaX = currentX - touchStartX;
                const deltaY = currentY - touchStartY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (distance > 15) {
                    // Cancel the interaction
                    clearPreviewState();
                    blockPressed = false;
                }
            });

            elem.addEventListener('touchcancel', () => {
                clearPreviewState();
                blockPressed = false;
            });

            elem.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (!blockPressed) {
                    console.log('block not pressed');
                    return;
                }
                console.log('touchend on mine block');

                clearPreviewState();

                const holdDuration = Date.now() - pressStartTime;

                // For quick taps, delay action slightly to allow double-tap detection
                const performAction = () => {
                    if (holdDuration > 250 && !gameState.board[i][j].isRevealed) {
                        flagSpot(j, i);
                        return;
                    }
                    if (gameState.board[i][j].isRevealed) {
                        selectAdjacentSpots(j, i);
                        return;
                    }
                    if (getQuestionMode()) {
                        questionMarkSpot(j, i);
                    } else {
                        selectSpot(j, i);
                    }
                };
                
                // If it's a long press (flag action), do it immediately
                // Otherwise delay to allow double-tap detection (match double-tap delay)
                if (holdDuration > 250) {
                    performAction();
                } else {
                    // Register cancellation callback
                    const cancelAction = () => {
                        if (actionTimeout) {
                            clearTimeout(actionTimeout);
                            actionTimeout = null;
                        }
                    };
                    registerTileAction(cancelAction);
                    
                    // Schedule action with cleanup
                    actionTimeout = setTimeout(() => {
                        performAction();
                        unregisterTileAction(cancelAction);
                    }, TILE_ACTION_DELAY_MS);
                }
                
                blockPressed = false;
            });

            elem.addEventListener('mousedown', (e) => {
                // Only handle left mouse button
                if (e.button !== 0) return;

                blockPressed = true;
                console.log(`mouse down on spot (${j}, ${i})`);

                // Apply preview state after a short delay if tile is revealed
                // This gives a more deliberate feel
                if (gameState.board[i][j].isRevealed) {
                    previewTimeout = setTimeout(() => {
                        applyPreviewState();
                    }, 100);
                }
            });

            elem.addEventListener('mouseup', (e) => {
                // Only handle left mouse button
                if (e.button !== 0) return;

                if (!blockPressed) return;

                clearPreviewState();

                console.log(`selecting spot (${j}, ${i})`);

                if (gameState.board[i][j].isRevealed) {
                    selectAdjacentSpots(j, i);
                } else if (getQuestionMode()) {
                    questionMarkSpot(j, i);
                } else {
                    selectSpot(j, i);
                }

                blockPressed = false;
            });

            elem.addEventListener('mouseleave', () => {
                if (!blockPressed) return;
                clearPreviewState();
                blockPressed = false;
            });

            elem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                console.log('right click');
                flagSpot(j, i);
            });
            row.appendChild(elem);
        }
        parentElem.appendChild(row);
    }
};

export const renderDigits = (
    parentElem: HTMLElement,
    digits: number,
    assetManager: AssetManager
) => {
    let digitStr;
    if (digits < 0) {
        digitStr = Math.abs(digits).toString().padStart(3, '0');
        digitStr = '-' + digitStr.slice(1);
    } else {
        digitStr = digits.toString();
    }

    const children = parentElem.children;

    if (digitStr.length > children.length) {
        throw new Error('More digits than available digit images');
    }

    for (let i = 0; i < children.length; i++) {
        const pre = assetManager.getImage('img/digits/0.png');
        const item = children.item(i) as HTMLImageElement;
        item.src = pre ? pre.src : 'img/digits/0.png';
        item.dataset.asset = 'img/digits/0.png';
    }

    let j = 0;
    for (let i = digitStr.length - 1; i >= 0; i--) {
        const digit = digitStr[i];
        const item = children.item(children.length - 1 - j) as HTMLImageElement;
        const pre = assetManager.getImage(`img/digits/${digit}.png`);
        item.src = pre ? pre.src : `img/digits/${digit}.png`;
        item.dataset.asset = `img/digits/${digit}.png`;
        j++;
    }

    parentElem.dataset.count = digits.toString();
};

export type DialogEffect = 'expand' | 'pop';

export type DialogOptions = {
    fadeIn?: boolean;
    effect?: DialogEffect;
    closable?: boolean;
    style?: CSS.Properties;
};

export const renderDialog = (content: HTMLElement, options?: DialogOptions) => {
    // Close any currently existing dialogs
    const dialogElem = document.querySelector('.dialog');
    if (dialogElem) dialogElem.remove();

    const template = document.querySelector('#dialog') as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as HTMLElement;

    const dialog = clone.querySelector('.dialog') as HTMLDialogElement;

    const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;

    const dialogContent = clone.querySelector('.dialog-content') as HTMLElement;
    dialogContent.appendChild(content);

    if (options) {
        if (options.fadeIn) {
            dialog.style.opacity = '0';
            // TODO: Instead of copying over "translate(-50%, -50%)" from the css style,
            // have it base itself off of a computed transform property
            dialog.style.transform = 'translate(-50%, -50%) scale(0.5)';
            setTimeout(() => {
                const dialog = document.querySelector('.dialog') as HTMLElement;
                dialog.style.opacity = '';
                dialog.style.transform = 'translate(-50%, -50%)';
            }, 10);
        }

        switch (options.effect) {
            case 'expand':
                dialog.classList.add('expand-effect');
                break;
            case 'pop':
                dialog.classList.add('pop-effect');
        }

        const closeBtn = clone.querySelector('button.close') as HTMLElement;
        if (options.closable || options.closable == null) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const dialog = document.querySelector('.dialog') as HTMLDialogElement;
                dialog.close();
                dialog.remove();
                overlayBackElem.style.display = 'none';
            });
        } else {
            closeBtn.style.display = 'none';
        }

        if (options.style) {
            Object.assign(dialog.style, options.style);
        }
    }

    document.body.appendChild(clone);

    overlayBackElem.style.display = 'block';

    (document.querySelector(".dialog [data-feather='x']") as HTMLElement).innerText = 'X';
    // TODO: ActionIconManager should handle feather.replace()
    feather.replace();

    dialog.show();
};

export type PromptDialogOptions = {
    fadeIn?: boolean;
    effect?: DialogEffect;
    style?: CSS.Properties;
    onConfirm?: Function;
    onCancel?: Function;
};

export const renderPromptDialog = (content: HTMLElement, options?: PromptDialogOptions) => {
    // Close any currently existing dialogs
    const dialogElem = document.querySelector('.dialog');
    if (dialogElem) dialogElem.remove();

    const template = document.querySelector('#dialog') as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as HTMLElement;

    const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;

    (clone.querySelector('button.close') as HTMLElement).style.display = 'none';

    const dialog = clone.querySelector('.dialog') as HTMLDialogElement;

    const dialogContent = clone.querySelector('.dialog-content') as HTMLElement;
    dialogContent.appendChild(content);

    if (options) {
        if (options.fadeIn) {
            dialog.style.opacity = '0';
            // TODO: Instead of copying over "translate(-50%, -50%)" from the css style,
            // have it base itself off of a computed transform property
            dialog.style.transform = 'translate(-50%, -50%) scale(0.5)';
            setTimeout(() => {
                const dialog = document.querySelector('.dialog') as HTMLElement;
                dialog.style.opacity = '';
                dialog.style.transform = 'translate(-50%, -50%)';
            }, 10);
        }

        switch (options.effect) {
            case 'expand':
                dialog.classList.add('expand-effect');
                break;
            case 'pop':
                dialog.classList.add('pop-effect');
        }

        if (options.style) {
            Object.assign(dialog.style, options.style);
        }
    }

    const cancelBtn = clone.querySelector('button.cancel') as HTMLElement;
    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dialog = document.querySelector('.dialog') as HTMLDialogElement;
        dialog.close();
        dialog.remove();
        overlayBackElem.style.display = 'none';
        if (options && options.onCancel) {
            options.onCancel();
        }
    });
    const confirmBtn = clone.querySelector('button.confirm') as HTMLElement;
    confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dialog = document.querySelector('.dialog') as HTMLDialogElement;
        dialog.close();
        dialog.remove();
        overlayBackElem.style.display = 'none';
        if (options && options.onConfirm) {
            options.onConfirm();
        }
    });

    document.body.appendChild(clone);

    overlayBackElem.style.display = 'block';

    dialog.show();
};

export const renderNotification = (msg: string, timeoutMS: number = 1000) => {
    const template = document.querySelector('#notification') as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as HTMLElement;

    const message = clone.querySelector('.notification-message') as HTMLElement;
    message.innerText = msg;

    const notificationArea = document.querySelector('.notification-area') as HTMLElement;
    notificationArea.appendChild(clone);

    // The original reference is a DocumentFragment, need to find the notification element in the DOM tree to continue using it
    const notificationList = notificationArea.querySelectorAll(
        '.notification-area > .notification'
    ) as NodeListOf<HTMLElement>;
    const notification = notificationList[notificationList.length - 1];

    setTimeout(() => {
        notification.style.opacity = '0';

        setTimeout(() => {
            notification.remove();
        }, 1000);
    }, timeoutMS);
};

export const createDialogContentFromTemplate = (tmplContentId: string) => {
    const contentTmpl = document.querySelector(tmplContentId) as HTMLTemplateElement;
    const contentClone = contentTmpl.content.cloneNode(true) as HTMLElement;

    return contentClone;
};
