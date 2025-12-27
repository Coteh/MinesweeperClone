export type Bounds = {
    minX: number; // px
    minY: number; // px
    maxX: number; // px
    maxY: number; // px
};

export type GameDifficulty = {
    displayName: string;
    boardWidth: number;
    boardHeight: number;
    numberOfMines: number;
    bounds: Bounds;
};

export type Config = {
    difficulty: Record<string, GameDifficulty>;
};

const FALLBACK_CONFIG: Config = {
    difficulty: {
        easy: {
            displayName: 'Easy',
            boardWidth: 9,
            boardHeight: 9,
            numberOfMines: 10,
            bounds: {
                minX: -200,
                minY: -200,
                maxX: 200,
                maxY: 200,
            },
        },
    },
};

export async function loadConfig(): Promise<Config> {
    try {
        const resp = await fetch('/config.json');
        if (!resp.ok) {
            console.warn('Failed to fetch config.json, using fallback');
            return FALLBACK_CONFIG;
        }
        const json = (await resp.json()) as Config;
        // Basic validation
        if (!json || !json.difficulty || Object.keys(json.difficulty).length === 0) {
            console.warn('config.json missing difficulty - using fallback');
            return FALLBACK_CONFIG;
        }
        return json;
    } catch (e) {
        console.warn('Error loading config.json', e);
        return FALLBACK_CONFIG;
    }
}
