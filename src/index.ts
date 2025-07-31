import { expect } from "chai";
import { test } from "mocha";
import {
	Action,
	Card,
	Columns,
	GRID_STOCK_LENGTH,
	NUMBER_OF_COLUMNS,
	NUMBER_OF_GAMES,
	NUMBER_OF_PLAYERS,
	NUMBER_OF_ROWS,
	PLAYER_0_PERCENT_WIN_REQUIRED,
	Player,
	SCORE_ENDING_GAME,
	Source,
	cards,
	introGreen,
	reset,
} from "./common.js";
import { play as playControl } from "./play-random.js";
// import { play, play as playControl } from "./play-random.js";
import { play } from "./play-human.js";
// import { play } from "./play.js";
// import { play, play as playControl } from "./play.js";
import {
	areAllCellsVisible,
	checkAction,
	getCardString,
	getMax,
	getPlayersColumnsClone,
	getSumOfVisibleCells,
	printPlayerGrids,
	removeTriplets,
	shuffle,
} from "./utils.js";

const LOG_LEVEL = global.dryRun === true ? 1 : 0;

// prettier-ignore
if (LOG_LEVEL) {
	console.info(`${introGreen}██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗███████╗`);
	console.info("██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝");
	console.info("██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║█████╗  ");
	console.info("██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝  ");
	console.info("╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗");
	console.info(" ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝");
	console.info("                                                              ");
	console.info("████████╗ ██████╗     ███████╗██╗  ██╗██╗   ██╗   ██╗ ██████╗ ");
	console.info("╚══██╔══╝██╔═══██╗    ██╔════╝██║ ██╔╝╚██╗ ██╔╝   ██║██╔═══██╗");
	console.info("   ██║   ██║   ██║    ███████╗█████╔╝  ╚████╔╝    ██║██║   ██║");
	console.info("   ██║   ██║   ██║    ╚════██║██╔═██╗   ╚██╔╝██   ██║██║   ██║");
	console.info("   ██║   ╚██████╔╝    ███████║██║  ██╗   ██║ ╚█████╔╝╚██████╔╝");
	console.info(`   ╚═╝    ╚═════╝     ╚══════╝╚═╝  ╚═╝   ╚═╝  ╚════╝  ╚═════╝ ${reset}`);
	console.info("");
}

const deck: Card[] = cards.flatMap(
	(card) => Array(card === -2 ? 5 : card === 0 ? 15 : 10).fill(card) as Card[],
);

const players: Player[] = Array.from({ length: NUMBER_OF_PLAYERS }, (_, i) => ({
	name: `Player ${i}`,
	totalScore: 0,
	victories: 0,
	totalTriplets: 0,
}));

let gameIndex = 0;
const turnsPerRound: number[] = [];

const playerPlayedFirst: number[] = Array.from(
	{ length: NUMBER_OF_PLAYERS },
	() => 0,
);
const playerTriggeredEnd: number[] = Array.from(
	{ length: NUMBER_OF_PLAYERS },
	() => 0,
);

const getError = (
	message: string,
	askReportOrPlayerIndex: true | number,
): Error =>
	Error(
		(askReportOrPlayerIndex === true
			? "[Please report this issue in this kata's comment section] "
			: askReportOrPlayerIndex !== 0
				? "[Error from control solution, please report this issue in this kata's comment section] "
				: "") + message,
	);

