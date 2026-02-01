/**
 * DialogManager - LIFO (Last In, First Out) stacked modal/dialog system
 *
 * Manages a stack of dialogs where the most recently opened dialog is active.
 * When closed, it restores and re-renders the previous dialog with callbacks and focus intact.
 */

import { DialogItem, DialogOptions, DialogType, DialogCallbacks } from './types';

/**
 * Generate a unique ID for dialog items
 */
function uid(prefix = 'dlg'): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * DialogManager class - singleton instance for managing dialog stack
 */
export class DialogManager {
    private stack: DialogItem[] = [];
    private current?: DialogItem;
    private overlayEl: HTMLElement;
    private templateSelector = '#dialog-template';

    constructor(overlaySelector = '.overlay-back', templateSelector = '#dialog-template') {
        const overlay = document.querySelector<HTMLElement>(overlaySelector);
        if (!overlay) {
            throw new Error(`Overlay element "${overlaySelector}" not found in DOM`);
        }
        this.overlayEl = overlay;
        this.templateSelector = templateSelector;
        this.overlayEl.addEventListener('click', this.overlayClickHandler);
    }

    /**
     * Show a new dialog
     *
     * @param content - Content to display in the dialog (DocumentFragment or HTMLElement)
     * @param options - Dialog display options (closable, fadeIn)
     * @param type - Dialog type ('regular' or 'prompt')
     * @param callbacks - Callbacks for dialog events (onConfirm, onCancel, rehydrate)
     * @param processImmediate - If true, immediately display new dialog (push current to stack).
     *                          If false (default), queue the new dialog (LIFO behavior - new dialog on top)
     * @returns Dialog ID string
     */
    show(
        content: DocumentFragment | HTMLElement,
        options?: DialogOptions,
        type: DialogType = 'regular',
        callbacks: DialogCallbacks = {},
        processImmediate = false
    ): string {
        const item: DialogItem = {
            id: uid(),
            content:
                content instanceof DocumentFragment
                    ? (content.cloneNode(true) as DocumentFragment)
                    : (content.cloneNode(true) as HTMLElement),
            options: {
                closable: options?.closable !== undefined ? options.closable : true,
                fadeIn: options?.fadeIn !== undefined ? options.fadeIn : false,
            },
            type,
            callbacks,
            previouslyFocused:
                document.activeElement instanceof HTMLElement ? document.activeElement : null,
        };

        if (!this.current) {
            // No dialog open, show this one immediately
            this.current = item;
            this.renderCurrent();
        } else {
            if (processImmediate) {
                // Push current to stack and show new one immediately
                this.pushCurrentToStack();
                this.current = item;
                this.renderCurrent();
            } else {
                // LIFO: Push current to stack, show new one (most recent on top)
                this.stack.push(this.current);
                this.current = item;
                this.renderCurrent();
            }
        }

        return item.id;
    }

    /**
     * Close the current dialog and restore the previous one from stack
     */
    closeCurrent(): void {
        if (!this.current) return;

        // Remove DOM node
        const root = document.querySelector(`[data-dialog-id="${this.current.id}"]`);
        if (root && root.parentElement) {
            root.parentElement.removeChild(root);
        }

        // Restore focus
        try {
            this.current.previouslyFocused?.focus();
        } catch (e) {
            // Ignore focus errors (element may no longer be in DOM)
        }

        // Pop from stack and render previous dialog
        const popped = this.popStack();
        if (popped) {
            this.current = popped;
            this.renderCurrent();
        } else {
            this.current = undefined;
            // Hide overlay when no more dialogs
            this.overlayEl.classList.remove('visible');
        }
    }

    /**
     * Close all dialogs and clear the stack
     */
    closeAll(): void {
        // Remove current dialog from DOM
        if (this.current) {
            const root = document.querySelector(`[data-dialog-id="${this.current.id}"]`);
            if (root && root.parentElement) {
                root.parentElement.removeChild(root);
            }
        }

        // Clear stack
        this.stack.splice(0);
        this.current = undefined;
        this.overlayEl.classList.remove('visible');
    }

    /**
     * Handle overlay/backdrop clicks
     */
    overlayClickHandler = (): void => {
        if (!this.current) return;
        if (this.current.options.closable) {
            this.closeCurrent();
        }
    };

    /**
     * Push current dialog to stack (internal helper)
     */
    private pushCurrentToStack(): void {
        if (this.current) {
            this.stack.push(this.current);
        }
        this.current = undefined;
    }

    /**
     * Pop dialog from stack (internal helper)
     */
    private popStack(): DialogItem | undefined {
        return this.stack.pop();
    }

