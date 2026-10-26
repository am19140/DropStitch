/**
 * Stitch help: the stitch names and abbreviations a row can use, explained in Mrs Purl's voice,
 * so a beginner never has to leave the row to find out what "ssk" means.
 *
 * Plain knit and purl ("k2", "p1") and RS/WS are left out on purpose: they're in nearly every row
 * (the counter already shows the side), and a chip for each would bury the ones that need explaining.
 * `video` is where Mariana's own tutorial for a stitch goes, once she's made it.
 * Mrs Purl opens every explanation with "<name>, dear.", so `says` never says "dear" itself.
 * Checked against the Craft Yarn Council's standard knitting abbreviations (2026-10-26); the wording is our own.
 */
export type Stitch = {
  key: string;
  /** What the chip says: the abbreviation as knitters write it. */
  label: string;
  /** The full name, e.g. "slip, slip, knit". */
  name: string;
  /** Mrs Purl's explanation: short, plain, and right for a beginner. */
  says: string;
  /** Finds it in a row. Longer abbreviations come first in the list, so "k2tog" wins over a shorter match. */
  match: RegExp;
  /** A tutorial video for this stitch, when there is one. */
  video?: string;
  /** The chip shows the abbreviation the way the pattern writes it ("S2KP2" or "cdd", "skp" or "skpo"). */
  asWritten?: boolean;
};

/** Short entries for the everyday pattern words that are abbreviations too. */
const word = (key: string, label: string, name: string, says: string, match: RegExp): Stitch => ({ key, label, name, says, match });

