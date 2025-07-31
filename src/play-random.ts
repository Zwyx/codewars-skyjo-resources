import { NUMBER_OF_ROWS, PlayFunctionInternal } from "./common.js";
import { getRandom } from "./utils.js";

export const play: PlayFunctionInternal = (
	playersColumns,
	startOfGame,
	discard,
	drawFromStock,
	drawFromDiscard,
	gameIndex,
	roundIndex,
	turnIndex,
	lastTurn,
	playersGameScores,
	playerIndex = 0,
) => {
	const columns = playersColumns[playerIndex];
	const numberOfColumns = columns.length;
	const numberOfRows = columns[0].length;

	if (startOfGame) {
		let x1: number, y1: number, x2: number, y2: number;

		do {
			x1 = getRandom(numberOfColumns);
			y1 = getRandom(numberOfRows);
			x2 = getRandom(numberOfColumns);
			y2 = getRandom(numberOfRows);
		} while (x1 === x2 && y1 === y2);

		return {
			action: "flip_two_cards",
			locations: [
				{ x: x1, y: y1 },
				{ x: x2, y: y2 },
			],
		};
	}

	const drawSource = getRandom(10) < 5 ? "discard" : "stock";

	(drawSource === "discard" ? drawFromDiscard : drawFromStock)();

	const x = getRandom(columns.length);
	const y = getRandom(NUMBER_OF_ROWS);

	return {
		action:
			columns[x][y].visible || drawSource === "discard"
				? "swap"
				: getRandom(10) < 5
					? "discard_and_flip"
					: "swap",
		location: { x, y },
	};
};
