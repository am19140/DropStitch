/// <reference types="node" />
/** Which steps get a "Reached …" button, and which are done once. Run with `npm test`. */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { detectRows, detectSide } from '@/lib/parse-steps';
import { countsRows, lengthTarget } from '@/lib/step-rules';

describe('the "Reached …" button', () => {
  const cases: [string, string | undefined][] = [
    ['Repeat rows 1–2 until the back measures 26 cm.', '26 cm'],
    ['Work in rib for 5 cm.', '5 cm'],
    ['Continue in stockinette until sleeve reaches 40 cm.', '40 cm'],
    ['Work even until piece measures 25–27 cm.', '25–27 cm'],
    ['Work even until piece measures 12 cm from cast-on edge.', '12 cm'],
    ['Knit until the sleeve is 45 cm long.', '45 cm'],
    ['Repeat rows 1–2 until work measures 17" [43 cm].', '17 in'],
    ['Repeat rows 1–2 until work measures 30.5 cm.', '30.5 cm'],
    ['Continue for a further 3 cm.', '3 cm'],
    ['Leave a 30 cm tail for sewing.', undefined],
    ['Pick up 3 sts for every 4 rows.', undefined],
    ['Knit with an 80 cm circular needle.', undefined],
  ];
  for (const [text, target] of cases) test(text, () => assert.equal(lengthTarget(text), target));
});

describe('steps done once', () => {
  test('a cast-on after an opening phrase', () => {
    assert.equal(countsRows({ text: 'Holding both yarns together, loosely cast on 42 sts.' }), false);
  });
  test('a bind-off that goes on to knit rows', () => {
    assert.equal(countsRows({ text: 'Bind off 3 sts at the beg of the next 2 rows.' }), true);
  });
  test('knitting to a length', () => {
    assert.equal(countsRows({ text: 'Work in rib for 5 cm.' }), true);
  });
});

describe('rows and sides', () => {
  test('"Next row" is one row', () => assert.equal(detectRows('Next row (RS): K1, ssk, knit to end.'), 1));
  test('"Next 2 rows" is two', () => assert.equal(detectRows('Next 2 rows: bind off 4 sts.'), 2));
  test('side written out', () => assert.equal(detectSide('Row 2 (wrong side): purl.'), 'WS'));
  test('where a step ends is not where it starts', () =>
    assert.equal(detectSide('Work until piece measures 30 cm, ending with a wrong side row.'), undefined));
});
