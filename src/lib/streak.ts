import { addDays, dayKey } from '@/lib/dates';

export type StreakDay = { key: string; letter: string; isToday: boolean; knitted: boolean; rows: number };

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Knitting streaks from the per-day log in the store (see `knitLog`). */
export function streakInfo(log: Record<string, number>, now = Date.now()) {
  const knitted = (time: number) => dayKey(time) in log;

  // The last seven days, oldest first, ending today.
  const week: StreakDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const time = addDays(now, -i);
    const key = dayKey(time);
    week.push({ key, letter: LETTERS[new Date(time).getDay()], isToday: i === 0, knitted: key in log, rows: log[key] ?? 0 });
  }

  // A streak is still alive until the end of today, so count back from yesterday when today is empty.
  let current = 0;
  for (let time = knitted(now) ? now : addDays(now, -1); knitted(time); time = addDays(time, -1)) current++;

  // Longest run of consecutive days ever.
  let best = 0;
  let run = 0;
  let previous: string | undefined;
  for (const key of Object.keys(log).sort()) {
    const dayBefore = dayKey(addDays(new Date(`${key}T12:00:00`).getTime(), -1));
    run = previous === dayBefore ? run + 1 : 1;
    best = Math.max(best, run);
    previous = key;
  }

  return {
    week,
    current,
    best,
    knittedToday: knitted(now),
    rowsToday: log[dayKey(now)] ?? 0,
    rowsThisWeek: week.reduce((sum, d) => sum + d.rows, 0),
  };
}
