/// <reference types="node" />
/**
 * Long rows broken at their markers, against rows written for these tests. Run with `npm test`.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { rowPieces } from '@/lib/row-pieces';

describe('row pieces', () => {
  test('a raglan increase round breaks where you meet each marker', () => {
    assert.deepEqual(rowPieces('Inc round: knit to marker, M1R, sm, k2, sm, M1L, knit to next marker, M1R, sm, k2, sm, M1L, knit to end.'), {
      label: 'Inc round',
      pieces: ['Knit to marker, M1R', 'Sm, k2, sm, M1L', 'Knit to next marker, M1R', 'Sm, k2, sm, M1L', 'Knit to end'],
    });
  });

  test('a decrease round: a marker you slip goes with what comes after it', () => {
    assert.deepEqual(rowPieces('K1, ssk, knit to 3 sts before next marker, k2tog, k1, sm, k1, ssk, knit to 3 sts before end, k2tog, k1.')?.pieces, [
      'K1, ssk',
      'Knit to 3 sts before next marker, k2tog, k1',
      'Sm, k1, ssk',
      'Knit to 3 sts before end, k2tog, k1',
    ]);
  });

  test('a set-up round ends a piece at every marker placed', () => {
    assert.deepEqual(rowPieces('K20 for the front, pm, k12 for a sleeve, pm, k20 for the back, pm, k12 for the other sleeve.')?.pieces, [
      'K20 for the front, pm',
      'K12 for a sleeve, pm',
      'K20 for the back, pm',
      'K12 for the other sleeve',
    ]);
  });

  test('rows that repeat a group of stitches stay whole', () => {
    assert.equal(rowPieces('K2, *k3, k2tog, yo, ssk, rep from * to last 2 sts, sm, k2.'), undefined);
  });

  test('short rows, and rows without markers, stay whole', () => {
    assert.equal(rowPieces('Knit'), undefined);
    assert.equal(rowPieces('K1, p1, knit to last 2 sts, p1, k1.'), undefined);
    assert.equal(rowPieces('Repeat (k3, k2tog) eight times, then knit the remaining stitches.'), undefined);
  });
});
