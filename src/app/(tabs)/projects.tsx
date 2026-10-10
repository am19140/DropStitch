import { useIsFocused, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ProjectBox } from '@/components/project-box';
import { GrandmaReading } from '@/components/grandma/grandma-scenes';
import { HeaderButton } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useProjects, type Project } from '@/store/projects';

/** How far Purl turns her head while reading (1 = as painted). */
const READING_MOTION = 1.8;

/** Splits a list into rows of `size` (padding the last row so boxes keep their width). */
function rows<T>(items: T[], size: number) {
  const out: (T | null)[][] = [];
  for (let i = 0; i < items.length; i += size) {
    const row: (T | null)[] = items.slice(i, i + size);
    while (row.length < size) row.push(null);
    out.push(row);
  }
  return out;
}

export default function ProjectsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { width: screenWidth } = useWindowDimensions();
  const projects = useProjects((s) => s.projects);
  const active = projects.filter((p) => !p.finishedAt).sort((a, b) => b.updatedAt - a.updatedAt);
  const finished = projects
    .filter((p) => p.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View />
          <HeaderButton icon="add" label="Start a new project" onPress={() => router.push('/new')} />
        </View>
        <ThemedText type="title">Your projects</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>
          Your pattern library, read along by Purl
        </ThemedText>
        <View style={styles.reading}>
          <GrandmaReading width={Math.min(screenWidth - 96, 300)} motion={READING_MOTION} active={isFocused} />
        </View>

        <Section title="Active now" count={active.length} />
        {active.length === 0 ? (
          <View style={styles.emptyActive}>
            <ThemedText themeColor="textSecondary">Nothing on the needles right now.</ThemedText>
            <Button label="Start a project" icon="add" onPress={() => router.push('/new')} />
          </View>
        ) : (
          <Grid items={active} columns={2} size="large" />
        )}

        <Section title="Finished" count={finished.length} />
        {finished.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={{ marginTop: 6 }}>
            Finished projects show up here, with the notes you wrote along the way.
          </ThemedText>
        ) : (
          <Grid items={finished} columns={3} size="small" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.section}>
      <ThemedText type="section">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {count} {count === 1 ? 'project' : 'projects'}
      </ThemedText>
    </View>
  );
}

function Grid({ items, columns, size }: { items: Project[]; columns: number; size: 'large' | 'small' }) {
  const gap = size === 'large' ? 14 : 12;
  return (
    <View style={{ gap }}>
      {rows(items, columns).map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap }}>
          {row.map((p, j) =>
            p ? <ProjectBox key={p.id} project={p} size={size} /> : <View key={`pad-${j}`} style={{ flex: 1 }} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.four, paddingTop: Spacing.three, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginRight: -10 },
  reading: { alignItems: 'center', marginTop: 4 },
  section: { marginTop: 20, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  emptyActive: { gap: 12, alignItems: 'flex-start' },
});
