import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { YarnBall } from '@/components/yarn-ball';
import { Colors, Fonts } from '@/constants/theme';
import { countsRows, projectTitle, repeatInfo, type Project } from '@/store/projects';

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

/** Where you are in a project, as one short line ("Repeat 6 of 11") and a fraction for a bar. */
export function progressOf(project: Project) {
  const { step, row, target, counting } = rowInfo(project);
  const stepsDone = project.steps.filter((s) => s.done).length;
  const repeat = step ? repeatInfo(step) : undefined;
  if (repeat?.of) return { label: `Repeat ${repeat.now} of ${repeat.of}`, fraction: Math.min(1, row / (target ?? 1)) };
  if (counting && target) return { label: `Row ${Math.min(row + 1, target)} of ${target}`, fraction: Math.min(1, row / target) };
  if (project.steps.length) {
    return { label: `${stepsDone} of ${project.steps.length} steps done`, fraction: stepsDone / project.steps.length };
  }
  return { label: `${project.rowCount} rows`, fraction: undefined };
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function monthLabel(time: number) {
  const d = new Date(time);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** A project's card: a yarn ball in its colour, its name, and how far along it is (or when it was finished). */
export function ProjectBox({ project, size = 'large' }: { project: Project; size?: 'large' | 'small' }) {
  const router = useRouter();
  const large = size === 'large';
  const { label, fraction } = progressOf(project);

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })}
      accessibilityLabel={projectTitle(project)}
      style={({ pressed }) => [large ? styles.large : styles.small, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <YarnBall color={project.color} size={large ? 64 : 46} style={{ marginLeft: -6, marginTop: -4 }} />
      <Text style={large ? styles.nameLarge : styles.nameSmall} numberOfLines={large ? 2 : 3}>
        {projectTitle(project)}
      </Text>
      <View style={{ flex: 1 }} />
      {large ? (
        <>
          <Text style={styles.meta}>{label}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round((fraction ?? 0) * 100)}%` }]} />
          </View>
        </>
      ) : (
        <Text style={styles.meta}>{monthLabel(project.finishedAt ?? project.updatedAt)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  large: { flex: 1, minHeight: 196, borderRadius: 22, padding: 16, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardLine },
  small: { flex: 1, minHeight: 150, borderRadius: 20, padding: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardLine },
  nameLarge: { marginTop: 6, fontFamily: Fonts.display, fontSize: 18, lineHeight: 22, color: C.text },
  nameSmall: { marginTop: 4, fontFamily: Fonts.extrabold, fontSize: 13.5, lineHeight: 17, color: C.text },
  meta: { marginTop: 8, fontFamily: Fonts.bold, fontSize: 12.5, color: C.textSecondary },
  track: { marginTop: 8, height: 6, borderRadius: 3, backgroundColor: C.cardLine, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: C.primary },
});
