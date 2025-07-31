import prompts, { PromptType } from "prompts";
import { PlayFunctionInternalAsync } from "./common.js";
import { getCardString } from "./utils.js";

export const play: PlayFunctionInternalAsync = async (
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

	const validateTwoDigitString = (text: string) => {
		const value = parseInt(text);
		const x = Math.floor(value / 10);
		const y = value % 10;

		return x > 0 && x <= numberOfColumns && y > 0 && y <= numberOfRows
			? true
			: `Enter two numbers: <1-${numberOfColumns}><1-${numberOfRows}>`;
	};

	if (startOfGame) {
		let x1y1: string;

		console.info("");
		console.info("Start of game: flip two cards.");
		console.info(
			"Enter the coordinates of the first card to flip. Example: '12' to flip the card in column 1, row 2.",
		);
		console.info("");

		const actionRes = (await prompts([
			{
				type: "text",
				name: "x1y1",
				message: `First card's xy? <1-${numberOfColumns}><1-${numberOfRows}>`,
				validate: (text: string) => {
					const result = validateTwoDigitString(text);

					if (result !== true) {
						return result;
					}

					x1y1 = text;

					return true;
				},
			},

			{
				type: "text",
				name: "x2y2",
				message: `Second card's xy? <1-${numberOfColumns}><1-${numberOfRows}>`,
				validate: (text: string) => {
					const result = validateTwoDigitString(text);

					if (result !== true) {
						return result;
					}

					if (x1y1 === text) {
						return "Cannot be the same coordinates as the first card.";
					}

					return true;
				},
			},
		])) as {
			x1y1: string;
			x2y2: string;
		};

		return {
			action: "flip_two_cards",
			locations: [
				{
					x: Math.floor(parseInt(actionRes.x1y1) / 10 - 1),
					y: (parseInt(actionRes.x1y1) % 10) - 1,
				},
				{
					x: Math.floor(parseInt(actionRes.x2y2) / 10 - 1),
					y: (parseInt(actionRes.x2y2) % 10) - 1,
				},
			],
		};
	}

	const drawSourceRes = await prompts({
		type: "select",
		name: "drawSource",
		message: "Action?",
		choices: [
			{
				title: `Draw from discard: ${getCardString(discard[discard.length - 1])}`,
				value: "discard",
			},
			{ title: "Draw from stock", value: "stock" },
		],
	});

	(drawSourceRes.drawSource === "discard" ? drawFromDiscard : drawFromStock)();

	const actionRes = (await prompts([
		...(drawSourceRes.drawSource === "stock"
			? [
					{
						type: "select" as PromptType,
						name: "action",
						message: "Action?",
						choices: [
							{ title: "Swap", value: "swap" },
							{ title: "Discard and flip", value: "discard_and_flip" },
						],
					},
				]
			: []),

		{
			type: "text",
			name: "xy",
			message: (prev) =>
				`${prev === "discard_and_flip" ? "Flip" : "Swap"} location's xy? <1-${numberOfColumns}><1-${numberOfRows}>`,
			validate: validateTwoDigitString,
		},
	])) as {
		action: "swap" | "discard_and_flip";
		xy: string;
	};

	return {
		action: actionRes.action || "swap",
		location: {
			x: Math.floor(parseInt(actionRes.xy) / 10 - 1),
			y: (parseInt(actionRes.xy) % 10) - 1,
		},
	};
};
