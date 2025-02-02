import feather from 'feather-icons';
import { GameState, GameOptions, selectSpot, flagSpot, selectAdjacentSpots } from './game';
import type * as CSS from 'csstype';

export const renderBoard = (parentElem: HTMLElement, gameState: GameState) => {
    parentElem.innerHTML = '';
    // console.log('rendering', gameState.board.length);
    const zoomable = document.getElementById('zoomable') as HTMLElement;
    for (let i = 0; i < gameState.board.length; i++) {
        const row = document.createElement('div');
        // console.log('rendering', gameState.board[i], gameState.board[i].length);
        for (let j = 0; j < gameState.board[i].length; j++) {
            const elem = document.createElement('div');
            elem.classList.add('box');
            if (gameState.board[i][j].isRevealed) {
                elem.classList.add('revealed');
                if (gameState.board[i][j].isMine) {
                    const mineImg = document.createElement('img');
                    mineImg.src = 'img/Mine.png';
                    elem.appendChild(mineImg);
                } else if (gameState.board[i][j].adjMinesCount > 0) {
                    const numElem = document.createElement('span');
                    numElem.style.color = `var(--mine-text-${gameState.board[i][j].adjMinesCount})`;
                    numElem.innerText =
                        gameState.board[i][j].adjMinesCount > 0
                            ? gameState.board[i][j].adjMinesCount.toString()
                            : '';
                    elem.appendChild(numElem);
                }
            } else if (gameState.board[i][j].isFlagged) {
                const flagImg = document.createElement('img');
                flagImg.src = 'img/Flag.png';
                elem.appendChild(flagImg);
            }
            let pressStartTime: number;
            let blockPressed: boolean;
            elem.addEventListener('touchstart', (e) => {
                e.preventDefault();
                pressStartTime = Date.now();
                blockPressed = true;
                console.log('touch start on mine block');
            });
            elem.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (!blockPressed) {
                    console.log('block not pressed');
                    return;
                }
                const targetElem = e.target as HTMLElement;
                const touch = e.changedTouches[0];
                const rect = targetElem.getBoundingClientRect();

                // Check if the touch point is outside the target element
                if (
                    touch.clientX < rect.left ||
                    touch.clientX > rect.right ||
                    touch.clientY < rect.top ||
                    touch.clientY > rect.bottom
                ) {
                    // The touch ended outside the target element; cancel the event.
                    return;
                }
                console.log('touchend on mine block');
                if (Date.now() - pressStartTime > 250) {
                    flagSpot(j, i);
                    return;
                }
                if (gameState.board[i][j].isRevealed) {
                    selectAdjacentSpots(j, i);
                    return;
                }
                selectSpot(j, i);
                blockPressed = false;
            });
            elem.addEventListener('click', (e) => {
                console.log('this work?');
                if (gameState.board[i][j].isRevealed) {
                    selectAdjacentSpots(j, i);
                    return;
                }
                selectSpot(j, i);
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

export const renderDigits = (parentElem: HTMLElement, digits: number) => {
    const digitStr = digits.toString();
    const children = parentElem.children;

    if (digitStr.length > children.length) {
        throw new Error('More digits than available digit images');
    }

    for (let i = 0; i < children.length; i++) {
        (children.item(i) as HTMLImageElement).src = 'img/digits/0.png';
    }

    let j = 0;
    for (let i = digitStr.length - 1; i >= 0; i--) {
        const digit = digitStr[i];
        const item = children.item(children.length - 1 - j) as HTMLImageElement;
        item.src = `img/digits/${digit}.png`;
        j++;
    }
};

export type DialogOptions = {
    fadeIn?: boolean;
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
