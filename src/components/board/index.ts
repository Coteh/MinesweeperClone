import { GameState, selectSpot, flagSpot, selectAdjacentSpots, questionMarkSpot } from '../../game';
import { getQuestionMode } from '../../inputMode';
import { AssetManager } from '../../manager/asset';

// Flag preview hold threshold in milliseconds (configurable)
const FLAG_PREVIEW_HOLD_THRESHOLD = 250;

// Module-level asset manager reference for flag preview
let assetManagerRef: AssetManager | null = null;

// Module-level flag preview state
let flagPreviewTimeout: ReturnType<typeof setTimeout> | null = null;
let flagPreviewElement: HTMLElement | null = null;

const startFlagPreview = (tileElement: HTMLElement, isFlagged: boolean) => {
    cancelFlagPreview();

    const rect = tileElement.getBoundingClientRect();
    const flagSrc = assetManagerRef?.getImage('img/Flag.png')?.src ?? 'img/Flag.png';

    const el = document.createElement('img') as HTMLImageElement;
    el.src = flagSrc;
    el.className = 'flag-preview';
    el.style.left = `${rect.left + 2}px`;
    el.style.top = `${rect.top + 2}px`;
    el.style.width = `${rect.width - 4}px`;
    el.style.height = `${rect.height - 4}px`;

    const startOffset = -(rect.top + rect.height);

    if (!isFlagged) {
        // Flag add: descend from top of screen to tile
        el.style.transform = `translateY(${startOffset}px)`;
        el.style.opacity = '0';
    } else {
        // Flag remove: start at tile, ascend to top of screen
        el.style.transform = 'translateY(0)';
        el.style.opacity = '0.65';

        // Dim the real flag on the tile
        const flagImg = tileElement.querySelector('img[data-asset="img/Flag.png"]');
        if (flagImg) {
            flagImg.classList.add('flag-img-fading');
        }
    }

    document.body.appendChild(el);
    flagPreviewElement = el;

    // Force reflow then apply transition
    el.getBoundingClientRect();
    el.style.transition = 'transform 150ms ease-out, opacity 150ms ease-out';

    if (!isFlagged) {
        el.style.transform = 'translateY(0)';
        el.style.opacity = '0.65';
    } else {
        el.style.transform = `translateY(${startOffset}px)`;
        el.style.opacity = '0';
    }
};

export const cancelFlagPreview = () => {
    if (flagPreviewTimeout) {
        clearTimeout(flagPreviewTimeout);
        flagPreviewTimeout = null;
    }
    if (flagPreviewElement) {
        flagPreviewElement.remove();
        flagPreviewElement = null;
    }
    document.querySelectorAll('img.flag-img-fading').forEach((el) => {
        el.classList.remove('flag-img-fading');
    });
};

