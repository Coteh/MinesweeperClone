import { jest } from '@jest/globals';
import { AudioManager, SoundEffect } from '../src/manager/audio';
import { AssetManager } from '../src/manager/asset';
import { Howler } from 'howler';

// Mock Howler
jest.mock('howler', () => ({
    Howler: {
        ctx: null,
    },
}));

// Mock global document for node environment
const mockDocument = {
    addEventListener: jest.fn(),
    visibilityState: 'visible',
};

global.document = mockDocument as any;

// Mock Howl instances
class MockHowl {
    private _volume: number = 1;
    private _seek: number = 0;

    volume(vol?: number) {
        if (vol !== undefined) {
            this._volume = vol;
        }
        return this._volume;
    }

    seek(position?: number) {
        if (position !== undefined) {
            this._seek = position;
        }
        return this._seek;
    }

    play() {
        return 0;
    }
}

describe('AudioManager', () => {
    let audioManager: AudioManager;
    let assetManager: AssetManager;
    let mockSound: MockHowl;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Reset mock functions
        mockDocument.addEventListener = jest.fn();

        // Create a mock sound
        mockSound = new MockHowl();

        // Create a mock asset manager
        assetManager = {
            getSoundEffect: jest.fn().mockReturnValue(mockSound),
        } as any;

        audioManager = new AudioManager(assetManager);
    });

    describe('sound effects enabled/disabled', () => {
        it('should start with sound effects enabled by default', () => {
            expect(audioManager.isSoundEffectsEnabled()).toBe(true);
        });

        it('should toggle sound effects off', () => {
            audioManager.toggleSoundEffects(false);
            expect(audioManager.isSoundEffectsEnabled()).toBe(false);
        });

        it('should toggle sound effects on', () => {
            audioManager.toggleSoundEffects(false);
            audioManager.toggleSoundEffects(true);
            expect(audioManager.isSoundEffectsEnabled()).toBe(true);
        });

        it('should toggle sound effects when called without arguments', () => {
            const initialState = audioManager.isSoundEffectsEnabled();
            audioManager.toggleSoundEffects();
            expect(audioManager.isSoundEffectsEnabled()).toBe(!initialState);
        });

        it('should not play sound when sound effects are disabled', () => {
            const playSpy = jest.spyOn(mockSound, 'play');
            audioManager.toggleSoundEffects(false);
            audioManager.playSoundEffect(SoundEffect.Click);
            expect(playSpy).not.toHaveBeenCalled();
        });

        it('should play sound when sound effects are enabled', () => {
            const playSpy = jest.spyOn(mockSound, 'play');
            audioManager.toggleSoundEffects(true);
            audioManager.playSoundEffect(SoundEffect.Click);
            expect(playSpy).toHaveBeenCalled();
        });
    });

    describe('volume control', () => {
        it('should start with volume at 1.0 by default', () => {
            expect(audioManager.getSoundEffectsVolume()).toBe(1.0);
        });

        it('should set volume correctly', () => {
            audioManager.setSoundEffectsVolume(0.5);
            expect(audioManager.getSoundEffectsVolume()).toBe(0.5);
        });

        it('should clamp volume to 0 when set below 0', () => {
            audioManager.setSoundEffectsVolume(-0.5);
            expect(audioManager.getSoundEffectsVolume()).toBe(0);
        });

        it('should clamp volume to 1 when set above 1', () => {
            audioManager.setSoundEffectsVolume(1.5);
            expect(audioManager.getSoundEffectsVolume()).toBe(1);
        });

        it('should apply volume when playing a sound', () => {
            const volumeSpy = jest.spyOn(mockSound, 'volume');
            audioManager.setSoundEffectsVolume(0.5);
            audioManager.playSoundEffect(SoundEffect.Click);
            expect(volumeSpy).toHaveBeenCalledWith(0.5);
        });

        it('should apply both global volume and per-sound volume', () => {
            const volumeSpy = jest.spyOn(mockSound, 'volume');
            audioManager.setSoundEffectsVolume(0.5);
            audioManager.playSoundEffect(SoundEffect.Click, { volume: 0.8 });
            expect(volumeSpy).toHaveBeenCalledWith(0.4); // 0.5 * 0.8 = 0.4
        });
    });

    describe('sound effect playback', () => {
        it('should play a sound effect', () => {
            const playSpy = jest.spyOn(mockSound, 'play');
            audioManager.playSoundEffect(SoundEffect.Click);
            expect(playSpy).toHaveBeenCalled();
        });

        it('should apply seek position when provided', () => {
            const seekSpy = jest.spyOn(mockSound, 'seek');
            audioManager.playSoundEffect(SoundEffect.Win, { seek: 0.3 });
            expect(seekSpy).toHaveBeenCalledWith(0.3);
        });

        it('should handle missing sound gracefully', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (assetManager.getSoundEffect as any) = jest.fn().mockReturnValue(null);

            expect(() => {
                audioManager.playSoundEffect(SoundEffect.Click);
            }).not.toThrow();

            expect(consoleErrorSpy).toHaveBeenCalledWith('Sound not loaded:', 'click');
            consoleErrorSpy.mockRestore();
        });
    });

    describe('AudioContext resume handlers', () => {
        it('should set up event listener for visibility change', () => {
            // This should have been called in the constructor
            expect(mockDocument.addEventListener).toHaveBeenCalledWith(
                'visibilitychange',
                expect.any(Function)
            );
        });

        it('should resume audio context when it is not running on visibility change', () => {
            const mockResume = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
            (Howler as any).ctx = {
                state: 'suspended',
                resume: mockResume,
            };

            // Simulate visibility change
            const visibilityChangeHandler = (mockDocument.addEventListener as jest.Mock).mock.calls.find(
                (call: any[]) => call[0] === 'visibilitychange'
            )?.[1] as () => void;

            // Mock document.visibilityState
            Object.defineProperty(mockDocument, 'visibilityState', {
                value: 'visible',
                configurable: true,
            });

            visibilityChangeHandler();

            expect(mockResume).toHaveBeenCalled();
        });

        it('should not resume audio context when it is already running', () => {
            const mockResume = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
            (Howler as any).ctx = {
                state: 'running',
                resume: mockResume,
            };

            // Simulate visibility change
            const visibilityChangeHandler = (mockDocument.addEventListener as jest.Mock).mock.calls.find(
                (call: any[]) => call[0] === 'visibilitychange'
            )?.[1] as () => void;

            Object.defineProperty(mockDocument, 'visibilityState', {
                value: 'visible',
                configurable: true,
            });

            visibilityChangeHandler();

            expect(mockResume).not.toHaveBeenCalled();
        });

        it('should not resume audio context when Howler.ctx is null', () => {
            (Howler as any).ctx = null;

            // Simulate visibility change
            const visibilityChangeHandler = (mockDocument.addEventListener as jest.Mock).mock.calls.find(
                (call: any[]) => call[0] === 'visibilitychange'
            )?.[1] as () => void;

            Object.defineProperty(mockDocument, 'visibilityState', {
                value: 'visible',
                configurable: true,
            });

            // This should not throw
            expect(() => {
                visibilityChangeHandler();
            }).not.toThrow();
        });

        it('should handle resume errors gracefully', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            const mockError = new Error('Resume failed');
            const mockResume = jest.fn<() => Promise<void>>().mockRejectedValue(mockError);

            (Howler as any).ctx = {
                state: 'suspended',
                resume: mockResume,
            };

            // Simulate visibility change
            const visibilityChangeHandler = (mockDocument.addEventListener as jest.Mock).mock.calls.find(
                (call: any[]) => call[0] === 'visibilitychange'
            )?.[1] as () => void;

            Object.defineProperty(mockDocument, 'visibilityState', {
                value: 'visible',
                configurable: true,
            });

            visibilityChangeHandler();

            // Flush the microtask queue so that the rejected resume's .catch() handler can run.
            await Promise.resolve();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Failed to resume audio context:',
                mockError
            );
            consoleWarnSpy.mockRestore();
        });
    });
});
