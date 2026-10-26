/// <reference types="node" />
/** Stitch help: which stitch names a row holds, and where. Run with `npm test`. */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { stitchesIn, stitchMatches } from '@/lib/stitches';

const keys = (text: string) => stitchesIn([text]).map((s) => s.key);

describe('stitch help', () => {
  test('finds the stitches in a row, each once, in order', () => {
    assert.deepEqual(keys('K1, ssk, knit to 3 sts before m, k2tog, k1. Next: k1, ssk.'), ['ssk', 'm', 'k2tog']);
  });

  test('the longer abbreviation wins: sssk is not ssk, M1L is not M1', () => {
    assert.deepEqual(keys('Sssk, k to m, M1L, k1, M1, sm.'), ['sssk', 'm', 'm1l', 'm1', 'sm']);
  });

  test('plain knit and purl, sizes and metres are not stitches', () => {
    assert.deepEqual(keys('K2, p2 to end. Size M only: work 5 m of yarn.'), []);
  });

  test('markers: pm, sm and a lone m', () => {
    assert.deepEqual(keys('K10, pm, k to m, sm, k to end.'), ['pm', 'm', 'sm']);
  });

  test('repeat from * and stockinette', () => {
    assert.deepEqual(keys('*K2, yo, k2tog; rep from * to end. Work in st st for 5 cm.'), ['yo', 'k2tog', 'rep', 'stst']);
  });

  test('matches carry their place in the text, for marking the words', () => {
    const text = 'K1, ssk, k1.';
    const [m] = stitchMatches(text);
    assert.equal(text.slice(m.start, m.end), 'ssk');
  });
});
