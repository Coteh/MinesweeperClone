import feather from 'feather-icons';

import type * as CSS from 'csstype';
import { ThemeManager } from '../../manager/theme';

export type DialogEffect = 'expand' | 'pop';

export type DialogOptions = {
    fadeIn?: boolean;
    effect?: DialogEffect;
    closable?: boolean;
    style?: CSS.Properties;
    themeManager?: ThemeManager;
};

export const renderDialog = (content: HTMLElement, options?: DialogOptions) => {
    // Close any currently existing dialogs
    const dialogElem = document.querySelector('.dialog');
    if (dialogElem) dialogElem.remove();

    const template = document.querySelector('#dialog') as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as HTMLElement;

    const dialog = clone.querySelector('.dialog') as HTMLDialogElement;

    const overlayBackElem = document.querySelector('.overlay-back') as HTMLElement;

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
                if (!document.contains(dialog)) return;
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

        const closeBtn = clone.querySelector('button.close') as HTMLElement;
        if (options.closable || options.closable == null) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const dialog = document.querySelector('.dialog') as HTMLDialogElement;
                dialog.close();
                dialog.remove();
                overlayBackElem.style.display = 'none';
                // Restore appropriate theme color based on current game state when dialog closes
                if (themeManagerRef) {
                    themeManagerRef.applyNormalColorForCurrentState();
                }
            });
        } else {
            closeBtn.style.display = 'none';
        }

        if (options.style) {
            Object.assign(dialog.style, options.style);
        }
    }

    document.body.appendChild(clone);

    overlayBackElem.style.display = 'block';

    (document.querySelector(".dialog [data-feather='x']") as HTMLElement).innerText = 'X';
    // TODO: ActionIconManager should handle feather.replace()
    feather.replace();

    dialog.show();

    // Apply dimmed theme color based on current game state when dialog opens
    if (themeManagerRef) {
        themeManagerRef.applyDimmedColorForCurrentState();
    }
};
