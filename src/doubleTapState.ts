// Shared state for double-tap detection to prevent tile interactions
let isAwaitingDoubleTap = false;
let doubleTapTimeout: NodeJS.Timeout | null = null;
let tileActionCallbacks: (() => void)[] = [];

export function registerTileAction(cancelCallback: () => void) {
    tileActionCallbacks.push(cancelCallback);
}

export function unregisterTileAction(cancelCallback: () => void) {
    const index = tileActionCallbacks.indexOf(cancelCallback);
    if (index > -1) {
        tileActionCallbacks.splice(index, 1);
    }
}

export function setAwaitingDoubleTap(waiting: boolean, timeoutMs: number = 0) {
    isAwaitingDoubleTap = waiting;
    
    // Clear any existing timeout
    if (doubleTapTimeout) {
        clearTimeout(doubleTapTimeout);
        doubleTapTimeout = null;
    }
    
    // Set timeout to reset flag if provided
    if (waiting && timeoutMs > 0) {
        doubleTapTimeout = setTimeout(() => {
            isAwaitingDoubleTap = false;
            doubleTapTimeout = null;
        }, timeoutMs);
    }
}

export function isAwaitingDoubleTapGesture(): boolean {
    return isAwaitingDoubleTap;
}

export function resetDoubleTapState() {
    if (doubleTapTimeout) {
        clearTimeout(doubleTapTimeout);
        doubleTapTimeout = null;
    }
    isAwaitingDoubleTap = false;
    
    // Cancel all pending tile actions
    tileActionCallbacks.forEach(callback => callback());
    tileActionCallbacks = [];
}
