import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Colors, Fonts } from '@/constants/theme';
import { formatDuration, useNow } from '@/lib/clock';
import { knitTime, timerRunning, useProjects, type Project } from '@/store/projects';

const C = Colors.light;

/**
 * "● Knitting 12:34  ⏸": shown while Mrs Purl is still knitting (the timer runs on for a while after
 * you leave the counter), so you can stop her from Home or the project page. While she rests, `resting` shows
 * instead. `onCobalt` styles it for a cobalt card (just the time, to fit beside a button); otherwise it sits
 * on the sky band.
 */
export function KnittingPill({ project, onCobalt, resting = null }: { project: Project; onCobalt?: boolean; resting?: ReactNode }) {
  const pauseTimer = useProjects((s) => s.pauseTimer);
  const now = useNow(!!project.timerStartedAt);
  if (!timerRunning(project, now)) return <>{resting}</>;
  const ink = onCobalt ? '#FFFFFF' : C.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mrs Purl is knitting, ${formatDuration(knitTime(project, now))}. Pause the timer.`}
      hitSlop={6}
      onPress={() => pauseTimer(project.id)}
      style={({ pressed }) => [styles.pill, onCobalt ? styles.onCobalt : styles.onBand, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={styles.dot} />
      <Text style={[styles.text, { color: ink }]} numberOfLines={1}>
        {onCobalt ? '' : 'Knitting '}
        {formatDuration(knitTime(project, now))}
      </Text>
      <View style={[styles.pause, { backgroundColor: onCobalt ? C.beige : C.text }]}>
        <Icon name="pause" size={12} color={onCobalt ? C.text : C.surface} strokeWidth={2.8} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', height: 34, paddingLeft: 12, paddingRight: 4, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8 },
  onCobalt: { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
  onBand: { backgroundColor: C.surface },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
  text: { fontFamily: Fonts.extrabold, fontSize: 13.5, fontVariant: ['tabular-nums'] },
  pause: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
