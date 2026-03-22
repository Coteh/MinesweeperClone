import { ThemeManager } from '../../manager/theme';
import { DialogEffect } from '../dialog';
import type * as CSS from 'csstype';

type PromptDialogComponentProps = {
    themeManager: ThemeManager;
}

export type PromptDialogRenderProps = {
    content: HTMLElement;
    fadeIn?: boolean;
    effect?: DialogEffect;
    style?: CSS.Properties;
    onConfirm?: () => void;
    onCancel?: () => void;
};

export const createPromptDialogComponent = ({ themeManager }: PromptDialogComponentProps) => {
    return ({ content, fadeIn, effect, style, onConfirm, onCancel }: PromptDialogRenderProps) => {
        // Close any currently existing dialogs
        const dialogElem = document.querySelector('.dialog');
        if (dialogElem) dialogElem.remove();

        const template = document.querySelector('#dialog') as HTMLTemplateElement;
        const clone = template.content.cloneNode(true) as HTMLElement;

        const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;

        (clone.querySelector('button.close') as HTMLElement).style.display = 'none';

        const dialog = clone.querySelector('.dialog') as HTMLDialogElement;
        dialog.classList.add('prompt-dialog');

        const dialogContent = clone.querySelector('.dialog-content') as HTMLElement;
        dialogContent.appendChild(content);

        if (fadeIn) {
            dialog.style.opacity = '0';
            // TODO: Instead of copying over "translate(-50%, -50%)" from the css style,
            // have it base itself off of a computed transform property
            dialog.style.transform = 'translate(-50%, -50%) scale(0.5)';
            setTimeout(() => {
                if (!document.contains(dialog)) return;
                dialog.style.opacity = '';
                dialog.style.transform = 'translate(-50%, -50%)';
            }, 10);
        }

        switch (effect) {
            case 'expand':
                dialog.classList.add('expand-effect');
                break;
            case 'pop':
                dialog.classList.add('pop-effect');
        }

        if (style) {
            Object.assign(dialog.style, style);
        }

        const cancelBtn = clone.querySelector('button.cancel') as HTMLElement;
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const dialog = document.querySelector('.dialog') as HTMLDialogElement;
            dialog.close();
            dialog.remove();
            overlayBackElem.style.display = 'none';
            // Restore appropriate theme color based on current game state when dialog closes
            themeManager.applyNormalColorForCurrentState();
            if (onCancel) {
                onCancel();
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
            themeManager.applyNormalColorForCurrentState();
            if (onConfirm) {
                onConfirm();
            }
        });

        document.body.appendChild(clone);

        overlayBackElem.style.display = 'block';

        dialog.show();

        // Apply dimmed theme color based on current game state when dialog opens
        themeManager.applyDimmedColorForCurrentState();
    };
}
