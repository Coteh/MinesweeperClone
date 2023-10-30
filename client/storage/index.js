const GAME_OPTIONS_KEY = "game_options";

let gameOptions = {
    highlightEffect: false,
    holdToFlag: true,
    revealBoardOnLoss: false,
};

module.exports.loadGameOptions = () => {
    try {
        gameOptions = JSON.parse(window.localStorage.getItem(GAME_OPTIONS_KEY));
    } catch (e) {
        console.error(e);
    }
    return gameOptions;
};

module.exports.saveGameOptions = (newOptions) => {
    window.localStorage.setItem(GAME_OPTIONS_KEY, JSON.stringify(newOptions));
};
