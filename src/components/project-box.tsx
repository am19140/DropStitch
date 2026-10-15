import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SelectMark } from '@/components/select-mode';
import { YarnBall } from '@/components/yarn-ball';
import { Colors, Fonts } from '@/constants/theme';
import { countsRows, projectTitle, repeatInfo, untilLength, type Project } from '@/store/projects';

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

/**
 * Where you are in a project: one short line about now ("Repeat 6 of 11"), and how far through
 * the whole pattern you are (done steps, plus the rows counted on the current one).
 */
export function progressOf(project: Project) {
  const { step, row, target, counting } = rowInfo(project);
  const total = project.steps.length;
  const stepsDone = project.steps.filter((s) => s.done).length;
  const partial = step && !step.done && counting && target ? Math.min(1, row / target) : 0;
  const fraction = total ? Math.min(1, (stepsDone + partial) / total) : undefined;
  const repeat = step ? repeatInfo(step) : undefined;
  const length = step && counting && !target ? untilLength(step) : undefined;
  let label: string;
  if (repeat?.of) label = `Repeat ${repeat.now} of ${repeat.of}`;
  else if (length) label = `${step?.inRound ? 'Round' : 'Row'} ${row + 1}, until ${length}`;
  else if (counting && target) label = `Row ${Math.min(row + 1, target)} of ${target}`;
  else if (total) label = `Step ${project.currentStep + 1} of ${total}`;
  else label = `${project.rowCount} rows`;
  return { label, fraction };
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function monthLabel(time: number) {
  const d = new Date(time);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** A project's card: a yarn ball in its colour, its name, and how far along it is (or when it was finished). */
export function ProjectBox({
  project,
  size = 'large',
  selecting = false,
  selected = false,
  onSelect,
}: {
  project: Project;
  size?: 'large' | 'small';
  /** While picking projects to remove, a tap picks the box instead of opening it. */
  selecting?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const router = useRouter();
  const large = size === 'large';
  const progress = progressOf(project);
  const { fraction } = progress;
  // The card's percentage covers the whole pattern, so it says which step you're on.
  const label = project.steps.length
    ? `Step ${project.currentStep + 1} of ${project.steps.length}`
    : progress.label;

  return (
    <Pressable
      accessibilityRole={selecting ? 'checkbox' : 'link'}
      aria-checked={selecting ? selected : undefined}
      onPress={() => (selecting ? onSelect?.() : router.push({ pathname: '/project/[id]', params: { id: project.id } }))}
      accessibilityLabel={projectTitle(project)}
      style={({ pressed }) => [
        large ? styles.large : styles.small,
        selected && styles.picked,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <YarnBall color={project.color} size={large ? 64 : 46} style={{ marginLeft: -6, marginTop: -4 }} />
      <Text style={large ? styles.nameLarge : styles.nameSmall} numberOfLines={large ? 2 : 3}>
        {projectTitle(project)}
      </Text>
      <View style={{ flex: 1 }} />
      {large ? (
        <>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { flex: 1 }]} numberOfLines={1}>
              {label}
            </Text>
            {fraction !== undefined && <Text style={styles.percent}>{Math.round(fraction * 100)}%</Text>}
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round((fraction ?? 0) * 100)}%` }]} />
          </View>
        </>
      ) : (
        <Text style={styles.meta}>{monthLabel(project.finishedAt ?? project.updatedAt)}</Text>
      )}
      {selecting && <SelectMark selected={selected} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  picked: { borderColor: Colors.light.primary, borderWidth: 2.5 },
  large: { flex: 1, minHeight: 196, borderRadius: 22, padding: 16, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardLine },
  small: { flex: 1, minHeight: 150, borderRadius: 20, padding: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardLine },
  nameLarge: { marginTop: 6, fontFamily: Fonts.display, fontSize: 18, lineHeight: 22, color: C.text },
  nameSmall: { marginTop: 4, fontFamily: Fonts.extrabold, fontSize: 13.5, lineHeight: 17, color: C.text },
  meta: { marginTop: 8, fontFamily: Fonts.bold, fontSize: 12.5, color: C.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  percent: { fontFamily: Fonts.display, fontSize: 15, color: C.text },
  track: { marginTop: 8, height: 6, borderRadius: 3, backgroundColor: C.cardLine, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: C.primary },
});