export const STITCHES: Stitch[] = [
  {
    key: 'sssk',
    label: 'sssk',
    name: 'slip, slip, slip, knit',
    says: 'Like ssk, but with three: slip three stitches one at a time as if to knit, then knit them together through the back. Three become one, leaning left.',
    match: /\bsssk\b/gi,
  },
  {
    key: 'ssk',
    label: 'ssk',
    name: 'slip, slip, knit',
    says: 'Slip two stitches one at a time as if to knit, then knit them together through the back. Two become one, leaning left.',
    match: /\bssk\b/gi,
  },
  {
    key: 'ssp',
    label: 'ssp',
    name: 'slip, slip, purl',
    says: 'Slip two stitches one at a time as if to knit, put them back on the left needle, then purl them together through the back. The wrong-side twin of ssk.',
    match: /\bssp\b/gi,
  },
  {
    key: 'k3tog',
    label: 'k3tog',
    name: 'knit 3 together',
    says: 'Put your needle into the next three stitches at once and knit them as one. Three become one, leaning right.',
    match: /\bk3tog\b/gi,
  },
  {
    key: 'k2tog',
    label: 'k2tog',
    name: 'knit 2 together',
    says: 'Put your needle into the next two stitches at once, as if to knit, and knit them as one. Two become one, leaning right.',
    match: /\bk2tog\b/gi,
  },
  {
    key: 'p2tog',
    label: 'p2tog',
    name: 'purl 2 together',
    says: 'Put your needle into the next two stitches at once, as if to purl, and purl them as one. Two become one.',
    match: /\bp2tog\b/gi,
  },
  {
    key: 'sk2p',
    label: 'sk2p',
    name: 'slip 1, knit 2 together, pass over',
    says: 'Slip one stitch as if to knit, knit the next two together, then lift the slipped stitch over and off. Three become one, leaning left.',
    match: /\bsk2p\b/gi,
  },
  {
    key: 'cdd',
    label: 'S2KP2',
    asWritten: true,
    name: 'centred double decrease',
    says: 'Slip two stitches together as if to knit, knit one, then lift both slipped stitches over it. Three become one, and the middle stitch stays neatly on top.',
    match: /\b(?:s2kp2?|cdd)\b/gi,
  },
  {
    key: 'p2sso',
    label: 'p2sso',
    name: 'pass 2 slipped stitches over',
    says: 'Lift both stitches you slipped a moment ago over the stitch you just worked, and off the needle.',
    match: /\bp2sso\b/gi,
  },
  {
    key: 'psso',
    label: 'psso',
    name: 'pass slipped stitch over',
    says: 'Lift the stitch you slipped a moment ago over the stitch you just worked, and off the needle.',
    match: /\bpsso\b/gi,
  },
  {
    key: 'm1l',
    label: 'M1L',
    name: 'make 1 left',
    says: 'Lift the bar between two stitches from front to back with your left needle, then knit it through the back. A new stitch, leaning left.',
    match: /\bm1l\b/gi,
  },
  {
    key: 'm1r',
    label: 'M1R',
    name: 'make 1 right',
    says: 'Lift the bar between two stitches from back to front with your left needle, then knit it through the front. A new stitch, leaning right.',
    match: /\bm1r\b/gi,
  },
  {
    key: 'm1rp',
    label: 'M1RP',
    name: 'make 1 right purlwise',
    says: 'Lift the bar between two stitches from back to front with your left needle, then purl it. A new purl stitch, leaning right.',
    match: /\bm1(?:rp|pr)\b/gi,
    asWritten: true,
  },
  {
    key: 'm1lp',
    label: 'M1LP',
    name: 'make 1 left purlwise',
    says: 'Lift the bar between two stitches from front to back with your left needle, then purl it through the back. A new purl stitch, leaning left.',
    match: /\bm1(?:lp|pl)\b/gi,
    asWritten: true,
  },
  {
    key: 'm1p',
    label: 'M1P',
    name: 'make 1 purlwise',
    says: 'Lift the bar between two stitches onto your left needle and purl it. A new stitch on the purl side.',
    match: /\bm1pw?\b/gi,
  },
  {
    key: 'm1',
    label: 'M1',
    name: 'make 1',
    says: 'Lift the bar between two stitches onto your left needle and knit it through the back. One new stitch, with no hole.',
    match: /\bm1k?\b/gi,
    asWritten: true,
  },
  {
    key: 'kfb',
    label: 'kfb',
    name: 'knit front and back',
    says: 'Knit into the stitch but leave it on the needle, then knit into its back loop too. One stitch becomes two.',
    match: /\bkfb\b/gi,
  },
  {
    key: 'pfb',
    label: 'pfb',
    name: 'purl front and back',
    says: 'Purl into the stitch but leave it on the needle, then purl into its back loop too. One stitch becomes two.',
    match: /\bpfb\b/gi,
  },
  {
    key: 'yo',
    label: 'yo',
    name: 'yarn over',
    says: 'Bring the yarn over your right needle before the next stitch. It makes a new stitch and a little hole, on purpose.',
    match: /\byo\b/gi,
  },
  {
    key: 'tbl',
    label: 'tbl',
    name: 'through the back loop',
    says: 'Put your needle into the back leg of the stitch instead of the front. It gives the stitch a little twist.',
    match: /\btbl\b/gi,
  },
  {
    key: 'wyif',
    label: 'wyif',
    name: 'with yarn in front',
    says: 'Keep your working yarn in front of the work, the side facing you, while you slip.',
    match: /\bwyif\b/gi,
  },
  {
    key: 'wyib',
    label: 'wyib',
    name: 'with yarn in back',
    says: 'Keep your working yarn at the back of the work, away from you, while you slip.',
    match: /\bwyib\b/gi,
  },
  {
    key: 'sl1k',
    label: 'sl1k',
    name: 'slip 1 knitwise',
    says: 'Move one stitch to your right needle without knitting it, putting the needle in as if to knit.',
    match: /\bsl ?1 ?k\b/gi,
  },
  {
    key: 'sl1p',
    label: 'sl1p',
    name: 'slip 1 purlwise',
    says: 'Move one stitch to your right needle without knitting it, putting the needle in as if to purl.',
    match: /\bsl ?1 ?p\b/gi,
  },
  {
    key: 'sl',
    label: 'sl',
    name: 'slip',
    says: 'Move the stitch to your right needle without knitting it. Slip it as if to purl, unless the pattern says otherwise.',
    match: /\bsl\d*(?:\s?(?:k|p)wise)?\b/gi,
  },
  {
    key: 'wt',
    label: 'w&t',
    name: 'wrap and turn',
    says: 'For short rows: bring the yarn to the other side, slip the next stitch, bring the yarn back, slip that stitch back again, then turn your work.',
    match: /\bw&t\b|\bwrap and turn\b/gi,
  },
  {
    key: 'pm',
    label: 'pm',
    name: 'place marker',
    says: 'Slide a stitch marker onto your right needle here. It saves you counting later.',
    match: /\bpm\b/gi,
  },
  {
    key: 'sm',
    label: 'sm',
    name: 'slip marker',
    says: 'Move the marker from your left needle to your right one, and carry on.',
    match: /\bsm\b/gi,
  },
  {
    key: 'rm',
    label: 'rm',
    name: 'remove marker',
    says: 'Take the marker off your needle when you reach it.',
    match: /\brm\b/gi,
  },
  {
    key: 'bor',
    label: 'BOR',
    name: 'beginning of round',
    says: 'The marker that shows where each round starts. Use one that looks different from the others.',
    match: /\bbor\b/gi,
  },
  {
    key: 'm',
    label: 'm',
    name: 'marker',
    says: 'The little ring you placed on your needle. "Knit to m" means knit until you reach it.',
    // Lowercase only, and never after a number: "5 m" is metres, and "M" is a size.
    match: /(?<![\d.,])(?<![\d.,] )\bm\b(?![\d&])/g,
  },
  {
    key: 'co',
    label: 'CO',
    name: 'cast on',
    says: 'Put your first stitches onto the needle. Any cast-on you like works, unless the pattern names one.',
    match: /\bco\b/gi,
  },
  {
    key: 'bo',
    label: 'BO',
    name: 'bind off',
    says: 'Close the stitches so they can’t unravel: knit two, lift the first over the second, then knit one more and lift again, all the way along.',
    match: /\bbo\b/gi,
  },
  {
    key: 'rep',
    label: 'rep *',
    name: 'repeat from *',
    says: 'Go back to the little star and work the part after it again, as many times as the row says.',
    match: /\brep(?:eat)? from \*/gi,
  },
  {
    key: 'revstst',
    label: 'rev st st',
    name: 'reverse stockinette',
    says: 'Stockinette with the bumpy purl side as the right side: purl the right-side rows and knit the wrong-side rows. In the round, purl every round.',
    match: /\brev\.? ?st\.? ?st\b|\breverse stockinette\b/gi,
  },
  {
    key: 'stst',
    label: 'st st',
    name: 'stockinette stitch',
    says: 'Knit the right-side rows and purl the wrong-side rows. In the round, you simply knit every round.',
    match: /\bst\.? ?st\b|\bstockinette\b/gi,
  },
  {
    key: 'garter',
    label: 'garter',
    name: 'garter stitch',
    says: 'Knit every row. In the round, knit one round and purl the next.',
    match: /\bgarter\b/gi,
  },
  {
    key: 'rib',
    label: 'rib',
    name: 'ribbing',
    says: 'Knits and purls side by side, so the fabric stretches like a cuff. Knit the knits and purl the purls as they face you.',
    match: /\brib(?:bing)?\b/gi,
  },
  {
    key: 'skp',
    label: 'skp',
    name: 'slip, knit, pass over',
    says: 'Slip one stitch as if to knit, knit the next one, then lift the slipped stitch over it and off. Two become one, leaning left.',
    match: /\bskpo?\b/gi,
    asWritten: true,
  },
  {
    key: 'sssp',
    label: 'sssp',
    name: 'slip, slip, slip, purl',
    says: 'Slip three stitches one at a time as if to knit, put them back on the left needle, then purl them together through the back. Three become one.',
    match: /\bsssp\b/gi,
  },
  {
    key: 'sspp2',
    label: 'SSPP2',
    name: 'centred double decrease, purl side',
    says: 'Slip two stitches one at a time as if to knit and put them back on the left needle, slip them together through the back to the right needle, purl one, then lift both slipped stitches over it. Three become one, centred.',
    match: /\bsspp2\b/gi,
  },
  {
    key: 'ksp',
    label: 'ksp',
    name: 'knit, slip, pass',
    says: 'Knit one, slip it back to the left needle, lift the next stitch over it and off, then slip it back to the right needle. Two become one, leaning right.',
    match: /\bksp\b/gi,
  },
  {
    key: 'k1b',
    label: 'k1b',
    name: 'knit 1 below',
    says: 'Knit into the stitch in the row below the next one on your needle, and let the stitch above slide off. It makes a squishy, deep stitch.',
    match: /\bk1 ?b(?:elow)?\b/gi,
  },
  {
    key: 'tfl',
    label: 'tfl',
    name: 'through the front loop',
    says: 'Put your needle into the front leg of the stitch, the usual way.',
    match: /\btfl\b/gi,
  },
  {
    key: 'yb',
    label: 'yb',
    name: 'yarn back',
    says: 'Bring the yarn to the back of the work, between the needles.',
    match: /\byb\b/gi,
  },
  {
    key: 'yf',
    label: 'yfwd',
    name: 'yarn forward',
    says: 'Bring the yarn to the front, between the needles. In UK patterns, between two knit stitches, this makes a yarn over.',
    match: /\by(?:f|fwd)\b/gi,
    asWritten: true,
  },
  {
    key: 'yrn',
    label: 'yrn',
    name: 'yarn over, UK style',
    says: 'UK names for a yarn over (yon: yarn over needle, yrn: yarn round needle): wrap the yarn around your needle to make a new stitch and a little hole.',
    match: /\by(?:on|rn)\b/gi,
    asWritten: true,
  },
  {
    key: 'byo',
    label: 'byo',
    name: 'backward yarn over',
    says: 'A yarn over the other way round: take the yarn over the needle from back to front.',
    match: /\bbyo\b/gi,
  },
  {
    key: 'kwise',
    label: 'kwise',
    name: 'knitwise',
    says: 'Put your needle into the stitch from left to right, front to back, as if to knit.',
    match: /\bkwise\b|\bknitwise\b/gi,
    asWritten: true,
  },
  {
    key: 'pwise',
    label: 'pwise',
    name: 'purlwise',
    says: 'Put your needle into the front of the stitch from right to left, as if to purl.',
    match: /\bpwise\b|\bpurlwise\b/gi,
    asWritten: true,
  },
  {
    key: 'brackets',
    label: '[ ]',
    name: 'brackets',
    says: 'Work what\u2019s inside the brackets, then do it again, as many times in all as the number after them says.',
    // Only the opening bracket, so the stitches inside still get their own chips.
    match: /[[{](?=[^\]}]{1,80}[\]}]\s*\d+\s*(?:x|times)\b)/gi,
  },
  {
    key: 'cn',
    label: 'cn',
    name: 'cable needle',
    says: 'A short extra needle that holds a few stitches in front or behind while you cross a cable.',
    match: /\bcn\b/gi,
  },
  {
    key: 'dpn',
    label: 'dpn',
    name: 'double-pointed needles',
    says: 'Short needles with a point at each end, for small rounds like socks, mittens and sleeves.',
    match: /\bdpns?\b/gi,
    asWritten: true,
  },
  word('mc', 'MC', 'main colour', 'The yarn you knit with most.', /\bmc\b/gi),
  word('cc', 'CC', 'contrast colour', 'The second yarn, for stripes or colourwork.', /\bcc\b/gi),
  word('lh', 'LH', 'left-hand needle', 'The needle in your left hand, holding the stitches you\u2019re about to work.', /\blh\b/gi),
  word('rh', 'RH', 'right-hand needle', 'The needle in your right hand, where the stitches you\u2019ve worked go.', /\brh\b/gi),
  word('dec', 'dec', 'decrease', 'Make one stitch fewer, usually by working two together. The pattern or the stitch chips say which way.', /\bdecs?\b/gi),
  word('inc', 'inc', 'increase', 'Make one stitch more, for example with M1 or kfb. The pattern says which way.', /\bincs?\b/gi),
  word('rem', 'rem', 'remaining', 'The stitches still left: on your needle, or still to work in this row.', /\brem\b/gi),
  word('cont', 'cont', 'continue', 'Keep going the same way.', /\bcont\b/gi),
  word('patt', 'patt', 'pattern', 'The stitch pattern you\u2019ve already set up. "In patt" means keep knitting it as before.', /\bpatt?\b/gi),
  word('beg', 'beg', 'beginning', 'The start, of the row or the round or the piece.', /\bbeg\b/gi),
  word('foll', 'foll', 'following', 'The next one, or the ones that come next.', /\bfoll\b/gi),
  word('alt', 'alt', 'alternate', 'Every other one: one yes, one no, like every other row.', /\balt\b/gi),
  word('prev', 'prev', 'previous', 'The one before.', /\bprev\b/gi),
  word('tog', 'tog', 'together', 'Work those stitches as if they were one.', /\btog\b/gi),
];

const BY_KEY = new Map(STITCHES.map((s) => [s.key, s]));
export const stitchByKey = (key: string) => BY_KEY.get(key);

/** Where each stitch shows up in a piece of text, without overlaps (earlier and longer wins). */
export function stitchMatches(text: string): { start: number; end: number; key: string }[] {
  const found: { start: number; end: number; key: string }[] = [];
  for (const s of STITCHES) {
    for (const m of text.matchAll(new RegExp(s.match.source, s.match.flags))) {
      found.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, key: s.key });
    }
  }
  found.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const out: typeof found = [];
  for (const f of found) if (!out.length || f.start >= out[out.length - 1].end) out.push(f);
  return out;
}

/** The stitches in some text, each once, in the order they first appear. */
export function stitchesIn(texts: (string | undefined)[]): Stitch[] {
  const found = new Map<string, string>();
  for (const t of texts) {
    if (!t) continue;
    for (const m of stitchMatches(t)) if (!found.has(m.key)) found.set(m.key, t.slice(m.start, m.end));
  }
  return [...found].map(([key, text]) => {
    const s = BY_KEY.get(key)!;
    return s.asWritten ? { ...s, label: text } : s;
  });
}
