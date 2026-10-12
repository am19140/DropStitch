/**
 * Rules about single steps that the counter needs: whether a step is knitted row by row, and the
 * length a step knits to ("until it measures 26 cm" → a "Reached 26 cm" button).
 * Kept free of app code so the tests can run them.
 */

type StepText = { text: string; rows?: number; lines?: string[] };

/** Steps you do once rather than row by row: "Cast on 120 sts", "Place marker", "Weave in ends". */
const ONE_OFF =
  /^(?:cast\s+on|co|cast\s+off|bind\s+off|bo|pick\s+up|place|pm|break|cut|weave|block|wash|sew|seam|graft|put|transfer|move|hold|slip|divide|remove|insert|attach|fold|thread|leave|try|measure|change|switch|join|turn|start|begin|do\s+not|don['’]t|fasten\s+off)\b/i;
/**
 * …unless it goes on to knit rows: "Bind off 3 sts at the beg of the next 2 rows",
 * "Change to 4.5 mm needles and work 10 cm in rib".
 */
const KNITS_ON =
  /\b(?:\d+\s*(?:more\s+)?(?:rows?|rnds?|rounds?)|next\s+(?:\w+\s+)?(?:rows?|rnds?|rounds?)|until)\b|\band\s+(?:work|knit|purl|continue)\b|\bfor\s+\d+(?:[.,]\d+)?\s*(?:cm|mm|in|inches|")/i;

/** Whether a step is knitted row by row (and gets the row counter), or just done once. */
export function countsRows(step: StepText): boolean {
  if (step.rows || step.lines?.length) return true;
  const text = step.text
    // "With RS facing, pick up…" / "RS facing, pick up…" is still a pick-up.
    .replace(/^(?:(?:with|using)\b|(?:RS|WS)\s+facing\b)[^,]*,\s*/i, '')
    // Picking up is done once, and "3 sts for every 4 rows" is a rate, not rows to knit.
    .replace(/\bpick\s+up\s+and\s+knit\b/gi, 'pick up')
    .replace(/\b(?:every|per|for each)\s+\d+(?:st|nd|rd|th)?\s*(?:rows?|rnds?|rounds?)\b/gi, '');
  // "Holding both yarns together, loosely cast on 42 sts" is a cast-on too.
  const afterIntro = text.replace(/^[^,.]{0,80},\s*(?:\w+ly\s+)?/, '');
  const oneOff = ONE_OFF.test(text) || ONE_OFF.test(afterIntro);
  return !oneOff || KNITS_ON.test(text);
}

const NUMBER = String.raw`\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?`;
const UNIT = String.raw`(cm|mm|inches|inch|in\b|")`;
const ABOUT = String.raw`(?:about\s+|approx(?:imately|\.)?\s+|at\s+least\s+|a\s+further\s+|another\s+)?`;
/** "until it measures 26 cm", "until the sleeve reaches 40 cm", "until it is 45 cm long" */
const UNTIL = new RegExp(String.raw`\buntil\b[^.]*?\b(?:measures?|reaches|is)\s+${ABOUT}(${NUMBER})\s*${UNIT}`, 'i');
/** "work in rib for 5 cm", "knit 10 cm", "continue for a further 3 cm" */
const FOR = new RegExp(String.raw`(?:\bfor\s+|\b(?:work|knit|purl|rib|continue|cont)\s+)${ABOUT}(${NUMBER})\s*${UNIT}`, 'i');

/** The length a step knits to, for its "Reached …" button: "26 cm", "25–27 cm", "10 in". */
export function lengthTarget(text: string): string | undefined {
  const m = text.match(UNTIL) ?? text.match(FOR);
  if (!m) return undefined;
  const unit = m[2].toLowerCase();
  return `${m[1].replace(/\s*[-–]\s*/, '–')} ${unit === '"' || unit.startsWith('in') ? 'in' : unit}`;
}
