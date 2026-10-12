/// <reference types="node" />
/**
 * The pattern reader against short pieces of pattern written for these tests: each one is a way
 * real patterns are written that the reader once got wrong. Run with `npm test`.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { parsePattern } from '@/lib/pattern-parser';

const read = (text: string, size = 0) => parsePattern(text).stepsFor(size);
const texts = (text: string, size = 0) => read(text, size).map((s) => s.text);
/** The step whose text (or one of its rows) mentions `words`. */
const stepWith = (text: string, words: string, size = 0) =>
  read(text, size).find((s) => [s.text, ...(s.lines ?? [])].join(' ').toLowerCase().includes(words.toLowerCase()));

describe('nothing gets lost', () => {
  test('a label before the instruction: "Shape armholes: BO …"', () => {
    const pattern = `Sizes: S (M, L)
BACK
Cast on 80 (88, 96) sts.
Work in stockinette stitch until piece measures 30 (32, 34) cm, ending with a WS row.
Shape armholes: BO 4 (5, 6) sts at beg of next 2 rows.
Purl 1 row.`;
    const step = stepWith(pattern, 'shape armholes', 1);
    assert.equal(step?.text, 'Shape armholes: BO 5 sts at beg of next 2 rows.');
    assert.equal(step?.rows, 2);
  });

  test('AT THE SAME TIME', () => {
    const pattern = `FRONT
Cast on 60 sts.
Dec 1 st at each end of every RS row 6 times.
AT THE SAME TIME, when piece measures 20 cm, bind off the center 10 sts for the neck.`;
    assert.ok(stepWith(pattern, 'at the same time'));
  });

  test('sentences that start with Cont, Beg, PU, Holding, When', () => {
    const pattern = `YOKE
Holding both yarns together, loosely cast on 42 sts.
Cont in patt as set until yoke measures 20 cm.
Beg with a WS row, work 3 rows in st st.
When the piece measures 43 cm, cast off 15 sts for the armholes.
PU and k 60 sts evenly around the neck.`;
    for (const words of ['loosely cast on', 'cont in patt', 'beg with a ws row', 'cast off 15', 'pu and k 60']) {
      assert.ok(stepWith(pattern, words), words);
    }
  });

  test('front matter without a blank line, and a heading after a line without a full stop', () => {
    const pattern = `Gauge: 22 sts and 30 rows = 10 cm in stockinette
Needles: 4 mm circular, 40 cm
Cast on 96 sts and join in the round
Brim
Rnd 1: *K2, p2; rep from * to end.
Rep rnd 1 until brim measures 5 cm.
Crown
Knit until hat measures 18 cm.`;
    const steps = read(pattern);
    assert.equal(steps[0].text, 'Cast on 96 sts and join in the round');
    assert.equal(steps[1].section, 'Brim');
    assert.deepEqual(steps[1].lines, ['*K2, p2; rep from * to end.']);
    assert.equal(steps[2].section, 'Crown');
  });

  test('finishing points written as bullets and numbered lists', () => {
    const pattern = `Cast on 40 sts.
Separate body and sleeves
1. Knit 44 front sts.
2. Place the next 36 sleeve sts on waste yarn.
Finishing
• Use the yarn tails to close any gaps at the underarms.
 Weave in all ends.`;
    const all = texts(pattern);
    for (const t of ['Knit 44 front sts.', 'Place the next 36 sleeve sts on waste yarn.', 'Weave in all ends.']) {
      assert.ok(all.includes(t), t);
    }
    assert.ok(stepWith(pattern, 'use the yarn tails'));
  });

  test('finishing steps that start with an everyday verb', () => {
    const pattern = `Cast on 20 sts.
Making up
Set in and sew the sleeves.
Press the work lightly.
Secure both ends of the tie.`;
    for (const words of ['set in and sew', 'press the work', 'secure both ends']) assert.ok(stepWith(pattern, words), words);
  });

  test('a sentence it is not sure about is shown, marked unsure', () => {
    const step = stepWith(`Cast on 20 sts.\nGarter stitch for 2 rows.`, 'garter');
    assert.equal(step?.unsure, true);
  });
});

