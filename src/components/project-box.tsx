import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { countsRows, projectTitle, type Project } from '@/store/projects';

const C = Colors.light;

/** Current row count and target for a project's current step (or the total when there are no steps). */
export function rowInfo(project: Project) {
  const step = project.steps[project.currentStep];
  return {
    step,
    row: step ? step.rowsDone : project.rowCount,
    target: step?.rows,
    /** False for steps done once, like casting on: they have no rows to count. */
    counting: step ? countsRows(step) : true,
  };
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function monthLabel(time: number) {
  const d = new Date(time);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** A paint-chip style box for a project: name on top, progress at the bottom. */
export function ProjectBox({ project, size = 'large' }: { project: Project; size?: 'large' | 'small' }) {
  const { row, target, counting } = rowInfo(project);
  const large = size === 'large';
  const stepsDone = project.steps.filter((s) => s.done).length;
  // A step done once (like casting on) has no rows, so show the step instead.
  const fraction = !counting ? stepsDone / project.steps.length : target ? Math.min(1, row / target) : 0;
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })}
      accessibilityLabel={projectTitle(project)}
      style={({ pressed }) => [
        large ? styles.large : styles.small,
        { backgroundColor: project.color, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}>
      <Text style={large ? styles.nameLarge : styles.nameSmall} numberOfLines={3}>
        {projectTitle(project).toUpperCase()}
      </Text>
      <View style={{ flex: 1 }} />
      {large ? (
        <>
          <Text style={styles.count}>
            {counting ? row : project.currentStep + 1}
            {!counting ? (
              <Text style={styles.countTarget}>/{project.steps.length}</Text>
            ) : target ? (
              <Text style={styles.countTarget}>/{target}</Text>
            ) : null}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%` }]} />
          </View>
          <Text style={styles.meta}>
            {!counting
              ? 'STEPS'
              : project.steps.length
                ? `STEP ${project.currentStep + 1} OF ${project.steps.length}`
                : 'ROWS'}
          </Text>
        </>
      ) : (
        <Text style={styles.meta}>{monthLabel(project.finishedAt ?? project.updatedAt)}</Text>
      )}
      </Pressable>
  );
}

const styles = StyleSheet.create({
  large: { flex: 1, height: 200, borderRadius: 22, padding: 16, paddingTop: 18 },
  small: { flex: 1, height: 128, borderRadius: 18, padding: 12, paddingTop: 14 },
  nameLarge: { fontFamily: Fonts.extrabold, fontSize: 18, lineHeight: 20, letterSpacing: 0.7, color: C.text },
  nameSmall: { fontFamily: Fonts.extrabold, fontSize: 13, lineHeight: 15, letterSpacing: 0.5, color: C.text },
  count: { fontFamily: Fonts.display, fontSize: 40, lineHeight: 42, letterSpacing: -1, color: C.text },
  countTarget: { fontSize: 18, letterSpacing: 0 },
  track: { marginTop: 8, height: 4, borderRadius: 2, backgroundColor: 'rgba(28, 26, 23, 0.14)' },
  fill: { height: 4, borderRadius: 2, backgroundColor: C.text },
  meta: { marginTop: 8, fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 1.5, color: C.text },
});