// MARK: playGame
const playGame = async () => {
	const playersGameScores: number[] = Array.from(
		{ length: NUMBER_OF_PLAYERS },
		() => 0,
	);

	let roundIndex = 0;

	// MARK: playRound
	const playRound = async () => {
		const playersGameScoresClone = [...playersGameScores];

		if (LOG_LEVEL) {
			console.info(`Game ${gameIndex} | Round ${roundIndex}`);
		}

		let stock: Card[] = shuffle(deck);

		// Instead of filling the players' grids now with cards from the stock,
		// which would require to filter the arrays before every call to `play`
		// in order to not let the user know what the hidden cards are,
		// we will simply draw new cards from `gridsStock` when they became visible;
		// as the cards are shuffled randomly, it doesn't make a difference
		const gridsStock: Card[] = stock.splice(
			-GRID_STOCK_LENGTH,
			GRID_STOCK_LENGTH,
		);

		let discard: Card[] = stock.splice(-1, 1);

		const playersColumns: Columns[] = Array.from(
			{ length: NUMBER_OF_PLAYERS },
			() =>
				Array.from({ length: NUMBER_OF_COLUMNS }, (_, x) =>
					Array.from({ length: NUMBER_OF_ROWS }, (__, y) => ({
						x,
						y,
						card: 0,
						visible: false,
					})),
				),
		);

		const playerSums: number[] = [];

		for (let i = 0; i < players.length; i++) {
			// MARK: call play
			// eslint-disable-next-line @typescript-eslint/await-thenable -- `await` is used when playing with `play-human.ts`
			const action: unknown = await (i === 0 ? play : playControl)(
				i === 0 ? getPlayersColumnsClone(playersColumns) : playersColumns,
				true,
				i === 0 ? [...discard] : discard,
				() => {
					throw getError(
						"Shouldn't try to draw a card at the start of the game.",
						i,
					);
				},
				() => {
					throw getError(
						"Shouldn't try to draw a card at the start of the game.",
						i,
					);
				},
				gameIndex,
				roundIndex,
				0,
				false,
				playersGameScoresClone,
				i > 0 ? i : undefined,
			);

			if (!checkAction(action, playersColumns[i].length, true)) {
				throw getError("Incorrect action returned.", i);
			}

			const newCards = [gridsStock.pop() as Card, gridsStock.pop() as Card];

			playersColumns[i][action.locations[0].x][action.locations[0].y].card =
				newCards[0];
			playersColumns[i][action.locations[0].x][action.locations[0].y].visible =
				true;

			playersColumns[i][action.locations[1].x][action.locations[1].y].card =
				newCards[1];
			playersColumns[i][action.locations[1].x][action.locations[1].y].visible =
				true;

			playerSums.push(newCards[0] + newCards[1]);
		}

		const playerSumsSortedDesc = playerSums
			.map((playerSum, i) => [playerSum, i])
			.sort(([a], [b]) => b - a);

		const highestPlayersSum = playerSumsSortedDesc[0][0];

		const playerIndexesWithHighestSum = playerSumsSortedDesc
			.filter(([sum]) => sum === highestPlayersSum)
			.map(([, playerIndex]) => playerIndex);

		const playerIndexesWithHighestSumShuffled = shuffle(
			playerIndexesWithHighestSum,
		);

		let playerIndex = playerIndexesWithHighestSumShuffled[0];
		let turnIndex = 0;
		let eogTriggerPlayerIndex: number | undefined = undefined;

		playerPlayedFirst[playerIndex]++;

		// MARK: shuffleDiscard
		const shuffleDiscard = () => {
			if (stock.length) {
				throw getError(
					"Stock not empty, shouldn't have called 'shuffleDiscard'.",
					true,
				);
			}

			if (!discard.length) {
				throw getError("Empty discard, should not happen.", true);
			}

			const newDiscard = discard.splice(-1, 1);
			stock = shuffle(discard);
			discard = newDiscard;
		};

		if (LOG_LEVEL) {
			printPlayerGrids(players, playersColumns, stock.length, discard);
		}

		// MARK: playTurn
		const playTurn = async () => {
			const player = players[playerIndex];
			const playerColumns = playersColumns[playerIndex];

			if (!playerColumns.length) {
				return;
			}

			if (LOG_LEVEL) {
				console.info(
					`Game ${gameIndex} | Round ${roundIndex} | Turn ${turnIndex} | ${player.name}`,
				);
			}

			let drawSource: Source | undefined = undefined;
			// The initial value is only to make TS happy.
			let drawnCard: Card = 0;
			let drawnCardString: string;

			const draw = (from: Source) => {
				if (drawSource) {
					throw getError("Shouldn't try to draw more than once.", playerIndex);
				}

				drawSource = from;

				if (drawSource === "stock" && !stock.length) {
					shuffleDiscard();
				}

				const newCard = (drawSource === "discard" ? discard : stock).pop();

				if (newCard === undefined) {
					throw getError(`Empty ${drawSource}, should not happen.`, true);
				}

				drawnCard = newCard;
				drawnCardString = getCardString(drawnCard);

				if (LOG_LEVEL) {
					console.info(`  Drawing card from ${drawSource}: ${drawnCardString}`);
				}

				return drawnCard;
			};

			// MARK: call play
			// eslint-disable-next-line @typescript-eslint/await-thenable -- `await` is used when playing with `play-human.ts`
			const action: unknown = await (playerIndex === 0 ? play : playControl)(
				playerIndex === 0
					? getPlayersColumnsClone(playersColumns)
					: playersColumns,
				false,
				playerIndex === 0 ? [...discard] : discard,
				() => draw("stock"),
				() => draw("discard"),
				gameIndex,
				roundIndex,
				turnIndex,
				eogTriggerPlayerIndex !== undefined,
				playersGameScoresClone,
				playerIndex > 0 ? playerIndex : undefined,
			);

			if (!(drawSource as Source | undefined)) {
				throw getError("Should have drawn a card.", playerIndex);
			}

			if (!checkAction(action, playersColumns[playerIndex].length, false)) {
				throw getError("Incorrect action returned.", playerIndex);
			}

			if (
				(drawSource as Source | undefined) === "discard" &&
				action.action === "discard_and_flip"
			) {
				throw getError(
					"Cannot discard a card drawn from the discard pile.",
					playerIndex,
				);
			}

			if (
				action.action === "discard_and_flip" &&
				playersColumns[playerIndex][action.location.x][action.location.y]
					.visible
			) {
				throw getError(
					"Cannot flip a card that is already face up.",
					playerIndex,
				);
			}

			// MARK: discardAndFlip
			const discardAndFlip = (x: number, y: number) => {
				discard.push(drawnCard);

				const flippedCard = gridsStock.pop();

				if (flippedCard === undefined) {
					throw getError("Empty 'gridsStock', should not happen", true);
				}

				playerColumns[x][y].card = flippedCard;
				playerColumns[x][y].visible = true;

				if (LOG_LEVEL) {
					console.info(
						`  Discarding ${drawnCardString} and flipping card at {${x},${y}}: ${getCardString(playerColumns[x][y].card)}`,
					);
				}
			};

			// MARK: swap
			const swap = (x: number, y: number) => {
				let swappedCardWasVisible: boolean;
				let newDiscardTopCard: Card;

				if (!playerColumns[x][y].visible) {
					swappedCardWasVisible = false;

					const swappedCard = gridsStock.pop();

					if (swappedCard === undefined) {
						throw getError("Empty 'gridsStock', should not happen", true);
					}

					newDiscardTopCard = swappedCard;
					discard.push(newDiscardTopCard);
					playerColumns[x][y].visible = true;
				} else {
					swappedCardWasVisible = true;
					newDiscardTopCard = playerColumns[x][y].card;
					discard.push(newDiscardTopCard);
				}

				if (LOG_LEVEL) {
					console.info(
						`  Swapping ${drawnCardString} with ${swappedCardWasVisible ? "visible" : "flipped"} ${getCardString(newDiscardTopCard)} at {${x},${y}}`,
					);
				}

				playerColumns[x][y].card = drawnCard;
			};

			(action.action === "discard_and_flip" ? discardAndFlip : swap)(
				action.location.x,
				action.location.y,
			);

			const hasRemovedTriplet = removeTriplets(
				player,
				playerColumns,
				discard,
				action.location.x,
			);

			if (
				eogTriggerPlayerIndex === undefined &&
				areAllCellsVisible(playerColumns)
			) {
				if (LOG_LEVEL) {
					console.info(`  End of round triggered by ${player.name}`);
				}
				eogTriggerPlayerIndex = playerIndex;
				playerTriggeredEnd[playerIndex]++;
			}

			if (LOG_LEVEL) {
				printPlayerGrids(
					players,
					playersColumns,
					stock.length,
					discard,
					playerIndex,
					hasRemovedTriplet ? undefined : action.location.x,
					hasRemovedTriplet ? undefined : action.location.y,
				);
			}
		};

		// MARK: play turns
		while (playerIndex !== eogTriggerPlayerIndex) {
			turnIndex++;

			await playTurn();

			playerIndex = playerIndex >= NUMBER_OF_PLAYERS - 1 ? 0 : playerIndex + 1;
		}

		if (LOG_LEVEL) {
			console.info(`Round finished in ${turnIndex} turns!`);
		}

		turnsPerRound.push(turnIndex);

		for (let i = 0; i < playersColumns.length; i++) {
			for (let x = 0; x < playersColumns[i].length; x++) {
				for (let y = 0; y < playersColumns[i][x].length; y++) {
					if (!playersColumns[i][x][y].visible) {
						const flippedCard = gridsStock.pop();

						if (flippedCard === undefined) {
							throw getError("Empty 'gridsStock', should not happen", true);
						}

						playersColumns[i][x][y].card = flippedCard;
						playersColumns[i][x][y].visible = true;
					}
				}
			}
		}

		const roundScores: number[] = [];
		let roundScoreMin = Infinity;

		for (let i = 0; i < players.length; i++) {
			removeTriplets(players[i], playersColumns[i], discard, undefined);

			const roundScore = getSumOfVisibleCells(playersColumns[i]);

			roundScores.push(roundScore);

			if (roundScore < roundScoreMin) {
				roundScoreMin = roundScore;
			}
		}

		let roundScoreDoubled = false;

		if (
			roundScores[eogTriggerPlayerIndex] > roundScoreMin ||
			(roundScores[eogTriggerPlayerIndex] === roundScoreMin &&
				roundScores.filter((score) => score === roundScoreMin).length > 1 &&
				roundScores[eogTriggerPlayerIndex] > 0)
		) {
			roundScores[eogTriggerPlayerIndex] *= 2;
			roundScoreDoubled = true;
		}

		if (LOG_LEVEL) {
			printPlayerGrids(players, playersColumns, stock.length, discard);
		}

		for (let i = 0; i < players.length; i++) {
			playersGameScores[i] += roundScores[i];
			players[i].totalScore += roundScores[i];

			const winner = roundScores[i] === roundScoreMin;
			const roundScoreString = roundScores[i].toLocaleString();

			if (LOG_LEVEL) {
				console.info(
					`  ${players[i].name} | ${winner ? "Winner" : "      "} | Round score: ${roundScoreString}${roundScoreDoubled && i === eogTriggerPlayerIndex ? " (doubled!)" : ""}`,
				);
			}
		}

		if (LOG_LEVEL) {
			console.info();
		}
	};

	// MARK: play rounds
	do {
		roundIndex++;
		await playRound();
	} while (Math.max(...playersGameScores) < SCORE_ENDING_GAME);

	if (LOG_LEVEL) {
		console.info(`Game finished in ${roundIndex} rounds!`);
	}

	const gameScoreMin = Math.min(...playersGameScores);

	for (let i = 0; i < players.length; i++) {
		const winner = playersGameScores[i] === gameScoreMin;

		if (winner) {
			players[i].victories++;
		}

		const gameScoreString = playersGameScores[i].toLocaleString();

		if (LOG_LEVEL) {
			console.info(
				`  ${players[i].name} | ${winner ? "Winner" : "      "} | Game score: ${gameScoreString}`,
			);
		}
	}

	if (LOG_LEVEL) {
		console.info();
	}
};

