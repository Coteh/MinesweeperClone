export type Bounds = {
    minX: number; // px
    minY: number; // px
    maxX: number; // px
    maxY: number; // px
};

export type GameDifficultyConfig = {
    displayName: string;
    boardWidth: number;
    boardHeight: number;
    numberOfMines: number;
    bounds: Bounds;
};

export type ThemeConfig = {
    displayName: string;
    backgroundColor: string;
    winColor: string;
    loseColor: string;
    highlightColor: string;
    metaThemeColor: string;
    winStatusBarColor?: string;
    loseStatusBarColor?: string;
    popupBackground: string;
    textColor: string;
    tileBackground: string;
    tileBorder: string;
    standardBlockColor: string;
    losingBlockColor: string;
    blockRevealedColor: string;
    mineText1: string;
    mineText2: string;
    mineText3: string;
    mineText4: string;
    mineText5: string;
    mineText6: string;
    mineText7: string;
    mineText8: string;
    dialogBackgroundColor?: string;
    dialogTextColor?: string;
};

export type Config = {
    difficulty: Record<string, GameDifficultyConfig>;
    theme: Record<string, ThemeConfig>;
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
    theme: {
        basic: {
            displayName: 'Basic',
            backgroundColor: '#BBBBBB',
            winColor: '#2ECC71',
            loseColor: '#E74C3C',
            standardBlockColor: '#808080',
            losingBlockColor: '#CC0000',
            blockRevealedColor: '#B3B3B3',
            mineText1: '#0099FF',
            mineText2: '#00FF00',
            mineText3: '#FF0000',
            mineText4: '#0000FF',
            mineText5: '#442200',
            mineText6: '#00FFFF',
            mineText7: '#000000',
            mineText8: '#858585',
            highlightColor: '#FFFF00',
            metaThemeColor: '#BBBBBB',
            popupBackground: '#FFFFFF',
            textColor: '#000000',
            tileBackground: '#BBBBBB',
            tileBorder: '#888888',
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
