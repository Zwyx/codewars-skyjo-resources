import Lodash from "lodash";

import {
	Action,
	Card,
	Cell,
	Columns,
	NUMBER_OF_ROWS,
	Player,
	USE_COLORS,
	blackOnWhite,
	blue,
	green,
	red,
	reset,
	yellow,
} from "./common.js";

/**
 * Splitmix32 PRNG;
 * see https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 */
let seed = 0;
const seededPrng = {
	getNext: () => {
		seed |= 0;
		seed = (seed + 0x9e3779b9) | 0;
		let t = seed ^ (seed >>> 16);
		t = Math.imul(t, 0x21f0aaad);
		t = t ^ (t >>> 15);
		t = Math.imul(t, 0x735a2d97);
		return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
	},
};

// MARK: getRandom
/** Returns a random integer between 0 (included) and `maxExcluded` */
export const getRandom = (maxExcluded: number) =>
	Math.floor(Math.random() * maxExcluded);
// Math.floor(seededPrng.getNext() * maxExcluded);

// MARK: shuffle
// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
// https://blog.codinghorror.com/the-danger-of-naivete/
// This is faster than Lodash's implementation
export const shuffle = <T>(deck: T[]): T[] => {
	const newDeck = [...deck];

	for (let i = newDeck.length - 1; i > 0; i--) {
		const j = getRandom(i + 1);
		[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
	}

	return newDeck;
};

// MARK: getPlayersColumnsClone
// _Much_ faster than `structuredClone` and `Lodash.cloneDeep`
export function getPlayersColumnsClone(playersColumns: Columns[]): Columns[] {
	const clonedPlayersColumns = new Array(playersColumns.length) as Columns[];

	for (let i = 0; i < playersColumns.length; i++) {
		const originalColumns = playersColumns[i];
		const clonedColumns = new Array(originalColumns.length) as Columns;

		for (let x = 0; x < originalColumns.length; x++) {
			const originalCells = originalColumns[x];
			const clonedCells = new Array(originalCells.length) as Cell[];

			for (let y = 0; y < originalCells.length; y++) {
				const cell = originalCells[y];

				clonedCells[y] = {
					x: cell.x,
					y: cell.y,
					card: cell.card,
					visible: cell.visible,
				};
			}

			clonedColumns[x] = clonedCells;
		}

		clonedPlayersColumns[i] = clonedColumns;
	}

	return clonedPlayersColumns;
}

// MARK: checkAction
// It'd be easier to use Zod for validation, but we need to include it as one JS file
// in our CodeWars kata, which I preferred not to do.
export function checkAction<T extends boolean>(
	action: unknown,
	numberOfColumnsInPlayerGrid: number,
	startOfGame: T,
): action is T extends true
	? Extract<Action, { action: "flip_two_cards" }>
	: Extract<Action, { action: "swap" | "discard_and_flip" }> {
	if (
		!(
			typeof action === "object" &&
			action &&
			"action" in action &&
			typeof action.action === "string" &&
			("locations" in action || "location" in action)
		)
	) {
		throw Error("Should return an object of type 'Action'.");
	}

	const checkLocation = (location: unknown): location is Location =>
		Boolean(
			typeof location === "object" &&
				location &&
				"x" in location &&
				"y" in location &&
				typeof location.x === "number" &&
				typeof location.y === "number" &&
				location.x >= 0 &&
				location.y >= 0 &&
				location.x < numberOfColumnsInPlayerGrid &&
				location.y < NUMBER_OF_ROWS,
		);

	if (startOfGame) {
		if (action.action !== "flip_two_cards") {
			throw Error(
				"Wrong action returned for start of game; action 'flip_two_cards' was expected.",
			);
		}

		if (
			!(
				"locations" in action &&
				Array.isArray(action.locations) &&
				Array.isArray(action.locations) &&
				action.locations.length === 2 &&
				checkLocation(action.locations[0]) &&
				checkLocation(action.locations[1])
			)
		) {
			throw Error(
				"Should return 'action.locations' as an array of two 'Location' objects, each with 'x' and 'y' greater than or equal to zero and lower than the number of columns (for 'x') and rows (for 'y') in the player's grid.",
			);
		}
	} else {
		if (!(action.action === "swap" || action.action === "discard_and_flip")) {
			throw Error(
				"Wrong action returned; action 'swap' or 'discard_and_flip' was expected.",
			);
		}

		if (!("location" in action && checkLocation(action.location))) {
			throw Error(
				"Should return 'action.location' as a 'Location' object, with 'x' and 'y' greater than or equal to zero and lower than the number of columns (for 'x') and rows (for 'y') in the player's grid.",
			);
		}
	}

	return true;
}

// MARK: getCardString
export const getCardString = (card: Card, visible = true): string => {
	const cardString = `  ${visible ? card : USE_COLORS ? " " : "·"} `.slice(-4);

	const color = visible
		? card < 1
			? blue
			: card < 5
				? green
				: card < 9
					? yellow
					: red
		: blackOnWhite;

	return `${color}${cardString}${reset}`;
};

// MARK: printPlayerGrids
export const printPlayerGrids = (
	players: Player[],
	playersColumns: Columns[],
	stockLength: number,
	discard: Card[],
	currentPlayerIndex?: number,
	currentCardX?: number,
	currentCardY?: number,
) => {
	console.info();

	players.forEach(({ name }, i) => {
		const columns = playersColumns[i];
		const numberOfVisibleCards = getNumberOfVisibleCells(columns);
		const rows = Lodash.zip(...columns) as Columns;
		const sum = getSumOfVisibleCells(columns);

		console.info(
			`  ${name} | Visible card${numberOfVisibleCards !== 1 ? "s" : ""}: ${numberOfVisibleCards} | Sum: ${sum}`,
		);

		const currentPlayerMarker = currentPlayerIndex === i ? "┃" : " ";

		rows.forEach((row, y) => {
			console.info(
				` ${currentPlayerMarker}  ${row
					.map(
						({ card, visible }, x) =>
							`${currentPlayerIndex === i && x === currentCardX && y === currentCardY ? "→ " : ""}${getCardString(card, visible)}`,
					)
					.join("  ")}`.replace("  →", "→"),
			);
		});
	});

	console.info(
		`\nStock: ${stockLength} card${stockLength !== 1 ? "s" : ""} | Discard: ${discard.length} card${discard.length !== 1 ? "s" : ""} with ${getCardString(discard[discard.length - 1])} on top`,
	);

	console.info();
};

const filterCells = (columns: Columns, isVisible: boolean): Cell[] => {
	const result: Cell[] = [];

	for (let x = 0; x < columns.length; x++) {
		for (let y = 0; y < columns[x].length; y++) {
			if (columns[x][y].visible === isVisible) {
				result.push(columns[x][y]);
			}
		}
	}

	return result;
};

// MARK: getVisibleCells
export const getVisibleCells = (columns: Columns): Cell[] =>
	filterCells(columns, true);

// MARK: getHiddenCells
export const getHiddenCells = (columns: Columns): Cell[] =>
	filterCells(columns, false);

// MARK: getNumberOfVisibleCells
export const getNumberOfVisibleCells = (columns: Columns): number =>
	filterCells(columns, true).length;

// MARK: getNumberOfHiddenCells
export const getNumberOfHiddenCells = (columns: Columns): number =>
	filterCells(columns, false).length;

// MARK: areAllCellsVisible
export const areAllCellsVisible = (columns: Columns): boolean => {
	for (let x = 0; x < columns.length; x++) {
		for (let y = 0; y < columns[x].length; y++) {
			if (!columns[x][y].visible) {
				return false;
			}
		}
	}

	return true;
};

// MARK: getSumOfVisibleCells
export const getSumOfVisibleCells = (columns: Columns): number => {
	let sum = 0;

	for (let x = 0; x < columns.length; x++) {
		for (let y = 0; y < columns[x].length; y++) {
			if (columns[x][y].visible) {
				sum += columns[x][y].card;
			}
		}
	}

	return sum;
};

/**
 * @param playerColumns modified by the function
 * @param discard modified by the function
 */
// MARK: removeTriplets
export const removeTriplets = (
	player: Player,
	playerColumns: Columns,
	discard: Card[],
	columnIndex?: number,
): boolean => {
	let removedCount = 0;

	for (
		let x = columnIndex ?? 0;
		x < (columnIndex !== undefined ? columnIndex + 1 : playerColumns.length);
		x++
	) {
		const column = playerColumns[x];

		let firstCard: Card | undefined;
		let tripletFound = true;

		for (let y = 0; y < column.length; y++) {
			const cell = column[y];

			if (!cell.visible) {
				tripletFound = false;
				break;
			}

			if (firstCard === undefined) {
				firstCard = cell.card;
				continue;
			}

			if (cell.card !== firstCard) {
				tripletFound = false;
				break;
			}
		}

		if (tripletFound) {
			playerColumns.splice(x, 1);

			for (let y = 0; y < column.length; y++) {
				discard.push(column[y].card);
			}

			removedCount++;
		}
	}

	if (removedCount > 0) {
		for (let x = 0; x < playerColumns.length; x++) {
			for (let y = 0; y < playerColumns[x].length; y++) {
				playerColumns[x][y].x = x;
			}
		}

		player.totalTriplets += removedCount;
	}

	return removedCount > 0;
};

// MARK: getMin
/**
 * `Math.min` throws `RangeError: Maximum call stack size exceeded.` with big arrays.
 */
export function getMin(array: number[]): number {
	let min = Infinity;

	for (let i = 0; i < array.length; i++) {
		if (array[i] < min) {
			min = array[i];
		}
	}

	return min;
}

// MARK: getMax
/**
 * `Math.max` throws `RangeError: Maximum call stack size exceeded.` with big arrays.
 */
export function getMax(array: number[]): number {
	let max = -Infinity;

	for (let i = 0; i < array.length; i++) {
		if (array[i] > max) {
			max = array[i];
		}
	}

	return max;
}
