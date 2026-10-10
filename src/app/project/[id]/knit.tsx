import { useKeepAwake } from 'expo-keep-awake';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { haptic, KnitBar } from '@/components/knit-bar';
import PaintedKnittingGrandma from '@/components/grandma/painted-knitting-grandma';
import { HeaderButton, ScreenHeader } from '@/components/screen-header';
import { StepList } from '@/components/step-list';
import { TextTabs } from '@/components/text-tabs';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Colors, Fonts, Spacing } from '@/constants/theme';
import { cheer } from '@/lib/cheers';
import {
  currentLine,
  currentSide,
  knitTime,
  projectTitle,
  useProject,
  useProjects,
  type Side,
  type Step,
} from '@/store/projects';

const C = Colors.light;
type Tab = 'counter' | 'steps';

const SIDE_STYLE = {
  RS: { bg: C.red, fg: C.onRed, short: 'RS', long: 'right side' },
  WS: { bg: C.primary, fg: C.onPrimary, short: 'WS', long: 'wrong side' },
  round: { bg: C.beige, fg: C.text, short: 'RND', long: 'in the round' },
} as const;

/** "0:42" / "1:05:09" */
function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** The current time, ticking every second while `active`. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [active]);
  return now;
}

/** The current step: where you are in the pattern, which row and which side, plus the row buttons. */
export default function KnitScreen() {
  // Knitting means long stretches without touching the screen; don't let it sleep.
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });

  const router = useRouter();
  const isFocused = useIsFocused();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProject(id);
  const [tab, setTab] = useState<Tab>('counter');
  // Which step's full pattern text is open, so it closes again when you move on.
  const [detailFor, setDetailFor] = useState<string | null>(null);
  const { completeStep, finishProject, updateStep, startTimer, pauseTimer } = useProjects(
    useShallow((s) => ({
      completeStep: s.completeStep,
      finishProject: s.finishProject,
      updateStep: s.updateStep,
      startTimer: s.startTimer,
      pauseTimer: s.pauseTimer,
    }))
  );
  const running = !!project?.timerStartedAt;
  const now = useNow(running);

  if (!project) return null;

  const step: Step | undefined = project.steps[project.currentStep];
  const rowsDone = step ? step.rowsDone : project.rowCount;
  const target = step?.rows;
  const done = !!target && rowsDone >= target;
  const isLast = project.currentStep >= project.steps.length - 1;
  // The row you're working on now (1-based); once the step is done, show the last row.
  const rowNow = done ? target : rowsDone + 1;
  const side = step ? currentSide(step) : undefined;
  const sideKey: keyof typeof SIDE_STYLE | undefined = step?.inRound ? 'round' : side;
  const unit = step?.inRound ? 'round' : 'row';
  const line = step && !done ? currentLine(step) : undefined;
  const showDetail = !!step && detailFor === step.id;
  const repeatOf = step?.lines?.length && target ? Math.ceil(target / step.lines.length) : 0;
  const repeatNow = step?.lines?.length ? Math.min(repeatOf, Math.floor(rowsDone / step.lines.length) + 1) : 0;

  const onStepDone = () => {
    haptic('success');
    completeStep(project.id);
    if (isLast) {
      finishProject(project.id);
      router.replace({ pathname: '/project/[id]', params: { id: project.id } });
    }
  };

  /** Tapping the side badge corrects it: right side → wrong side → in the round → right side. */
  const cycleSide = () => {
    if (!step) return;
    const next: keyof typeof SIDE_STYLE = sideKey === 'RS' ? 'WS' : sideKey === 'WS' ? 'round' : 'RS';
    if (next === 'round') {
      updateStep(project.id, step.id, { inRound: true, startSide: undefined });
    } else {
      // Store the side of the step's first row, so the current row ends up on `next`.
      const flip: Side = next === 'RS' ? 'WS' : 'RS';
      updateStep(project.id, step.id, { inRound: false, startSide: rowsDone % 2 === 0 ? next : flip });
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
            : projectTitle(project).toUpperCase()}
        </ThemedText>
        {step?.section ? (
          <Text style={styles.where} numberOfLines={2}>
            <Text style={styles.whereSmall}>You’re knitting the{'\n'}</Text>
            {step.section.toLowerCase()}
          </Text>
        ) : (
          <Text style={styles.where} numberOfLines={1}>
            {project.steps.length ? 'Current step' : 'Row counter'}
          </Text>
        )}
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
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.number, rowNow >= 100 && styles.numberSmall, done && { color: C.primary }]}>
                {rowNow}
              </Text>
              <ThemedText style={styles.rowLabel}>
                {done
                  ? `all ${target} ${unit}s done`
                  : target
                    ? `${unit} ${rowNow} of ${target}`
                    : `${unit} ${rowNow}`}
              </ThemedText>
              {step && !done && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    sideKey ? `This ${unit} is ${SIDE_STYLE[sideKey].long}. Tap to change.` : 'Set which side this row is on'
                  }
                  onPress={cycleSide}
                  style={[
                    styles.sideBadge,
                    { backgroundColor: sideKey ? SIDE_STYLE[sideKey].bg : C.surface },
                    !sideKey && styles.sideUnknown,
                  ]}>
                  <Text style={[styles.sideShort, { color: sideKey ? SIDE_STYLE[sideKey].fg : C.text }]}>
                    {sideKey ? SIDE_STYLE[sideKey].short : '?'}
                  </Text>
                  <Text style={[styles.sideLong, { color: sideKey ? SIDE_STYLE[sideKey].fg : C.text }]}>
                    {sideKey ? SIDE_STYLE[sideKey].long : 'tap to set side'}
                  </Text>
                </Pressable>
              )}
            </View>
            <PaintedKnittingGrandma paused={!running} width={168} active={isFocused} />
          </View>

          <View style={styles.timerRow}>
            <View style={styles.cheer}>
              <Text style={styles.cheerText} numberOfLines={2}>
                {running ? cheer(project.currentStep, rowsDone, target) : 'shh… Purl dozed off'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={running ? 'Pause the knitting timer' : 'Start the knitting timer'}
              onPress={() => (running ? pauseTimer(project.id) : startTimer(project.id))}
              style={({ pressed }) => [styles.timer, running && styles.timerOn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
              <Icon name={running ? 'pause' : 'play'} size={18} color={running ? C.onPrimary : C.text} strokeWidth={2.2} />
              <Text style={[styles.timerText, running && { color: C.onPrimary }]}>{formatDuration(knitTime(project, now))}</Text>
            </Pressable>
          </View>

          <View style={[styles.stepCard, CardShadow]}>
            {step ? (
              <>
                <ThemedText type="eyebrow" themeColor="textSecondary">CURRENT STEP</ThemedText>
                <ThemedText style={styles.stepText}>{step.text}</ThemedText>
                {line && (
                  <View style={styles.thisRow}>
                    <ThemedText type="eyebrow">{`THIS ${unit.toUpperCase()}`}</ThemedText>
                    <ThemedText style={styles.thisRowText}>{line}</ThemedText>
                  </View>
                )}
                {(repeatOf > 1 && !done) || step.stitches ? (
                  <View style={styles.chips}>
                    {repeatOf > 1 && !done && (
                      <View style={styles.repeatChip}>
                        <Text style={styles.repeatText}>
                          repeat {repeatNow} of {repeatOf}
                        </Text>
                      </View>
                    )}
                    {step.stitches ? (
                      <View style={[styles.repeatChip, { backgroundColor: C.skySoft }]}>
                        <Text style={styles.repeatText}>ends with {step.stitches} sts</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                {step.detail ? (
                  <View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: showDetail }}
                      onPress={() => setDetailFor(showDetail ? null : step.id)}
                      style={styles.detailToggle}>
                      <Text style={styles.detailToggleText}>
                        {showDetail ? 'Hide pattern text' : 'Full pattern text'}
                      </Text>
                      <Icon name={showDetail ? 'up' : 'chevronDown'} size={16} color={C.textSecondary} strokeWidth={2} />
                    </Pressable>
                    {showDetail && <Text style={styles.detailText}>{step.detail}</Text>}
                  </View>
                ) : null}
                {target ? (
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(100, Math.round((rowsDone / target) * 100))}%` }]} />
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
                <ThemedText style={styles.stepText}>
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
  where: { marginTop: 4, marginBottom: 4, fontFamily: Fonts.display, fontSize: 32, lineHeight: 36, color: C.text },
  whereSmall: { fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 22, color: C.textSecondary },
  body: { paddingHorizontal: Spacing.four, paddingBottom: 24 },
  hero: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  number: { fontFamily: Fonts.display, fontSize: 112, lineHeight: 110, letterSpacing: -4, color: C.text },
  numberSmall: { fontSize: 84, lineHeight: 90 },
  rowLabel: { fontFamily: Fonts.bold, fontSize: 17, color: C.text },
  sideBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideUnknown: { borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed' },
  sideShort: { fontFamily: Fonts.display, fontSize: 24, lineHeight: 30 },
  sideLong: { fontFamily: Fonts.bold, fontSize: 14 },
  timerRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cheer: { flexShrink: 1, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.beige },
  timer: {
    marginLeft: 'auto',
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.text,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerOn: { backgroundColor: C.primary, borderColor: C.primary },
  timerText: { fontFamily: Fonts.bold, fontSize: 15, color: C.text, fontVariant: ['tabular-nums'] },
  cheerText: { fontFamily: Fonts.displayItalic, fontSize: 18, color: C.text },
  stepCard: { marginTop: 16, padding: 20, borderRadius: 24, backgroundColor: C.surface, gap: 12 },
  stepText: { fontSize: 17, lineHeight: 25, fontFamily: Fonts.medium },
  thisRow: { padding: 14, borderRadius: 16, backgroundColor: C.sky, gap: 4 },
  thisRowText: { fontFamily: Fonts.semibold, fontSize: 16, lineHeight: 23 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailToggle: { alignSelf: 'flex-start', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailToggleText: { fontFamily: Fonts.semibold, fontSize: 13, color: C.textSecondary },
  detailText: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 21, color: C.textSecondary },
  repeatChip: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: C.beige },
  repeatText: { fontFamily: Fonts.bold, fontSize: 13, color: C.text },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(3, 79, 201, 0.16)' },
  fill: { height: 4, borderRadius: 2, backgroundColor: C.primary },
  linkButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  link: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: C.text,
    textDecorationLine: 'underline',
    textDecorationColor: C.red,
  },
});
