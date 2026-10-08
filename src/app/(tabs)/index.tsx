import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { rowInfo } from '@/components/project-box';
import { Purl } from '@/components/purl';
import { ThemedText } from '@/components/themed-text';
import { YarnBall } from '@/components/yarn-ball';
import { CardShadow, Colors, Fonts, Spacing } from '@/constants/theme';
import { daysAgo, timeAgo } from '@/lib/dates';
import { initials, projectTitle, useProjects, type Project } from '@/store/projects';

const C = Colors.light;

export default function HomeScreen() {
  const router = useRouter();
  const seenWelcome = useProjects((s) => s.seenWelcome);
  const projects = useProjects((s) => s.projects);
  const active = projects
    .filter((p) => !p.finishedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (!seenWelcome) return <Redirect href="/welcome" />;

  const [current, ...others] = active;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <BrandMark />
          <AccountButton onPress={() => router.push('/account')} />
        </View>

        {current ? <NeedlesCard project={current} /> : <StartCard onPress={() => router.push('/new')} />}

        <View style={styles.illustration}>
          <Purl pose="proud" size={300} />
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

/** The project you're knitting now, with a jump back in. */
function NeedlesCard({ project }: { project: Project }) {
  const router = useRouter();
  const open = () => router.push({ pathname: '/project/[id]', params: { id: project.id } });
  const { step } = rowInfo(project);

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
      <Text style={styles.cardSmall}>
        {project.lastStitchAt
          ? `last stitch: ${timeAgo(project.lastStitchAt)}`
          : `cast on ${daysAgo(project.createdAt)}`}
        {step ? ` · step ${project.currentStep + 1} of ${project.steps.length}` : ''}
      </Text>
      <View style={styles.pill}>
        <Text style={styles.pillText}>continue</Text>
        <Icon name="arrowRight" size={18} color={C.text} strokeWidth={2.2} />
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
      <Text style={styles.cardSmall}>add a pattern as a PDF or photos</Text>
      <View style={styles.pill}>
        <Text style={styles.pillText}>start</Text>
        <Icon name="add" size={18} color={C.text} strokeWidth={2.2} />
      </View>
    </Pressable>
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
  card: { marginTop: 28, padding: 20, minHeight: 168, borderRadius: 26, backgroundColor: C.primary, gap: 6 },
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
  pill: {
    marginTop: 'auto',
    alignSelf: 'flex-end',
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: C.sky,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: { fontFamily: Fonts.extrabold, fontSize: 16, color: C.text },
  illustration: { marginTop: 20, alignItems: 'center' },
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
