import * as Haptics from 'expo-haptics';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/button';
import { rowInfo } from '@/components/project-box';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Colors, Fonts } from '@/constants/theme';
import { useProjects, type Project } from '@/store/projects';

const C = Colors.light;

export function haptic(kind: 'tap' | 'undo' | 'success') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else if (kind === 'undo') Haptics.selectionAsync();
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Sticky bottom bar with the row controls. `label`/`value` sit on the left
 * (total rows on the counter screen, the current step on the pattern screen).
 */
export function KnitBar({ project, label, value }: { project: Project; label: string; value: string }) {
  const insets = useSafeAreaInsets();
  const { increment, decrement } = useProjects(
    useShallow((s) => ({ increment: s.increment, decrement: s.decrement }))
  );
  const { row, target } = rowInfo(project);

  return (
    <View style={[styles.bar, CardShadow, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
      <View style={styles.left}>
        <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1}>
          {label}
        </ThemedText>
        <ThemedText style={styles.value} numberOfLines={1}>
          {value}
        </ThemedText>
      </View>
      <Button
        icon="remove"
        variant="secondary"
        size="large"
        accessibilityLabel="Undo one row"
        disabled={row === 0}
        onPress={() => {
          decrement(project.id);
          haptic('undo');
        }}
      />
      <Button
        label="Row"
        icon="add"
        size="large"
        onPress={() => {
          increment(project.id);
          haptic(target && row + 1 === target ? 'success' : 'tap');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 24,
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  left: { flex: 1, gap: 2 },
  value: { fontFamily: Fonts.semibold, fontSize: 20, lineHeight: 26 },
});
