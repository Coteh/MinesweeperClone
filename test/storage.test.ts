import { GAME_STATE_KEY, PERSISTENT_STATE_KEY, PREFERENCES_KEY } from '../src/storage/browser';

describe('BrowserGameStorage', () => {
    describe('storage keys', () => {
        it('should have prefixed game state key', () => {
            expect(GAME_STATE_KEY).toBe('ms-game-state');
        });

        it('should have prefixed persistent state key', () => {
            expect(PERSISTENT_STATE_KEY).toBe('ms-persistent-state');
        });

        it('should have prefixed preferences key', () => {
            expect(PREFERENCES_KEY).toBe('ms-preferences');
        });
    });
});
