import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { CardShadow, Colors, Fonts } from '@/constants/theme';

const C = Colors.light;

/** Picking several things in a list at once (projects, yarn), to remove them together. */
export function useSelection() {
  const [selecting, setSelecting] = useState(false);
  const [ids, setIds] = useState<Set<string>>(new Set());
  return {
    selecting,
    ids,
    isSelected: (id: string) => ids.has(id),
    toggle: (id: string) =>
      setIds((now) => {
        const next = new Set(now);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    selectAll: (all: string[]) => setIds(new Set(all)),
    start: () => setSelecting(true),
    stop: () => {
      setSelecting(false);
      setIds(new Set());
    },
  };
}

/** "Select" to start picking, "Done" to stop. */
export function SelectToggle({ selecting, onPress, style }: { selecting: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={[styles.toggle, selecting && styles.toggleOn, style]}>
      <Text style={[styles.toggleText, selecting && { color: C.surface }]}>{selecting ? 'Done' : 'Select'}</Text>
    </Pressable>
  );
}

/** The tick in the corner of a card while picking. */
export function SelectMark({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.mark, selected && styles.markOn]} pointerEvents="none">
      {selected ? <Icon name="check" size={16} color={C.surface} strokeWidth={3} /> : null}
    </View>
  );
}

/** Floats at the bottom while picking: how many, select all, and remove. */
export function SelectBar({
  count,
  total,
  onSelectAll,
  onRemove,
}: {
  count: number;
  total: number;
  onSelectAll: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.bar, CardShadow]}>
      <Pressable accessibilityRole="button" onPress={onSelectAll} hitSlop={8} disabled={count === total}>
        <Text style={[styles.barText, count === total && { opacity: 0.4 }]}>Select all</Text>
      </Pressable>
      <Text style={styles.count}>{count === 0 ? 'Tap to pick' : `${count} picked`}</Text>
      <Button label="Remove" icon="trash" variant="danger" size="small" disabled={count === 0} onPress={onRemove} />
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    alignSelf: 'flex-end',
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: C.text, borderColor: C.text },
  toggleText: { fontFamily: Fonts.bold, fontSize: 14, color: C.text },
  mark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: C.text,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOn: { backgroundColor: C.primary, borderColor: C.primary },
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 10,
    borderRadius: 28,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.cardLine,
  },
  barText: { fontFamily: Fonts.bold, fontSize: 14, color: C.text },
  count: { flex: 1, textAlign: 'center', fontFamily: Fonts.semibold, fontSize: 14, color: C.textSecondary },
});
