import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/button';
import { useConfirm } from '@/components/confirm-dialog';
import { FilePicker } from '@/components/file-picker';
import { progressOf } from '@/components/project-box';
import { Purl } from '@/components/purl';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { WaveBand } from '@/components/wave-band';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { deletePatternFiles } from '@/lib/pattern-files';
import { projectTitle, useProject, useProjects, type PatternFile } from '@/store/projects';

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProject(id);
  const insets = useSafeAreaInsets();
  const { ask, dialog } = useConfirm();
  const { updateProject, deleteProject, resetProgress, finishProject, reopenProject } = useProjects(
    useShallow((s) => ({
      updateProject: s.updateProject,
      deleteProject: s.deleteProject,
      resetProgress: s.resetProgress,
      finishProject: s.finishProject,
      reopenProject: s.reopenProject,
    }))
  );

  if (!project) return null;

  const addFiles = (added: PatternFile[]) =>
    updateProject(project.id, { files: [...project.files, ...added] });

  const removeFile = async (file: PatternFile) => {
    const ok = await ask({
      title: 'Remove file?',
      message: `“${file.name}” will be removed from this pattern.`,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    updateProject(project.id, { files: project.files.filter((f) => f.id !== file.id) });
    deletePatternFiles([file]);
  };

  const startOver = async () => {
    const ok = await ask({
      title: 'Start over?',
      message: 'All row counts go back to 0 and every step is unticked. Your steps and files stay.',
      confirmLabel: 'Start over',
    });
    if (ok) {
      resetProgress(project.id);
      router.back();
    }
  };

  const remove = async () => {
    const ok = await ask({
      title: 'Delete pattern?',
      message: `“${projectTitle(project)}” and its progress will be deleted. This can’t be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    deletePatternFiles(project.files);
    deleteProject(project.id);
    router.dismissAll();
  };

  const stepsDone = project.steps.filter((st) => st.done).length;
  const { fraction } = progressOf(project);

  return (
    <View style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}>
        <WaveBand style={{ paddingBottom: 18 }}>
          <ScreenHeader back="close" round />
          <Text style={styles.title}>Edit project</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {projectTitle(project)}
          </Text>
        </WaveBand>

        <View style={styles.content}>
          <TextField
            label="Name"
            value={project.name}
            onChangeText={(name) => updateProject(project.id, { name })}
            placeholder="Pattern name"
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pattern files</Text>
            <FilePicker files={project.files} onAdd={addFiles} onRemove={removeFile} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.card}>
              <View style={styles.progressTop}>
                <Text style={styles.progressText}>
                  {project.rowCount} rows · {stepsDone} of {project.steps.length} steps
                </Text>
                {fraction !== undefined && <Text style={styles.percent}>{Math.round(fraction * 100)}%</Text>}
              </View>
              {fraction !== undefined && (
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%` }]} />
                </View>
              )}
              <View style={styles.row}>
                <Button label="Start over" icon="reset" variant="secondary" onPress={startOver} style={styles.flex} />
                {project.finishedAt ? (
                  <Button label="Knit it again" onPress={() => reopenProject(project.id)} style={styles.flex} />
                ) : (
                  <Button
                    label="Mark finished"
                    icon="check"
                    onPress={() => {
                      finishProject(project.id);
                      router.back();
                    }}
                    style={styles.flex}
                  />
                )}
              </View>
            </View>
          </View>

          <Button label="Delete pattern" icon="trash" variant="danger" onPress={remove} />
        </View>

        <View style={styles.purl} pointerEvents="none">
          <Purl pose="yarnPile" size={260} />
        </View>
      </ScrollView>
      {dialog}
    </View>
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  title: { marginTop: 10, fontFamily: Fonts.display, fontSize: 32, lineHeight: 36, color: C.text },
  subtitle: { marginTop: 6, fontFamily: Fonts.semibold, fontSize: 14.5, color: C.text, opacity: 0.75 },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.four },
  section: { gap: 10 },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 19, color: C.text },
  card: { padding: 16, borderRadius: 22, borderWidth: 1.5, borderColor: C.cardLine, backgroundColor: C.card, gap: 12 },
  progressTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  progressText: { flex: 1, fontFamily: Fonts.bold, fontSize: 14.5, color: C.text },
  percent: { fontFamily: Fonts.display, fontSize: 16, color: C.text },
  track: { height: 8, borderRadius: 4, backgroundColor: C.cardLine, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.primary },
  row: { gap: Spacing.two },
  flex: {},
  purl: { marginTop: Spacing.three, alignItems: 'center' },
});