// MARK: playSkyjo
async function playSkyjo(): Promise<{
	player0Won: boolean;
	player0PercentWinMoreOfAverageOthers: number;
}> {
	const startTime = performance.now();

	while (gameIndex < (LOG_LEVEL ? 1 : NUMBER_OF_GAMES)) {
		gameIndex++;
		await playGame();
	}

	const durationString = Math.round((performance.now() - startTime) / 10) / 100;

	console.info(
		`${gameIndex.toLocaleString()} game${gameIndex !== 1 ? "s" : ""} (${turnsPerRound.length.toLocaleString()} round${turnsPerRound.length !== 1 ? "s" : ""}) played in ${durationString} s`,
	);

	const victories = players.map((player) => player.victories);

	const victoriesMax = getMax(victories);

	const averageNotPlayer0 =
		victories.reduce((acc, cur, i) => acc + (i === 0 ? 0 : cur), 0) /
		(victories.length - 1);
	const player0PercentWinMoreOfAverageOthers =
		Math.round(((victories[0] * 100) / averageNotPlayer0 - 100) * 100) / 100;

	console.info();

	let player0Won = false;

	players.forEach(({ name, victories: playerVictories }, i) => {
		if (i === 0 && playerVictories === victoriesMax) {
			player0Won = true;
		}

		const victoriesString = `${playerVictories.toLocaleString()}${i === 0 && player0Won ? " – Winner 🎉" : ""}`;

		console.info(`  ${name} | Victories: ${victoriesString}`);
	});

	if (player0Won) {
		console.info(
			`\n  Player 0 wins ${player0PercentWinMoreOfAverageOthers} % more than the average of the other players${player0PercentWinMoreOfAverageOthers > PLAYER_0_PERCENT_WIN_REQUIRED ? " 🎉 🎉" : ""}`,
		);
	}

	return {
		player0Won,
		player0PercentWinMoreOfAverageOthers,
	};
}

