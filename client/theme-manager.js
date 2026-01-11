/**
 * Theme Manager
 * Manages theme colors and updates the meta theme-color tag for mobile status bars
 */

// Current theme configuration
let currentTheme = {
    name: 'default',
    backgroundColor: 'rgb(136, 136, 136)', // 0x888888
    overlayColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay for dialogs
    overlayAlpha: 0.3
};

let isDialogOpen = false;

/**
 * Blend two colors together based on alpha transparency
 * @param {string} topColor - The top color (e.g., 'rgba(255, 0, 0, 0.5)')
 * @param {string} bottomColor - The bottom color (e.g., 'rgb(0, 0, 255)')
 * @param {number} alphaTop - The alpha value of the top color (0-1)
 * @returns {string} The blended color in RGB format
 */
export function blendColors(topColor, bottomColor, alphaTop) {
    // Extract RGB components from the top and bottom colors
    const top = topColor.match(/\d+/g).map(Number);
    const bottom = bottomColor.match(/\d+/g).map(Number);
    
    // Calculate the resulting RGB values
    const r = Math.round(alphaTop * top[0] + (1 - alphaTop) * bottom[0]);
    const g = Math.round(alphaTop * top[1] + (1 - alphaTop) * bottom[1]);
    const b = Math.round(alphaTop * top[2] + (1 - alphaTop) * bottom[2]);

    // Return the combined color in the RGB format
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convert hex color to RGB string
 * @param {number} hex - Hex color (e.g., 0x888888)
 * @returns {string} RGB color string (e.g., 'rgb(136, 136, 136)')
 */
export function hexToRgb(hex) {
    const r = (hex >> 16) & 0xFF;
    const g = (hex >> 8) & 0xFF;
    const b = hex & 0xFF;
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Update the meta theme-color tag in the document
 * @param {string} color - The color to set (e.g., 'rgb(136, 136, 136)')
 */
function updateMetaThemeColor(color) {
    let metaTag = document.querySelector('meta[name="theme-color"]');
    
    if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'theme-color';
        document.head.appendChild(metaTag);
    }
    
    metaTag.content = color;
}

/**
 * Set the current theme
 * @param {Object} theme - Theme configuration object
 * @param {string} theme.name - Theme name
 * @param {string} theme.backgroundColor - Background color in RGB format
 * @param {string} [theme.overlayColor] - Overlay color in RGBA format
 * @param {number} [theme.overlayAlpha] - Overlay alpha value
 */
export function setTheme(theme) {
    currentTheme = {
        ...currentTheme,
        ...theme
    };
    
    // Update theme color based on current dialog state
    if (isDialogOpen) {
        applyDimmedThemeColor();
    } else {
        applyNormalThemeColor();
    }
}

/**
 * Apply the normal (non-dimmed) theme color
 */
export function applyNormalThemeColor() {
    isDialogOpen = false;
    updateMetaThemeColor(currentTheme.backgroundColor);
}

/**
 * Apply the dimmed theme color (for when dialogs are open)
 */
export function applyDimmedThemeColor() {
    isDialogOpen = true;
    const dimmedColor = blendColors(
        currentTheme.overlayColor,
        currentTheme.backgroundColor,
        currentTheme.overlayAlpha
    );
    updateMetaThemeColor(dimmedColor);
}

/**
 * Initialize the theme manager with a background color
 * @param {number} hexColor - Hex color value (e.g., 0x888888)
 */
export function initThemeManager(hexColor) {
    const rgbColor = hexToRgb(hexColor);
    setTheme({
        name: 'default',
        backgroundColor: rgbColor
    });
}

/**
 * Get the current theme configuration
 * @returns {Object} Current theme object
 */
export function getCurrentTheme() {
    return { ...currentTheme };
}
