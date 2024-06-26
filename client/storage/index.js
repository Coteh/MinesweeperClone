const GAME_OPTIONS_KEY = 'game_options';

let gameOptions = {
    highlightEffect: false,
    holdToFlag: true,
    revealBoardOnLoss: false,
};

export function loadGameOptions() {
    try {
        const gameOptionsStr = window.localStorage.getItem(GAME_OPTIONS_KEY);
        if (!gameOptionsStr) {
            return gameOptions;
        }
        gameOptions = JSON.parse(gameOptionsStr);
    } catch (e) {
        console.error(e);
    }
    return gameOptions;
};

export function saveGameOptions(newOptions) {
    window.localStorage.setItem(GAME_OPTIONS_KEY, JSON.stringify(newOptions));
};