if (
	process.versions.bun ||
	process.env.npm_lifecycle_event === "dev" ||
	process.env.npm_lifecycle_event === "start" ||
	process.env.npm_lifecycle_event === "prof"
) {
	await playSkyjo();
	process.exit();
}

// ----------------------------------------------------------------------------
// MARK: TESTS
// ----------------------------------------------------------------------------

const emptyPlayerColumns: Columns = [
	[
		{ x: 0, y: 0, visible: false, card: 0 },
		{ x: 0, y: 1, visible: false, card: 0 },
		{ x: 0, y: 2, visible: false, card: 0 },
	],
	[
		{ x: 1, y: 0, visible: false, card: 0 },
		{ x: 1, y: 1, visible: false, card: 0 },
		{ x: 1, y: 2, visible: false, card: 0 },
	],
	[
		{ x: 2, y: 0, visible: false, card: 0 },
		{ x: 2, y: 1, visible: false, card: 0 },
		{ x: 2, y: 2, visible: false, card: 0 },
	],
	[
		{ x: 3, y: 0, visible: false, card: 0 },
		{ x: 3, y: 1, visible: false, card: 0 },
		{ x: 3, y: 2, visible: false, card: 0 },
	],
];

describe("Start of game, flip first two cards", () => {
	test("should return an object of type Action, with 'action' 'flip_two_cards' and 'location' an array with the location of two cards", async () => {
		// eslint-disable-next-line @typescript-eslint/await-thenable -- `await` is used when playing with `play-human.ts`
		const action = (await play(
			[
				emptyPlayerColumns,
				emptyPlayerColumns,
				emptyPlayerColumns,
				emptyPlayerColumns,
				emptyPlayerColumns,
			],
			true,
			[0],
			() => {
				throw Error("Shouldn't try to draw a card at the start of the game.");
			},
			() => {
				throw Error("Shouldn't try to draw a card at the start of the game.");
			},
			1,
			1,
			0,
			false,
			[0, 0, 0, 0, 0],
		)) as Extract<Action, { action: "flip_two_cards" }>;

		expect(action).to.have.property("action");
		expect(action.action).to.equal("flip_two_cards");
		expect(action).to.have.property("locations");
		expect(action.locations).to.be.an("array");

		for (let i = 0; i < 2; i++) {
			expect(action.locations[i]).to.have.property("x");
			expect(action.locations[i]).to.have.property("y");
			expect(action.locations[i].x).to.be.greaterThanOrEqual(0);
			expect(action.locations[i].x).to.be.lessThan(4);
			expect(action.locations[i].y).to.be.greaterThanOrEqual(0);
			expect(action.locations[i].y).to.be.lessThan(3);
		}
	});
});

