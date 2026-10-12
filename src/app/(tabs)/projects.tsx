import { useIsFocused, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ProjectBox } from '@/components/project-box';
import { GrandmaReading } from '@/components/grandma/grandma-scenes';
import { ThemedText } from '@/components/themed-text';
import { WaveBand } from '@/components/wave-band';
import { Colors, Fonts } from '@/constants/theme';
import { useProjects, type Project } from '@/store/projects';

/** How far Mrs Purl turns her head while reading (1 = as painted). */
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
  const projects = useProjects((s) => s.projects);
  const active = projects.filter((p) => !p.finishedAt).sort((a, b) => b.updatedAt - a.updatedAt);
  const finished = projects
    .filter((p) => p.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <WaveBand
        style={{ paddingBottom: 30 }}
        art={<GrandmaReading width={226} motion={READING_MOTION} active={isFocused} />}
        artStyle={{ right: -14, bottom: -8 }}>
        <Text style={styles.title}>Your{'\n'}projects</Text>
        <Text style={styles.subtitle}>Your pattern library,{'\n'}read along by Mrs Purl</Text>
      </WaveBand>

      <View style={styles.content}>
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
      </View>
    </ScrollView>
  );
}

function Section({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
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

const C = Colors.light;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 24 },
  title: { marginTop: 18, fontFamily: Fonts.display, fontSize: 34, lineHeight: 38, color: C.text },
  subtitle: { marginTop: 8, fontFamily: Fonts.semibold, fontSize: 14.5, lineHeight: 20, color: C.text, opacity: 0.75 },
  section: { marginTop: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 19, color: C.text },
  emptyActive: { gap: 12, alignItems: 'flex-start' },
});
