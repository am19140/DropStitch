import { useIsFocused, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { CobaltCard, CobaltProgress, cobaltText } from '@/components/cobalt-card';
import { useConfirm } from '@/components/confirm-dialog';
import { ProjectBox, progressOf, rowInfo } from '@/components/project-box';
import { SelectBar, SelectToggle, useSelection } from '@/components/select-mode';
import { GrandmaReading } from '@/components/grandma/grandma-scenes';
import { ThemedText } from '@/components/themed-text';
import { WaveBand } from '@/components/wave-band';
import { YarnBall } from '@/components/yarn-ball';
import { Colors, Fonts } from '@/constants/theme';
import { deletePatternFiles } from '@/lib/pattern-files';
import { projectTitle, useProjects, type Project } from '@/store/projects';

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
  // The one you're knitting now (the same one Home shows) gets the cobalt card; the rest stay in the grid.
  const [knitting, ...others] = active;
  const finished = projects
    .filter((p) => p.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  const pick = useSelection();
  const { ask, dialog } = useConfirm();
  const deleteProject = useProjects((s) => s.deleteProject);

  const removePicked = async () => {
    const picked = projects.filter((p) => pick.isSelected(p.id));
    const many = picked.length > 1;
    const ok = await ask({
      title: many ? `Remove ${picked.length} projects?` : 'Remove this project?',
      message: many
        ? 'Their steps, rows, notes and pattern files go too. This can’t be undone.'
        : `“${projectTitle(picked[0])}” goes, with its steps, rows, notes and pattern files. This can’t be undone.`,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    for (const p of picked) {
      deletePatternFiles(p.files);
      deleteProject(p.id);
    }
    pick.stop();
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: pick.selecting ? 110 : 40 }}>
        <WaveBand
          style={{ paddingBottom: 30 }}
          art={<GrandmaReading width={226} motion={READING_MOTION} active={isFocused} />}
          artStyle={{ right: -14, bottom: -8 }}>
          <Text style={styles.title}>Your{'\n'}projects</Text>
          <Text style={styles.subtitle}>Your pattern library,{'\n'}read by Mrs Purl</Text>
        </WaveBand>

        <View style={styles.content}>
          {projects.length > 0 && (
            <SelectToggle selecting={pick.selecting} onPress={pick.selecting ? pick.stop : pick.start} style={{ marginTop: 4 }} />
          )}
          <Section title="Active now" count={active.length} />
          {active.length === 0 ? (
            <View style={styles.emptyActive}>
              <ThemedText themeColor="textSecondary">Nothing on the needles right now.</ThemedText>
              <Button label="Start a project" icon="add" onPress={() => router.push('/new')} />
            </View>
          ) : (
            pick.selecting ? (
              // While picking, the project you're knitting sits in the grid like the others.
              <Grid items={active} columns={2} size="large" pick={pick} />
            ) : (
              <>
                <KnittingNow project={knitting} />
                {others.length > 0 && <Grid items={others} columns={2} size="large" />}
              </>
            )
          )}

          <Section title="Finished" count={finished.length} />
          {finished.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={{ marginTop: 6 }}>
              Finished projects show up here, with the notes you wrote along the way.
            </ThemedText>
          ) : (
            <Grid items={finished} columns={3} size="small" pick={pick} />
          )}
        </View>
      </ScrollView>
      {pick.selecting && (
        <SelectBar
          count={pick.ids.size}
          total={projects.length}
          onSelectAll={() => pick.selectAll(projects.map((p) => p.id))}
          onRemove={removePicked}
        />
      )}
      {dialog}
    </View>
  );
}

/** The project you're knitting now, wide and cobalt above the others. */
function KnittingNow({ project }: { project: Project }) {
  const router = useRouter();
  const { step } = rowInfo(project);
  const { label, fraction } = progressOf(project);
  const where = [step?.section, step && `step ${project.currentStep + 1} of ${project.steps.length}`].filter(Boolean).join(' · ');
  return (
    <CobaltCard
      accessibilityLabel={projectTitle(project)}
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })}
      style={{ marginBottom: 14 }}>
      <View style={styles.knittingTop}>
        <YarnBall color={project.color} size={58} style={{ marginLeft: -6, marginVertical: -6 }} />
        <View style={{ flex: 1 }}>
          <Text style={cobaltText.muted}>Knitting now</Text>
          <Text style={[cobaltText.title, { fontSize: 23, lineHeight: 28 }]} numberOfLines={2}>
            {projectTitle(project)}
          </Text>
          {where ? <Text style={cobaltText.muted}>{where.charAt(0).toUpperCase() + where.slice(1)}</Text> : null}
        </View>
      </View>
      <CobaltProgress label={label} fraction={fraction} />
    </CobaltCard>
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

function Grid({
  items,
  columns,
  size,
  pick,
}: {
  items: Project[];
  columns: number;
  size: 'large' | 'small';
  pick?: ReturnType<typeof useSelection>;
}) {
  const gap = size === 'large' ? 14 : 12;
  return (
    <View style={{ gap }}>
      {rows(items, columns).map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap }}>
          {row.map((p, j) =>
            p ? (
              <ProjectBox
                key={p.id}
                project={p}
                size={size}
                selecting={pick?.selecting}
                selected={pick?.isSelected(p.id)}
                onSelect={() => pick?.toggle(p.id)}
              />
            ) : (
              <View key={`pad-${j}`} style={{ flex: 1 }} />
            )
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
  knittingTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
