/**
 * Turns the text of a knitting pattern (as read out of a PDF) into short, knittable steps:
 * - finds the sizes ("XS (S) M (L) XL", "S (M, L, XL)") and keeps only the chosen size's numbers,
 * - follows the pattern's own headings ("Left shoulder") so the counter can say where you are,
 * - leaves out the front matter (gauge, yarn, needles), descriptions, size guides and abbreviations,
 * - folds "Row 1 … Row 2 … Work Row 1 and 2 a total of 5 times" into one step that knows each row,
 * - trims every instruction to what you need while knitting: no video links, inch conversions or
 *   asides. The pattern's full wording is kept alongside (`detail`) for when you want it.
 */
import { detectRound, detectRows, detectSide, type ParsedStep } from '@/lib/parse-steps';

export type ParsedPattern = {
  /** Size labels, e.g. ["XS", "S", "M"]. Empty when the pattern has one size. */
  sizes: string[];
  /** Builds the steps for one size (index into `sizes`; 0 when there are none). */
  stepsFor: (sizeIndex: number) => ParsedStep[];
};

type Side = 'RS' | 'WS';

// ---------------------------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------------------------

const FRACTION = '[¼½¾⅓⅔⅛⅜⅝⅞]';
const PLAIN = String.raw`(?:\d+(?:[.,]\d+)?${FRACTION}?|${FRACTION})(?:st|nd|rd|th)?`;
/** One size's value: "86", "45¼", "9th", "500-600", or "-" when a size skips it. */
const VALUE = String.raw`(?:${PLAIN}(?:[-–]${PLAIN})?|[-–])`;
/** "80 (88, 96, 104)" */
const COMMA_GROUP = new RegExp(String.raw`(${VALUE})\s*[([]\s*((?:${VALUE}\s*[,;]\s*)*${VALUE})\s*[)\]]`, 'g');

/** "86 (90) 94 (96) 100": values alternating in and out of brackets, one per size. */
function alternatingGroup(count: number) {
  const parts = Array.from({ length: count }, (_, i) => (i % 2 ? String.raw`\(\s*(${VALUE})\s*\)` : `(${VALUE})`));
  return new RegExp(String.raw`(^|[^\w(.,¼½¾])${parts.join(String.raw`\s*`)}(?![\w(¼½¾])`, 'g');
}

/** Reads the size labels from a "Sizes: XS (S) M (L)" or "Sizes: S (M, L, XL)" style line. */
function sizeLabels(rest: string): string[] {
  const cleaned = rest
    .replace(/\b(years?|yrs|months?|mos)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  let parts: string[];
  if (/^[^\s()]+(?:\s*\([^\s()]+\)\s*[^\s()]+)*(?:\s*\([^\s()]+\))?$/.test(cleaned)) {
    parts = cleaned.replace(/[()]/g, ' ').split(/\s+/);
  } else {
    const grouped = cleaned.match(/^([^()[\]]+?)\s*[([]\s*([^)\]]+)[)\]]/);
    parts = grouped ? [grouped[1], ...grouped[2].split(/\s*[,;/]\s*/)] : cleaned.split(/\s*[,/]\s*|\s+-\s+/);
  }
  const labels = parts.map((p) => p.trim()).filter(Boolean);
  const ok = labels.length >= 2 && labels.length <= 12 && labels.every((l) => l.length <= 14);
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

