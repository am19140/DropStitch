import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { rowInfo } from '@/components/project-box';
import PaintedKnittingGrandma from '@/components/grandma/painted-knitting-grandma';
import { Purl } from '@/components/purl';
import { HeaderButton, ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { WaveBand } from '@/components/wave-band';
import { Colors, Fonts } from '@/constants/theme';
import { daysAgo, knitDuration, longDate, shortDate } from '@/lib/dates';
import { knitTime, projectTitle, timerRunning, useProject, useProjects } from '@/store/projects';

const C = Colors.light;

/** A project's page: when it started, a jump to the current step, notes and the pattern file. */
export default function ProjectScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
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
  const { step, row, target, counting } = rowInfo(project);
  const params = { id: project.id };
  const knitted = knitTime(project);
  const running = timerRunning(project);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <WaveBand
        style={{ paddingBottom: 22 }}
        art={
          finished ? (
            <Purl pose="proud" size={222} />
          ) : (
            <PaintedKnittingGrandma paused={!running} width={222} active={isFocused} />
          )
        }
        artStyle={{ right: -16, bottom: -4 }}>
        <ScreenHeader
          back="back"
          round
          right={
            <HeaderButton
              icon="edit"
              label="Edit project"
              round
              onPress={() => router.push({ pathname: '/project/[id]/edit', params })}
            />
          }
        />
        <Text style={styles.eyebrow}>
          {finished
            ? 'Finished'
            : project.steps.length
              ? `On the needles · step ${project.currentStep + 1} of ${project.steps.length}`
              : 'On the needles'}
        </Text>
        <Text style={styles.title}>{projectTitle(project)}</Text>
        <View style={styles.metaRow}>
          <Icon name="calendar" size={16} color={C.text} />
          <Text style={styles.meta}>
            {finished
              ? `Finished ${longDate(project.finishedAt!)}`
              : `Started ${shortDate(project.createdAt)} · ${daysAgo(project.createdAt)}`}
          </Text>
        </View>
        {knitted > 0 && (
          <View style={styles.metaRow}>
            <Icon name={running ? 'pause' : 'play'} size={16} color={C.text} />
            <Text style={styles.meta}>{knitDuration(knitted)} of knitting</Text>
          </View>
        )}
      </WaveBand>

      <View style={styles.content}>
        {finished ? (
          <View style={{ marginTop: 6 }}>
            <Text style={styles.proudTitle}>You made this!</Text>
            <Text style={styles.proudNote}>Mrs Purl is showing it off to the whole flock.</Text>
          </View>
        ) : (
          <>
            <Button
              label="Go to current step"
              icon="arrowRight"
              iconAfter
              size="large"
              onPress={() => router.push({ pathname: '/project/[id]/knit', params })}
            />
            <Text style={styles.caption} numberOfLines={1}>
              {step
                ? `${step.text}${counting ? ` · row ${row}${target ? ` of ${target}` : ''}` : ''}`
                : `${project.rowCount} rows counted`}
            </Text>
          </>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Notes</Text>
          <Text style={styles.sectionHint}>{finished ? 'Written while you knitted' : 'Saved as you type'}</Text>
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

        <Text style={[styles.section, { marginTop: 28 }]}>Pattern</Text>
        <View style={styles.fileCard}>
          <View style={styles.fileIcon}>
            <Icon name="file" size={22} color={C.text} strokeWidth={1.7} />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            {project.files.length > 0 ? (
              <>
                <Text style={styles.fileName} numberOfLines={1}>
                  {project.files[0].name}
                </Text>
                <Text style={styles.sectionHint}>
                  {project.files.length === 1 ? '1 file' : `${project.files.length} files`}
                  {project.size ? ` · size ${project.size}` : ''}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.fileName}>No pattern file yet</Text>
                <Text style={styles.sectionHint}>Add a PDF or photos of the pattern.</Text>
              </>
            )}
          </View>
          {project.files.length > 0 ? (
            <Button
              label={project.files[0].kind === 'pdf' ? 'View PDF' : 'View'}
              variant="secondary"
              size="small"
              onPress={() => router.push({ pathname: '/project/[id]/pdf', params })}
            />
          ) : (
            <Button
              label="Add a file"
              variant="secondary"
              size="small"
              onPress={() => router.push({ pathname: '/project/[id]/edit', params })}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  missing: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  content: { paddingHorizontal: 24 },
  eyebrow: { marginTop: 14, fontFamily: Fonts.bold, fontSize: 13.5, color: C.text, opacity: 0.75 },
  title: { marginTop: 4, maxWidth: 190, fontFamily: Fonts.display, fontSize: 32, lineHeight: 36, color: C.text },
  metaRow: { marginTop: 10, maxWidth: 190, flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { flex: 1, fontFamily: Fonts.semibold, fontSize: 14, color: C.text },
  proudTitle: { fontFamily: Fonts.display, fontSize: 30, color: C.text },
  proudNote: { marginTop: 2, fontFamily: Fonts.semibold, fontSize: 15, color: C.textSecondary },
  caption: { marginTop: 10, fontFamily: Fonts.semibold, fontSize: 13.5, color: C.textSecondary },
  sectionRow: { marginTop: 26, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  section: { fontFamily: Fonts.display, fontSize: 20, color: C.text },
  sectionHint: { fontFamily: Fonts.semibold, fontSize: 13, color: C.textSecondary },
  notes: {
    marginTop: 10,
    minHeight: 120,
    padding: 16,
    paddingTop: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.card,
    color: C.text,
    fontFamily: Fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  fileCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: { fontFamily: Fonts.extrabold, fontSize: 15, color: C.text },
});
