/**
 * Dialog Stack System - Main Export
 *
 * A LIFO stacked modal/dialog system for TypeScript applications
 */

export { DialogManager, dialogManager, getDialogManager } from './DialogManager';
export {
    createContentFromTemplate,
    createContentFromHTML,
    createTextContent,
    createPromptContent,
} from './render';
export type { DialogType, DialogOptions, DialogCallbacks, DialogItem } from './types';
