import feather from 'feather-icons';

import type * as CSS from 'csstype';
import { ThemeManager } from '../../manager/theme';

export type DialogEffect = 'expand' | 'pop';

type DialogComponentProps = {
    themeManager: ThemeManager;
};

export type DialogRenderProps = {
    content: HTMLElement;
    fadeIn?: boolean;
    effect?: DialogEffect;
    closable?: boolean;
    style?: CSS.Properties;
};

export const createDialogComponent = ({ themeManager }: DialogComponentProps) => {
    return ({ content, fadeIn, effect, closable, style }: DialogRenderProps) => {
        // Close any currently existing dialogs
        const dialogElem = document.querySelector('.dialog');
        if (dialogElem) dialogElem.remove();

        const template = document.querySelector('#dialog') as HTMLTemplateElement;
        const clone = template.content.cloneNode(true) as HTMLElement;

        const dialog = clone.querySelector('.dialog') as HTMLDialogElement;

        const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;

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

        const closeBtn = clone.querySelector('button.close') as HTMLElement;
        if (closable || closable == null) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const dialog = document.querySelector('.dialog') as HTMLDialogElement;
                dialog.close();
                dialog.remove();
                overlayBackElem.style.display = 'none';
                // Restore appropriate theme color based on current game state when dialog closes
                themeManager.applyNormalColorForCurrentState();
            });
        } else {
            closeBtn.style.display = 'none';
        }

        if (style) {
            Object.assign(dialog.style, style);
        }

        document.body.appendChild(clone);

        overlayBackElem.style.display = 'block';

        (document.querySelector(".dialog [data-feather='x']") as HTMLElement).innerText = 'X';
        // TODO: ActionIconManager should handle feather.replace()
        feather.replace();

        dialog.show();

        // Apply dimmed theme color based on current game state when dialog opens
        themeManager.applyDimmedColorForCurrentState();
    };
};
