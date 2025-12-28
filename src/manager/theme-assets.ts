import type { Theme } from './theme';

// Use import.meta.glob with eager option to gather base assets and theme-specific assets.
// We will return a mapping of logical keys (e.g. 'img/Tiles.png' or 'sound/Win.wav')
// to the resolved URL so the AssetManager can register them and keep backward-compatible keys.

const baseAssets = import.meta.glob('/src/assets/base/**', {
    eager: true,
    query: '?url',
    import: 'default',
}) as Record<string, string>;
const themeAssets = import.meta.glob('/src/assets/themes/*/**', {
    eager: true,
    query: '?url',
    import: 'default',
}) as Record<string, string>;

function logicalKeyFromPath(fullPath: string, basePrefix: string) {
    // fullPath like '/src/assets/base/img/Tiles.png' -> logical 'img/Tiles.png'
    return fullPath.replace(basePrefix, '');
}

export function getThemeAssets(theme: Theme): Record<string, string> {
    const map: Record<string, string> = {};

    // Start with base assets
    Object.entries(baseAssets).forEach(([fullPath, url]) => {
        const key = logicalKeyFromPath(fullPath, '/src/assets/base/');
        map[key] = url;
    });

    // Overlay theme assets for the selected theme
    const themePrefix = `/src/assets/themes/${theme}/`;
    Object.entries(themeAssets).forEach(([fullPath, url]) => {
        if (fullPath.startsWith(themePrefix)) {
            const key = logicalKeyFromPath(fullPath, themePrefix);
            map[key] = url; // override base
        }
    });

    return map;
}
