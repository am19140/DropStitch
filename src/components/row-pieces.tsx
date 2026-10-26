import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { StitchText } from '@/components/stitch-help';
import { Colors, Fonts } from '@/constants/theme';

const C = Colors.light;

/**
 * A long row as a short list, split at its markers (see `rowPieces`). Tap a piece as you pass it:
 * it ticks off and the next one gets big. Ticking never counts a row; "Next row" still does.
 */
export function RowPieces({ pieces, ticked, onTick }: { pieces: string[]; ticked: number; onTick: (ticked: number) => void }) {
  return (
    <View>
      {pieces.map((piece, i) => {
        const done = i < ticked;
        const now = i === ticked;
        return (
          <Pressable
            key={i}
            accessibilityRole="checkbox"
            aria-checked={done}
            accessibilityLabel={piece}
            // Tapping a ticked piece unticks it and the ones after it.
            onPress={() => onTick(done ? i : i + 1)}
            style={[styles.piece, i > 0 && styles.divider]}>
            <View style={[styles.tick, done && styles.tickDone, now && styles.tickNow]}>
              {done ? <Icon name="check" size={15} color={C.surface} strokeWidth={3} /> : null}
            </View>
            <StitchText style={[styles.text, done && styles.textDone, now && styles.textNow, !done && !now && styles.textNext]} text={piece} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 9 },
  divider: { borderTopWidth: 1.5, borderTopColor: C.cardLine },
  tick: {
    width: 26,
    height: 26,
    marginTop: 1,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C9D6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickDone: { backgroundColor: C.primary, borderColor: C.primary },
  tickNow: { borderColor: C.primary, borderWidth: 3 },
  text: { flex: 1, fontFamily: Fonts.extrabold, fontSize: 15, lineHeight: 21, color: C.text },
  textDone: { color: C.textSecondary, opacity: 0.7, textDecorationLine: 'line-through' },
  textNow: { fontFamily: Fonts.display, fontSize: 19, lineHeight: 25 },
  textNext: { color: C.textSecondary },
});
