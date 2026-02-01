/**
 * Render utilities for Dialog Stack System
 * 
 * Helper functions for creating dialog content from templates and other sources
 */

/**
 * Create content from an HTML template element
 * 
 * @param selector - CSS selector for the template element (e.g., '#my-dialog-content')
 * @returns DocumentFragment with cloned template content
 * @throws Error if template is not found
 */
export function createContentFromTemplate(selector: string): DocumentFragment {
    const template = document.querySelector<HTMLTemplateElement>(selector);
    if (!template) {
        throw new Error(`Template "${selector}" not found in DOM`);
    }
    return template.content.cloneNode(true) as DocumentFragment;
}

/**
 * Create content from an HTML string
 * 
 * @param html - HTML string to convert to content
 * @returns HTMLElement with the parsed content
 */
export function createContentFromHTML(html: string): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstElementChild as HTMLElement || div;
}

/**
 * Create simple text content in a paragraph
 * 
 * @param text - Text to display
 * @returns HTMLElement with the text
 */
export function createTextContent(text: string): HTMLElement {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
}

/**
 * Create a prompt dialog content with custom message
 * 
 * @param message - Message to display in the prompt
 * @returns HTMLElement with prompt structure including confirm/cancel buttons
 */
export function createPromptContent(message: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'prompt-container';
    
    const messageEl = document.createElement('p');
    messageEl.className = 'prompt-message';
    messageEl.textContent = message;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'prompt-buttons';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'button confirm';
    confirmBtn.textContent = 'Confirm';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'button cancel';
    cancelBtn.textContent = 'Cancel';
    
    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    
    container.appendChild(messageEl);
    container.appendChild(buttonContainer);
    
    return container;
}
