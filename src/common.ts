// Note, across the project, we:
// - use traditional `for` loops as they seem to be 5-10 times more performant than `.map`, `.filter` etc.;
// - pass multiple arguments instead of a single object to function as it seems to lead to a 5-10 % performance
//   improvement (however, returning `[a, b]` instead of `{a, b}` doesn't seem to lead to any improvement);
// - cache computationally intensive values when we can;
// - use Lodash because it is available in Codewars, but Ramda isn't;
// - use a custom clone function or the spread operator, instead of `structuredClone` or `Lodash.cloneDeep`,
//   as they have better performances.

declare global {
	// eslint-disable-next-line no-var -- `var` necessary within `global`
	var dryRun: boolean | undefined;
}

// Uncomment to play only one game and print the players' grids at each turn
global.dryRun = true;

export const NUMBER_OF_GAMES = 3_000;
export const NUMBER_OF_COLUMNS = 4;
export const NUMBER_OF_ROWS = 3;
export const NUMBER_OF_CELLS = NUMBER_OF_COLUMNS * NUMBER_OF_ROWS;
export const NUMBER_OF_PLAYERS = 5;
export const GRID_STOCK_LENGTH = NUMBER_OF_PLAYERS * NUMBER_OF_CELLS;
export const SCORE_ENDING_GAME = 100;
export const PLAYER_0_PERCENT_WIN_REQUIRED = 10;

export const USE_COLORS = true;
export const bold = USE_COLORS ? "\x1b[1m" : "";
export const introGreen = USE_COLORS ? `\x1b[92m` : "";
export const red = USE_COLORS ? `${bold}\x1b[41m\x1b[91m` : "";
export const whiteOnRed = USE_COLORS ? `${bold}\x1b[41m\x1b[10m` : "";
export const green = USE_COLORS ? `${bold}\x1b[42m\x1b[92m` : "";
export const whiteOnGreen = USE_COLORS ? `${bold}\x1b[42m\x1b[10m` : "";
export const yellow = USE_COLORS ? `${bold}\x1b[43m\x1b[93m` : "";
export const blue = USE_COLORS ? `${bold}\x1b[44m\x1b[94m` : "";
export const blackOnWhite = USE_COLORS ? "\x1b[47m\x1b[90m" : "";
export const reset = USE_COLORS ? "\x1b[0m" : "";

export const cards = [
	-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const;
export type Card = (typeof cards)[number];

export type Cell = {
	/** Column index */
	x: number;

	/** Row index */
	y: number;

	/** Card value (must be ignored when the card is face down) */
	card: Card;

	/** Card visibility: `true` is the card is face up (visible), `false` if it is face down (hidden) */
	visible: boolean;
};

export type Column = Cell[];
export type Columns = Column[];

export type Source = "discard" | "stock";

export type Location = { x: number; y: number };

export type Action =
	| {
			action: "flip_two_cards";
			locations: Location[];
	  }
	| {
			action: "swap" | "discard_and_flip";
			location: Location;
	  };

export type PlayFunction = (
	playersColumns: Columns[],
	startOfGame: boolean,
	discard: Card[],
	drawFromStock: () => Card,
	drawFromDiscard: () => Card,
	gameIndex: number,
	roundIndex: number,
	turnIndex: number,
	lastTurn: boolean,
	playersGameScores: number[],
) => Action;

export type PlayFunctionInternal = (
	playersColumns: Columns[],
	startOfGame: boolean,
	discard: Card[],
	drawFromStock: () => Card,
	drawFromDiscard: () => Card,
	gameIndex: number,
	roundIndex: number,
	turnIndex: number,
	lastTurn: boolean,
	playersGameScores: number[],
	playerIndex?: number,
) => Action;

export type PlayFunctionInternalAsync = (
	playersColumns: Columns[],
	startOfGame: boolean,
	discard: Card[],
	drawFromStock: () => Card,
	drawFromDiscard: () => Card,
	gameIndex: number,
	roundIndex: number,
	turnIndex: number,
	lastTurn: boolean,
	playersGameScores: number[],
	playerIndex?: number,
) => Promise<Action>;

export type Player = {
	name: string;
	totalScore: number;
	victories: number;
	totalTriplets: number;
};
