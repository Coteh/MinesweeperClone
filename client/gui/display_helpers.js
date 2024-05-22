export const getAdjMinesTextColor = function (adjMinesCount) {
    switch (adjMinesCount) {
        case 1:
            return '#0099FF'; //blue
        case 2:
            return '#00FF00'; //green
        case 3:
            return '#FF0000'; //red
        case 4:
            return '#0000FF'; //dark blue
        case 5:
            return '#442200'; //brown
        case 6:
            return '#00FFFF'; //cyan
        case 7:
            return '#000000'; //black
        case 8:
            return '#858585'; //grey
    }
    return '#FF9900'; //fallback color
};

/* num is a number from 0-9 */
var determineDigitFormation = function (num, callback) {
    if (num < 0 || num > 9) {
        return;
    }
    switch (num) {
        case 1:
            callback([0, 0, 1, 0, 0, 1, 0]);
            break;
        case 2:
            callback([1, 0, 1, 1, 1, 0, 1]);
            break;
        case 3:
            callback([1, 0, 1, 1, 0, 1, 1]);
            break;
        case 4:
            break;
        case 5:
            break;
        case 6:
            break;
        case 7:
            break;
        case 8:
            break;
        case 9:
            break;
        default:
            callback([0, 0, 0, 0, 0, 0, 0]);
            break;
    }
};
