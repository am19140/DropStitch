import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardShadow, Colors, Fonts } from '@/constants/theme';
import type { Side, Step } from '@/store/projects';

const C = Colors.light;

const SIDES = {
  RS: { short: 'RS', long: 'right side' },
  WS: { short: 'WS', long: 'wrong side' },
  round: { short: 'RND', long: 'in the round' },
} as const;

type RepeatViewProps = {
  step: Step;
  repeat: { size: number; now: number; of?: number; row: number };
  side?: Side | 'round';
  unit: 'row' | 'round';
  done: boolean;
  grandma: ReactNode;
  onCycleSide: () => void;
  /** Stitch count and the full pattern text, under the instructions. */
  details: ReactNode;
};

/** One bar per repeat: done ones dark, this one blue, the rest light. */
function Segments({ now, of }: { now: number; of: number }) {
  return (
    <View style={styles.segments}>
      {Array.from({ length: of }, (_, i) => (
        <View
          key={i}
          style={[styles.segment, { backgroundColor: i < now - 1 ? C.text : i === now - 1 ? C.primary : C.beige }]}
        />
      ))}
    </View>
  );
}

/**
 * A step that repeats a few rows ("Repeat rows 1–2 11 times") on one screen. The side you're on
 * is the big thing, with which repeat you're on under it. The step's sentence only shows during
 * the first repeat; after that you know it, so just this row's instruction is left.
 */
export function RepeatView({ step, repeat, side, unit, done, grandma, onCycleSide, details }: RepeatViewProps) {
  const s = side ? SIDES[side] : undefined;
  const line = done ? undefined : step.lines?.[repeat.row - 1];
  return (
    <>
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
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
          <View style={styles.repeat}>
            <Text style={styles.repeatText}>
              {done ? 'All ' : 'Repeat '}
              <Text style={styles.repeatNumber}>{done ? repeat.of : repeat.now}</Text>
              {done ? ' done' : repeat.of ? ` of ${repeat.of}` : ''}
            </Text>
            {repeat.of ? <Segments now={done ? repeat.of + 1 : repeat.now} of={repeat.of} /> : null}
          </View>
        </View>
        {grandma}
      </View>
      <View style={[styles.card, CardShadow]}>
        {repeat.now === 1 && !done ? <Text style={styles.intro}>{step.text}</Text> : null}
        {line ? (
          <>
            {/* With two rows, RS/WS already says which one; longer repeats also say the row number. */}
            {repeat.size > 2 && (
              <Text style={styles.eyebrow}>{`${unit} ${repeat.row} of ${repeat.size}`.toUpperCase()}</Text>
            )}
            <Text style={styles.line}>{line}</Text>
          </>
        ) : null}
        {details}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { fontFamily: Fonts.display, fontSize: 80, lineHeight: 84, letterSpacing: -2, color: C.primary },
  sideLong: { fontFamily: Fonts.bold, fontSize: 19, marginTop: -2, color: C.primary },
  repeat: { marginTop: 18 },
  repeatText: { fontFamily: Fonts.bold, fontSize: 17, color: C.text },
  repeatNumber: { fontFamily: Fonts.display, fontSize: 26 },
  segments: { flexDirection: 'row', gap: 3, marginTop: 8 },
  segment: { flex: 1, height: 10, borderRadius: 5 },
  card: { marginTop: 16, padding: 20, borderRadius: 24, backgroundColor: C.surface, gap: 10 },
  eyebrow: { fontFamily: Fonts.extrabold, fontSize: 12, letterSpacing: 2, color: C.textSecondary },
  intro: { fontFamily: Fonts.medium, fontSize: 15, lineHeight: 22, color: C.textSecondary },
  line: { fontFamily: Fonts.semibold, fontSize: 22, lineHeight: 30, color: C.text },
});
