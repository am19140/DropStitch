import { Redirect, useIsFocused, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { progressOf, rowInfo } from '@/components/project-box';
import { GrandmaTea } from '@/components/grandma/grandma-scenes';
import { Icon } from '@/components/icon';
import { Purl } from '@/components/purl';
import { Tour, TourTarget, type TourStep } from '@/components/tour';
import { WaveBand } from '@/components/wave-band';
import { YarnBall } from '@/components/yarn-ball';
import { Colors, Fonts } from '@/constants/theme';
import { daysAgo, greeting, timeAgo, todayLabel } from '@/lib/dates';
import { streakInfo, type StreakDay } from '@/lib/streak';
import { projectTitle, useProjects, type Project } from '@/store/projects';

const C = Colors.light;

export default function HomeScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const seenWelcome = useProjects((s) => s.seenWelcome);
  const projects = useProjects((s) => s.projects);
  const knitterName = useProjects((s) => s.knitterName);
  const knitLog = useProjects((s) => s.knitLog);
  const active = projects
    .filter((p) => !p.finishedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (!seenWelcome) return <Redirect href="/welcome" />;

  const [current, ...others] = active;
  const streak = streakInfo(knitLog);
  const firstName = knitterName.trim().split(/\s+/)[0];

  return (
    <>
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <WaveBand
        style={{ paddingBottom: 6 }}
        art={<GrandmaTea width={198} active={isFocused} />}
        artStyle={{ right: -18, bottom: 0 }}>
        <View style={styles.brand}>
          <Purl pose="head" size={36} style={{ marginLeft: -4 }} />
          <Text style={styles.brandText}>dropstitch</Text>
        </View>
        <Text style={styles.date}>{todayLabel()}</Text>
        <Text style={styles.greeting}>
          {greeting()}
          {firstName ? `,\n${firstName}` : ''}
        </Text>
        <View style={styles.todayPill}>
          <View style={styles.dot} />
          <Text style={styles.todayText}>
            {streak.rowsToday > 0
              ? `${streak.rowsToday} ${streak.rowsToday === 1 ? 'row' : 'rows'} today`
              : 'No rows yet today'}
          </Text>
        </View>
      </WaveBand>

      <View style={styles.content}>
        <TourTarget id="home.streak">
          <StreakWeek streak={streak} />
        </TourTarget>
        <TourTarget id="home.card">
          {current ? <NeedlesCard project={current} /> : <StartCard onPress={() => router.push('/new')} />}
        </TourTarget>

        {others.length > 0 && (
          <>
            <Text style={styles.section}>Also on the needles</Text>
            {others.map((p) => (
              <SmallProjectRow key={p.id} project={p} />
            ))}
          </>
        )}
      </View>
    </ScrollView>
    <Tour id="home" steps={HOME_TOUR} />
    </>
  );
}

type Streak = ReturnType<typeof streakInfo>;

/** Purl's first tour of the app, on the home screen. */
const HOME_TOUR: TourStep[] = [
  {
    target: 'tab.add',
    title: 'Start here',
    text: 'Tap + to add a pattern: a PDF or a photo. I’ll split it into steps and keep only the numbers for your size.',
  },
  {
    target: 'home.card',
    title: 'Your project lives here',
    text: 'It shows where you are and how far along. Tap it to pick up right where you stopped.',
  },
  {
    target: 'home.streak',
    title: 'A little every day',
    text: 'Count a row and that day joins your streak. Days you knitted get filled in.',
  },
  {
    target: 'tab.bar',
    title: 'Everything else',
    text: 'Your projects, your yarn stash and your profile are down here. Have fun, dear!',
  },
];

/** The last seven days as numbered beads on a thread: knitted days filled in, today dark. */
function StreakWeek({ streak }: { streak: Streak }) {
  const { week, current, rowsThisWeek } = streak;
  return (
    <View accessible accessibilityLabel={`${current}-day knitting streak, ${rowsThisWeek} rows this week`}>
      <View style={styles.streakTop}>
        <Text style={styles.streakTitle}>{current ? `${current}-day streak` : 'No streak yet'}</Text>
        <Text style={styles.muted}>
          {rowsThisWeek} {rowsThisWeek === 1 ? 'row' : 'rows'} this week
        </Text>
      </View>
      <View style={styles.week}>
        <View style={styles.thread} />
        {week.map((day) => (
          <Day key={day.key} day={day} />
        ))}
      </View>
    </View>
  );
}

function Day({ day }: { day: StreakDay }) {
  const knitted = day.knitted;
  return (
    <View style={styles.day}>
      <Text style={styles.dayLetter}>{day.letter}</Text>
      <View style={[styles.bead, knitted && styles.beadKnitted, day.isToday && knitted && styles.beadToday]}>
        <Text style={[styles.beadText, !knitted && { color: C.textSecondary }, day.isToday && knitted && { color: C.surface }]}>
          {Number(day.key.slice(8))}
        </Text>
      </View>
    </View>
  );
}

/** The project you're knitting now: where you are in it, how far along, and a jump back in. */
function NeedlesCard({ project }: { project: Project }) {
  const router = useRouter();
  const open = () => router.push({ pathname: '/project/[id]', params: { id: project.id } });
  const { step } = rowInfo(project);
  const { label, fraction } = progressOf(project);
  const where = [step?.section, step && `step ${project.currentStep + 1} of ${project.steps.length}`].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue ${projectTitle(project)}`}
      onPress={open}
      style={({ pressed }) => [styles.card, { marginTop: 22, transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>On the needles</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {projectTitle(project)}
          </Text>
          {where ? <Text style={[styles.muted, { marginTop: 2 }]}>{where.charAt(0).toUpperCase() + where.slice(1)}</Text> : null}
        </View>
        <YarnBall color={project.color} size={58} style={{ marginTop: -8, marginRight: -6 }} />
      </View>

      <View style={styles.progressTop}>
        <Text style={styles.progressLabel}>{label}</Text>
        {fraction !== undefined && <Text style={styles.muted}>{Math.round(fraction * 100)}%</Text>}
      </View>
      {fraction !== undefined && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%` }]} />
        </View>
      )}

      <View style={styles.cardBottom}>
        <Text style={[styles.muted, { flex: 1 }]}>
          {project.lastStitchAt ? `Last stitch ${timeAgo(project.lastStitchAt)}` : `Cast on ${daysAgo(project.createdAt)}`}
        </Text>
        {/* The whole card is the button; this is just its label. */}
        <View style={styles.go}>
          <Text style={styles.goText}>Continue</Text>
          <Icon name="arrowRight" size={18} color={C.surface} strokeWidth={2.4} />
        </View>
      </View>
    </Pressable>
  );
}

