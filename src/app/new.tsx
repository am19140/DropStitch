import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FilePicker } from '@/components/file-picker';
import { PdfTextReader } from '@/components/pdf-text-reader';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { parseSteps, type ParsedStep } from '@/lib/parse-steps';
import { parsePattern, type ParsedPattern } from '@/lib/pattern-parser';
import { deletePatternFiles } from '@/lib/pattern-files';
import { useProjects, type PatternFile } from '@/store/projects';

export default function NewPatternScreen() {
  const router = useRouter();
  const addProject = useProjects((s) => s.addProject);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [files, setFiles] = useState<PatternFile[]>([]);
  const [instructions, setInstructions] = useState('');
  // Reading the first PDF: its text becomes steps, for the size the knitter picks.
  const [reading, setReading] = useState<PatternFile | null>(null);
  const [pattern, setPattern] = useState<ParsedPattern | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [sizeIndex, setSizeIndex] = useState<number | null>(null);

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

  const typedSteps = parseSteps(instructions);
  const withRows = typedSteps.filter((s) => s.rows).length;
  const needsSize = !!pattern && pattern.sizes.length > 1 && sizeIndex === null;
  const pdfSteps: ParsedStep[] = pattern && !needsSize ? pattern.stepsFor(sizeIndex ?? 0) : [];
  const steps = [...pdfSteps, ...typedSteps];
  const sections = [...new Set(pdfSteps.map((s) => s.section).filter(Boolean))] as string[];
  const canCreate = name.trim().length > 0 && !needsSize && !reading;

  const addFiles = (added: PatternFile[]) => {
    pendingFiles.current = [...pendingFiles.current, ...added];
    setFiles(pendingFiles.current);
    // Suggest a name from the first file, e.g. "Cozy Socks.pdf" → "Cozy Socks".
    if (!name.trim()) setName(added[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    const pdf = added.find((f) => f.kind === 'pdf');
    if (pdf && !pattern && !reading) {
      setReadFailed(false);
      setReading(pdf);
    }
  };

  const removeFile = (file: PatternFile) => {
    pendingFiles.current = pendingFiles.current.filter((f) => f.id !== file.id);
    setFiles(pendingFiles.current);
    deletePatternFiles([file]);
  };

  const create = () => {
    created.current = true;
    const size = pattern && sizeIndex !== null ? pattern.sizes[sizeIndex] : undefined;
    const id = addProject({ name: name.trim(), files, steps, size });
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

          {reading && (
            <PdfTextReader
              file={reading}
              onText={(text) => {
                const parsed = parsePattern(text);
                setReading(null);
                setSizeIndex(null);
                if (parsed.stepsFor(0).length === 0) setReadFailed(true);
                else setPattern(parsed);
              }}
              onError={() => {
                setReading(null);
                setReadFailed(true);
              }}
            />
          )}
          {(reading || pattern || readFailed) && (
            <View style={styles.pdfCard}>
              {reading ? (
                <View style={styles.readingRow}>
                  <ActivityIndicator color={Colors.light.text} />
                  <ThemedText type="smallBold">Reading your pattern…</ThemedText>
                </View>
              ) : readFailed ? (
                <ThemedText type="small">
                  Couldn’t find written instructions in this PDF (it may be a scan). You can type the steps below.
                </ThemedText>
              ) : pattern ? (
                <>
                  {pattern.sizes.length > 1 && (
                    <View style={{ gap: 10 }}>
                      <ThemedText type="section">Which size are you knitting?</ThemedText>
                      <View style={styles.chips}>
                        {pattern.sizes.map((label, i) => (
                          <Pressable
                            key={label + i}
                            accessibilityRole="button"
                            accessibilityState={{ selected: sizeIndex === i }}
                            onPress={() => setSizeIndex(i)}
                            style={[styles.chip, sizeIndex === i && styles.chipOn]}>
                            <Text style={styles.chipText}>{label}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                  {needsSize ? (
                    <ThemedText type="small">Pick a size and you’ll only see the numbers for that size.</ThemedText>
                  ) : (
                    <View style={{ gap: 8 }}>
                      <ThemedText type="smallBold">
                        Found {pdfSteps.length} {pdfSteps.length === 1 ? 'step' : 'steps'}
                        {sections.length ? ` in ${sections.join(' · ')}` : ''}
                      </ThemedText>
                      {pdfSteps.slice(0, 4).map((step, i) => (
                        <View key={i} style={styles.previewStep}>
                          {step.section ? (
                            <ThemedText type="eyebrow" themeColor="textSecondary">
                              {step.section.toUpperCase()}
                            </ThemedText>
                          ) : null}
                          <ThemedText type="small" numberOfLines={2}>
                            {step.text}
                          </ThemedText>
                        </View>
                      ))}
                      {pdfSteps.length > 4 && (
                        <ThemedText type="small" themeColor="textSecondary">
                          …and {pdfSteps.length - 4} more. You can edit them anytime.
                        </ThemedText>
                      )}
                    </View>
                  )}
                </>
              ) : null}
            </View>
          )}

          <TextField
            label={pattern ? 'Extra steps (optional)' : 'Steps (optional)'}
            value={instructions}
            onChangeText={setInstructions}
            placeholder={'Cast on 60 sts\nRows 1-10: k2, p2 rib\nKnit 40 rows in stockinette\nBind off'}
            multiline
            style={styles.instructions}
            hint={
              typedSteps.length > 0
                ? `${typedSteps.length} ${typedSteps.length === 1 ? 'step' : 'steps'} found` +
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
  pdfCard: {
    padding: Spacing.three,
    borderRadius: 22,
    backgroundColor: Colors.light.matchaMilk,
    gap: 14,
  },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: 52,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: Colors.light.pink, borderColor: Colors.light.pink },
  chipText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.light.text },
  previewStep: { padding: 12, borderRadius: 14, backgroundColor: Colors.light.surface, gap: 2 },
});
