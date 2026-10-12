import { useKeepAwake } from 'expo-keep-awake';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Icon } from '@/components/icon';
import { KnitBar, NextStepButton } from '@/components/knit-bar';
import PaintedKnittingGrandma from '@/components/grandma/painted-knitting-grandma';
import { RepeatCard, RepeatSide } from '@/components/repeat-view';
import { HeaderButton, ScreenHeader } from '@/components/screen-header';
import { StepList } from '@/components/step-list';
import { TextTabs } from '@/components/text-tabs';
import { Tour, TourTarget, type TourStep } from '@/components/tour';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import {
  countsRows,
  currentLine,
  currentSide,
  knitTime,
  projectTitle,
  repeatInfo,
  untilLength,
  useProject,
  useProjects,
  type Side,
  type Step,
} from '@/store/projects';

const C = Colors.light;
type Tab = 'counter' | 'steps';

const SIDE_STYLE = {
  RS: { short: 'RS', long: 'right side' },
  WS: { short: 'WS', long: 'wrong side' },
  round: { short: 'RND', long: 'in the round' },
} as const;

/** Purl's guide the first time the counter opens. */
const KNIT_TOUR: TourStep[] = [
  {
    target: 'knit.hero',
    title: 'Where you are',
    text: 'Right side or wrong side, which row or repeat you’re on, and how many rows to go. The timer runs while you knit.',
  },
  {
    target: 'knit.bar',
    title: 'One tap per row',
    text: 'Tap Next row after every row. Counted one too many? Tap −. When a step is done, the button turns into Next step.',
  },
  {
    target: 'knit.tabs',
    title: 'All the steps',
    text: 'See every step of your pattern, tick them off, or tap one to jump to it.',
  },
  {
    target: 'knit.pattern',
    title: 'The original pattern',
    text: 'Peek at your PDF any time, without losing your place.',
  },
];

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
  const { updateStep, startTimer, pauseTimer } = useProjects(
    useShallow((s) => ({
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
  // Steps done once, like casting on, have no rows: no row number, no side, just "Next step".
  const counting = step ? countsRows(step) : true;
  // The row you're working on now (1-based); once the step is done, show the last row.
  const rowNow = done ? target : rowsDone + 1;
  const side = step ? currentSide(step) : undefined;
  const sideKey: keyof typeof SIDE_STYLE | undefined = step?.inRound ? 'round' : side;
  const unit = step?.inRound ? 'round' : 'row';
  const line = step && !done ? currentLine(step) : undefined;
  const showDetail = !!step && detailFor === step.id;
  // "Knit and purl 11 times each": one screen for the whole step, counting repeats (6/11).
  const repeat = step ? repeatInfo(step) : undefined;

  const grandma = <PaintedKnittingGrandma paused={!running} width={196} active={isFocused} />;
  const details = step ? (
    <>
      {step.stitches ? (
        <View style={[styles.repeatChip, { backgroundColor: C.skySoft }]}>
          <Text style={styles.repeatText}>ends with {step.stitches} sts</Text>
        </View>
      ) : null}
      {/* Repeating steps hide their sentence after the first repeat, so keep it one tap away. */}
      {step.detail || repeat ? (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showDetail }}
            onPress={() => setDetailFor(showDetail ? null : step.id)}
            style={styles.detailToggle}>
            <Text style={styles.detailToggleText}>{showDetail ? 'Hide pattern text' : 'Full pattern text'}</Text>
            <Icon name={showDetail ? 'up' : 'chevronDown'} size={16} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          {showDetail && <Text style={styles.detailText}>{step.detail ?? step.text}</Text>}
        </View>
      ) : null}
    </>
  ) : null;

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

  const timerPill = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={running ? 'Pause the knitting timer' : 'Start the knitting timer'}
      onPress={() => (running ? pauseTimer(project.id) : startTimer(project.id))}
      style={({ pressed }) => [styles.pill, styles.timer, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
      <Icon name={running ? 'pause' : 'play'} size={14} color={C.text} strokeWidth={2.6} />
      <Text style={styles.pillText}>{formatDuration(knitTime(project, now))}</Text>
    </Pressable>
  );
  const toGo = counting && target && !done ? target - rowsDone : 0;
  const until = step && counting && !target ? untilLength(step) : undefined;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.top}>
        <ScreenHeader
          back="back"
          round
          right={
            project.files.length > 0 ? (
              <TourTarget id="knit.pattern">
                <HeaderButton
                  icon="file"
                  label="View pattern"
                  round
                  onPress={() => router.push({ pathname: '/project/[id]/pdf', params: { id: project.id } })}
                />
              </TourTarget>
            ) : null
          }
        />
        <Text style={styles.eyebrow} numberOfLines={1}>
          {project.steps.length
            ? `${projectTitle(project)} · step ${project.currentStep + 1} of ${project.steps.length}`
            : projectTitle(project)}
        </Text>
        <Text style={styles.where} numberOfLines={2}>
          {step?.section ? `You’re knitting the ${step.section.toLowerCase()}` : project.steps.length ? 'Current step' : 'Row counter'}
        </Text>
        <TourTarget id="knit.tabs" style={{ alignSelf: 'flex-start' }}>
          <TextTabs<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'counter', label: 'Counter' },
              { value: 'steps', label: `All steps${project.steps.length ? ` (${project.steps.length})` : ''}` },
            ]}
          />
        </TourTarget>
      </View>

      {tab === 'counter' ? (
        <ScrollView contentContainerStyle={styles.body}>
          {/* The sky card: where you are, big, with Purl knitting (or dozing while the timer is paused). */}
          <TourTarget id="knit.hero">
          <View style={styles.hero}>
            <View style={styles.grandma} pointerEvents="none">
              {grandma}
            </View>
            <View style={styles.heroLeft}>
              {step && repeat && counting ? (
                <RepeatSide repeat={repeat} side={sideKey} unit={unit} done={done} until={until} onCycleSide={cycleSide} />
              ) : counting ? (
                <>
                  <Text style={[styles.number, (rowNow ?? 0) >= 100 && styles.numberSmall]}>{rowNow}</Text>
                  <Text style={styles.rowLabel}>
                    {done
                      ? target === 1
                        ? `${unit[0].toUpperCase()}${unit.slice(1)} done`
                        : `All ${target} ${unit}s done`
                      : target
                        ? `${unit[0].toUpperCase()}${unit.slice(1)} ${rowNow} of ${target}`
                        : `${unit[0].toUpperCase()}${unit.slice(1)} ${rowNow}${until ? `, until ${until}` : ''}`}
                  </Text>
                  {!done && sideKey && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`This ${unit} is ${SIDE_STYLE[sideKey].long}. Tap to change.`}
                      onPress={cycleSide}
                      style={styles.sideChip}>
                      <View style={styles.sideTag}>
                        <Text style={styles.sideShort}>{SIDE_STYLE[sideKey].short}</Text>
                      </View>
                      <Text style={styles.sideLong}>{SIDE_STYLE[sideKey].long}</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.number}>{project.currentStep + 1}</Text>
                  <Text style={styles.rowLabel}>
                    Step {project.currentStep + 1} of {project.steps.length}
                  </Text>
                  <Text style={styles.onceText}>Do it once,{'\n'}then on to the next</Text>
                </>
              )}
            </View>
            {toGo > 0 && (
              <View style={[styles.pill, styles.toGo]}>
                <View style={styles.dot} />
                <Text style={styles.pillText}>
                  {toGo} {toGo === 1 ? unit : `${unit}s`} to go
                </Text>
              </View>
            )}
            {timerPill}
          </View>
          </TourTarget>

          {/* "Repeat rows 1–2 until it measures 26 cm": the rows keep flipping RS/WS above,
              and this says when you've got there. */}
          {step && counting && !target && (
            <View style={{ marginTop: 12 }}>
              <NextStepButton project={project} length={until} />
            </View>
          )}

          <View style={styles.stepCard}>
            {step && repeat && counting ? (
              <RepeatCard step={step} repeat={repeat} unit={unit} done={done} details={details} />
            ) : step ? (
              <>
                <Text style={styles.cardLabel}>Current step</Text>
                <Text style={styles.stepText}>{step.text}</Text>
                {line && (
                  <View style={styles.thisRow}>
                    <Text style={styles.cardLabel}>{`This ${unit}`}</Text>
                    <Text style={styles.thisRowText}>{line}</Text>
                  </View>
                )}
                {details}
                {counting && target ? (
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(100, Math.round((rowsDone / target) * 100))}%` }]} />
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.stepText}>
                  No steps yet. Add the pattern’s steps under “All steps” to tick them off as you go.
                </Text>
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

      <TourTarget id="knit.bar">
        <KnitBar project={project} label="Total rows" value={String(project.rowCount)} />
      </TourTarget>
      <Tour id="knit" steps={KNIT_TOUR} ready={tab === 'counter'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  top: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  eyebrow: { marginTop: 8, fontFamily: Fonts.bold, fontSize: 13.5, color: C.textSecondary },
  where: { marginTop: 2, marginBottom: 12, fontFamily: Fonts.display, fontSize: 23, lineHeight: 28, color: C.text },
  body: { paddingHorizontal: Spacing.four, paddingTop: 14, paddingBottom: 24 },
  hero: { minHeight: 232, padding: 18, paddingBottom: 60, borderRadius: 28, backgroundColor: C.band, overflow: 'hidden' },
  heroLeft: { maxWidth: 190 },
  grandma: { position: 'absolute', right: -30, bottom: -26 },
  number: { fontFamily: Fonts.display, fontSize: 96, lineHeight: 100, letterSpacing: -3, color: C.text },
  numberSmall: { fontSize: 76, lineHeight: 84 },
  rowLabel: { fontFamily: Fonts.extrabold, fontSize: 16, color: C.text },
  onceText: { marginTop: 6, fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 19, color: C.text },
  sideChip: { marginTop: 10, alignSelf: 'flex-start', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sideTag: { height: 28, paddingHorizontal: 9, borderRadius: 9, backgroundColor: C.primary, justifyContent: 'center' },
  sideShort: { fontFamily: Fonts.display, fontSize: 15, color: C.onPrimary },
  sideLong: { fontFamily: Fonts.extrabold, fontSize: 15, color: C.text },
  pill: {
    position: 'absolute',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pillText: { fontFamily: Fonts.extrabold, fontSize: 13.5, color: C.text, fontVariant: ['tabular-nums'] },
  toGo: { top: 16, right: 16 },
  timer: { left: 20, bottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
  stepCard: { marginTop: 14, padding: 18, borderRadius: 22, borderWidth: 1.5, borderColor: C.cardLine, backgroundColor: C.surface, gap: 8 },
  cardLabel: { fontFamily: Fonts.bold, fontSize: 13, color: C.textSecondary },
  stepText: { fontFamily: Fonts.extrabold, fontSize: 18, lineHeight: 25, color: C.text },
  thisRow: { marginTop: 4, padding: 14, borderRadius: 16, backgroundColor: C.card, gap: 2 },
  thisRowText: { fontFamily: Fonts.extrabold, fontSize: 19, lineHeight: 26, color: C.text },
  detailToggle: { alignSelf: 'flex-start', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailToggleText: { fontFamily: Fonts.bold, fontSize: 13.5, color: C.textSecondary },
  detailText: { fontFamily: Fonts.medium, fontSize: 14, lineHeight: 21, color: C.textSecondary },
  repeatChip: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: C.beige },
  repeatText: { fontFamily: Fonts.bold, fontSize: 13, color: C.text },
  track: { marginTop: 4, height: 6, borderRadius: 3, backgroundColor: C.cardLine, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: C.primary },
  linkButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  link: { fontFamily: Fonts.extrabold, fontSize: 15, color: C.text, textDecorationLine: 'underline', textDecorationColor: C.red },
});
