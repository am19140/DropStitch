/**
 * Turns the text of a knitting pattern (e.g. read out of a PDF) into steps:
 * - finds the sizes the pattern is written for ("S (M, L, XL)"),
 * - keeps only the numbers for the chosen size ("Cast on 80 (88, 96, 104) sts" → "Cast on 88 sts"),
 * - groups instructions under the pattern's own headings ("LEFT SHOULDER"),
 * - folds "Row 1 … Row 2 … Repeat rows 1–2 7 times" into one step that remembers each row.
 */
import { detectRound, detectRows, detectSide, type ParsedStep } from '@/lib/parse-steps';

export type ParsedPattern = {
  /** Size labels, e.g. ["S", "M", "L"]. Empty when the pattern has one size. */
  sizes: string[];
  /** Builds the steps for one size (index into `sizes`; 0 when there are none). */
  stepsFor: (sizeIndex: number) => ParsedStep[];
};

const NUM = String.raw`(?:\d+(?:[.,]\d+)?|-|–)`;
const SIZE_GROUP = new RegExp(String.raw`(${NUM})\s*[([]\s*((?:${NUM}\s*[,;]\s*)*${NUM})\s*[)\]]`, 'g');

const SKIP_SECTIONS =
  /^(materials?|yarns?|needles?|notions|supplies|gauge|tension|abbreviations?|notes?|pattern notes|sizes?|size|finished (?:measurements|size)|measurements|designer|about|copyright|skill level|techniques)\b/i;

const KNITTING_WORDS =
  /\b(cast on|co|bind off|bo|cast off|knit|purl|k\d+|p\d+|k2tog|p2tog|ssk|sl\d?|slip|rows?|rnds?|rounds?|rep(?:eat)?|work|dec(?:rease)?|inc(?:rease)?|pick up|pm|place marker|turn|join|graft|continue|next row|next rnd|yo)\b/i;

/** Reads the size labels from a "Sizes: S (M, L, XL)" style line. */
function sizeLabels(rest: string): string[] {
  const cleaned = rest.replace(/\b(years?|yrs|months?|mos)\b/gi, '').replace(/\s+/g, ' ').trim();
  const grouped = cleaned.match(/^([^()[\]]+?)\s*[([]\s*([^)\]]+)[)\]]/);
  const parts = grouped
    ? [grouped[1], ...grouped[2].split(/\s*[,;/]\s*/)]
    : cleaned.split(/\s*[,/]\s*|\s+-\s+/);
  const labels = parts.map((p) => p.trim()).filter(Boolean);
  const ok = labels.length >= 2 && labels.length <= 10 && labels.every((l) => l.length <= 14);
  return ok ? labels : [];
}

function findSizes(lines: string[]): string[] {
  for (const line of lines) {
    const m = line.match(/^\s*(?:sizes?|to fit|size\s*\(s\))\s*[:\-–]?\s*(.+)$/i);
    if (m) {
      const labels = sizeLabels(m[1]);
      if (labels.length) return labels;
    }
  }
  return [];
}

/** Keeps only the chosen size's number in "a (b, c)" groups and DROPS-style "a-b-c". */
export function pickSize(text: string, count: number, index: number): string {
  if (count < 2) return text;
  let out = text.replace(SIZE_GROUP, (whole, first: string, rest: string) => {
    const values = [first, ...rest.split(/\s*[,;]\s*/)];
    return values.length === count ? values[index] : whole;
  });
  if (count >= 3) {
    const dashed = new RegExp(String.raw`\b(\d+(?:[.,]\d+)?)((?:-\d+(?:[.,]\d+)?){${count - 1}})\b`, 'g');
    out = out.replace(dashed, (_w, first: string, rest: string) => [first, ...rest.slice(1).split('-')][index]);
  }
  return out;
}

