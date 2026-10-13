/**
 * Long rows and rounds broken at their markers, so the counter can show where you are inside one:
 * "Knit to 1st marker and M1R, slip marker, k1, slip marker, M1L, knit to next marker, …" becomes
 * "Knit to 1st marker and M1R" / "Slip marker, k1, slip marker, M1L" / "Knit to next marker, …".
 * Rows that go round and round ("*k4, k2tog, yo, rep from *") are left whole.
 * Kept free of app code so the tests can run it.
 */

/** "knit to 1st marker", "k to 2 sts before next marker", "work in patt to end of round": knitting up to a place. */
const TRAVEL = /^(?:knit|purl|work|k|p)\b[^,]*?\bto\b[^,]*\b(?:markers?|m|end)\b/i;
/** "slip marker", "sm", "slip the marker" */
const SLIP = /^(?:sm|slip\s+(?:the\s+)?(?:marker|m)|sl\s*m)\b/i;
/** "place marker", "pm", "reach BOR marker": a marker goes on (or you reach one), so a piece ends there. */
const PLACE = /\b(?:pm|place\s+(?:a\s+|the\s+|new\s+)*marker|reach\s+(?:the\s+)?(?:\w+\s+)?marker)\b/i;
/** Rows that repeat a group of stitches across: no sensible places to break them. */
const REPEATS = /\*|\brep(?:eat)?\s+from\b/i;
/** "Increase round: …", "Dec row: …" */
const LABEL = /^([A-Za-z][\w -]{0,24}?\b(?:row|rnd|round)):\s*/i;

/** Splits at commas outside brackets: "Repeat (k3, k2tog) 8 times, then knit" stays in two parts. */
function parts(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[') depth += 1;
    if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
    } else current += ch;
  }
  out.push(current.trim());
  return out.filter(Boolean);
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The pieces of a row, broken where you meet a marker. Undefined when the row is short, has no
 * markers to break at, or repeats a group of stitches: then it reads best as it is.
 */
export function rowPieces(text: string): { label?: string; pieces: string[] } | undefined {
  if (REPEATS.test(text)) return undefined;
  const label = text.match(LABEL);
  const body = (label ? text.slice(label[0].length) : text).trim().replace(/\.$/, '');
  const pieces: string[][] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) pieces.push(current);
    current = [];
  };
  for (const part of parts(body)) {
    const onlySlips = current.length > 0 && current.every((p) => SLIP.test(p));
    // A new piece starts where you knit on to the next place, or slip the marker you just knitted up to.
    // A marker you've just slipped stays with what comes after it.
    if (current.length && !onlySlips && (TRAVEL.test(part) || (SLIP.test(part) && current.some((p) => TRAVEL.test(p))))) flush();
    current.push(part);
    if (PLACE.test(part)) flush();
  }
  flush();
  if (pieces.length < 3) return undefined;
  return {
    ...(label ? { label: label[1] } : {}),
    pieces: pieces.map((p) => capitalize(p.join(', '))),
  };
}