describe('rows and repeats', () => {
  test('a stitch count after a row does not swallow the next row', () => {
    const pattern = `BODY
Cast on 80 sts.
Row 1 (RS): K1, m1, knit to last st, m1, k1. (82 sts)
Row 2 (WS): Purl.
Repeat rows 1-2 4 more times.`;
    const step = stepWith(pattern, 'repeat rows');
    assert.equal(step?.rows, 10);
    assert.deepEqual(step?.lines, ['K1, m1, knit to last st, m1, k1. (82 sts)', 'Purl.']);
    assert.equal(step?.startSide, 'RS');
  });

  test('a heel flap: two rows repeated', () => {
    const pattern = `HEEL FLAP
Cast on 30 sts.
Row 1 (RS): *Sl 1, k1; rep from * to end.
Row 2 (WS): Sl 1, purl to end.
Rep these 2 rows 15 more times.`;
    assert.equal(stepWith(pattern, 'repeat rows')?.rows, 32);
  });

  test('set-up row and short rows', () => {
    const pattern = `HEEL
Cast on 40 sts.
Set-up row (WS): P2, pm, p to last 2 sts, pm, p2.
Short row 1 (RS): Knit to 2 sts before m, w&t.
Short row 2 (WS): Purl to 2 sts before m, w&t.
Repeat short rows 1-2 5 more times.`;
    assert.equal(stepWith(pattern, 'set-up row')?.rows, 1);
    const short = stepWith(pattern, 'short rows');
    assert.equal(short?.text, 'Repeat short rows 1–2 6 times.');
    assert.equal(short?.rows, 12);
  });

  test('an increase round with a stitch count, then rounds to repeat', () => {
    const pattern = `YOKE
Cast on 72 sts.
Inc rnd: *K1, m1; rep from * to end. (144 sts)
Rnd 2: Knit.
Rnd 3: Purl.
Rep rnds 2-3 3 more times.`;
    const inc = stepWith(pattern, 'inc rnd');
    assert.equal(inc?.stitches, 144);
    assert.equal(inc?.rows, 1);
    const repeat = stepWith(pattern, 'repeat rounds');
    assert.equal(repeat?.rows, 8);
    assert.equal(repeat?.inRound, true);
  });

  test('"Dec row … Next row … Repeat the last 2 rows 5 more times" becomes one repeat', () => {
    const pattern = `SLEEVE
Cast on 50 sts.
Dec row (RS): K1, ssk, knit to last 3 sts, k2tog, k1.
Next row (WS): Purl.
Repeat the last 2 rows 5 more times. 38 sts.`;
    const step = stepWith(pattern, 'repeat these');
    assert.equal(step?.text, 'Repeat these 2 rows 6 times.');
    assert.equal(step?.rows, 12);
    assert.equal(step?.lines?.length, 2);
    assert.equal(step?.stitches, 38);
    assert.equal(texts(pattern).length, 2);
  });

  test('rows written as "1st row:", with stitches as short sentences', () => {
    const pattern = `TOTE
Cast on 90 sts.
1st row: (RS). *K1. P1. Rep from * to end of row.
2nd row: *P1. K1. Rep from * to end of row.
Rep last 2 rows until work measures 30.5 cm.`;
    const step = stepWith(pattern, 'repeat rows');
    assert.equal(step?.text, 'Repeat rows 1–2 until work measures 30.5 cm.');
    assert.deepEqual(step?.lines, ['*K1. P1. Rep from * to end of row.', '*P1. K1. Rep from * to end of row.']);
    assert.equal(texts(pattern).length, 2);
  });

  test('"until 52 rows in total are complete" counts the rows', () => {
    const pattern = `BLOCK
Cast on 30 sts.
1st row: Knit.
2nd row: Purl.
Rep 1st and 2nd rows until 52 rows in total are complete.`;
    assert.equal(stepWith(pattern, 'repeat rows')?.rows, 52);
  });
});