/** Shown when nothing is on the needles. */
function StartCard({ onPress }: { onPress: () => void }) {
  return (
    <View style={[styles.card, { marginTop: 22 }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>Nothing on the needles</Text>
          <Text style={styles.cardTitle}>Your first project</Text>
          <Text style={[styles.muted, { marginTop: 2 }]}>Add a pattern as a PDF or photos, and we’ll count the rows.</Text>
        </View>
        <YarnBall color={C.sky} size={58} style={{ marginTop: -8, marginRight: -6 }} />
      </View>
      <View style={[styles.cardBottom, { justifyContent: 'flex-end' }]}>
        <Button label="Start a project" icon="add" size="small" onPress={onPress} />
      </View>
    </View>
  );
}

function SmallProjectRow({ project }: { project: Project }) {
  const router = useRouter();
  const { label } = progressOf(project);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })}
      style={({ pressed }) => [styles.card, styles.smallRow, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
      <YarnBall color={project.color} size={48} />
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={styles.smallTitle} numberOfLines={1}>
          {projectTitle(project)}
        </Text>
        <Text style={styles.muted}>{label}</Text>
      </View>
      <Icon name="chevronRight" size={20} color={C.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 24, paddingTop: 2 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brandText: { fontFamily: Fonts.display, fontSize: 20, color: C.text },
  date: { marginTop: 18, fontFamily: Fonts.bold, fontSize: 14, color: C.text, opacity: 0.75 },
  greeting: { marginTop: 2, maxWidth: 236, fontFamily: Fonts.display, fontSize: 28, lineHeight: 33, color: C.text },
  todayPill: {
    marginTop: 14,
    alignSelf: 'flex-start',
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
  todayText: { fontFamily: Fonts.extrabold, fontSize: 14, color: C.text },

  muted: { fontFamily: Fonts.semibold, fontSize: 14, color: C.textSecondary },
  streakTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  streakTitle: { fontFamily: Fonts.display, fontSize: 21, color: C.text },
  week: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  thread: { position: 'absolute', left: 18, right: 18, top: 39, height: 2, backgroundColor: C.skySoft },
  day: { alignItems: 'center', gap: 6 },
  dayLetter: { fontFamily: Fonts.extrabold, fontSize: 12, color: C.textSecondary },
  bead: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beadKnitted: { backgroundColor: C.skySoft, borderColor: C.skySoft },
  beadToday: { backgroundColor: C.text, borderColor: C.text },
  beadText: { fontFamily: Fonts.extrabold, fontSize: 15, color: C.text },

  card: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardLine, borderRadius: 22, padding: 18 },
  cardTop: { flexDirection: 'row', gap: 8 },
  cardTitle: { marginTop: 3, fontFamily: Fonts.display, fontSize: 23, lineHeight: 28, color: C.text },
  progressTop: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontFamily: Fonts.extrabold, fontSize: 15, color: C.text },
  track: { marginTop: 8, height: 8, borderRadius: 4, backgroundColor: C.cardLine, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.primary },
  cardBottom: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },

  go: { height: 44, paddingHorizontal: 18, borderRadius: 999, backgroundColor: C.text, flexDirection: 'row', alignItems: 'center', gap: 8 },
  goText: { fontFamily: Fonts.extrabold, fontSize: 15, color: C.surface },
  section: { marginTop: 26, marginBottom: 10, fontFamily: Fonts.display, fontSize: 19, color: C.text },
  smallRow: { marginBottom: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  smallTitle: { fontFamily: Fonts.extrabold, fontSize: 16, color: C.text },
});
