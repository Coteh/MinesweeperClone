import { MineBlock } from '../../src/game';

interface VerifyBoardOptions {
    isGameOver?: boolean;
}

declare global {
    namespace Cypress {
        interface Chainable<Subject> {
            clearBrowserCache(): Chainable<Subject>;
            grantClipboardPermission(): Chainable<Subject>;
            shouldNotBeActionable(done: Mocha.Done): Chainable<Element>;
            shouldBeInViewport(): Chainable<Subject>;
            shouldNotBeInViewport(): Chainable<Subject>;
            waitUntilDialogAppears(): Chainable<Subject>;
            waitForGameReady(): Chainable<Subject>;
            verifyBoardMatches(
                expectedBoard: (MineBlock | undefined)[][],
                options?: VerifyBoardOptions,
            ): Chainable<Subject>;
            selectDifficulty(value: string): Chainable<Subject>;
            selectTheme(value: string): Chainable<Subject>;
            changeDifficulty(value: string): Chainable<Subject>;
        }
    }
}
