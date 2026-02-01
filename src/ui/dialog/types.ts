/**
 * Dialog system types and interfaces
 */

export type DialogType = 'regular' | 'prompt';

export interface DialogOptions {
    closable?: boolean; // default true
    fadeIn?: boolean;
}

export interface DialogCallbacks {
    onConfirm?: () => Promise<void> | void;
    onCancel?: () => Promise<void> | void;
    rehydrate?: (root: HTMLElement) => void | Promise<void>;
}

export interface DialogItem {
    id: string;
    content: DocumentFragment | HTMLElement;
    options: Required<DialogOptions>;
    type: DialogType;
    callbacks: DialogCallbacks;
    previouslyFocused?: HTMLElement | null;
}
