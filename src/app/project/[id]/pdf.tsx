import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KnitBar } from '@/components/knit-bar';
import { PatternViewer } from '@/components/pattern-viewer';
import { rowInfo } from '@/components/project-box';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useProject } from '@/store/projects';

/** The pattern file, with the row counter underneath so you can count while you read. */
export default function PatternScreen() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProject(id);
  if (!project) return null;

  const { step, row, target, counting } = rowInfo(project);
  const file = project.files[0];

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.top}>
        <ScreenHeader back="back" />
        <View style={styles.titleBlock}>
          <ThemedText numberOfLines={1} style={{ fontFamily: Fonts.semibold, fontSize: 15 }}>
            {file ? file.name : 'Pattern'}
          </ThemedText>
          {project.files.length > 1 && (
            <ThemedText type="eyebrow" themeColor="textSecondary">
              {project.files.length} FILES
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.viewer}>
        <PatternViewer project={project} />
      </View>
      <KnitBar
        project={project}
        label={step ? `STEP ${project.currentStep + 1} OF ${project.steps.length}` : 'ROWS'}
        value={!counting && step ? step.text : target ? `Row ${row} of ${target}` : `Row ${row}`}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  top: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  titleBlock: { position: 'absolute', left: 64, right: 64, top: Spacing.three, height: 44, alignItems: 'center', justifyContent: 'center' },
  viewer: { flex: 1, marginTop: 8, marginHorizontal: 12, marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.light.border },
});
