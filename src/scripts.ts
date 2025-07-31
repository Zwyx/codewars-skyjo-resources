import Lodash from "lodash";
import { shuffle } from "./utils.js";

/**
 * Used to check the repartition of the shuffler;
 * run `npm run checkShuffleRepartition`
 */
export const checkShuffleRepartition = (withLodash = false) => {
	const originalDeck = [0, 1, 2, 3, 4];

	const repartition: {
		[id: string]: number;
	} = {};

	const startTime = performance.now();

	for (let i = 0; i < 10_000_000; i++) {
		const shuffledDeck = (
			withLodash ? Lodash.shuffle(originalDeck) : shuffle(originalDeck)
		).join();
		repartition[shuffledDeck] = (repartition[shuffledDeck] || 0) + 1;
	}

	const durationString = (performance.now() - startTime) / 1000;

	const allNumberOfAppearances = Object.entries(repartition).map(
		([, numberOfAppearances]) => numberOfAppearances,
	);

	const numberOfAppearanceMin = Math.min(...allNumberOfAppearances);
	const numberOfAppearanceMax = Math.max(...allNumberOfAppearances);
	const numberOfAppearanceSpan = numberOfAppearanceMax - numberOfAppearanceMin;
	const numberOfAppearanceSpanPercent =
		Math.round(
			((numberOfAppearanceMax * 100) / numberOfAppearanceMin - 100) * 100,
		) / 100;

	console.info(Object.fromEntries(Object.entries(repartition).toSorted()));
	console.info(`Min: ${numberOfAppearanceMin}`);
	console.info(`Max: ${numberOfAppearanceMax}`);
	console.info(
		`Span: ${numberOfAppearanceSpan} (${numberOfAppearanceSpanPercent}% of min)`,
	);
	console.info(`Took ${durationString} s`);
};
