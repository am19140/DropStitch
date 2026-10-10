import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
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

/** Moves on to the next step; on the last step, finishes the project and shows it. */
function useNextStep(project: Project) {
  const router = useRouter();
  const { completeStep, finishProject } = useProjects(
    useShallow((s) => ({ completeStep: s.completeStep, finishProject: s.finishProject }))
  );
  const isLast = project.currentStep >= project.steps.length - 1;
  const next = () => {
    haptic('success');
    completeStep(project.id);
    if (isLast) {
      finishProject(project.id);
      router.replace({ pathname: '/project/[id]', params: { id: project.id } });
    }
  };
  return { next, label: isLast ? 'Finish project' : 'Next step' };
}

/** "Next step" (or "Finish project" on the last step), for steps whose rows the app can't count down. */
export function NextStepButton({ project }: { project: Project }) {
  const { next, label } = useNextStep(project);
  return <Button label={label} icon="arrowRight" iconAfter variant="secondary" size="large" onPress={next} />;
}

/**
 * Sticky bottom bar with the row controls. `label`/`value` sit on the left
 * (total rows on the counter screen, the current step on the pattern screen).
 * Steps done once, like casting on, get a "Next step" button instead of the row buttons,
 * and so does a step once all its rows are counted.
 */
export function KnitBar({ project, label, value }: { project: Project; label: string; value: string }) {
  const insets = useSafeAreaInsets();
  const { increment, decrement } = useProjects(
    useShallow((s) => ({ increment: s.increment, decrement: s.decrement }))
  );
  const { step, row, target, counting } = rowInfo(project);
  const nextStep = useNextStep(project);
  const rowsDone = !!target && row >= target;

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
      {counting && (
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
      )}
      {step && (!counting || rowsDone) ? (
        // Next to the undo button there's no room for the arrow.
        <Button
          label={nextStep.label}
          icon={counting ? undefined : 'arrowRight'}
          iconAfter
          size="large"
          onPress={nextStep.next}
        />
      ) : (
        <Button
          label="Next row"
          size="large"
          onPress={() => {
            increment(project.id);
            haptic(target && row + 1 === target ? 'success' : 'tap');
          }}
        />
      )}
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
