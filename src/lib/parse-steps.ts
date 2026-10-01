export type ParsedStep = { text: string; rows?: number };

const ROW_WORD = String.raw`(?:rows?|rnds?|rounds?|r)`;
const DASH = String.raw`\s*(?:-|–|—|to|through|thru)\s*`;

// "Rows 1-10: ...", "Rnds 5 to 8 ..."
const LEADING_RANGE = new RegExp(String.raw`^${ROW_WORD}\.?\s*(\d+)${DASH}(\d+)\b`, 'i');
// "Row 5: ...", "R12 ..."
const LEADING_SINGLE = new RegExp(String.raw`^${ROW_WORD}\.?\s*(\d+)\b`, 'i');
// "Repeat rows 1-4 three times" (the range can appear anywhere in the line)
const REPEAT_RANGE = new RegExp(String.raw`\brepeat\b.*?\b${ROW_WORD}\.?\s*(\d+)${DASH}(\d+)\b`, 'i');
// "... for 10 rows", "knit 6 rounds"
const ROW_AMOUNT = /\b(\d+)\s*(?:more\s+)?(?:rows|rounds|rnds)\b/i;
// "... 3 times" / "3x"
const TIMES = /\b(\d+)\s*(?:times|x)\b/i;

/** Works out how many rows a single line of pattern text covers, if it says. */
export function detectRows(line: string): number | undefined {
  const range = line.match(LEADING_RANGE);
  if (range) {
    const from = Number(range[1]);
    const to = Number(range[2]);
    if (to >= from) return to - from + 1;
  }
  if (LEADING_SINGLE.test(line)) return 1;

  const times = Number(line.match(TIMES)?.[1] ?? 1);
  const repeat = line.match(REPEAT_RANGE);
  if (repeat) {
    const from = Number(repeat[1]);
    const to = Number(repeat[2]);
    if (to >= from) return (to - from + 1) * times;
  }
  const amount = line.match(ROW_AMOUNT);
  if (amount) return Number(amount[1]) * times;
  return undefined;
}

/** Splits pasted pattern text into steps: one step per non-empty line. */
export function parseSteps(text: string): ParsedStep[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const rows = detectRows(line);
      return rows && rows > 0 && rows <= 9999 ? { text: line, rows } : { text: line };
    });
}
