import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RowPieces } from '@/components/row-pieces';
import { Colors, Fonts } from '@/constants/theme';
import { rowPieces } from '@/lib/row-pieces';
import type { Side, Step } from '@/store/projects';

const C = Colors.light;

const SIDES = {
  RS: { short: 'RS', long: 'right side' },
  WS: { short: 'WS', long: 'wrong side' },
  round: { short: 'RND', long: 'in the round' },
} as const;

type Repeat = { size: number; now: number; of?: number; row: number };

/** One bar per repeat: done ones dark, this one blue, the rest light. */
function Segments({ now, of }: { now: number; of: number }) {
  return (
    <View style={styles.segments}>
      {Array.from({ length: of }, (_, i) => (
        <View
          key={i}
          style={[styles.segment, { backgroundColor: i < now - 1 ? C.text : i === now - 1 ? C.primary : 'rgba(255, 252, 244, 0.75)' }]}
        />
      ))}
    </View>
  );
}

/**
 * The counter's big side for a step that repeats a few rows ("Repeat rows 1–2 11 times"):
 * the side you're on in big letters, with which repeat you're on under it.
 */
export function RepeatSide({
  repeat,
  side,
  unit,
  done,
  until,
  onCycleSide,
}: {
  repeat: Repeat;
  side?: Side | 'round';
  unit: 'row' | 'round';
  done: boolean;
  /** "26 cm" for "repeat until it measures 26 cm". */
  until?: string;
  onCycleSide: () => void;
}) {
  const s = side ? SIDES[side] : undefined;
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s ? `This ${unit} is ${s.long}. Tap to change.` : undefined}
        disabled={!s}
        onPress={onCycleSide}>
        {s && !done ? (
          <>
            <Text style={styles.side}>{s.short}</Text>
            <Text style={styles.sideLong}>{s.long}</Text>
          </>
        ) : (
          <Text style={styles.side}>✓</Text>
        )}
      </Pressable>
      <Text style={styles.repeatText}>
        {done
          ? `All ${repeat.of} repeats done`
          : `Repeat ${repeat.now}${repeat.of ? ` of ${repeat.of}` : until ? `, until ${until}` : ''}`}
      </Text>
      {repeat.of ? <Segments now={done ? repeat.of + 1 : repeat.now} of={repeat.of} /> : null}
    </View>
  );
}

/**
 * What to do on this row of a repeating step. The step's sentence only shows during the first
 * repeat; after that you know it, so just this row's instruction is left. A long row with markers
 * shows as pieces to tick off (`ticked` of them so far).
 */
export function RepeatCard({
  step,
  repeat,
  unit,
  done,
  details,
  ticked,
  onTick,
}: {
  step: Step;
  repeat: Repeat;
  unit: 'row' | 'round';
  done: boolean;
  details: ReactNode;
  ticked: number;
  onTick: (ticked: number) => void;
}) {
  const line = done ? undefined : step.lines?.[repeat.row - 1];
  const split = line ? rowPieces(line) : undefined;
  return (
    <>
      {repeat.now === 1 && !done ? <Text style={styles.intro}>{step.text}</Text> : null}
      {line ? (
        <>
          <Text style={styles.eyebrow}>
            {/* With two rows, RS/WS already says which one; longer repeats also say the row number. */}
            {repeat.size > 2 ? `This ${unit} · ${repeat.row} of ${repeat.size}` : `This ${unit}`}
            {split?.label ? ` · ${split.label.toLowerCase()}` : ''}
          </Text>
          {split ? <RowPieces pieces={split.pieces} ticked={ticked} onTick={onTick} /> : <Text style={styles.line}>{line}</Text>}
        </>
      ) : null}
      {details}
    </>
  );
}

const styles = StyleSheet.create({
  side: { fontFamily: Fonts.display, fontSize: 76, lineHeight: 80, letterSpacing: -2, color: C.primary },
  sideLong: { marginTop: -4, fontFamily: Fonts.extrabold, fontSize: 17, color: C.primary },
  repeatText: { marginTop: 10, fontFamily: Fonts.extrabold, fontSize: 15, color: C.text },
  segments: { width: 156, flexDirection: 'row', gap: 3, marginTop: 8 },
  segment: { flex: 1, height: 9, borderRadius: 5 },
  intro: { fontFamily: Fonts.semibold, fontSize: 14.5, lineHeight: 21, color: C.textSecondary },
  eyebrow: { fontFamily: Fonts.bold, fontSize: 13, color: C.textSecondary },
  line: { fontFamily: Fonts.extrabold, fontSize: 20, lineHeight: 27, color: C.text },
});
