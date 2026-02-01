# Dialog Stack System

A LIFO (Last In, First Out) stacked modal/dialog system for TypeScript applications.

## Overview

This dialog system manages a stack of dialogs where the most recently opened dialog is the active one. When closed, it restores and re-renders the previous dialog with callbacks and focus intact.

## Features

- **LIFO Stack Behavior**: Most recently opened dialog is shown on top
- **Two Dialog Types**: `regular` and `prompt`
- **Focus Management**: Automatically saves and restores focus when dialogs open/close
- **Rehydrate Hook**: Callback that runs after dialog DOM is appended and visible
- **Prompt Wrapping**: For prompt dialogs, callbacks are called after the dialog closes
- **Overlay Click**: Closes current dialog if `closable` option is enabled
- **ProcessImmediate**: Control whether new dialogs are queued or shown immediately
- **Accessibility**: Full ARIA support and keyboard navigation

## API

### DialogManager

The `DialogManager` class is exported as a singleton instance.

```typescript
import { dialogManager } from './ui/dialog/DialogManager';
```

#### Methods

##### `show(content, options?, type?, callbacks?, processImmediate?): string`

Show a new dialog.

- **content**: `DocumentFragment | HTMLElement` - The content to display
- **options**: `DialogOptions` (optional) - Display options
  - `closable`: `boolean` - Whether the dialog can be closed (default: `true`)
  - `fadeIn`: `boolean` - Whether to fade in the dialog (default: `false`)
- **type**: `DialogType` (optional) - Dialog type: `'regular'` or `'prompt'` (default: `'regular'`)
- **callbacks**: `DialogCallbacks` (optional) - Event callbacks
  - `onConfirm`: `() => Promise<void> | void` - Called when prompt is confirmed
  - `onCancel`: `() => Promise<void> | void` - Called when prompt is cancelled
  - `rehydrate`: `(root: HTMLElement) => void | Promise<void>` - Called after DOM is ready
- **processImmediate**: `boolean` (optional) - If `true`, immediately show new dialog. If `false` (default), use LIFO behavior (default: `false`)
- **Returns**: `string` - Unique dialog ID

##### `closeCurrent(): void`

Close the current (topmost) dialog and restore the previous one from the stack.

##### `closeAll(): void`

Close all dialogs and clear the stack.

## Usage Examples

### Basic Regular Dialog

```typescript
import { dialogManager } from './ui/dialog/DialogManager';

const content = document.createElement('div');
content.innerHTML = '<h3>Hello!</h3><p>This is a dialog.</p>';

const dialogId = dialogManager.show(content, {
    closable: true,
    fadeIn: true,
});
```

### Prompt Dialog with Callbacks

```typescript
import { dialogManager } from './ui/dialog/DialogManager';

const content = document.createElement('div');
content.innerHTML = '<p>Are you sure you want to delete this item?</p>';

dialogManager.show(
    content,
    { closable: true },
    'prompt',
    {
        onConfirm: async () => {
            console.log('Deleting item...');
            await deleteItem();
        },
        onCancel: () => {
            console.log('Cancelled');
        },
    }
);
```

### Using Rehydrate Callback

```typescript
import { dialogManager } from './ui/dialog/DialogManager';

const content = document.createElement('div');
content.innerHTML = `
    <h3>Settings</h3>
    <button class="save-button">Save</button>
`;

dialogManager.show(
    content,
    { closable: true },
    'regular',
    {
        rehydrate: (root) => {
            // Called after DOM is appended and visible
            const saveBtn = root.querySelector('.save-button');
            saveBtn?.addEventListener('click', () => {
                console.log('Save clicked');
            });
        },
    }
);
```

### Using processImmediate

```typescript
// Default (LIFO - new dialog on top)
dialogManager.show(contentA); // Shows A
dialogManager.show(contentB); // Shows B (A goes to stack)

// With processImmediate = true
dialogManager.show(contentA); // Shows A
dialogManager.show(contentB, {}, 'regular', {}, true); // Shows B immediately
```

## Integration

### HTML Setup

Ensure your HTML has the dialog template and overlay element:

```html
<!-- Overlay backdrop -->
<div class="overlay-back"></div>

<!-- Dialog template -->
<template id="dialog-template">
    <div class="dialog-stack-item" role="dialog" aria-modal="true">
        <button class="dialog-close" data-action="close" aria-label="Close">×</button>
        <div class="dialog-content"></div>
    </div>
</template>
```

### CSS

Import the dialog CSS in your main stylesheet:

```css
@import './ui/dialog/dialog.css';
```

Or include it in your build process.

## Accessibility

The dialog system includes:

- `role="dialog"` and `aria-modal="true"` attributes
- Automatic focus management (saves and restores focus)
- Keyboard navigation support
- ARIA labels on close buttons
- Focus indicators on interactive elements

## Testing

Unit tests are in `test/DialogManager.test.ts`.
E2E tests are in `cypress/e2e/dialog.cy.ts`.

Run tests:
```bash
npm test
npm run cypress
```

## Architecture

### Dialog Lifecycle

1. User calls `show()` with content and options
2. DialogManager creates a `DialogItem` with unique ID
3. If no current dialog, shows immediately; otherwise manages stack based on `processImmediate`
4. Renders dialog by cloning template and injecting content
5. Shows overlay backdrop
6. Manages focus (saves previous focus, focuses first focusable element)
7. Calls `rehydrate` callback after paint
8. For prompt dialogs, binds confirm/cancel buttons
9. When closed, removes from DOM and restores previous dialog from stack

### Stack Management

The system uses a LIFO (Last In, First Out) stack:

- `show()` pushes current dialog to stack and renders new one
- `closeCurrent()` pops from stack and renders previous dialog
- `closeAll()` clears the entire stack

## Notes

- The singleton instance is created when the module loads
- Overlay element must exist in DOM before importing DialogManager
- All callbacks are wrapped in try/catch to prevent crashes
- Focus restoration handles cases where element is no longer in DOM
- Content is always cloned to avoid modifying original
