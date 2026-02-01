# Dialog Stack System - Usage Examples

This document provides practical examples of using the Dialog Stack System in various scenarios.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Prompt Dialogs](#prompt-dialogs)
- [Stacked Dialogs](#stacked-dialogs)
- [Rehydration](#rehydration)
- [Using Templates](#using-templates)
- [Advanced Patterns](#advanced-patterns)

## Basic Usage

### Simple Text Dialog

```typescript
import { dialogManager, createTextContent } from './ui/dialog';

// Show a simple text dialog
const content = createTextContent('Hello, World!');
dialogManager.show(content, {
    closable: true,
    fadeIn: true,
});
```

### HTML Content Dialog

```typescript
import { dialogManager, createContentFromHTML } from './ui/dialog';

const content = createContentFromHTML(`
    <div>
        <h3>Welcome!</h3>
        <p>This is your first dialog.</p>
        <button class="close-btn">Got it!</button>
    </div>
`);

dialogManager.show(content, { closable: true });
```

### Non-Closable Dialog

```typescript
import { dialogManager, createTextContent } from './ui/dialog';

// Dialog that cannot be closed by clicking overlay or close button
const content = createTextContent('Processing... Please wait.');
dialogManager.show(content, {
    closable: false,
    fadeIn: false,
});

// Later, close it programmatically
setTimeout(() => {
    dialogManager.closeCurrent();
}, 3000);
```

## Prompt Dialogs

### Confirmation Dialog

```typescript
import { dialogManager, createPromptContent } from './ui/dialog';

const content = createPromptContent('Are you sure you want to delete this item?');

dialogManager.show(
    content,
    { closable: true, fadeIn: true },
    'prompt',
    {
        onConfirm: async () => {
            console.log('Deleting item...');
            await deleteItem();
            console.log('Item deleted!');
        },
        onCancel: () => {
            console.log('Delete cancelled');
        },
    }
);
```

### Custom Prompt with API Call

```typescript
import { dialogManager, createPromptContent } from './ui/dialog';

const content = createPromptContent('Save changes before closing?');

dialogManager.show(
    content,
    { closable: false }, // Force user to choose
    'prompt',
    {
        onConfirm: async () => {
            try {
                await saveChanges();
                showNotification('Changes saved successfully!');
            } catch (error) {
                showErrorDialog('Failed to save changes');
            }
        },
        onCancel: () => {
            // Discard changes
            discardChanges();
        },
    }
);
```

## Stacked Dialogs

### LIFO Stack Behavior

```typescript
import { dialogManager, createTextContent } from './ui/dialog';

// Open first dialog
const contentA = createTextContent('This is Dialog A');
dialogManager.show(contentA, { closable: true });

// Open second dialog (A goes to stack, B is visible)
const contentB = createTextContent('This is Dialog B');
dialogManager.show(contentB, { closable: true });

// Close B -> A becomes visible again
dialogManager.closeCurrent();
```

### Nested Dialog Flow

```typescript
import { dialogManager, createContentFromHTML } from './ui/dialog';

// First dialog with button to open second
const content1 = createContentFromHTML(`
    <div>
        <h3>Settings</h3>
        <button class="advanced-btn">Advanced Settings</button>
    </div>
`);

dialogManager.show(content1, { closable: true }, 'regular', {
    rehydrate: (root) => {
        const advancedBtn = root.querySelector('.advanced-btn');
        advancedBtn?.addEventListener('click', () => {
            // Open nested dialog
            const content2 = createContentFromHTML(`
                <div>
                    <h3>Advanced Settings</h3>
                    <p>Configure advanced options here.</p>
                </div>
            `);
            dialogManager.show(content2, { closable: true });
        });
    },
});
```

### Wizard/Multi-Step Flow

```typescript
import { dialogManager, createContentFromHTML } from './ui/dialog';

let currentStep = 1;
const totalSteps = 3;

function showWizardStep(step: number) {
    const content = createContentFromHTML(`
        <div class="wizard">
            <h3>Step ${step} of ${totalSteps}</h3>
            <p>Content for step ${step}...</p>
            <div class="wizard-buttons">
                ${step > 1 ? '<button class="prev-btn">Previous</button>' : ''}
                ${step < totalSteps ? '<button class="next-btn">Next</button>' : ''}
                ${step === totalSteps ? '<button class="finish-btn">Finish</button>' : ''}
            </div>
        </div>
    `);

    dialogManager.show(content, { closable: true }, 'regular', {
        rehydrate: (root) => {
            root.querySelector('.next-btn')?.addEventListener('click', () => {
                currentStep++;
                showWizardStep(currentStep);
            });

            root.querySelector('.prev-btn')?.addEventListener('click', () => {
                dialogManager.closeCurrent(); // Go back to previous step
            });

            root.querySelector('.finish-btn')?.addEventListener('click', () => {
                dialogManager.closeAll(); // Close entire wizard
                console.log('Wizard completed!');
            });
        },
    });
}

// Start wizard
showWizardStep(1);
```

## Rehydration

### Event Listeners

```typescript
import { dialogManager, createContentFromHTML } from './ui/dialog';

const content = createContentFromHTML(`
    <div>
        <h3>Interactive Dialog</h3>
        <button class="action-btn">Click Me</button>
        <p class="result"></p>
    </div>
`);

dialogManager.show(content, { closable: true }, 'regular', {
    rehydrate: (root) => {
        // Attach event listeners after DOM is ready
        const btn = root.querySelector('.action-btn') as HTMLButtonElement;
        const result = root.querySelector('.result') as HTMLParagraphElement;

        btn.addEventListener('click', () => {
            result.textContent = 'Button clicked!';
        });
    },
});
```

### Form Handling

```typescript
import { dialogManager, createContentFromHTML } from './ui/dialog';

const content = createContentFromHTML(`
    <form class="user-form">
        <h3>User Information</h3>
        <input type="text" name="username" placeholder="Username" />
        <input type="email" name="email" placeholder="Email" />
        <button type="submit">Submit</button>
    </form>
`);

dialogManager.show(content, { closable: true }, 'regular', {
    rehydrate: (root) => {
        const form = root.querySelector('.user-form') as HTMLFormElement;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            try {
                await submitUserData(data);
                dialogManager.closeCurrent();
                showNotification('User data saved!');
            } catch (error) {
                showErrorDialog('Failed to save user data');
            }
        });
    },
});
```

### Async Rehydration

```typescript
import { dialogManager, createContentFromHTML } from './ui/dialog';

const content = createContentFromHTML(`
    <div>
        <h3>Loading Data...</h3>
        <div class="data-container"></div>
    </div>
`);

dialogManager.show(content, { closable: true }, 'regular', {
    rehydrate: async (root) => {
        const container = root.querySelector('.data-container') as HTMLDivElement;

        try {
            const data = await fetchData();
            container.innerHTML = `<p>${data.message}</p>`;
        } catch (error) {
            container.innerHTML = '<p>Error loading data</p>';
        }
    },
});
```

## Using Templates

### From HTML Template Element

```html
<!-- In your HTML -->
<template id="user-profile-dialog">
    <div class="user-profile">
        <h3>User Profile</h3>
        <img class="avatar" src="" alt="Avatar" />
        <p class="username"></p>
        <p class="email"></p>
    </div>
</template>
```

```typescript
import { dialogManager, createContentFromTemplate } from './ui/dialog';

// Clone and use template
const content = createContentFromTemplate('#user-profile-dialog');

dialogManager.show(content, { closable: true }, 'regular', {
    rehydrate: (root) => {
        // Populate template with user data
        const avatar = root.querySelector('.avatar') as HTMLImageElement;
        const username = root.querySelector('.username') as HTMLParagraphElement;
        const email = root.querySelector('.email') as HTMLParagraphElement;

        avatar.src = user.avatarUrl;
        username.textContent = user.name;
        email.textContent = user.email;
    },
});
```

## Advanced Patterns

### Loading Dialog with Auto-Close

```typescript
import { dialogManager, createTextContent } from './ui/dialog';

async function performAsyncOperation() {
    // Show loading dialog
    const loadingContent = createTextContent('Loading...');
    const dialogId = dialogManager.show(loadingContent, {
        closable: false,
        fadeIn: false,
    });

    try {
        // Perform operation
        await someAsyncTask();

        // Close loading dialog
        dialogManager.closeCurrent();

        // Show success dialog
        const successContent = createTextContent('Operation completed successfully!');
        dialogManager.show(successContent, { closable: true, fadeIn: true });
    } catch (error) {
        // Close loading dialog and show error
        dialogManager.closeCurrent();
        showErrorDialog(error.message);
    }
}
```

### Dialog with Timeout

```typescript
import { dialogManager, createTextContent } from './ui/dialog';

function showTemporaryDialog(message: string, duration: number = 3000) {
    const content = createTextContent(message);
    dialogManager.show(content, { closable: false, fadeIn: true });

    setTimeout(() => {
        dialogManager.closeCurrent();
    }, duration);
}

// Usage
showTemporaryDialog('Changes saved!', 2000);
```

### Confirm Before Navigation

```typescript
import { dialogManager, createPromptContent } from './ui/dialog';

function confirmNavigation(url: string) {
    const content = createPromptContent('You have unsaved changes. Leave anyway?');

    dialogManager.show(
        content,
        { closable: false },
        'prompt',
        {
            onConfirm: () => {
                window.location.href = url;
            },
            onCancel: () => {
                console.log('Navigation cancelled');
            },
        }
    );
}

// Intercept navigation
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        confirmNavigation(newUrl);
    }
});
```

### Dialog Factory Pattern

```typescript
import { dialogManager, createContentFromHTML } from './ui/dialog';

class DialogFactory {
    static showError(message: string) {
        const content = createContentFromHTML(`
            <div class="error-dialog">
                <h3>Error</h3>
                <p>${message}</p>
                <button class="ok-btn">OK</button>
            </div>
        `);

        dialogManager.show(content, { closable: true, fadeIn: true }, 'regular', {
            rehydrate: (root) => {
                root.querySelector('.ok-btn')?.addEventListener('click', () => {
                    dialogManager.closeCurrent();
                });
            },
        });
    }

    static showSuccess(message: string, onClose?: () => void) {
        const content = createContentFromHTML(`
            <div class="success-dialog">
                <h3>Success</h3>
                <p>${message}</p>
            </div>
        `);

        dialogManager.show(content, { closable: true, fadeIn: true });

        if (onClose) {
            setTimeout(() => {
                dialogManager.closeCurrent();
                onClose();
            }, 2000);
        }
    }

    static async showConfirm(message: string): Promise<boolean> {
        return new Promise((resolve) => {
            const content = createPromptContent(message);

            dialogManager.show(
                content,
                { closable: false },
                'prompt',
                {
                    onConfirm: () => resolve(true),
                    onCancel: () => resolve(false),
                }
            );
        });
    }
}

// Usage
DialogFactory.showError('Something went wrong!');

const confirmed = await DialogFactory.showConfirm('Delete this item?');
if (confirmed) {
    await deleteItem();
}

DialogFactory.showSuccess('Item deleted!', () => {
    refreshList();
});
```

## Best Practices

1. **Always use rehydrate for event listeners**: Attach event listeners in the rehydrate callback to ensure the DOM is ready.

2. **Handle async operations properly**: Wrap async operations in try/catch blocks and show appropriate feedback.

3. **Use prompt type for confirmations**: When you need user confirmation, use the 'prompt' type for consistent behavior.

4. **Manage focus**: The dialog system handles focus automatically, but ensure your content has focusable elements.

5. **Clean up resources**: If your dialog creates intervals, timeouts, or other resources, clean them up when the dialog closes.

6. **Use templates for reusable dialogs**: For dialogs you'll show multiple times, use HTML templates.

7. **Test accessibility**: Ensure dialogs are keyboard-navigable and screen-reader friendly.

8. **Avoid deep nesting**: While the system supports stacked dialogs, avoid creating too many nested levels for better UX.
