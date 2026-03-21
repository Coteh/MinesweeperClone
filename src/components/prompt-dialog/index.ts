import { ThemeManager } from '../../manager/theme';
import { DialogEffect } from '../dialog';
import type * as CSS from 'csstype';

export type PromptDialogOptions = {
    fadeIn?: boolean;
    effect?: DialogEffect;
    style?: CSS.Properties;
    onConfirm?: () => void;
    onCancel?: () => void;
    themeManager?: ThemeManager;
};

export const renderPromptDialog = (content: HTMLElement, options?: PromptDialogOptions) => {
    // Close any currently existing dialogs
    const dialogElem = document.querySelector('.dialog');
    if (dialogElem) dialogElem.remove();

    const template = document.querySelector('#dialog') as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as HTMLElement;

    const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;

    (clone.querySelector('button.close') as HTMLElement).style.display = 'none';

    const dialog = clone.querySelector('.dialog') as HTMLDialogElement;

    const dialogContent = clone.querySelector('.dialog-content') as HTMLElement;
    dialogContent.appendChild(content);

    const themeManagerRef = options?.themeManager;

    if (options) {
        if (options.fadeIn) {
            dialog.style.opacity = '0';
            // TODO: Instead of copying over "translate(-50%, -50%)" from the css style,
            // have it base itself off of a computed transform property
            dialog.style.transform = 'translate(-50%, -50%) scale(0.5)';
            setTimeout(() => {
                const dialog = document.querySelector('.dialog') as HTMLElement;
                dialog.style.opacity = '';
                dialog.style.transform = 'translate(-50%, -50%)';
            }, 10);
        }

        switch (options.effect) {
            case 'expand':
                dialog.classList.add('expand-effect');
                break;
            case 'pop':
                dialog.classList.add('pop-effect');
        }

        if (options.style) {
            Object.assign(dialog.style, options.style);
        }
    }

    const cancelBtn = clone.querySelector('button.cancel') as HTMLElement;
    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dialog = document.querySelector('.dialog') as HTMLDialogElement;
        dialog.close();
        dialog.remove();
        overlayBackElem.style.display = 'none';
        // Restore appropriate theme color based on current game state when dialog closes
        if (themeManagerRef) {
            themeManagerRef.applyNormalColorForCurrentState();
        }
        if (options && options.onCancel) {
            options.onCancel();
        }
    });
    const confirmBtn = clone.querySelector('button.confirm') as HTMLElement;
    confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dialog = document.querySelector('.dialog') as HTMLDialogElement;
        dialog.close();
        dialog.remove();
        overlayBackElem.style.display = 'none';
        // Restore appropriate theme color based on current game state when dialog closes
        if (themeManagerRef) {
            themeManagerRef.applyNormalColorForCurrentState();
        }
        if (options && options.onConfirm) {
            options.onConfirm();
        }
    });

    document.body.appendChild(clone);

    overlayBackElem.style.display = 'block';

    dialog.show();

    // Apply dimmed theme color based on current game state when dialog opens
    if (themeManagerRef) {
        themeManagerRef.applyDimmedColorForCurrentState();
    }
};
