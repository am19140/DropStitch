import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FilePicker } from '@/components/file-picker';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { parseSteps } from '@/lib/parse-steps';
import { deletePatternFiles } from '@/lib/pattern-files';
import { useProjects, type PatternFile } from '@/store/projects';

export default function NewPatternScreen() {
  const router = useRouter();
  const addProject = useProjects((s) => s.addProject);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [files, setFiles] = useState<PatternFile[]>([]);
  const [instructions, setInstructions] = useState('');

  // Files are copied into app storage as soon as they're picked. If the screen closes
  // without creating the pattern (Cancel or swiping the sheet away), remove them again.
  const pendingFiles = useRef<PatternFile[]>([]);
  const created = useRef(false);
  useEffect(
    () => () => {
      if (!created.current) deletePatternFiles(pendingFiles.current);
    },
    []
  );

  const steps = parseSteps(instructions);
  const withRows = steps.filter((s) => s.rows).length;
  const canCreate = name.trim().length > 0;

  const addFiles = (added: PatternFile[]) => {
    pendingFiles.current = [...pendingFiles.current, ...added];
    setFiles(pendingFiles.current);
    // Suggest a name from the first file, e.g. "Cozy Socks.pdf" → "Cozy Socks".
    if (!name.trim()) setName(added[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
  };

  const removeFile = (file: PatternFile) => {
    pendingFiles.current = pendingFiles.current.filter((f) => f.id !== file.id);
    setFiles(pendingFiles.current);
    deletePatternFiles([file]);
  };

  const create = () => {
    created.current = true;
    const id = addProject({ name: name.trim(), files, steps });
    router.replace({ pathname: '/project/[id]', params: { id } });
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.form, { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.four }]}>
          <View>
            <ScreenHeader back="close" />
            <ThemedText type="title">New project</ThemedText>
          </View>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Cozy winter socks"
            returnKeyType="done"
          />

          <View style={styles.section}>
            <ThemedText type="section">Pattern file</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              A PDF, a screenshot or photos of a paper pattern. You can add more later.
            </ThemedText>
            <FilePicker files={files} onAdd={addFiles} onRemove={removeFile} />
          </View>

          <TextField
            label="Steps (optional)"
            value={instructions}
            onChangeText={setInstructions}
            placeholder={'Cast on 60 sts\nRows 1-10: k2, p2 rib\nKnit 40 rows in stockinette\nBind off'}
            multiline
            style={styles.instructions}
            hint={
              steps.length > 0
                ? `${steps.length} ${steps.length === 1 ? 'step' : 'steps'} found` +
                  (withRows ? ` · ${withRows} with a row count` : '')
                : 'Paste or type the pattern instructions. Each line becomes a step you can tick off.'
            }
          />

          <Button
            label="Start knitting"
            size="large"
            disabled={!canCreate}
            onPress={create}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  instructions: {
    minHeight: 160,
  },
});
