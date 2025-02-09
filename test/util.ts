import { GamePersistentState, GameState } from '../src/game';
import { Preferences } from '../src/preferences';
import { IGameStorage } from '../src/storage';

export class MockGameStorage implements IGameStorage {
    gameState: GameState;
    constructor(gameState: GameState) {
        this.gameState = gameState;
    }
    saveGame = (_gameState: GameState) => {};
    savePersistentState = (_persistentState: GamePersistentState) => {};
    savePreferences = (_preferences: Preferences) => {};
    gameExists = () => true;
    persistentStateExists = () => false;
    preferencesExists = () => false;
    loadGame: () => GameState = () => {
        return JSON.parse(JSON.stringify(this.gameState));
    };
    loadPersistentState: () => GamePersistentState = () => ({
        highscore: 0,
        unlockables: {},
        hasPlayedBefore: false,
    });
    loadPreferences: () => Preferences = () => ({});
    clearGame: () => void = () => {};
    clearPersistentState: () => void = () => {};
    clearPreferences: () => void = () => {};
}

export class NonexistentMockGameStorage implements IGameStorage {
    constructor() {}
    saveGame = (_gameState: GameState) => {};
    savePersistentState = (_persistentState: GamePersistentState) => {};
    savePreferences = (_preferences: Preferences) => {};
    gameExists = () => false;
    persistentStateExists = () => false;
    preferencesExists = () => false;
    loadGame: () => GameState = () => {
        throw new Error(
            'There should not be any game state loaded from NonexistentMockGameStorage'
        );
    };
    loadPersistentState: () => GamePersistentState = () => ({
        highscore: 0,
        unlockables: {},
        hasPlayedBefore: false,
    });
    loadPreferences: () => Preferences = () => ({});
    clearGame: () => void = () => {};
    clearPersistentState: () => void = () => {};
    clearPreferences: () => void = () => {};
}
