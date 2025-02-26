import { MineBlock } from '../../src/game';

interface VerifyBoardOptions {
    isGameOver?: boolean;
}

declare global {
    namespace Cypress {
        interface Chainable<Subject = any> {
            clearBrowserCache(): Chainable<Subject>;
            grantClipboardPermission(): Chainable<Subject>;
            shouldNotBeActionable(done: Mocha.Done): Chainable<Element>;
            shouldBeInViewport(): Chainable<Subject>;
            shouldNotBeInViewport(): Chainable<Subject>;
            waitUntilDialogAppears(): Chainable<Subject>;
            waitForGameReady(): Chainable<Subject>;
            verifyBoardMatches(
                expectedBoard: (MineBlock | undefined)[][],
                options?: VerifyBoardOptions
            ): Chainable<Subject>;
        }
    }
}
