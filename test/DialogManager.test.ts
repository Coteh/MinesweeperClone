/**
 * Unit tests for DialogManager
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';

// Import after environment is setup
import { DialogManager } from '../src/ui/dialog/DialogManager';

describe('DialogManager', () => {
    let dialogManager: DialogManager;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div class="overlay-back"></div>
            <template id="dialog-template">
                <div class="dialog-stack-item" role="dialog" aria-modal="true">
                    <button class="dialog-close" data-action="close" aria-label="Close">×</button>
                    <div class="dialog-content"></div>
                </div>
            </template>
        `;

        // Create new manager instance
        dialogManager = new DialogManager();
    });

    afterEach(() => {
        // Clean up dialogs
        const dialogs = document.querySelectorAll('[data-dialog-id]');
        dialogs.forEach((dialog) => dialog.remove());
    });

    describe('show()', () => {
        it('should show a dialog and return an ID', () => {
            const content = document.createElement('div');
            content.textContent = 'Test content';

            const id = dialogManager.show(content);

            expect(id).toBeTruthy();
            expect(typeof id).toBe('string');
            expect(id).toMatch(/^dlg-/);
        });

        it('should render dialog content to DOM', () => {
            const content = document.createElement('div');
            content.textContent = 'Test content';

            dialogManager.show(content);

            const dialogInDom = document.querySelector('[data-dialog-id]');
            expect(dialogInDom).toBeTruthy();
            expect(dialogInDom?.querySelector('.dialog-content')?.textContent).toContain(
                'Test content'
            );
        });

        it('should show overlay when dialog is opened', () => {
            const content = document.createElement('div');
            content.textContent = 'Test';

            dialogManager.show(content);

            const overlay = document.querySelector('.overlay-back');
            expect(overlay?.classList.contains('visible')).toBe(true);
        });

        it('should support LIFO stack behavior (new dialog on top)', () => {
            const contentA = document.createElement('div');
            contentA.textContent = 'Dialog A';
            dialogManager.show(contentA);

            const contentB = document.createElement('div');
            contentB.textContent = 'Dialog B';
            const idB = dialogManager.show(contentB);

            // Only one dialog should be visible (B, the most recent)
            const visibleDialogs = document.querySelectorAll('[data-dialog-id]');
            expect(visibleDialogs.length).toBe(1);
            expect(visibleDialogs[0].getAttribute('data-dialog-id')).toBe(idB);
        });

        it('should apply closable option correctly', () => {
            const content = document.createElement('div');
            content.textContent = 'Test';

            dialogManager.show(content, { closable: false });

            const closeBtn = document.querySelector('.dialog-close') as HTMLElement;
            expect(closeBtn.style.display).toBe('none');
        });
    });

    describe('closeCurrent()', () => {
        it('should close the current dialog', () => {
            const content = document.createElement('div');
            content.textContent = 'Test';

            const id = dialogManager.show(content);
            expect(document.querySelector(`[data-dialog-id="${id}"]`)).toBeTruthy();

            dialogManager.closeCurrent();

            expect(document.querySelector(`[data-dialog-id="${id}"]`)).toBeNull();
        });

        it('should restore previous dialog from stack', () => {
            const contentA = document.createElement('div');
            contentA.textContent = 'Dialog A';
            const idA = dialogManager.show(contentA);

            const contentB = document.createElement('div');
            contentB.textContent = 'Dialog B';
            const idB = dialogManager.show(contentB);

            // Close B
            dialogManager.closeCurrent();

            // A should now be visible
            expect(document.querySelector(`[data-dialog-id="${idA}"]`)).toBeTruthy();
            expect(document.querySelector(`[data-dialog-id="${idB}"]`)).toBeNull();
        });

        it('should hide overlay when all dialogs are closed', () => {
            const content = document.createElement('div');
            content.textContent = 'Test';

            dialogManager.show(content);
            const overlay = document.querySelector('.overlay-back');
            expect(overlay?.classList.contains('visible')).toBe(true);

            dialogManager.closeCurrent();
            expect(overlay?.classList.contains('visible')).toBe(false);
        });

        it('should not error when closing with no dialog open', () => {
            expect(() => {
                dialogManager.closeCurrent();
            }).not.toThrow();
        });
    });

    describe('closeAll()', () => {
        it('should close all dialogs and clear stack', () => {
            const contentA = document.createElement('div');
            contentA.textContent = 'Dialog A';
            dialogManager.show(contentA);

            const contentB = document.createElement('div');
            contentB.textContent = 'Dialog B';
            dialogManager.show(contentB);

            dialogManager.closeAll();

            expect(document.querySelectorAll('[data-dialog-id]').length).toBe(0);
            const overlay = document.querySelector('.overlay-back');
            expect(overlay?.classList.contains('visible')).toBe(false);
        });
    });

    describe('prompt dialogs', () => {
        it('should call onConfirm callback after closing', (done) => {
            const content = document.createElement('div');
            content.innerHTML = '<button class="confirm">Confirm</button>';

            const onConfirm = jest.fn(() => {
                expect(document.querySelectorAll('[data-dialog-id]').length).toBe(0);
                done();
            });

            dialogManager.show(content, {}, 'prompt', { onConfirm });

            // Wait for render
            setTimeout(() => {
                const confirmBtn = document.querySelector('.confirm') as HTMLElement;
                confirmBtn?.click();
            }, 10);
        });

        it('should call onCancel callback after closing', (done) => {
            const content = document.createElement('div');
            content.innerHTML = '<button class="cancel">Cancel</button>';

            const onCancel = jest.fn(() => {
                expect(document.querySelectorAll('[data-dialog-id]').length).toBe(0);
                done();
            });

            dialogManager.show(content, {}, 'prompt', { onCancel });

            // Wait for render
            setTimeout(() => {
                const cancelBtn = document.querySelector('.cancel') as HTMLElement;
                cancelBtn?.click();
            }, 10);
        });
    });

    describe('rehydrate callback', () => {
        it('should call rehydrate with actual DOM element', (done) => {
            const content = document.createElement('div');
            content.textContent = 'Test';

            dialogManager.show(content, {}, 'regular', {
                rehydrate: (root) => {
                    expect(root).toBeInstanceOf(HTMLElement);
                    expect(root.hasAttribute('data-dialog-id')).toBe(true);
                    done();
                },
            });
        });
    });

    describe('overlay click handling', () => {
        it('should close dialog when overlay is clicked and dialog is closable', () => {
            const content = document.createElement('div');
            content.textContent = 'Test';

            const id = dialogManager.show(content, { closable: true });

            const overlay = document.querySelector('.overlay-back') as HTMLElement;
            overlay.click();

            expect(document.querySelector(`[data-dialog-id="${id}"]`)).toBeNull();
        });

        it('should not close dialog when overlay is clicked and dialog is not closable', () => {
            const content = document.createElement('div');
            content.textContent = 'Test';

            const id = dialogManager.show(content, { closable: false });

            const overlay = document.querySelector('.overlay-back') as HTMLElement;
            overlay.click();

            expect(document.querySelector(`[data-dialog-id="${id}"]`)).toBeTruthy();
        });
    });

    describe('processImmediate flag', () => {
        it('should push current to stack when processImmediate is true', () => {
            const contentA = document.createElement('div');
            contentA.textContent = 'Dialog A';
            const idA = dialogManager.show(contentA);

            const contentB = document.createElement('div');
            contentB.textContent = 'Dialog B';
            const idB = dialogManager.show(contentB, {}, 'regular', {}, true);

            // B should be visible
            expect(document.querySelector(`[data-dialog-id="${idB}"]`)).toBeTruthy();

            // Close B, A should return
            dialogManager.closeCurrent();
            expect(document.querySelector(`[data-dialog-id="${idA}"]`)).toBeTruthy();
        });
    });
});
