/**
 * Turns the text of a knitting pattern (as read out of a PDF) into short, knittable steps:
 * - finds the sizes ("XS (S) M (L) XL", "S (M, L, XL)") and keeps only the chosen size's numbers,
 *   leaving out parts written for other sizes ("Sizes S and L only: …"),
 * - follows the pattern's own headings ("Left shoulder") so the counter can say where you are,
 * - starts at the cast-on: front matter (gauge, yarn, needles, size guides, stitch guides,
 *   abbreviations), page numbers, running headers and footers, and the small print are left out,
 * - folds "Row 1 … Row 2 … Work Row 1 and 2 a total of 5 times" (or "Dec row … Next row … Repeat
 *   the last 2 rows 5 more times") into one step that knows each row,
 * - trims every instruction to what you need while knitting: no video links, inch conversions or
 *   asides. The pattern's full wording is kept alongside (`detail`) for when you want it.
 *
 * When it can't tell whether a sentence is an instruction, it shows it as a step marked `unsure`
 * rather than leave it out: an extra step costs a tap, a missing one can cost a sweater.
 */
import { detectRound, detectRows, detectSide, type ParsedStep } from '@/lib/parse-steps';

export type ParsedPattern = {
  /** Size labels, e.g. ["XS", "S", "M"]. Empty when the pattern has one size. */
  sizes: string[];
  /** Builds the steps for one size (index into `sizes`; 0 when there are none). */
  stepsFor: (sizeIndex: number) => ParsedStep[];
  /** Crochet patterns are read as knitting for now, so the app says so. */
  craft: 'knitting' | 'crochet';
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
  const ok = labels.length >= 2 && labels.length <= 12 && labels.every((l) => l.length <= 14 && !/\bmm\b/i.test(l));
  return ok ? labels : [];
}

function findSizes(lines: string[]): string[] {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:sizes?|to fit|size\s*\(s\))\s*[:\-–]?\s*(.*)$/i);
    // "Size U.S. 8 (5 mm) knitting needles" is about needles, not sizes to knit.
    if (!m || /\b(?:needles?|hooks?)\b/i.test(lines[i])) continue;
    // "Sizes: XS (S) M", or a "SIZES" heading with the labels on the next line.
    const labels = sizeLabels(m[1] || (lines[i + 1] ?? ''));
    if (labels.length) return labels;
  }
  return labelledSizes(lines.join(' '));
}

/** A letter size: "XS", "M", "XXL", "3XL". */
const SIZE_LABEL = String.raw`(?:[2-6]?X{0,4}[SL]|M)`;
/** "XS (88)": a size's name with its own number. */
const LABELLED_VALUE = String.raw`${SIZE_LABEL}\s*\(\s*${VALUE}\s*\)`;
const LABELLED_RUN = new RegExp(String.raw`(?<![\w(])${LABELLED_VALUE}(?:\s*${LABELLED_VALUE}){1,11}(?![\w(])`, 'g');

/**
 * Patterns without a "Sizes:" line that name every size next to its number: "CO XS (88) S (100) M (112) sts".
 * The labels count when the same run of them comes up at least twice.
 */