function isHeading(raw: string): boolean {
  const line = raw.trim();
  const text = line.replace(/:$/, '');
  if (text.length < 3 || text.length > 40) return false;
  if (/[.;,]$/.test(line)) return false;
  if (/\d/.test(text) && !/^(?:part|section|step)\s+\d+/i.test(text)) return false;
  const words = text.split(/\s+/);
  if (words.length > 5) return false;
  const upper = text === text.toUpperCase() && /[A-Z]/.test(text);
  const titled = line.endsWith(':') || words.every((w) => /^[A-Z(&]/.test(w) || /^(of|and|the|for|to|a)$/.test(w));
  return upper || titled;
}

function prettySection(heading: string): string {
  const t = heading.trim().replace(/:$/, '');
  if (t !== t.toUpperCase()) return t;
  return t.charAt(0) + t.slice(1).toLowerCase();
}

/** Splits a section's text into instruction pieces. */
function splitInstructions(text: string): string[] {
  const pieces = text
    // New piece before "Row 3", "Rows 1-4", "Rnd 2", "Next row", "Repeat"…
    .replace(/\s+(?=(?:Row|Rows|Rnd|Rnds|Round|Rounds)\s+\d)/g, '\n')
    .replace(/\s+(?=(?:Next (?:row|rnd|round)|Rep(?:eat)?\s))/g, '\n')
    // …and after a full stop that ends a sentence.
    .replace(/([.!])\s+(?=[A-Z*])/g, '$1\n')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  // Glue very short fragments back onto the previous piece.
  const merged: string[] = [];
  for (const p of pieces) {
    if (merged.length && p.length < 14) merged[merged.length - 1] += ` ${p}`;
    else merged.push(p);
  }
  return merged;
}

const ROW_LINE = /^(?:Row|Rnd|Round)\s+(\d+)\b/i;
const REPEAT_RANGE = /\brep(?:eat)?\s+(?:rows?|rnds?|rounds?)\s+(\d+)\s*(?:-|–|—|to|and)\s*(\d+)\s+(\d+)\s*(more\s+)?times/i;

/** Turns instruction pieces into steps, folding "Row 1… Row 2… Repeat rows 1–2 N times" together. */
function toSteps(pieces: string[], section: string | undefined): ParsedStep[] {
  const steps: ParsedStep[] = [];
  let i = 0;
  while (i < pieces.length) {
    // A run of single "Row N" lines…
    const run: string[] = [];
    let j = i;
    while (j < pieces.length && ROW_LINE.test(pieces[j]) && !/\d\s*(?:-|–|to)\s*\d/.test(pieces[j].slice(0, 12))) {
      run.push(pieces[j]);
      j += 1;
    }
    const repeat = j < pieces.length ? pieces[j].match(REPEAT_RANGE) : null;
    if (run.length >= 1 && repeat) {
      const from = Number(repeat[1]);
      const to = Number(repeat[2]);
      const times = Number(repeat[3]) + (repeat[4] ? 1 : 0);
      const lines = run.filter((l) => {
        const n = Number(l.match(ROW_LINE)?.[1]);
        return n >= from && n <= to;
      });
      const block = lines.length ? lines : run;
      const text = [...run, pieces[j]].join(' ');
      steps.push({
        text,
        section,
        rows: block.length * times,
        lines: block,
        ...sideOf(block[0] ?? text),
      });
      i = j + 1;
      continue;
    }

    const piece = pieces[i];
    const rows = detectRows(piece);
    steps.push({ text: piece, section, ...(rows && rows <= 9999 ? { rows } : {}), ...sideOf(piece) });
    i += 1;
  }
  return steps;
}

function sideOf(text: string): Pick<ParsedStep, 'startSide' | 'inRound'> {
  if (detectRound(text)) return { inRound: true };
  const side = detectSide(text);
  return side ? { startSide: side } : {};
}

/** Reads a whole pattern's text. */
export function parsePattern(fullText: string): ParsedPattern {
  const lines = fullText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const sizes = findSizes(lines);

  // Group lines under headings.
  const sections: { title?: string; lines: string[] }[] = [{ lines: [] }];
  for (const line of lines) {
    if (isHeading(line)) sections.push({ title: line, lines: [] });
    else sections[sections.length - 1].lines.push(line);
  }

  const stepsFor = (sizeIndex: number) => {
    const out: ParsedStep[] = [];
    for (const s of sections) {
      if (s.title && SKIP_SECTIONS.test(s.title.trim())) continue;
      const body = pickSize(s.lines.join(' '), sizes.length, sizeIndex);
      const pieces = splitInstructions(body).filter((p) => KNITTING_WORDS.test(p));
      // Skip front matter without a heading (title, intro) unless it reads like instructions.
      if (!s.title && pieces.length < 2) continue;
      out.push(...toSteps(pieces, s.title ? prettySection(s.title) : undefined));
    }
    return out;
  };

  return { sizes, stepsFor };
}
