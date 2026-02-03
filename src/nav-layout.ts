import { CLASSIC_THEME } from './consts';

const ids = ['mine-count-board', 'new-game', 'time-board'] as const;

export function updateNavLayout(theme: string): void {
    const navContainer = document.querySelector('.nav-game-controls') as HTMLElement;
    const gameTop = document.querySelector('.game-top') as HTMLElement;

    if (!navContainer || !gameTop) return;

    const target = theme === CLASSIC_THEME ? gameTop : navContainer;

    for (const id of ids) {
        const el = document.getElementById(id);
        if (el && !target.contains(el)) {
            target.appendChild(el);
        }
    }
}
