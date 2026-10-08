import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { rowInfo } from '@/components/project-box';
import { Purl } from '@/components/purl';
import { ThemedText } from '@/components/themed-text';
import { YarnBall } from '@/components/yarn-ball';
import { CardShadow, Colors, Fonts, Spacing } from '@/constants/theme';
import { daysAgo, greeting, timeAgo, todayEyebrow } from '@/lib/dates';
import { streakInfo } from '@/lib/streak';
import { initials, projectTitle, useProjects, type Project } from '@/store/projects';

const C = Colors.light;

export default function HomeScreen() {
  const router = useRouter();
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
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <BrandMark />
          <AccountButton onPress={() => router.push('/account')} />
        </View>

        <ThemedText type="eyebrow" themeColor="textSecondary" style={{ marginTop: 22 }}>
          {todayEyebrow()}
        </ThemedText>
        <Text style={styles.greeting}>
          {greeting()}
          {firstName ? (
            <>
              , <Text style={styles.greetingName}>{firstName}</Text>
            </>
          ) : null}
        </Text>

        {current ? <NeedlesCard project={current} /> : <StartCard onPress={() => router.push('/new')} />}

        <StreakCard streak={streak} />

        <View style={styles.illustration}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{purlSays(current, streak)}</Text>
          </View>
          <View style={styles.bubbleTail} />
          <Purl pose="proud" size={280} />
        </View>

        {others.length > 0 && (
          <>
            <ThemedText type="section" style={{ marginTop: 12 }}>
              Also on the needles
            </ThemedText>
            {others.map((p) => (
              <SmallProjectRow key={p.id} project={p} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type Streak = ReturnType<typeof streakInfo>;

/** What Purl has to say, depending on how today's knitting is going. */
function purlSays(project: Project | undefined, streak: Streak) {
  if (!project) return 'Shall we cast on something cosy, dear?';
  if (streak.rowsToday > 0) {
    return `${streak.rowsToday} ${streak.rowsToday === 1 ? 'row' : 'rows'} today! I’ll put the kettle on.`;
  }
  if (streak.current > 0) return `Don’t let the yarn get cold, dear. One row keeps your streak.`;
  return `Your ${projectTitle(project).toLowerCase()} misses you, dear.`;
}

function BrandMark() {
  return (
    <View style={styles.brand}>
      <YarnBall color={C.sky} size={34} />
      <Text style={styles.brandText}>dropstitch</Text>
    </View>
  );
}

/** Round account button with the knitter's initials. */
function AccountButton({ onPress }: { onPress: () => void }) {
  const name = useProjects((s) => s.knitterName);
  const letters = initials(name);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Your account"
      onPress={onPress}
      style={({ pressed }) => [styles.avatar, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
      {letters ? (
        <Text style={styles.avatarText}>{letters}</Text>
      ) : (
        <Icon name="user" size={24} color={C.beige} strokeWidth={2} />
      )}
    </Pressable>
  );
}

/** The project you're knitting now: where you are in it, how far along, and a jump back in. */
function NeedlesCard({ project }: { project: Project }) {
  const router = useRouter();
  const open = () => router.push({ pathname: '/project/[id]', params: { id: project.id } });
  const { step, row, target } = rowInfo(project);
  const stepsDone = project.steps.filter((s) => s.done).length;

  // Progress through the current step when it has a row count, otherwise through the pattern.
  const fraction = target
    ? Math.min(1, row / target)
    : project.steps.length
      ? stepsDone / project.steps.length
      : undefined;
  const where = [step?.section?.toLowerCase(), step && `step ${project.currentStep + 1} of ${project.steps.length}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue ${projectTitle(project)}`}
      onPress={open}
      style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <Text style={styles.cardSmall}>on the needles</Text>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {projectTitle(project)}
      </Text>
      {where ? <Text style={styles.cardSmall}>{where}</Text> : null}

      <View style={styles.progressRow}>
        {fraction !== undefined && (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%` }]} />
          </View>
        )}
        <Text style={styles.progressText}>
          {target ? `row ${row} of ${target}` : step ? `row ${row}` : `${project.rowCount} rows`}
        </Text>
      </View>

      <View style={styles.cardBottom}>
        <Text style={[styles.cardSmall, { flex: 1 }]}>
          {project.lastStitchAt
            ? `last stitch: ${timeAgo(project.lastStitchAt)}`
            : `cast on ${daysAgo(project.createdAt)}`}
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>continue</Text>
          <Icon name="arrowRight" size={18} color={C.text} strokeWidth={2.2} />
        </View>
      </View>
    </Pressable>
  );
}

/** Shown when nothing is on the needles. */
function StartCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start a project"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <Text style={styles.cardSmall}>nothing on the needles</Text>
      <Text style={styles.cardTitle}>Your first project</Text>
      <Text style={styles.cardSmall}>add a pattern as a PDF or photos, and we’ll count the rows</Text>
      <View style={[styles.cardBottom, { justifyContent: 'flex-end' }]}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>start</Text>
          <Icon name="add" size={18} color={C.text} strokeWidth={2.2} />
        </View>
      </View>
    </Pressable>
  );
}

/** The last seven days, with a yarn ball on every day you knitted. */
function StreakCard({ streak }: { streak: Streak }) {
  const { week, current, best, knittedToday, rowsThisWeek } = streak;
  const message = knittedToday
    ? current === 1
      ? 'Day one! Knit tomorrow to grow your streak.'
      : best > current
        ? `You knitted today. Best streak: ${best} days.`
        : 'You knitted today. Your best streak yet!'
    : current > 0
      ? 'Count a row today to keep it going.'
      : 'Count a row to start a streak.';

  return (
    <View style={styles.streak} accessible accessibilityLabel={`${current}-day knitting streak. ${message}`}>
      <View style={styles.streakTop}>
        <YarnBall color={current ? C.red : C.beige} size={34} />
        <Text style={styles.streakTitle}>{current ? `${current}-day streak` : 'No streak yet'}</Text>
        <Text style={styles.streakWeek}>
          {rowsThisWeek} {rowsThisWeek === 1 ? 'row' : 'rows'}
          {'\n'}this week
        </Text>
      </View>

      <View style={styles.week}>
        {week.map((day) => (
          <View key={day.key} style={styles.day}>
            <Text style={[styles.dayLetter, day.isToday && styles.dayToday]}>{day.letter}</Text>
            {day.knitted ? (
              <YarnBall color={C.red} size={34} />
            ) : (
              <View style={[styles.emptyDay, day.isToday && { backgroundColor: C.skySoft }]} />
            )}
          </View>
        ))}
      </View>

      <Text style={styles.streakMessage}>{message}</Text>
    </View>
  );
}

function SmallProjectRow({ project }: { project: Project }) {
  const router = useRouter();
  const { step } = rowInfo(project);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })}
      style={({ pressed }) => [styles.smallRow, CardShadow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={[styles.miniBox, { backgroundColor: project.color }]}>
        <Text style={styles.miniBoxText} numberOfLines={3}>
          {projectTitle(project).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText style={{ fontFamily: Fonts.semibold }}>{projectTitle(project)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {step ? `Step ${project.currentStep + 1} of ${project.steps.length} · row ${step.rowsDone}` : `${project.rowCount} rows`}
        </ThemedText>
      </View>
      <Icon name="chevronRight" size={20} color={C.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.four, paddingTop: Spacing.three, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontFamily: Fonts.display, fontSize: 24, lineHeight: 30, color: C.text },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.extrabold, fontSize: 16, letterSpacing: 0.5, color: C.beige },
  greeting: { marginTop: 4, fontFamily: Fonts.display, fontSize: 30, lineHeight: 36, color: C.text },
  greetingName: { fontFamily: Fonts.displayItalic, color: C.red },

  card: { marginTop: 18, padding: 20, borderRadius: 26, backgroundColor: C.primary, gap: 6 },
  cardSmall: { fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 19, color: C.beige },
  cardTitle: {
    marginBottom: 2,
    fontFamily: Fonts.extrabold,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: C.beige,
  },
  progressRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(226, 217, 188, 0.28)' },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.beige },
  progressText: { fontFamily: Fonts.extrabold, fontSize: 14, color: C.beige, fontVariant: ['tabular-nums'] },
  cardBottom: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pill: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: C.sky,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: { fontFamily: Fonts.extrabold, fontSize: 16, color: C.text },

  streak: { marginTop: 14, padding: 18, borderRadius: 26, backgroundColor: C.surface, gap: 14 },
  streakTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakTitle: { flex: 1, fontFamily: Fonts.display, fontSize: 26, lineHeight: 32, color: C.text },
  streakWeek: { fontFamily: Fonts.semibold, fontSize: 13, lineHeight: 17, color: C.textSecondary, textAlign: 'right' },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6 },
  dayLetter: { fontFamily: Fonts.bold, fontSize: 12, color: C.textSecondary },
  dayToday: { color: C.red, fontFamily: Fonts.extrabold },
  emptyDay: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.beige },
  streakMessage: { fontFamily: Fonts.medium, fontSize: 14, color: C.text },

  illustration: { marginTop: 24, alignItems: 'center' },
  bubble: {
    maxWidth: 320,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: C.surface,
  },
  bubbleText: { fontFamily: Fonts.note, fontSize: 18, lineHeight: 24, color: C.cocoa, textAlign: 'center' },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.surface,
  },
  smallRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  miniBox: { width: 60, height: 60, borderRadius: 14, padding: 8 },
  miniBoxText: { fontFamily: Fonts.extrabold, fontSize: 9, lineHeight: 11, letterSpacing: 0.4, color: C.text },
});