function labelledSizes(text: string): string[] {
  const seen = new Map<string, number>();
  for (const run of text.match(LABELLED_RUN) ?? []) {
    const key = [...run.matchAll(new RegExp(String.raw`(${SIZE_LABEL})\s*\(`, 'g'))].map((m) => m[1]).join(' ');
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const [best] = [...seen].filter(([key]) => new Set(key.split(' ')).size === key.split(' ').length).sort((a, b) => b[1] - a[1]);
  return best && best[1] >= 2 ? best[0].split(' ') : [];
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
};
/** "fourteen (16, 16, 18, 18) more times": the first size spelled out. */
const SPELLED_FIRST = new RegExp(String.raw`\b(${Object.keys(NUMBER_WORDS).join('|')})(?=\s*[([]\s*\d)`, 'gi');

/**
 * Keeps only the chosen size's numbers: "86 (90) 94" / "80 (88, 96)" / "80-88-96" / "XS (88) S (100)" → the one
 * for `index`. `labels` are the size names, for patterns that write them next to each number.
 */
export function pickSize(text: string, count: number, index: number, labels: string[] = []): string {
  if (count < 2) return text;
  let out = text;
  if (labels.length === count) {
    const run = new RegExp(
      String.raw`(?<![\w(])` + labels.map((l) => String.raw`${escapeRegExp(l)}\s*\(\s*(${VALUE})\s*\)`).join(String.raw`\s*`),
      'g'
    );
    out = out.replace(run, (...m: string[]) => m[1 + index]);
  }
  out = out.replace(SPELLED_FIRST, (word: string) => String(NUMBER_WORDS[word.toLowerCase()]));
  out = out.replace(alternatingGroup(count), (...m: string[]) => m[1] + m[2 + index]);
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

/**
 * Which sizes a part of the pattern is for, when it says: "SIZES ADULT SMALL + LARGE ONLY",
 * "Sizes S and L only:", "For the 2nd and 4th sizes only,". Undefined when it doesn't say.
 */
function forSizes(text: string, labels: string[]): Set<number> | undefined {
  if (labels.length < 2 || !/\bonly\b/i.test(text) || !/\bsizes?\b/i.test(text)) return undefined;
  const found = new Set<number>();
  for (const m of text.matchAll(/\b(\d+)(?:st|nd|rd|th)\b/gi)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= labels.length) found.add(n - 1);
  }
  if (found.size) return found;
  const lower = labels.map((l) => l.toLowerCase());
  const words = text
    .toLowerCase()
    .replace(/[:;.()]/g, ' ')
    .split(/[\s,+&]+/)
    .filter((w) => w && w !== 'and');
  // "XS–M": every size from one label to the other.
  for (const w of words) {
    const ends = lower.includes(w) ? undefined : w.split(/[-–]/);
    if (ends?.length === 2 && lower.includes(ends[0]) && lower.includes(ends[1])) {
      for (let i = lower.indexOf(ends[0]); i <= lower.indexOf(ends[1]); i++) found.add(i);
    }
  }
  // Words several labels share ("Adult") don't tell the sizes apart.
  const parts = lower.map((l) => l.split(/\s+/));
  const shared = (word: string) => parts.filter((ps) => ps.includes(word)).length > 1;
  parts.forEach((ps, i) => {
    const own = ps.filter((p) => !shared(p));
    if (own.length && own.every((p) => words.includes(p))) found.add(i);
  });
  return found.size ? found : undefined;
}

// ---------------------------------------------------------------------------------------------
// What a sentence is: an instruction, a note, or not sure
// ---------------------------------------------------------------------------------------------

/** Front-matter lines ("Gauge: 15 sts…", "Needles: …") — skipped along with the rest of their paragraph. */
const META =
  /^(?:sizes?(?![^:]*\bonly\b)|size guide|to fit|bust|chest|hip|finished|measurements?|length|width|ease|gauge|tension|needles?|hooks?|materials?|yarns?|notions|supplies|you will need|designer|skill level|difficulty|techniques)\b[^:]{0,40}:/i;

/** Sections that never hold knitting steps: these titles, or titles that start like the second group. */
const SKIP_SECTIONS =
  /^(?:(?:materials?|yarns?|needles?|notions|supplies|gauge|tension|abbreviations?|glossary|notes?|pattern notes|sizes?|size guide|sizing|designer|copyright|skill level|(?:special )?techniques|stitch guide|stitches used|before you (?:begin|start)|tips?|samples?|you will need|key|legend|symbols?|chart key|diagram key)$|(?:finished|measurements?|about|construction|find\b.*\bsize|choos\w*\b.*\bsize|how to|more|shop|learn about)\b)/i;

/** Words that start an instruction ("Cast on…", "K3, M1L…", "Row 1 (RS)…", "Pick up and knit…"). */
const INSTRUCTION =
  /^(?:\*\s*)?(?:cast\s+on|co|cast\s+off|bind\s+off|bo|knit|purl|k\d+\w*|k(?:tbl|fb|wise)?|keep|kitchener|p\d+\w*|p(?:tbl|wise)?|k2tog|p2tog|ssk|ssp|sk2p|s2kp|cdd|kfb|m1[lrp]?|yo|sl\d*|slip|work|continue|cont|change|switch|pick\s+up|pu|join|rejoin|place|pm|sm|rm|remove|break|cut|turn|rep(?:eat)?|weave|inc(?:rease)?|dec(?:rease)?|transfer|divide|move|put|hold|return|graft|sew|seam|block|wash|try|measure|mark|make|bring|take|secure|press|steam|pin|position|set\s+in|do\s+not|don['’]t|insert|using|with|beg(?:in|inning)?|rows?|rnds?|rounds?|next|end|start|fold|attach|thread|leave|fasten\s+off|at\s+(?:the\s+)?same\s+time)\b/i;

/** "Now…", "Then,…", "RS facing with the cast-on edge on top,…" — lead-ins that come before the verb. */
const LEAD = /^(?:(?:now|then|next|finally|first|afterwards)\b,?\s*|(?:with\s+)?(?:RS|WS|right side|wrong side)\s+facing\b[^,]*,\s*)+/i;

/** "Holding both yarns together, loosely cast on…", "When piece measures 20 cm, bind off…" */
const INTRO_THEN_VERB =
  /^[^.;:()]{0,60}?,\s*(?:\w+ly\s+)?(?:cast\s+on|cast\s+off|bind\s+off|bo|co|knit|purl|work|k\d|p\d|pick\s+up|join|place|pm|slip|sl\d*|rep(?:eat)?|continue|cont|dec(?:rease)?|inc(?:rease)?|change|turn|break|cut|weave|leave|transfer|divide|start|beg(?:in)?)\b/i;

/** "Shape armholes: BO 4 sts…", "Set-up row (WS): P2…", "Sizes S–M only: work…" — a label, then the instruction. */
const LABELLED = /^([A-Z][^:]{0,40}?):\s*(.+)$/;
const NOT_A_LABEL = /^(?:notes?|tips?|hint|nb|please note|important)$/i;

/** Descriptions and asides: "This hat is worked…", "You will…", "Note: …", "Share your version…". */
const NOTE_START =
  /^(?:this|these|that|those|the|it|its|it['’]s|they|you|you['’]ll|your|we|our|i|my|each|note|notes|tip|tips|hint|nb|please|remember|here|if you|in this|share|enjoy|happy|thank|shop|explore|looking|designed|learn|check out|visit|follow|find us|tag)\b/i;

/** "Press the work lightly", "Secure both ends…", "Set in and sew the sleeves": a verb, then what to do it to. */
const IMPERATIVE =
  /^[A-Z][a-z]+(?:\s+(?:in|up|out|down|off|over|on|together|back|through|around|lightly|gently|firmly|loosely|carefully|evenly|flat))?(?:\s+and\s+[a-z]+)?\s+(?:the|a|an|all|both|each|every|any|your|this|these|that|it|them|one|two|three|four|\d+)\b/;

/** "(144 sts)", "= 54 sts", "[56 stitches]", "144 sts remain." — just the stitch count to check. */
const COUNT_ONLY = /^[([]?\s*=?\s*(\d+)\s*(?:sts|stitches)(?!\s*(?:inc|dec|have been))\b[^()[\]]{0,24}[)\]]?\.?$/i;
/** "There are now 144 sts", "You should have 144 sts" */
const COUNT_SENTENCE = /\b(?:there (?:is|are|will be) now|you (?:should )?(?:now )?have)\s+(?:a total of\s+)?(\d+)\s+(?:sts|stitches)\b/i;
/** "K = knit", "st(s) = stitch(es)": an abbreviation, not an instruction. */
const ABBREVIATION = /^[\w()/.&’'-]{1,15}\s*=\s*[A-Za-z]/;

/** Knitting words, to tell an instruction from a description when the first word doesn't. */
const KNIT_WORD =
  /^(?:k\d*|p\d*|knit(?:s|ted|ting|wise)?|purl(?:s|ed|ing|wise)?|k\d*tog|p\d*tog|ssk|ssp|sssk|skp|sk2p|s2kp|cdd|yo|yos|yfwd|sl\d*|slip(?:s|ped|ping)?|pm|sm|rm|m1[lrp]?|kfb|pfb|inc(?:s|rease[sd]?|reasing)?|dec(?:s|rease[sd]?|reasing)?|cast|bind|bo|co|rep(?:eat(?:s|ed|ing)?)?|rows?|rnds?|rounds?|r|sts?|stitch(?:es)?|rs|ws|turn(?:s|ed|ing)?|pick(?:ed|ing)?|tbl|wyif|wyib|w&t|together|tog|markers?|cm|mm|inches|measures?|garter|stockinette|rib(?:bing|bed)?|patt|cables?|c\d+[fb]|beg|cont|work(?:s|ed|ing)?|weave|ends|sew(?:n)?|seams?|edges?)$/;

/** Share of a sentence's words that are knitting words. */
function knitDensity(text: string): number {
  const words = text.toLowerCase().match(/[a-z][a-z0-9&]*/g) ?? [];
  return words.length ? words.filter((w) => KNIT_WORD.test(w)).length / words.length : 0;
}

/** "Row 1 (RS): …", "Round 2: …", "Short row 1: …", "1st row: …" — but not "Row 1 and 2 …" or "Rows 1-4". */
const ROW_LINE =
  /^(?:short\s+)?(?:(?:Row|Rnd|Round)\s+(\d+)\b(?!\s*(?:and|&|-|–|to)\s*\d)|(\d+)(?:st|nd|rd|th)\s+(?:row|rnd|round)\b(?!s))/i;
/** Anything that starts with a row number, ranges included. */
const ROW_START = /^(?:short\s+)?(?:(?:Row|Rnd|Round)s?\s+\d|\d+(?:st|nd|rd|th)\s+(?:row|rnd|round))/i;
const rowNumber = (line: string) => {
  const m = line.match(ROW_LINE);
  return m ? Number(m[1] ?? m[2]) : NaN;
};

/** Whether a sentence reads as something to do. */
function isInstruction(text: string): boolean {
  const body = text.replace(LEAD, '');
  if (ABBREVIATION.test(body)) return false;
  if (INSTRUCTION.test(body) || ROW_START.test(body) || INTRO_THEN_VERB.test(body)) return true;
  const label = body.match(LABELLED);
  if (label && !NOT_A_LABEL.test(label[1].trim())) {
    const rest = label[2].replace(LEAD, '');
    return INSTRUCTION.test(rest) || INTRO_THEN_VERB.test(rest) || knitDensity(rest) >= 0.3;
  }
  return false;
}

/** What to do with a sentence: show it as a step, keep it as a note, or show it marked unsure. */
function classify(piece: string): 'instruction' | 'note' | 'unsure' {
  const body = piece.replace(LEAD, '');
  if (COUNT_ONLY.test(body) || ABBREVIATION.test(body)) return 'note';
  // Swatching and gauge advice belong to the front matter.
  if (/\bswatch/i.test(body) || (/\b(?:gauge|tension)\b/i.test(body) && !INSTRUCTION.test(body))) return 'note';
  if (isInstruction(body)) return 'instruction';
  if (NOTE_START.test(body)) return 'note';
  if (IMPERATIVE.test(body)) return knitDensity(body) >= 0.1 ? 'instruction' : 'unsure';
  return knitDensity(body) >= 0.25 ? 'unsure' : 'note';
}

// ---------------------------------------------------------------------------------------------
// Lines and headings
// ---------------------------------------------------------------------------------------------

function isHeading(lines: string[], i: number): boolean {
  const line = lines[i];
  // "Tote Sides (make 2)" is a heading too.
  const text = line
    .replace(/:$/, '')
    .replace(/\s*\((?:make|work|knit)\s+[\w\s]{1,12}\)$/i, '')
    .trim();
  if (text.length < 3 || text.length > 50) return false;
  if (/[.;,!?)\]]$/.test(text) || !/^[A-Z]/.test(text) || /[=|]/.test(text)) return false;
  if (/\d/.test(text) && !/^(?:part|section|step)\s+\d+/i.test(text)) return false;
  if (META.test(line) || /^at\s+(?:the\s+)?same\s+time\b/i.test(text)) return false;
  const words = text.split(/\s+/).length;
  // ALL CAPS stands out as a heading, even when it starts like an instruction ("BLOCK").
  if (text === text.toUpperCase()) return /[A-Z]{2}/.test(text) && words <= 8;
  if (words > 5 || INSTRUCTION.test(text)) return false;
  // A heading in sentence case stands on its own: the line before finishes a sentence, the line after starts one.
  const before = lines.slice(0, i).reverse().find(Boolean);
  const after = lines
    .slice(i + 1)
    .find(Boolean)
    ?.replace(BULLET, '')
    .replace(LIST_NUMBER, '');
  const startsAfter = !after || /^[A-Z*“"(]/.test(after);
  // PDFs often leave out the full stop: "Cast on 96 sts and join in the round" / "Brim" / "Rnd 1: …".
  const between = !!before && !!after && words <= 3 && isInstruction(before) && isInstruction(after);
  // …or the line before is a heading itself: "Instructions" / "Collar".
  const underHeading =
    !!before && /^[A-Z][^.!?;,:=|]*$/.test(before) && before.split(/\s+/).length <= 5 && !isInstruction(before);
  const endsBefore =
    !before || /[.:!?)\]]$/.test(before) || before === before.toUpperCase() || between || underHeading;
  return endsBefore && startsAfter;
}

function prettySection(heading: string): string {
  const t = heading.trim().replace(/:$/, '');
  if (t !== t.toUpperCase()) return t;
  return t.charAt(0) + t.slice(1).toLowerCase();
}

/** A line that starts a row of its own: "Row 3 (RS):", "1st row:", "Set-Up Row (WS):", "Next Row:", "AT THE SAME TIME". */
const OWN_LINE =
  /^(?:(?:(?:Short|Set-?up|Foundation|Next|Dec(?:rease)?|Inc(?:rease)?)\s+)?(?:Row|Rnd|Round)s?\b[^:]{0,30}:|\d+(?:st|nd|rd|th)\s+(?:row|rnd|round)\b|AT THE SAME TIME\b)/i;
/** "•", "▪", and the bullet of Symbol-font lists. */
const BULLET = /^[•▪◦●·•]\s*/;
/** "1. Knit 44 front sts." */
const LIST_NUMBER = /^\d{1,2}[.)]\s+(?=[A-Z*])/;