// Helper function to get adjacent non-revealed, non-flagged tile elements
const getAdjacentTileElements = (
    x: number,
    y: number,
    gameState: GameState,
    parentElem: HTMLElement,
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

// Helper to clear reveal-preview classes from all tiles
const clearAllRevealPreviews = () => {
    document.querySelectorAll('.box.reveal-preview').forEach((elem) => {
        elem.classList.remove('reveal-preview');
    });
};

export const renderBoard = (
    parentElem: HTMLElement,
    gameState: GameState,
    assetManager: AssetManager,
) => {
    assetManagerRef = assetManager;
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
            let revealPreviewTimeout: NodeJS.Timeout | null = null;

            const applyRevealPreviewState = () => {
                if (!gameState.board[i][j].isRevealed) return;
                if (gameState.ended) return; // Don't show surprised face if game has ended

                // Get adjacent non-revealed, non-flagged tiles
                const revealPreviewTiles = getAdjacentTileElements(j, i, gameState, parentElem);

                // Apply reveal-preview class to adjacent tiles
                revealPreviewTiles.forEach((tile) => tile.classList.add('reveal-preview'));

                // Change smiley to surprised
                const newGameImage = document.querySelector('#new-game img') as HTMLImageElement;
                if (newGameImage) {
                    const smileySurprisedImg = 'img/Smiley_surprised.png';
                    const pre = assetManager.getImage(smileySurprisedImg);
                    newGameImage.src = pre ? pre.src : smileySurprisedImg;
                    newGameImage.dataset.asset = smileySurprisedImg;
                }
            };

            const clearRevealPreviewState = () => {
                // Cancel any pending reveal-preview timeout
                if (revealPreviewTimeout) {
                    clearTimeout(revealPreviewTimeout);
                    revealPreviewTimeout = null;
                }

                // Use clearAllRevealPreviews to handle any DOM elements with reveal-preview class
                clearAllRevealPreviews();

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
                e.preventDefault();
                pressStartTime = Date.now();
                blockPressed = true;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                console.log('touch start on mine block');

                // Apply reveal-preview state after a short delay (100ms) if tile is revealed
                // This prevents drag gestures from triggering the preview
                if (gameState.board[i][j].isRevealed) {
                    revealPreviewTimeout = setTimeout(() => {
                        applyRevealPreviewState();
                    }, 100);
                } else if (!gameState.ended) {
                    if (flagPreviewTimeout) clearTimeout(flagPreviewTimeout);
                    flagPreviewTimeout = setTimeout(() => {
                        startFlagPreview(elem, gameState.board[i][j].isFlagged);
                    }, FLAG_PREVIEW_HOLD_THRESHOLD);
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
                    cancelFlagPreview();
                    clearRevealPreviewState();
                    blockPressed = false;
                }
            });

            elem.addEventListener('touchcancel', () => {
                cancelFlagPreview();
                clearRevealPreviewState();
                blockPressed = false;
            });

            elem.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (!blockPressed) {
                    console.log('block not pressed');
                    return;
                }
                console.log('touchend on mine block');

                cancelFlagPreview();
                clearRevealPreviewState();

                const holdDuration = Date.now() - pressStartTime;

                if (
                    holdDuration >= FLAG_PREVIEW_HOLD_THRESHOLD &&
                    !gameState.board[i][j].isRevealed
                ) {
                    flagSpot(j, i);
                    blockPressed = false;
                    return;
                }
                if (gameState.board[i][j].isRevealed) {
                    selectAdjacentSpots(j, i);
                    blockPressed = false;
                    return;
                }
                if (getQuestionMode()) {
                    questionMarkSpot(j, i);
                } else {
                    selectSpot(j, i);
                }
                blockPressed = false;
            });

            elem.addEventListener('mousedown', (e) => {
                // Only handle left mouse button
                if (e.button !== 0) return;

                pressStartTime = Date.now();
                blockPressed = true;
                console.log(`mouse down on spot (${j}, ${i})`);

                // Apply reveal-preview state after a short delay if tile is revealed
                // This gives a more deliberate feel
                if (gameState.board[i][j].isRevealed) {
                    revealPreviewTimeout = setTimeout(() => {
                        applyRevealPreviewState();
                    }, 100);
                } else if (!gameState.ended) {
                    if (flagPreviewTimeout) clearTimeout(flagPreviewTimeout);
                    flagPreviewTimeout = setTimeout(() => {
                        startFlagPreview(elem, gameState.board[i][j].isFlagged);
                    }, FLAG_PREVIEW_HOLD_THRESHOLD);
                }
            });

            elem.addEventListener('mouseup', (e) => {
                // Only handle left mouse button
                if (e.button !== 0) return;

                if (!blockPressed) return;

                cancelFlagPreview();
                clearRevealPreviewState();

                console.log(`selecting spot (${j}, ${i})`);

                const holdDuration = Date.now() - pressStartTime;

                if (
                    holdDuration >= FLAG_PREVIEW_HOLD_THRESHOLD &&
                    !gameState.board[i][j].isRevealed
                ) {
                    flagSpot(j, i);
                    blockPressed = false;
                    return;
                }

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
                cancelFlagPreview();
                clearRevealPreviewState();
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