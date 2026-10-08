import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/button';
import { FilePicker } from '@/components/file-picker';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { confirm } from '@/lib/confirm';
import { deletePatternFiles } from '@/lib/pattern-files';
import { projectTitle, useProject, useProjects, type PatternFile } from '@/store/projects';

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProject(id);
  const insets = useSafeAreaInsets();
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
    const ok = await confirm('Remove file?', `“${file.name}” will be removed from this pattern.`, 'Remove');
    if (!ok) return;
    updateProject(project.id, { files: project.files.filter((f) => f.id !== file.id) });
    deletePatternFiles([file]);
  };

  const startOver = async () => {
    const ok = await confirm(
      'Start over?',
      'All row counts go back to 0 and every step is unticked. Your steps and files stay.',
      'Start over'
    );
    if (ok) {
      resetProgress(project.id);
      router.back();
    }
  };

  const remove = async () => {
    const ok = await confirm(
      'Delete pattern?',
      `“${projectTitle(project)}” and its progress will be deleted. This can’t be undone.`,
      'Delete'
    );
    if (!ok) return;
    deletePatternFiles(project.files);
    deleteProject(project.id);
    router.dismissAll();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.form, { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.four }]}>
        <View>
          <ScreenHeader back="close" />
          <ThemedText type="title">Edit project</ThemedText>
        </View>
        <TextField
          label="Name"
          value={project.name}
          onChangeText={(name) => updateProject(project.id, { name })}
          placeholder="Pattern name"
        />

        <View style={styles.section}>
          <ThemedText type="smallBold">Pattern files</ThemedText>
          <FilePicker files={project.files} onAdd={addFiles} onRemove={removeFile} />
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold">Progress</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {project.rowCount} rows knitted · {project.steps.filter((s) => s.done).length} of{' '}
            {project.steps.length} steps done
          </ThemedText>
          <View style={styles.row}>
            <Button label="Start over" icon="reset" variant="secondary" onPress={startOver} />
            {project.finishedAt ? (
              <Button label="Knitting it again" variant="soft" onPress={() => reopenProject(project.id)} />
            ) : (
              <Button
                label="Mark finished"
                icon="check"
                variant="cocoa"
                onPress={() => {
                  finishProject(project.id);
                  router.back();
                }}
              />
            )}
          </View>
        </View>

        <View style={styles.row}>
          <Button label="Delete pattern" icon="trash" variant="danger" onPress={remove} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