/** Keeps only the chosen size's numbers: "86 (90) 94" / "80 (88, 96)" / "80-88-96" → the one for `index`. */
export function pickSize(text: string, count: number, index: number): string {
  if (count < 2) return text;
  let out = text.replace(alternatingGroup(count), (...m: string[]) => m[1] + m[2 + index]);
  out = out.replace(COMMA_GROUP, (whole, first: string, rest: string) => {
    const values = [first, ...rest.split(/\s*[,;]\s*/)];
    return values.length === count ? values[index] : whole;
  });
  if (count >= 3) {
    const dashed = new RegExp(String.raw`\b(\d+(?:[.,]\d+)?)((?:-\d+(?:[.,]\d+)?){${count - 1}})\b`, 'g');
    out = out.replace(dashed, (_w, first: string, rest: string) => [first, ...rest.slice(1).split('-')][index]);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Lines and headings
// ---------------------------------------------------------------------------------------------

/** Front-matter lines ("Gauge: 15 sts…", "Needles: …") — skipped along with the rest of their paragraph. */
const META =
  /^(?:sizes?|size guide|to fit|bust|chest|hip|finished|measurements?|length|width|ease|gauge|tension|needles?|hooks?|materials?|yarns?|notions|supplies|you will need|designer|skill level|difficulty|techniques)\b[^:]{0,40}:/i;

/** Sections that never hold knitting steps. */
const SKIP_SECTIONS =
  /^(?:materials?|yarns?|needles?|notions|supplies|gauge|tension|abbreviations?|glossary|notes?|pattern notes|sizes?|size guide|sizing|finished (?:measurements|size)|measurements|designer|about\b.*|copyright|skill level|(?:special )?techniques|stitch guide|stitches used|construction|before you (?:begin|start)|tips?)$/i;

/** Words that start an instruction ("Cast on…", "K3, M1L…", "Row 1 (RS)…", "Pick up and knit…"). */
const INSTRUCTION =
  /^(?:\*\s*)?(?:cast\s+on|co|cast\s+off|bind\s+off|bo|knit|purl|k\d*\w*|p\d+\w*|k2tog|p2tog|ssk|ssp|kfb|m1[lrp]?|yo|sl\d*|slip|work|continue|change|switch|pick\s+up|join|place|pm|remove|break|cut|turn|rep(?:eat)?|weave|inc(?:rease)?|dec(?:rease)?|transfer|divide|move|put|hold|graft|sew|seam|block|wash|try|measure|do\s+not|don['’]t|insert|using|with|rows?|rnds?|rounds?|next|end|start|fold|attach|thread|leave)\b/i;

/** "Now…", "Then,…", "RS facing with the cast-on edge on top,…" — lead-ins that come before the verb. */
const LEAD = /^(?:(?:now|then|next|finally|first|afterwards)\b,?\s*|(?:with\s+)?(?:RS|WS|right side|wrong side)\s+facing\b[^,]*,\s*)+/i;

function isHeading(lines: string[], i: number): boolean {
  const line = lines[i];
  const text = line.replace(/:$/, '');
  if (text.length < 3 || text.length > 40) return false;
  if (/[.;,!?)\]]$/.test(text) || !/^[A-Z]/.test(text)) return false;
  if (/\d/.test(text) && !/^(?:part|section|step)\s+\d+/i.test(text)) return false;
  if (text.split(/\s+/).length > 5 || INSTRUCTION.test(text) || META.test(line)) return false;
  if (text === text.toUpperCase()) return true;
  // A heading in sentence case stands on its own: the line before finishes a sentence, the line after starts one.
  const before = lines.slice(0, i).reverse().find(Boolean);
  const after = lines.slice(i + 1).find(Boolean);
  const endsBefore = !before || /[.:!?)\]]$/.test(before) || before === before.toUpperCase();
  const startsAfter = !after || /^[A-Z*“"(]/.test(after);
  return endsBefore && startsAfter;
}

function prettySection(heading: string): string {
  const t = heading.trim().replace(/:$/, '');
  if (t !== t.toUpperCase()) return t;
  return t.charAt(0) + t.slice(1).toLowerCase();
}

/** Joins wrapped lines into one paragraph, mending words hyphenated across lines ("double-" + "pointed"). */
function joinLines(lines: string[]): string {
  let out = '';
  for (const line of lines) {
    if (!out) out = line;
    else if (/[a-z]-$/.test(out) && /^[a-z]/.test(line)) out += line;
    else out += ` ${line}`;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Instructions
// ---------------------------------------------------------------------------------------------

/** "[45¼ inches]", "[US9]", "[219 yds]" — imperial conversions next to the metric ones. */
const IMPERIAL = /\s*\[[^\]]*?(?:inch|inches|\bin\b|["”]|yds?\b|yards?|\boz\b|US\s?\d)[^\]]*\]/gi;
/** Asides in brackets: video links, "meaning…", "i.e.…". Allows one level of nested brackets. */
const ASIDE = /\s*\((?:[^()]|\([^()]*\))*?\b(?:see|video|meaning|i\.e|e\.g|www|https?)\b(?:[^()]|\([^()]*\))*\)/gi;
const SIDE_SIGNAL = /,?\s*(?:so\s+)?the\s+(?:next|first)\s+row\s+is\s+an?\s+(RS|WS)\s+row\b/i;

/** Trims an instruction down to what you need while knitting. */
function tidy(text: string): string {
  const out = text
    .replace(IMPERIAL, '')
    .replace(ASIDE, '')
    .replace(new RegExp(SIDE_SIGNAL.source, 'gi'), '')
    .replace(/,?\s*so (?:that )?the knitting looks continuous/gi, '')
    .replace(/\s*as the next step follows from here/gi, '')
    .replace(/\((\d+) (?:stitch|stitches|sts?) (?:has|have) been (in|de)creased\)/gi, (_w, n: string, dir: string) =>
      `(${dir.toLowerCase() === 'in' ? '+' : '−'}${n} st${n === '1' ? '' : 's'})`
    )
    .replace(/\s+([,.;:)])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/,\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return capitalize(out.replace(/^(?:(?:now|then|next),?\s+|work as follows:\s*)/i, ''));
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Splits a section's text into sentences and "Row N" lines. */
function splitPieces(text: string): string[] {
  const pieces = text
    .replace(/([.:!])\s+(?=(?:Row|Rows|Rnd|Rnds|Round|Rounds)\s+\d)/g, '$1\n')
    .replace(/([.!?])\s+(?=[A-Z*“"])/g, '$1\n')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  // Glue stray fragments (that aren't instructions themselves) back onto the previous piece.
  const merged: string[] = [];
  for (const p of pieces) {
    if (merged.length && p.length < 14 && !INSTRUCTION.test(p)) merged[merged.length - 1] += ` ${p}`;
    else merged.push(p);
  }
  return merged;
}

/** "Row 1 (RS): …", "Round 2: …" — but not "Row 1 and 2 …" or "Rows 1-4". */
const ROW_LINE = /^(?:Row|Rnd|Round)\s+(\d+)\b(?!\s*(?:and|&|-|–|to)\s*\d)/i;
/** "Work Row 1 and 2 a total of 5 times", "Rep rows 1–4 until…", "Repeat rows 1-2 7 more times". */
const REPEAT = /\b(?:rep(?:eat)?|work)\s+(?:rows?|rnds?|rounds?)\s+(\d+)(?:\s*(?:-|–|—|to|and|&)\s*(\d+))?\b(.*)$/i;
/** "Repeat the last 2 rows 3 more times" */
const REPEAT_LAST = /\brep(?:eat)?\s+(?:these|the last|last)\s+(\d+)\s+(?:rows|rnds|rounds)\b(.*)$/i;

function sideOf(text: string): Pick<ParsedStep, 'startSide' | 'inRound'> {
  if (detectRound(text)) return { inRound: true };
  const side = detectSide(text);
  return side ? { startSide: side } : {};
}

const other = (side: Side): Side => (side === 'RS' ? 'WS' : 'RS');

/** Turns a section's sentences into steps. */
function toSteps(pieces: string[], section: string | undefined): ParsedStep[] {
  const steps: ParsedStep[] = [];
  let pendingSide: Side | undefined;
  let intro: { text: string; raw: string } | undefined;

  const push = (step: ParsedStep, raw: string) => {
    // "The next row is a RS row" belongs to the next step that knits a row, not to "Break the yarn".
    const knitsRows = !!step.rows || !!step.lines || /^(?:knit|purl|k\d|p\d|work|rows?)/i.test(step.text);
    if (pendingSide && knitsRows) {
      if (!step.startSide && !step.inRound) step.startSide = pendingSide;
      pendingSide = undefined;
    }
    const detail = raw.replace(/\s{2,}/g, ' ').trim();
    steps.push({ ...step, section, ...(detail !== step.text ? { detail } : {}) });
  };

  /** "The next row is a RS row": the next step starts on that side, and a one-row step before it is the other side. */
  const sideSignal = (side: Side) => {
    pendingSide = side;
    const last = steps[steps.length - 1];
    if (last && last.rows === 1 && !last.startSide && !last.inRound) last.startSide = other(side);
  };

  let i = 0;
  while (i < pieces.length) {
    const piece = pieces[i];
    const body = piece.replace(LEAD, '');
    const signal = piece.match(SIDE_SIGNAL)?.[1]?.toUpperCase() as Side | undefined;
    const count = piece.match(/\bthere (?:is|are) now (?:a total of )?(\d+) (?:sts|stitches)\b/i);

    // Not an instruction: a description, a stitch count to check, or a note about the next row.
    if (!INSTRUCTION.test(body)) {
      const last = steps[steps.length - 1];
      if (last) {
        if (count) last.stitches = Number(count[1]);
        last.detail = `${last.detail ?? last.text} ${piece}`;
      }
      if (signal) sideSignal(signal);
      i += 1;
      continue;
    }

    // Keep "RS facing…" in the text: it tells you which way to hold the work.
    const tidied = tidy(piece);
    if (/^work as follows:?$/i.test(tidied)) {
      i += 1;
      continue;
    }

    // "Work stockinette stitch as follows:" introduces the "Row 1… Row 2…" lines after it.
    if (/:$/.test(tidied) && i + 1 < pieces.length && ROW_LINE.test(pieces[i + 1])) {
      intro = { text: tidied.replace(/,?\s*(?:as follows)?:$/i, '').trim(), raw: piece };
      i += 1;
      continue;
    }

    // A run of "Row N" lines, maybe followed by how often to repeat them.
    if (ROW_LINE.test(piece)) {
      const run: string[] = [];
      let j = i;
      while (j < pieces.length && ROW_LINE.test(pieces[j])) run.push(pieces[j++]);
      const after = j < pieces.length ? pieces[j] : '';
      const range = after.match(REPEAT);
      const last = after.match(REPEAT_LAST);
      let block = run;
      let tail = '';
      if (range) {
        const from = Number(range[1]);
        const to = Number(range[2] ?? range[1]);
        const inRange = run.filter((l) => {
          const n = Number(l.match(ROW_LINE)?.[1]);
          return n >= from && n <= to;
        });
        if (inRange.length) block = inRange;
        tail = range[3];
      } else if (last) {
        block = run.slice(-Number(last[1]));
        tail = last[2];
      }
      const times = tail.match(/^\s*(?:a total(?: of)?\s+)?(\d+)\s*(more\s+)?times/i);
      const until = tail.match(/\buntil\b[^.]*/i);
      // Only fold the next sentence in when it says how often: "5 times" or "until it measures…".
      const repeats = (range || last) && (times || until);
      if (!repeats) block = run;
      const unit = /^(?:rnd|round)/i.test(block[0]) ? 'round' : 'row';
      const numbers = block.map((l) => l.match(ROW_LINE)?.[1]);
      const label = numbers.length > 1 ? `${unit}s ${numbers[0]}–${numbers[numbers.length - 1]}` : `${unit} ${numbers[0]}`;
      const total = times ? Number(times[1]) + (times[2] ? 1 : 0) : 0;

      let summary: string;
      if (repeats && total) summary = `Repeat ${label} ${total} ${total === 1 ? 'time' : 'times'}.`;
      else if (repeats && until) summary = `Repeat ${label} ${tidy(until[0]).charAt(0).toLowerCase()}${tidy(until[0]).slice(1)}`;
      else summary = '';
      if (summary && !/[.!]$/.test(summary)) summary += '.';

      const lines = block.map((l) =>
        capitalize(tidy(l).replace(/^(?:row|rnd|round)\s+\d+\s*(?:\((?:RS|WS)\))?\s*[:.]?\s*/i, ''))
      );
      const text = [intro?.text ? `${intro.text}.` : '', summary].filter(Boolean).join(' ') || `Work ${label}.`;
      push(
        {
          text,
          lines,
          ...(repeats && total ? { rows: block.length * total } : !repeats ? { rows: block.length } : {}),
          ...sideOf(block[0]),
        },
        [intro?.raw, ...run, repeats ? after : ''].filter(Boolean).join(' ')
      );
      intro = undefined;
      i = repeats ? j + 1 : j;
      continue;
    }

    // A single instruction.
    intro = undefined;
    const until = /\buntil\b/i.test(tidied);
    let rows = until ? undefined : detectRows(tidied);
    if (!rows && /,\s*turn\.?$/i.test(tidied)) rows = 1;
    const check = piece.match(/\(=\s*(\d+)\s*(?:sts|stitches)\)/i) ?? count;
    push(
      {
        text: tidied,
        ...(rows && rows <= 9999 ? { rows } : {}),
        ...sideOf(tidied),
        ...(check ? { stitches: Number(check[1]) } : {}),
      },
      piece
    );
    if (signal) sideSignal(signal);
    i += 1;
  }
  return steps;
}

// ---------------------------------------------------------------------------------------------
// The whole pattern
// ---------------------------------------------------------------------------------------------

/** Reads a whole pattern's text. */
export function parsePattern(fullText: string): ParsedPattern {
  // Keep blank lines for now: they mark where front-matter paragraphs end.
  const all = fullText.split(/\r?\n/).map((l) => {
    const line = l.replace(/\s+/g, ' ').trim();
    // Page numbers and rules ("____") count as blank.
    return /^\d{1,3}$/.test(line) || /^[_\-=–—.\s]{5,}$/.test(line) ? '' : line;
  });
  const sizes = findSizes(all.filter(Boolean));

  // Group lines under headings, leaving out front matter.
  const sections: { title?: string; lines: string[] }[] = [{ lines: [] }];
  let inMeta = false;
  for (let i = 0; i < all.length; i++) {
    const line = all[i];
    if (!line) {
      inMeta = false;
      continue;
    }
    if (isHeading(all, i)) {
      inMeta = false;
      sections.push({ title: line, lines: [] });
      continue;
    }
    if (META.test(line)) inMeta = true;
    if (!inMeta) sections[sections.length - 1].lines.push(line);
  }

  const stepsFor = (sizeIndex: number) => {
    const out: ParsedStep[] = [];
    for (const s of sections) {
      if (s.title && SKIP_SECTIONS.test(s.title.trim().replace(/:$/, ''))) continue;
      const body = pickSize(joinLines(s.lines), sizes.length, sizeIndex);
      out.push(...toSteps(splitPieces(body), s.title ? prettySection(s.title) : undefined));
    }
    return out;
  };

  return { sizes, stepsFor };
}