describe("Triplet completion", () => {
	test("should complete a triplet", async () => {
		// eslint-disable-next-line @typescript-eslint/await-thenable -- `await` is used when playing with `play-human.ts`
		const action = (await play(
			[
				[
					[
						{ x: 0, y: 0, visible: true, card: 5 },
						{ x: 0, y: 1, visible: true, card: 5 },
						{ x: 0, y: 2, visible: false, card: 0 },
					],
					[
						{ x: 1, y: 0, visible: false, card: 0 },
						{ x: 1, y: 1, visible: false, card: 0 },
						{ x: 1, y: 2, visible: false, card: 0 },
					],
					[
						{ x: 2, y: 0, visible: false, card: 0 },
						{ x: 2, y: 1, visible: false, card: 0 },
						{ x: 2, y: 2, visible: false, card: 0 },
					],
					[
						{ x: 3, y: 0, visible: false, card: 0 },
						{ x: 3, y: 1, visible: false, card: 0 },
						{ x: 3, y: 2, visible: false, card: 0 },
					],
				],
				emptyPlayerColumns,
				emptyPlayerColumns,
				emptyPlayerColumns,
				emptyPlayerColumns,
			],
			false,
			[5],
			() => {
				throw Error(
					"Shouldn't try to draw from the stock, as the discard top card can complete a triplet.",
				);
			},
			() => 5,
			1,
			1,
			1,
			false,
			[0, 0, 0, 0, 0],
		)) as Extract<Action, { action: "swap" | "discard_and_flip" }>;

		expect(action).to.have.property("action");
		expect(action.action).to.equal("swap");
		expect(action).to.have.property("location");
		expect(action.location).to.have.property("x");
		expect(action.location).to.have.property("y");
		expect(action.location.x).to.equal(0);
		expect(action.location.y).to.equal(2);
	});
});

describe("Win at Skyjo", () => {
	test(`should win at least ${PLAYER_0_PERCENT_WIN_REQUIRED} % more than the average of the other players`, async () => {
		const gameResult = await playSkyjo();

		expect(gameResult.player0Won).to.equal(true);
		expect(
			gameResult.player0PercentWinMoreOfAverageOthers,
		).to.be.greaterThanOrEqual(PLAYER_0_PERCENT_WIN_REQUIRED);
	}).timeout(30000);

	test(`should have played ${NUMBER_OF_GAMES} games`, () => {
		expect(gameIndex).to.be.greaterThanOrEqual(NUMBER_OF_GAMES);
	});
});
