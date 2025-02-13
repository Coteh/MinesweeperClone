import { MineBlock } from "../../src/game";

declare global {
    namespace Cypress {
        interface Chainable<Subject = any> {
            clearBrowserCache(): Chainable<Subject>;
            grantClipboardPermission(): Chainable<Subject>;
            shouldNotBeActionable(done: Mocha.Done): Chainable<Element>;
            shouldBeInViewport(): Chainable<Subject>;
            waitUntilDialogAppears(): Chainable<Subject>;
            verifyBoardMatches(expectedBoard: (MineBlock | undefined)[][]): Chainable<Subject>;
            verifyBoardDoesNotMatch(expectedBoard: (MineBlock | undefined)[][]): Chainable<Subject>;
        }
    }
}
