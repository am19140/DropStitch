export type ParsedStep = {
  text: string;
  rows?: number;
  section?: string;
  startSide?: 'RS' | 'WS';
  inRound?: boolean;
  lines?: string[];
  /** The pattern's full wording for this step, when `text` was shortened. */
  detail?: string;
  /** How many stitches you should have once the step is done, when the pattern says. */
  stitches?: number;
};

const ROW_WORD = String.raw`(?:rows?|rnds?|rounds?|r)`;
const DASH = String.raw`\s*(?:-|–|—|to|through|thru)\s*`;

// "Rows 1-10: ...", "Rnds 5 to 8 ..."
const LEADING_RANGE = new RegExp(String.raw`^${ROW_WORD}\.?\s*(\d+)${DASH}(\d+)\b`, 'i');
// "Row 5: ...", "R12 ..."
const LEADING_SINGLE = new RegExp(String.raw`^${ROW_WORD}\.?\s*(\d+)\b`, 'i');
// "Repeat rows 1-4 three times" (the range can appear anywhere in the line)
const REPEAT_RANGE = new RegExp(String.raw`\brepeat\b.*?\b${ROW_WORD}\.?\s*(\d+)${DASH}(\d+)\b`, 'i');
// "... for 10 rows", "knit 6 rounds", "purl across 1 row"
const ROW_AMOUNT = /\b(\d+)\s*(?:more\s+)?(?:rows?|rounds?|rnds?)\b/i;
// "pick up 3 sts for every 4 rows" is a rate, not an amount
const RATE = /\b(?:every|per|for each)\s+\d+(?:st|nd|rd|th)?\s*(?:rows?|rnds?|rounds?)\b/gi;
// "... 3 times" / "3x"
const TIMES = /\b(\d+)\s*(?:times|x)\b/i;

// "work RS and WS rows 7 times each" → 14 rows
const BOTH_SIDES = /\b(?:RS and WS|WS and RS)\b[^.]*?\b(\d+)\s*times(?:\s*each)?/i;
// "every RS row 5 times", "every other row 5 times", "every 4th row 6 times", "every row 3 times"
const EVERY_NTH = /\bevery\s+(RS|WS|other|alt(?:ernate)?|(\d+)(?:st|nd|rd|th))?\s*(?:row|rnd|round)s?\s+(?:a total of\s+)?(\d+)\s*(?:more\s+)?times/i;

/** Works out how many rows a single line of pattern text covers, if it says. */
export function detectRows(line: string): number | undefined {
  const both = line.match(BOTH_SIDES);
  if (both) return Number(both[1]) * 2;
  const every = line.match(EVERY_NTH);
  if (every) {
    const times = Number(every[3]);
    if (!every[1]) return times;
    if (every[2]) return Number(every[2]) * times;
    return 2 * times;
  }
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
  const amount = line.replace(RATE, '').match(ROW_AMOUNT);
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
      const step: ParsedStep = { text: line };
      if (rows && rows > 0 && rows <= 9999) step.rows = rows;
      if (detectRound(line)) step.inRound = true;
      else {
        const side = detectSide(line);
        if (side) step.startSide = side;
      }
      return step;
    });
}

/** Side of the first row a line talks about ("Row 1 (RS)", "next WS row", "RS and WS"). */
export function detectSide(text: string): 'RS' | 'WS' | undefined {
  // "…ending with a WS row" says where the step ends, not where it starts.
  const m = text.replace(/\bend(?:ing|s)?\s+(?:with|after|on)\s+an?\s+(?:RS|WS)\s+row\b/gi, '').match(/\b(RS|WS)\b/);
  if (!m) return undefined;
  return m[1].toUpperCase() as 'RS' | 'WS';
}

/** Whether a line is worked in the round. */
export function detectRound(text: string): boolean {
  return /\b(rnds?|rounds?|in the round)\b/i.test(text) && !/\b(RS|WS)\b/.test(text);
}
