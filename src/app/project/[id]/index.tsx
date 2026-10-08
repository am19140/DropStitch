import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { rowInfo } from '@/components/project-box';
import { Purl } from '@/components/purl';
import { HeaderButton, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Colors, Fonts, Spacing } from '@/constants/theme';
import { daysAgo, knitDuration, longDate } from '@/lib/dates';
import { knitTime, projectTitle, useProject, useProjects } from '@/store/projects';

const C = Colors.light;

/** A project's page: when it started, a jump to the current step, notes and the pattern file. */
export default function ProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProject(id);
  const updateProject = useProjects((s) => s.updateProject);

  if (!project) {
    return (
      <SafeAreaView style={[styles.screen, styles.missing]}>
        <ThemedText>This project doesn’t exist anymore.</ThemedText>
        <Button label="Back home" variant="secondary" onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  const finished = !!project.finishedAt;
  const { step, row, target } = rowInfo(project);
  const params = { id: project.id };
  const knitted = knitTime(project);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          back="back"
          right={
            <HeaderButton
              icon="edit"
              label="Edit project"
              onPress={() => router.push({ pathname: '/project/[id]/edit', params })}
            />
          }
        />

        {finished && (
          <View style={styles.proud}>
            <Purl pose="proud" size={220} />
            <Text style={styles.proudTitle}>
              You <Text style={styles.proudItalic}>made</Text> this!
            </Text>
            <ThemedText type="note" style={styles.proudNote}>
              Purl is showing it off to the whole flock
            </ThemedText>
          </View>
        )}

        <View style={[styles.header, { backgroundColor: finished ? C.sky : C.beige }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="eyebrow">
                {finished
                  ? 'FINISHED'
                  : project.steps.length
                    ? `ON THE NEEDLES · STEP ${project.currentStep + 1} OF ${project.steps.length}`
                    : 'ON THE NEEDLES'}
              </ThemedText>
              <Text style={styles.title}>{projectTitle(project)}</Text>
            </View>
            {!finished && <Purl pose="knitting" size={104} />}
          </View>
          <View style={styles.dateRow}>
            <Icon name="calendar" size={16} color={C.text} />
            <ThemedText type="small" style={{ flex: 1 }}>
              {finished
                ? `Started ${longDate(project.createdAt)} · finished ${longDate(project.finishedAt!)}`
                : `Started ${longDate(project.createdAt)} · ${daysAgo(project.createdAt)}`}
            </ThemedText>
          </View>
          {knitted > 0 && (
            <View style={styles.dateRow}>
              <Icon name="play" size={16} color={C.text} />
              <ThemedText type="small" style={{ flex: 1 }}>
                {knitDuration(knitted)} of knitting{project.timerStartedAt ? ' · timer running' : ''}
              </ThemedText>
            </View>
          )}
        </View>

        {!finished && (
          <>
            <Button
              label="Go to current step"
              icon="arrowRight"
              iconAfter
              size="large"
              onPress={() => router.push({ pathname: '/project/[id]/knit', params })}
              style={{ marginTop: 24 }}
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.caption} numberOfLines={1}>
              {step
                ? `${step.text} · row ${row}${target ? ` of ${target}` : ''}`
                : `${project.rowCount} rows counted`}
            </ThemedText>
          </>
        )}

        <View style={styles.sectionRow}>
          <ThemedText type="section">Notes</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
            {finished ? 'Written while you knitted' : 'Saved as you type'}
          </ThemedText>
        </View>
        <TextInput
          accessibilityLabel={`Notes for ${projectTitle(project)}`}
          value={project.notes}
          onChangeText={(notes) => updateProject(project.id, { notes })}
          placeholder="Needle size, yarn, changes you made…"
          placeholderTextColor={C.textSecondary}
          multiline
          textAlignVertical="top"
          style={styles.notes}
        />

        <ThemedText type="section" style={{ marginTop: 32 }}>
          Pattern
        </ThemedText>
        <View style={[styles.fileCard, CardShadow]}>
          <View style={styles.thumb}>
            <View style={[styles.thumbLine, { width: '70%', height: 3, backgroundColor: C.text }]} />
            <View style={styles.thumbLine} />
            <View style={styles.thumbLine} />
            <View style={[styles.thumbLine, { height: 7, backgroundColor: C.sky }]} />
            <View style={styles.thumbLine} />
            <View style={[styles.thumbLine, { width: '80%' }]} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            {project.files.length > 0 ? (
              <>
                <ThemedText style={{ fontFamily: Fonts.semibold }} numberOfLines={1}>
                  {project.files[0].name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {project.files.length === 1 ? '1 file' : `${project.files.length} files`}
                </ThemedText>
                <Button
                  label={project.files[0].kind === 'pdf' ? 'View PDF' : 'View pattern'}
                  variant="secondary"
                  size="small"
                  onPress={() => router.push({ pathname: '/project/[id]/pdf', params })}
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                />
              </>
            ) : (
              <>
                <ThemedText style={{ fontFamily: Fonts.semibold }}>No pattern file yet</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Add a PDF or photos of the pattern.
                </ThemedText>
                <Button
                  label="Add a file"
                  variant="secondary"
                  size="small"
                  onPress={() => router.push({ pathname: '/project/[id]/edit', params })}
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  missing: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  content: { padding: Spacing.four, paddingTop: Spacing.three, paddingBottom: 48 },
  header: { marginTop: 8, padding: 18, borderRadius: 22, gap: 4 },
  title: { fontFamily: Fonts.display, fontSize: 32, lineHeight: 37, color: C.text },
  proud: { alignItems: 'center', marginTop: 4, marginBottom: 16 },
  proudTitle: { marginTop: 4, fontFamily: Fonts.display, fontSize: 40, lineHeight: 44, color: C.text, textAlign: 'center' },
  proudItalic: { fontFamily: Fonts.displayItalic, color: C.red },
  proudNote: { marginTop: 6, textAlign: 'center', color: C.primary },
  dateRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  caption: { marginTop: 8, textAlign: 'center' },
  sectionRow: { marginTop: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  notes: {
    marginTop: 12,
    minHeight: 120,
    padding: 16,
    paddingTop: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.sky,
    backgroundColor: C.skySoft,
    color: C.text,
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  fileCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: C.surface,
    flexDirection: 'row',
    gap: 16,
  },
  thumb: {
    width: 76,
    height: 98,
    padding: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.text,
    backgroundColor: C.surface,
    gap: 7,
  },
  thumbLine: { height: 2, borderRadius: 1, backgroundColor: 'rgba(110, 90, 80, 0.4)' },
});
