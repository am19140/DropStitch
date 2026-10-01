import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { YarnOutlineArt } from '@/components/illustrations';
import { rowInfo } from '@/components/project-box';
import { HeaderButton } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Colors, Fonts, Spacing } from '@/constants/theme';
import { shortDate, todayEyebrow } from '@/lib/dates';
import { projectTitle, useProjects, type Project } from '@/store/projects';

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
          <HeaderButton icon="add" label="Start a new project" onPress={() => router.push('/new')} />
        </View>

        {current ? (
          <>
            <ThemedText type="eyebrow" themeColor="textSecondary" style={{ marginTop: 12 }}>
              {todayEyebrow()}
            </ThemedText>
            <Text style={styles.display}>
              Keep <Text style={styles.displayItalic}>on</Text>
              {'\n'}knitting
            </Text>
            <ContinueCard project={current} />
            {others.length > 0 && (
              <>
                <ThemedText type="section" style={{ marginTop: 36 }}>
                  Also on the needles
                </ThemedText>
                {others.map((p) => (
                  <SmallProjectRow key={p.id} project={p} />
                ))}
              </>
            )}
          </>
        ) : (
          <EmptyHome onStart={() => router.push('/new')} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export function BrandMark() {
  return (
    <View style={styles.brand}>
      <Icon name="yarn" size={20} color={C.text} strokeWidth={1.6} />
      <Text style={styles.brandText}>dropstitch</Text>
    </View>
  );
}

function ContinueCard({ project }: { project: Project }) {
  const router = useRouter();
  const { step, row, target } = rowInfo(project);
  const fraction = target ? Math.min(1, row / target) : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue ${projectTitle(project)}`}
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })}
      style={({ pressed }) => [styles.card, CardShadow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1, gap: 8 }}>
          <ThemedText type="eyebrow">CONTINUE</ThemedText>
          <Text style={styles.cardTitle}>{projectTitle(project)}</Text>
          {step && (
            <ThemedText numberOfLines={2} style={{ fontSize: 15 }}>
              Step {project.currentStep + 1} of {project.steps.length}
            </ThemedText>
          )}
        </View>
        <View style={styles.rowBox}>
          <Text style={styles.rowNumber}>{row}</Text>
          <Text style={styles.rowLabel}>{target ? `of ${target} rows` : 'rows'}</Text>
        </View>
      </View>
      <View style={styles.chip}>
        <Text style={styles.chipText}>Started {shortDate(project.createdAt)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%` }]} />
      </View>
      <View style={styles.continuePill}>
        <Text style={styles.continueText}>CONTINUE</Text>
        <Icon name="arrowRight" size={20} color={C.onPrimary} strokeWidth={2.2} />
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

function EmptyHome({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.empty}>
      <YarnOutlineArt width={190} />
      <ThemedText type="eyebrow" themeColor="textSecondary" style={{ marginTop: 32 }}>
        NOTHING ON THE NEEDLES
      </ThemedText>
      <Text style={[styles.display, { textAlign: 'center', marginTop: 12 }]}>
        Your <Text style={styles.displayItalic}>first</Text>
        {'\n'}project
      </Text>
      <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
        Add a pattern as a PDF or a photo, and DropStitch keeps count of your rows and steps.
      </ThemedText>
      <ThemedText type="note" style={styles.emptyNote}>
        let’s cast on!
      </ThemedText>
      <Button label="Start a project" size="large" onPress={onStart} style={{ marginTop: 28 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.four, paddingTop: Spacing.three, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: -10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontFamily: Fonts.bold, fontSize: 14, color: C.text },
  display: { marginTop: 8, fontFamily: Fonts.display, fontSize: 46, lineHeight: 48, letterSpacing: -1, color: C.text },
  displayItalic: { fontFamily: Fonts.displayItalic, color: C.matcha },
  card: { marginTop: 32, padding: 20, paddingTop: 22, borderRadius: 24, backgroundColor: C.pink, gap: 10 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardTitle: { fontFamily: Fonts.display, fontSize: 30, lineHeight: 33, color: C.text },
  rowBox: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: C.matcha, alignItems: 'flex-end' },
  rowNumber: { fontFamily: Fonts.display, fontSize: 56, lineHeight: 58, letterSpacing: -2, color: C.text },
  rowLabel: { fontFamily: Fonts.semibold, fontSize: 13, color: C.text },
  chip: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: C.matchaMilk },
  chipText: { fontFamily: Fonts.bold, fontSize: 12, color: C.text },
  track: { height: 6, borderRadius: 3, backgroundColor: C.blush },
  fill: { height: 6, borderRadius: 3, backgroundColor: C.matcha },
  continuePill: {
    marginTop: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  continueText: { fontFamily: Fonts.extrabold, fontSize: 18, letterSpacing: 1.4, color: C.onPrimary },
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
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyBody: { marginTop: 16, maxWidth: 290, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  emptyNote: { marginTop: 10, transform: [{ rotate: '-3deg' }] },
});