/**
 * Joins wrapped lines into one paragraph, mending words hyphenated across lines ("double-" + "pointed").
 * Rows, bullets and numbered points that start a line stay apart, even after a stitch count like "(88 sts)".
 */
function joinLines(lines: string[]): string {
  let out = '';
  for (const raw of lines) {
    const point = BULLET.test(raw) || LIST_NUMBER.test(raw);
    const line = raw.replace(BULLET, '').replace(LIST_NUMBER, '');
    if (!out) out = line;
    else if (point || (/^[A-Z0-9]/.test(line) && OWN_LINE.test(line))) out += `\n${line}`;
    else if (/[a-z]-$/.test(out) && /^[a-z]/.test(line)) out += line;
    else out += ` ${line}`;
  }
  return out;
}

/** Whether a wrapped line carries on the sentence before it ("…in stockinette," / "knit on 4 mm needles"). */
function continues(previous: string | undefined, line: string): boolean {
  if (!previous) return false;
  return /^[a-z(]/.test(line) || /[,;(\-–/&]$|\b(?:and|or|of|in|on|with|to|the|a|an|for|by)$/i.test(previous);
}

// ---------------------------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------------------------

/** "12", "9/12", "Page 3", "Page 3 of 8", and a lone list number ("1.") */
const PAGE_NUMBER = /^(?:page\s*)?\d{1,3}(?:\s*(?:\/|of)\s*\d{1,3})?\.?$/i;
const RULE = /^[_\-=–—.\s]{5,}$/;
/** "© 2021 Jane Doe", "… are the copyrights of …", "All rights reserved." */
const SMALL_PRINT = /©|\bcopyrights?\b|\ball rights reserved\b/i;

/** Ignores page numbers and case, so "Weekend Sweater – page 2" matches "WEEKEND SWEATER – PAGE 3". */
const edgeKey = (line: string) => line.toLowerCase().replace(/\d+/g, '#');

/**
 * Lines at the top or bottom of two or more pages: running headers and footers. An instruction
 * ("Purl across 1 row.") only counts when it's on most pages, since it may just happen to sit there twice.
 */
function pageEdges(pages: string[][]): Set<string> {
  const seen = new Map<string, { line: string; pages: number }>();
  for (const lines of pages) {
    const text = lines.filter(Boolean);
    for (const line of new Set([...text.slice(0, 2), ...text.slice(-2)])) {
      const key = edgeKey(line);
      const entry = seen.get(key);
      if (entry) entry.pages += 1;
      else seen.set(key, { line, pages: 1 });
    }
  }
  const most = Math.max(3, pages.length / 2);
  return new Set(
    [...seen]
      .filter(([, e]) => e.pages >= 2 && !ROW_START.test(e.line) && (e.pages >= most || !isInstruction(e.line)))
      .map(([key]) => key)
  );
}

/** Lines that are never part of the knitting: page numbers, rules, the small print, "Pattern name | page 1 of 2". */
function isClutter(line: string): boolean {
  return PAGE_NUMBER.test(line) || RULE.test(line) || SMALL_PRINT.test(line) || (/\s\|\s/.test(line) && !isInstruction(line));
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
    .replace(/\((right|wrong)[\s-]side\)/gi, (_w, side: string) => (side.toLowerCase() === 'right' ? '(RS)' : '(WS)'))
    .replace(/\s+([,.;:)])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/,\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // "Then knit…" → "Knit…", but "Next row (WS): …" keeps its "Next".
  return capitalize(out.replace(/^(?:(?:now|then),?\s+|next,\s+|work as follows:\s*)/i, ''));
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The stitches of a row written as short sentences: "*K1.", "P1.", "Rep from * to end of row." */
const STITCHES = /^(?:\*\s*)?(?:\[?\s*(?:k|p)\d*\b|k\d*tog|p\d*tog|ssk|ssp|sl\d*\w*|yo\b|m1\w*|kfb|pfb|rep(?:eat)?\s+from\b)/i;

/** Splits a section's text into sentences and "Row N" lines. */
function splitPieces(text: string): string[] {
  const pieces = text
    .replace(/([.:!)\]])\s+(?=(?:Row|Rows|Rnd|Rnds|Round|Rounds)\s+\d|\d+(?:st|nd|rd|th)\s+(?:row|rnd|round)\b)/g, '$1\n')
    .replace(/([.!?\]])\s+(?=[A-Z*“"])/g, '$1\n')
    // "Dec every RS row 5 times. (30 sts) Bind off.": the count closes its step, and the next one starts after it.
    .replace(/([([]\s*=?\s*\d+\s*(?:sts|stitches)[^()[\]]{0,24}[)\]]\.?)\s+(?=[A-Z*“"])/gi, '$1\n')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  const merged: string[] = [];
  for (const p of pieces) {
    const previous = merged[merged.length - 1];
    // "1st row: (RS). *K1. P1. Rep from * to end of row." is one row, written as short sentences.
    if (previous && ROW_LINE.test(previous) && p.length <= 60 && STITCHES.test(p) && !ROW_START.test(p)) {
      merged[merged.length - 1] += ` ${p}`;
    } else if (previous && p.length < 14 && !isInstruction(p) && !COUNT_ONLY.test(p)) {
      // Glue stray fragments (that aren't instructions themselves) back onto the previous piece.
      merged[merged.length - 1] += ` ${p}`;
    } else merged.push(p);
  }
  return merged;
}

/** "Work Row 1 and 2 a total of 5 times", "Rep rows 1–4 until…", "Repeat short rows 1-2 7 more times". */
const REPEAT = /\b(?:rep(?:eat)?|work)\s+(?:short\s+)?(?:rows?|rnds?|rounds?)\s+(\d+)(?:\s*(?:-|–|—|to|and|&)\s*(\d+))?\b(.*)$/i;
/** "Rep 1st and 2nd rows until…", "Repeat 1st to 4th rows 3 times" */
const REPEAT_ORDINAL =
  /\b(?:rep(?:eat)?|work)\s+(\d+)(?:st|nd|rd|th)(?:\s*(?:-|–|—|to|and|&)\s*(\d+)(?:st|nd|rd|th))?\s+(?:rows?|rnds?|rounds?)\b(.*)$/i;
/** "Repeat the last 2 rows 3 more times" */
const REPEAT_LAST = /\brep(?:eat)?\s+(?:these|the last|last)\s+(\d+)\s+(?:rows|rnds|rounds)\b(.*)$/i;
/** "Repeat these 2 rnds 12 more times", "Rep the last row 3 times": the steps just before, again. */
const REPEAT_PREVIOUS =
  /^(?:rep(?:eat)?|work)\s+(?:these|the last|last|the previous|previous)\s+(?:(\d+)\s+)?(rows?|rnds?|rounds?)\b(.*)$/i;
/** "until piece measures 30.5 cm": up to the end of the sentence (a decimal point doesn't end it). */
const UNTIL = /\buntil\b(?:[^.]|\.(?=\d))*/i;
/** "… k2tog, k1. (82 sts)", "… [56 stitches]", "… marker. 104 body sts." */
const TRAILING_COUNT =
  /(?:[([](\d+)\s*(?:sts|stitches)(?:\s+(?:rem(?:ain(?:ing)?)?|in total|total|on (?:the )?needles?|left))?[)\]]|[.:;]\s*(\d+)\s*(?:\w+\s+)?(?:sts|stitches))\.?$/i;

const TIMES = /^\s*:?\s*(?:a total(?: of)?\s+)?(\d+)\s*(more\s+)?times/i;

/** How many times a repeat tail says: "5 more times" → 6, "a total of 5 times" → 5, "until…" → undefined. */
function repeatTimes(tail: string, moreByDefault: boolean): number | undefined {
  const m = tail.match(TIMES);
  if (!m) return undefined;
  return Number(m[1]) + (m[2] || (moreByDefault && !/a total/i.test(m[0])) ? 1 : 0);
}

/** What a repeat adds after "3 more times": ", removing markers on the last round". */
function repeatRest(tail: string): string {
  const after = tail.replace(TIMES, '');
  return after.match(/^\s*[,:;]\s*(?:[^.[(]|\.(?=\d))+/)?.[0].trim().replace(/[,:;]?\s*$/, '') ?? '';
}

function sideOf(text: string): Pick<ParsedStep, 'startSide' | 'inRound'> {
  if (detectRound(text)) return { inRound: true };
  const side = detectSide(text);
  return side ? { startSide: side } : {};
}

const other = (side: Side): Side => (side === 'RS' ? 'WS' : 'RS');

/**
 * Turns a section's sentences into steps. `forOtherSize` says whether a size-only label skips the piece.
 * `bareLabels` are size names that can start a piece on their own ("S K8, k2tog…").
 */
function toSteps(
  pieces: string[],
  section: string | undefined,
  forOtherSize: (label: string) => boolean,
  bareLabels: string[] = []
): ParsedStep[] {
  const steps: ParsedStep[] = [];
  const raws: string[] = [];
  let pendingSide: Side | undefined;
  let intro: { text: string; raw: string } | undefined;
  // Notes that come before the section's first step, kept with that step's full pattern text.
  let leadNotes: string[] = [];

  const push = (step: ParsedStep, raw: string) => {
    // "The next row is a RS row" belongs to the next step that knits a row, not to "Break the yarn".
    const knitsRows = !!step.rows || !!step.lines || /^(?:knit|purl|k\d|p\d|work|rows?)/i.test(step.text);
    if (pendingSide && knitsRows) {
      if (!step.startSide && !step.inRound) step.startSide = pendingSide;
      pendingSide = undefined;
    }
    const detail = [...leadNotes, raw].join(' ').replace(/\s{2,}/g, ' ').trim();
    leadNotes = [];
    steps.push({ ...step, section, ...(detail !== step.text ? { detail } : {}) });
    raws.push(raw);
  };

  /** "The next row is a RS row": the next step starts on that side, and a one-row step before it is the other side. */
  const sideSignal = (side: Side) => {
    pendingSide = side;
    const last = steps[steps.length - 1];
    if (last && last.rows === 1 && !last.startSide && !last.inRound) last.startSide = other(side);
  };

  // After another size's own line, its notes ("You now have 36 sts") are skipped too.
  let otherSize = false;
  let i = 0;
  while (i < pieces.length) {
    let piece = pieces[i];
    // "S K8, k2tog…": only for size S. Other sizes skip it; size S drops the label.
    const bare = bareLabels.length ? piece.match(/^(\S{1,5})\s+(?=[A-Z])/)?.[1] : undefined;
    if (bare && bareLabels.includes(bare)) {
      otherSize = forOtherSize(bare);
      if (otherSize) {
        i += 1;
        continue;
      }
      piece = piece.slice(bare.length).trim();
    }
    const signal = piece.match(SIDE_SIGNAL)?.[1]?.toUpperCase() as Side | undefined;
    const count = piece.replace(LEAD, '').match(COUNT_ONLY) ?? piece.match(COUNT_SENTENCE);
    const kind = classify(piece);

    // "Sizes S and L only: …" when you're knitting an M.
    const sizeLabel = piece.match(/^([^:]{3,60}):\s/)?.[1] ?? piece.match(/^(.{3,60}?\bonly\b),\s/i)?.[1];
    if (sizeLabel && forOtherSize(sizeLabel)) {
      i += 1;
      continue;
    }

    // Not an instruction: a description, a stitch count to check, or a note about the next row.
    if (kind === 'note') {
      if (otherSize) {
        i += 1;
        continue;
      }
      const last = steps[steps.length - 1];
      if (count && last) last.stitches = Number(count[1]);
      // Keep notes that talk about the knitting with the step; leave out the chatter.
      if (count || signal || knitDensity(piece) > 0) {
        if (last) last.detail = `${last.detail ?? last.text} ${piece}`;
        else leadNotes.push(piece);
      }
      if (signal) sideSignal(signal);
      i += 1;
      continue;
    }

    otherSize = false;
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
      const range = after.match(REPEAT) ?? after.match(REPEAT_ORDINAL);
      const last = after.match(REPEAT_LAST);
      let block = run;
      let tail = '';
      if (range) {
        const from = Number(range[1]);
        const to = Number(range[2] ?? range[1]);
        const inRange = run.filter((l) => {
          const n = rowNumber(l);
          return n >= from && n <= to;
        });
        if (inRange.length) block = inRange;
        tail = range[3];
      } else if (last) {
        block = run.slice(-Number(last[1]));
        tail = last[2];
      }
      const total = repeatTimes(tail, false);
      const until = tail.match(UNTIL);
      // "until 52 rows in total are complete": the rows are counted for you.
      const allRows = tail.match(/\buntil\s+(?:there are\s+)?(\d+)\s+(?:rows|rnds|rounds)\s+(?:in total|total|in all|have been worked|are complete)/i);
      // Only fold the next sentence in when it says how often: "5 times" or "until it measures…".
      const repeats = (range || last) && (total || until);
      if (!repeats) block = run;
      const short = /^short\b/i.test(block[0]) ? 'short ' : '';
      const unit = /^(?:short\s+)?(?:\d+(?:st|nd|rd|th)\s+)?(?:rnd|round)/i.test(block[0]) ? 'round' : 'row';
      const numbers = block.map(rowNumber);
      const label =
        numbers.length > 1
          ? `${short}${unit}s ${numbers[0]}–${numbers[numbers.length - 1]}`
          : `${short}${unit} ${numbers[0]}`;

      let summary: string;
      if (repeats && total) summary = `Repeat ${label} ${total} ${total === 1 ? 'time' : 'times'}${repeatRest(tail)}.`;
      else if (repeats && until) summary = `Repeat ${label} ${tidy(until[0]).charAt(0).toLowerCase()}${tidy(until[0]).slice(1)}`;
      else summary = '';
      if (summary && !/[.!]$/.test(summary)) summary += '.';

      const lines = block.map((l) =>
        capitalize(
          tidy(l).replace(
            /^(?:short\s+)?(?:(?:row|rnd|round)\s+\d+|\d+(?:st|nd|rd|th)\s+(?:row|rnd|round))\s*(?:\((?:RS|WS)\))?\s*[:.]?\s*(?:\((?:RS|WS)\)\s*[.:]?\s*)?/i,
            ''
          )
        )
      );
      const text = [intro?.text ? `${intro.text}.` : '', summary].filter(Boolean).join(' ') || `Work ${label}.`;
      const rows = repeats && total ? block.length * total : allRows ? Number(allRows[1]) : !repeats ? block.length : undefined;
      // "… 3 more times. [8 stitches remain]"
      const count = repeats ? after.match(TRAILING_COUNT) : undefined;
      push(
        {
          text: capitalize(text),
          lines,
          ...(rows ? { rows } : {}),
          ...sideOf(tidy(block[0])),
          ...(count ? { stitches: Number(count[1] ?? count[2]) } : {}),
        },
        [intro?.raw, ...run, repeats ? after : ''].filter(Boolean).join(' ')
      );
      intro = undefined;
      i = repeats ? j + 1 : j;
      continue;
    }

    // "Dec row … Next row … Repeat these 2 rows 5 more times": fold the rows just before into one repeat.
    const again = tidied.match(REPEAT_PREVIOUS);
    const n = again ? Number(again[1] ?? 1) : 0;
    const previous = steps.slice(-n);
    if (again && n >= 1 && previous.length === n && previous.every((s) => s.rows === 1 && !s.lines)) {
      const times = repeatTimes(again[3], true);
      const until = again[3].match(UNTIL);
      const unit = /^r(?:nd|ound)/i.test(again[2]) ? 'round' : 'row';
      const label = n === 1 ? `this ${unit}` : `these ${n} ${unit}s`;
      const summary = times
        ? `Repeat ${label} ${times} times${repeatRest(again[3])}.`
        : until
          ? `Repeat ${label} ${until[0].trim()}.`
          : tidied;
      const raw = [...raws.slice(-n), piece].join(' ');
      steps.splice(-n);
      raws.splice(-n);
      const check = piece.match(TRAILING_COUNT);
      push(
        {
          text: summary,
          lines: previous.map((s) => s.text),
          ...(times ? { rows: n * times } : {}),
          ...(previous[0].inRound ? { inRound: true } : previous[0].startSide ? { startSide: previous[0].startSide } : {}),
          ...(check ? { stitches: Number(check[1] ?? check[2]) } : {}),
        },
        raw
      );
      i += 1;
      continue;
    }

    // A single instruction (or something that might be one).
    intro = undefined;
    const until = /\buntil\b/i.test(tidied);
    let rows = until ? undefined : detectRows(tidied);
    if (!rows && /,\s*turn\.?$/i.test(tidied)) rows = 1;
    const equals = piece.match(/\(=\s*(\d+)\s*(?:sts|stitches)\)/i);
    const trailing = piece.match(TRAILING_COUNT);
    const sentence = piece.match(COUNT_SENTENCE);
    const stitches = equals?.[1] ?? trailing?.[1] ?? trailing?.[2] ?? sentence?.[1];
    push(
      {
        text: tidied,
        ...(rows && rows <= 9999 ? { rows } : {}),
        ...sideOf(tidied),
        ...(stitches ? { stitches: Number(stitches) } : {}),
        ...(kind === 'unsure' ? { unsure: true } : {}),
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

/** Words only crochet patterns use, against words only knitting patterns use. */
const CROCHET_WORDS = /\b(?:sc|hdc|dc|dtr|tr|sl\s+st|ch\s*\d+|magic ring|from (?:the )?hook|in each (?:st|ch|sc|dc)|across,\s*turn|fasten off)\b/gi;
const KNITTING_WORDS = /\b(?:k\d+|p\d+|k2tog|ssk|knit|purl|cast on|bind off|cast off|needles?|stockinette|st st|garter)\b/gi;

/** Where the knitting starts: everything before the first cast-on is front matter (or a stitch guide). */
const CAST_ON = /\b(?:cast(?:ing)?[\s-]+on|co\s+\d|provisional(?:ly)?|chain\s+\d)/i;

/** Reads a whole pattern's text. */
export function parsePattern(fullText: string): ParsedPattern {
  // Pages come separated by a form feed (see pdf-lines.ts); text from elsewhere is one page.
  const pages = fullText.split('\f').map((page) =>
    page.split(/\r?\n/).map((l) => {
      // Keep blank lines for now: they mark where front-matter paragraphs end.
      const line = l.replace(/\s+/g, ' ').trim();
      return isClutter(line) ? '' : line;
    })
  );
  const edges = pages.length > 1 ? pageEdges(pages) : new Set<string>();
  const all = pages.flatMap((lines) => [...lines.map((l) => (l && edges.has(edgeKey(l)) ? '' : l)), '']);
  const sizes = findSizes(all.filter(Boolean));

  // Group lines under headings, leaving out front matter. A heading right under another one
  // ("Construction guide" / "Section  Stitch count") belongs to it.
  const sections: { title?: string; parent?: string; lines: string[] }[] = [{ lines: [] }];
  let inMeta = false;
  for (let i = 0; i < all.length; i++) {
    const line = all[i];
    if (!line) {
      inMeta = false;
      continue;
    }
    if (isHeading(all, i)) {
      inMeta = false;
      const above = sections[sections.length - 1];
      sections.push({ title: line, parent: above.lines.length ? undefined : (above.parent ?? above.title), lines: [] });
      continue;
    }
    // Front matter ends where the instructions start, even without a blank line in between.
    if (inMeta && /^[A-Z*]/.test(line) && !continues(all[i - 1], line) && isInstruction(line)) inMeta = false;
    if (META.test(line)) inMeta = true;
    if (!inMeta) sections[sections.length - 1].lines.push(line);
  }

  const crochet = fullText.match(CROCHET_WORDS)?.length ?? 0;
  const knitting = fullText.match(KNITTING_WORDS)?.length ?? 0;

  const stepsFor = (sizeIndex: number) => {
    const forOtherSize = (label: string) => {
      // "S" on its own: a line for one size only.
      const exact = sizes.indexOf(label.trim());
      if (exact !== -1) return exact !== sizeIndex;
      const only = forSizes(label, sizes);
      return !!only && !only.has(sizeIndex);
    };
    // "…as follows: XS Knit all sts. S K8, k2tog…": each size's own line starts a new piece.
    const sizeLines =
      sizes.length > 1 && sizes.every((l) => new RegExp(`^${SIZE_LABEL}$`).test(l))
        ? new RegExp(String.raw`:\s+(?=(?:${sizes.map(escapeRegExp).join('|')})\s+[A-Z])`, 'g')
        : undefined;
    const out: ParsedStep[] = [];
    for (const s of sections) {
      const title = s.title?.trim().replace(/:$/, '');
      const parent = s.parent?.trim().replace(/:$/, '');
      const skip = (t?: string) => !!t && (SKIP_SECTIONS.test(t) || forOtherSize(t));
      if (skip(title) || skip(parent)) continue;
      let body = pickSize(joinLines(s.lines), sizes.length, sizeIndex, sizes);
      if (sizeLines) body = body.replace(sizeLines, ':\n');
      let steps = toSteps(splitPieces(body), title ? prettySection(title) : undefined, forOtherSize, sizeLines ? sizes : []);
      // A chart's key explains symbols; only rows written out are steps.
      if (title && /^(?:charts?|diagrams?)\b/i.test(title)) steps = steps.filter((st) => st.lines);
      // "WEAVE IN ENDS" on a line of its own looks like a heading, but it's the last step.
      if (!steps.length && title && isInstruction(title)) steps.push({ text: `${prettySection(title)}.` });
      out.push(...steps);
    }
    const start = out.findIndex((s) => !s.lines && CAST_ON.test(s.text));
    return start > 0 ? out.slice(start) : out;
  };

  return { sizes, stepsFor, craft: crochet >= 5 && crochet > 2 * knitting ? 'crochet' : 'knitting' };
}
