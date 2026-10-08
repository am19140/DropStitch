/** Little encouraging messages for the counter screen. */

const START = ['prepare your tea!', 'find your comfiest spot', 'put on a good podcast', 'cast on, cast off, cast away'];
const MIDDLE = [
  'stretch those fingers',
  'sip of tea?',
  'you’re on a roll',
  'biscuit break soon',
  'count it out loud',
  'look at those stitches',
];
const ALMOST = ['almost there!', 'last few rows!', 'nearly done, keep the tea warm'];
const DONE = ['step done! refill your tea', 'look at you go!', 'that’s a wrap, almost'];
const OPEN = ['take it slow', 'enjoy the knitting', 'no rush, no count'];

function pick(list: string[], seed: number) {
  return list[Math.abs(seed) % list.length];
}

/**
 * Picks a message for where the knitter is. It only changes every few rows,
 * so it doesn't flicker with every tap.
 */
export function cheer(stepIndex: number, rowsDone: number, target?: number) {
  const seed = stepIndex * 7 + Math.floor(rowsDone / 4);
  if (!target) return pick(OPEN, seed);
  if (rowsDone >= target) return pick(DONE, stepIndex);
  if (rowsDone === 0) return pick(START, stepIndex);
  if (target - rowsDone <= 3) return pick(ALMOST, seed);
  return pick(MIDDLE, seed);
}
