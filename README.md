# Codewars Skyjo Resources

Resources for developers attempting to solve the Codewars kata [Wind at Skyjo](https://www.codewars.com/kata/688b957a12698cb53d5959fe).

---

<div align="center">

**Play the game right now in your browser to get familiar with the rules!**

**[stackblitz.com/~/github.com/Zwyx/codewars-skyjo-resources](https://stackblitz.com/~/github.com/Zwyx/codewars-skyjo-resources)**

**Once Stackblitz opens, wait for its terminal to automatically start the game.**

Extend the terminal view to be sure to see your grid. You are **Player 0**.

</div>

---

This repository includes:

- The game engine – `src/index.ts` – which will allow you to start working on your solution locally.
- An interactive playing script – `src/play-human.ts` – so you can start playing the game right now.
- A simple, random, playing algorithm – `src/play-random.ts` – against which you can play.

To play against the random playing algorithm, simply head to [stackblitz.com/~/github.com/Zwyx/codewars-skyjo-resources](https://stackblitz.com/~/github.com/Zwyx/codewars-skyjo-resources).

To start working on your solution, clone this repository, run `npm ci`, change the imports of the `play` and `playControl` functions in `src/index.ts` to include `src/play.ts` (your solution), then

- if you have Bun installed, simply execute the TypeScript files by running:

```sh
npm run dev
```

- otherwise, build the TypeScript files and run the program with Node by running:

```sh
npm start
```

While working on your solution, you can make the game predictable by modifying the function `getRandom` in `src/utils.ts`: comment the line with `Math.random`, and uncomment the one with `seededPrng`. You might find this useful to compare performance or reproduce issues.