describe('sizes', () => {
  test('sizes written "XS (S) M (L)" keep only the chosen size', () => {
    const pattern = `Sizes: XS (S) M (L)
FRONT
Cast on 86 (90) 94 (98) sts.
Work as for back until piece measures 40 cm.`;
    assert.equal(texts(pattern, 2)[0], 'Cast on 94 sts.');
  });

  test('a SIZES heading with the sizes on the next line', () => {
    const pattern = `SIZES
Scarf (Wrap)
PATTERN
Cast on 42 (82) stitches.`;
    const parsed = parsePattern(pattern);
    assert.deepEqual(parsed.sizes, ['Scarf', 'Wrap']);
    assert.equal(parsed.stepsFor(1)[0].text, 'Cast on 82 stitches.');
  });

  test('a needle size is not a size to knit', () => {
    assert.deepEqual(parsePattern('Size U.S. 8 (5 mm) knitting needles\nCast on 30 sts.').sizes, []);
  });

  test('the first size spelled out: "fourteen (16, 18) more times"', () => {
    const pattern = `Sizes: S (M, L)
THUMB
Cast on 40 sts.
Round 1: Knit to marker, m1, knit to end.
Repeat Round 1 fourteen (16, 18) more times.`;
    assert.equal(stepWith(pattern, 'repeat round', 0)?.rows, 15);
    assert.equal(stepWith(pattern, 'repeat round', 2)?.rows, 19);
  });

  test('parts written for other sizes are left out', () => {
    const pattern = `Sizes: S (M, L)
BODY
Cast on 80 (88, 96) sts.
SIZES S AND L ONLY
Knit 2 rows.
ALL SIZES
Size M only: Purl 1 row.
Bind off.`;
    assert.deepEqual(texts(pattern, 0), ['Cast on 80 sts.', 'Knit 2 rows.', 'Bind off.']);
    assert.deepEqual(texts(pattern, 1), ['Cast on 88 sts.', 'Size M only: Purl 1 row.', 'Bind off.']);
  });
});

describe('what is left out', () => {
  test('descriptions, abbreviations, a size guide and everything before the cast-on', () => {
    const pattern = `Like the sun through the trees, this wrap celebrates light.
This hat is worked in the round from the brim up.
FIND THE RIGHT SIZE
1. Measure a garment that fits.
2. Compare your measurements with those in the pattern.
ABBREVIATIONS
K = knit
st(s) = stitch(es)
INSTRUCTIONS
Cast on 96 sts.
Knit 10 rnds.`;
    assert.deepEqual(texts(pattern), ['Cast on 96 sts.', 'Knit 10 rnds.']);
  });

  test('page numbers, the small print and running headers', () => {
    const page = (n: number, body: string) => `COZY HAT BY JANE\n${body}\n© 2026 Jane Doe. All rights reserved.\nPage ${n} of 3`;
    const pattern = [
      page(1, 'Cast on 96 sts.'),
      page(2, 'Knit until hat measures 18 cm.'),
      page(3, 'Weave in ends.'),
    ].join('\n\f\n');
    assert.deepEqual(texts(pattern), ['Cast on 96 sts.', 'Knit until hat measures 18 cm.', 'Weave in ends.']);
  });

  test('swatching advice is not a step', () => {
    assert.deepEqual(texts('Begin by working a swatch to check your gauge.\nCast on 20 sts.'), ['Cast on 20 sts.']);
  });
});

describe('crochet', () => {
  test('a crochet pattern is recognised', () => {
    const pattern = `Ch 20.
Row 1: Sc in 2nd ch from hook and in each ch across, turn. (19 sc)
Row 2: Ch 1, sc in each st across, turn.
Rep row 2 until piece measures 15 cm. Fasten off.`;
    assert.equal(parsePattern(pattern).craft, 'crochet');
  });

  test('a knitting pattern is not', () => {
    assert.equal(parsePattern('Cast on 40 sts.\nRow 1: K2, p2.\nRow 2: Purl.').craft, 'knitting');
  });
});