    /**
     * Render the current dialog (internal helper)
     *
     * This method:
     * 1. Clones the dialog template
     * 2. Injects the dialog content
     * 3. Appends to DOM
     * 4. Shows overlay
     * 5. Handles focus management
     * 6. Calls rehydrate callback after render
     * 7. Binds prompt buttons if needed
     */
    private async renderCurrent(): Promise<void> {
        if (!this.current) return;

        // Remove any existing visible dialog nodes (cleanup)
        const existingDialogs = document.querySelectorAll('[data-dialog-id]');
        existingDialogs.forEach((dialog) => {
            if (dialog.parentElement) {
                dialog.parentElement.removeChild(dialog);
            }
        });

        // Get template
        const tpl = document.querySelector<HTMLTemplateElement>(this.templateSelector);
        if (!tpl) {
            throw new Error(`Dialog template "${this.templateSelector}" not found`);
        }

        // Clone template
        const clone = tpl.content.cloneNode(true) as DocumentFragment;
        const root = clone.firstElementChild as HTMLElement;
        if (!root) {
            throw new Error('Dialog template must have a root element');
        }

        root.setAttribute('data-dialog-id', this.current.id);

        // Inject content
        const contentContainer = root.querySelector('.dialog-content') as HTMLElement;
        if (!contentContainer) {
            throw new Error('Dialog template must have a .dialog-content element');
        }

        if (this.current.content instanceof DocumentFragment) {
            contentContainer.appendChild(this.current.content.cloneNode(true));
        } else {
            contentContainer.appendChild(this.current.content.cloneNode(true));
        }

        // Handle close button
        const closeBtn = root.querySelector('.dialog-close') as HTMLElement;
        if (closeBtn) {
            if (this.current.options.closable) {
                closeBtn.addEventListener('click', () => {
                    this.closeCurrent();
                });
            } else {
                closeBtn.style.display = 'none';
            }
        }

        // Handle fadeIn effect
        if (this.current.options.fadeIn) {
            root.style.opacity = '0';
            root.style.transform = 'scale(0.9)';
        }

        // Append to DOM
        document.body.appendChild(root);

        // Show overlay
        this.overlayEl.classList.add('visible');

        // Apply fadeIn animation if needed
        if (this.current.options.fadeIn) {
            // Wait for next frame to ensure DOM is ready
            requestAnimationFrame(() => {
                root.style.opacity = '';
                root.style.transform = '';
            });
        }

        // For prompt dialogs, bind confirm/cancel buttons
        if (this.current.type === 'prompt') {
            this.bindPromptButtons(root, this.current);
        }

        // Focus management and rehydrate callback
        // Use requestAnimationFrame to ensure paint has occurred
        const currentItem = this.current; // Capture in closure
        requestAnimationFrame(() => {
            // Call rehydrate callback with actual DOM element
            try {
                currentItem.callbacks.rehydrate?.(root);
            } catch (e) {
                console.error('Error in rehydrate callback:', e);
            }

            // Focus first focusable element or dialog root
            const focusableSelector =
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
            const firstFocusable = root.querySelector<HTMLElement>(focusableSelector);
            if (firstFocusable) {
                firstFocusable.focus();
            } else {
                root.setAttribute('tabindex', '-1');
                root.focus();
            }
        });
    }

    /**
     * Bind confirm/cancel buttons for prompt dialogs
     *
     * For prompt type dialogs, this attaches handlers that:
     * 1. Close the dialog first
     * 2. Then call the user's callback
     */
    private bindPromptButtons(rootEl: HTMLElement, item: DialogItem): void {
        const confirmBtn = rootEl.querySelector<HTMLElement>('.confirm');
        const cancelBtn = rootEl.querySelector<HTMLElement>('.cancel');

        if (confirmBtn && item.callbacks.onConfirm) {
            confirmBtn.addEventListener('click', () => {
                // Close dialog first
                this.closeCurrent();

                // Then call user callback
                try {
                    const result = item.callbacks.onConfirm?.();
                    if (result instanceof Promise) {
                        result.catch((e) => {
                            console.error('Error in onConfirm callback:', e);
                        });
                    }
                } catch (e) {
                    console.error('Error in onConfirm callback:', e);
                }
            });
        }

        if (cancelBtn && item.callbacks.onCancel) {
            cancelBtn.addEventListener('click', () => {
                // Close dialog first
                this.closeCurrent();

                // Then call user callback
                try {
                    const result = item.callbacks.onCancel?.();
                    if (result instanceof Promise) {
                        result.catch((e) => {
                            console.error('Error in onCancel callback:', e);
                        });
                    }
                } catch (e) {
                    console.error('Error in onCancel callback:', e);
                }
            });
        }
    }
}

/**
 * Export singleton instance (lazy initialization)
 * Will be initialized on first access
 */
let _dialogManagerInstance: DialogManager | undefined;

export const getDialogManager = (): DialogManager => {
    if (!_dialogManagerInstance) {
        _dialogManagerInstance = new DialogManager();
    }
    return _dialogManagerInstance;
};

// For backward compatibility, export as dialogManager
export const dialogManager = {
    get show() {
        return getDialogManager().show.bind(getDialogManager());
    },
    get closeCurrent() {
        return getDialogManager().closeCurrent.bind(getDialogManager());
    },
    get closeAll() {
        return getDialogManager().closeAll.bind(getDialogManager());
    },
};
