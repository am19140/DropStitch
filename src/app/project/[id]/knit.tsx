import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/button';
import { SitterArt } from '@/components/illustrations';
import { haptic, KnitBar } from '@/components/knit-bar';
import { rowInfo } from '@/components/project-box';
import { HeaderButton, ScreenHeader } from '@/components/screen-header';
import { StepList } from '@/components/step-list';
import { TextTabs } from '@/components/text-tabs';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { projectTitle, useProject, useProjects } from '@/store/projects';

const C = Colors.light;
type Tab = 'counter' | 'steps';

/** The current step: big row count, the step's instructions, and the row buttons. */
export default function KnitScreen() {
  // Knitting means long stretches without touching the screen; don't let it sleep.
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });

  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProject(id);
  const [tab, setTab] = useState<Tab>('counter');
  const { completeStep, finishProject } = useProjects(
    useShallow((s) => ({ completeStep: s.completeStep, finishProject: s.finishProject }))
  );

  if (!project) return null;

  const { step, row, target } = rowInfo(project);
  const isLast = project.currentStep >= project.steps.length - 1;
  const done = !!target && row >= target;
  const left = target ? target - row : 0;
  const cheer = done ? 'step done!' : target && left <= 3 ? 'almost there!' : target ? 'keep going!' : 'take your time';

  const onStepDone = () => {
    haptic('success');
    if (isLast) {
      completeStep(project.id);
      finishProject(project.id);
      router.replace({ pathname: '/project/[id]', params: { id: project.id } });
    } else {
      completeStep(project.id);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.top}>
        <ScreenHeader
          back="back"
          right={
            project.files.length > 0 ? (
              <HeaderButton
                icon="file"
                label="View pattern"
                onPress={() => router.push({ pathname: '/project/[id]/pdf', params: { id: project.id } })}
              />
            ) : null
          }
        />
        <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1} style={{ marginTop: 4 }}>
          {project.steps.length
            ? `${projectTitle(project).toUpperCase()} · STEP ${project.currentStep + 1} OF ${project.steps.length}`
            : 'ROW COUNTER'}
        </ThemedText>
        <Text style={styles.title} numberOfLines={1}>
          {projectTitle(project)}
        </Text>
        <TextTabs<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'counter', label: 'Counter' },
            { value: 'steps', label: `All steps${project.steps.length ? ` (${project.steps.length})` : ''}` },
          ]}
        />
      </View>

      {tab === 'counter' ? (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.hero}>
            <Text style={[styles.number, done && { color: C.matcha }]}>{row}</Text>
            <ThemedText themeColor="textSecondary" style={{ marginTop: 10 }}>
              {target ? `of ${target} rows` : step ? 'rows in this step' : 'rows'}
            </ThemedText>
            <ThemedText type="note" style={styles.cheer}>
              {cheer}
            </ThemedText>
            <View style={styles.art} pointerEvents="none">
              <SitterArt width={190} />
            </View>
          </View>

          <View style={styles.stepCard}>
            {step ? (
              <>
                <ThemedText style={{ fontSize: 16, lineHeight: 24 }}>{step.text}</ThemedText>
                {target ? (
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(100, Math.round((row / target) * 100))}%` }]} />
                  </View>
                ) : null}
                {done ? (
                  <Button label={isLast ? 'Finish project' : 'Next step'} size="large" onPress={onStepDone} />
                ) : (
                  <Pressable accessibilityRole="button" onPress={onStepDone} style={styles.linkButton}>
                    <Text style={styles.link}>{isLast ? 'Finish project' : 'Mark step done'}</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <ThemedText style={{ fontSize: 16, lineHeight: 24 }}>
                  No steps yet. Add the pattern’s steps under “All steps” to tick them off as you go.
                </ThemedText>
                <Pressable accessibilityRole="button" onPress={() => setTab('steps')} style={styles.linkButton}>
                  <Text style={styles.link}>Add steps</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <StepList project={project} />
        </View>
      )}

      <KnitBar project={project} label="TOTAL ROWS" value={String(project.rowCount)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  top: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  title: { marginTop: 4, marginBottom: 6, fontFamily: Fonts.display, fontSize: 32, lineHeight: 38, color: C.text },
  body: { paddingHorizontal: Spacing.four, paddingBottom: 24 },
  hero: { marginTop: 16, height: 220 },
  number: { fontFamily: Fonts.display, fontSize: 150, lineHeight: 140, letterSpacing: -6, color: C.text },
  cheer: { marginTop: 4, alignSelf: 'flex-start', transform: [{ rotate: '-4deg' }] },
  art: { position: 'absolute', right: -60, top: 0 },
  stepCard: { marginTop: 8, padding: 20, borderRadius: 24, backgroundColor: C.matchaMilk, gap: 14 },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(137, 142, 70, 0.3)' },
  fill: { height: 4, borderRadius: 2, backgroundColor: C.matcha },
  linkButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  link: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: C.text,
    textDecorationLine: 'underline',
    textDecorationColor: C.primary,
  },
});
