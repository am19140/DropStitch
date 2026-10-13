import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Purl } from '@/components/purl';
import { HeaderButton } from '@/components/screen-header';
import { StepEditorSheet } from '@/components/step-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WaveBand } from '@/components/wave-band';
import { Colors, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { lengthTarget } from '@/lib/step-rules';
import { useProject, useProjects, type Step } from '@/store/projects';

const C = Colors.light;

/** One colour per part of the pattern, for the bar down the side of its steps. */
const PART_COLOURS = [C.sky, C.cocoa, C.primary, C.beige];

/**
 * Right after Mrs Purl reads a PDF: one look at every step before you start, grouped by part.
 * Each step can open to show the pattern's own words, and the lines she wasn't sure about ask
 * Keep it / Leave it out, so nothing slips through.
 */
export default function CheckStepsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProject(id);
  const [editing, setEditing] = useState<Step | null>(null);

  const startKnitting = () => router.replace({ pathname: '/project/[id]', params: { id } });

  if (!project) {
    return (
      <ThemedView style={[styles.screen, styles.missing]}>
        <ThemedText>This project doesn’t exist anymore.</ThemedText>
      </ThemedView>
    );
  }

  const { steps } = project;
  const unsure = steps.filter((s) => s.unsure).length;
  const parts: { title?: string; steps: Step[] }[] = [];
  for (const step of steps) {
    const last = parts[parts.length - 1];
    if (last && last.title === step.section) last.steps.push(step);
    else parts.push({ title: step.section, steps: [step] });
  }
  const subtitle = [
    project.name,
    project.size ? `size ${project.size}` : '',
    `${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.four }}>
        <WaveBand style={{ paddingBottom: 6 }}>
          <View style={styles.headerRow}>
            <HeaderButton icon="close" label="Skip checking" onPress={startKnitting} round />
          </View>
          <Text style={styles.title}>Check your steps</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </WaveBand>

        <View style={styles.body}>
          {unsure > 0 && (
            <View style={styles.bubble}>
              <Purl pose="head" size={42} />
              <Text style={styles.bubbleText}>
                I wasn’t sure about {unsure === 1 ? '1 line' : `${unsure} lines`}, dear. Have a look before we start?
              </Text>
            </View>
          )}
          {parts.map((part, p) => (
            <View key={p}>
              {part.title ? <Text style={styles.part}>{part.title.toUpperCase()}</Text> : null}
              {part.steps.map((step) => (
                <StepCard
                  key={step.id}
                  projectId={project.id}
                  step={step}
                  colour={PART_COLOURS[p % PART_COLOURS.length]}
                  onEdit={() => setEditing(step)}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>
        <Button label="Looks good, start knitting" size="large" onPress={startKnitting} />
      </View>

      {editing ? (
        <StepEditorSheet key={editing.id} projectId={project.id} step={editing} onClose={() => setEditing(null)} />
      ) : null}
    </ThemedView>
  );
}

function StepCard({
  projectId,
  step,
  colour,
  onEdit,
}: {
  projectId: string;
  step: Step;
  colour: string;
  onEdit: () => void;
}) {
  const { updateStep, deleteStep } = useProjects(
    useShallow((s) => ({ updateStep: s.updateStep, deleteStep: s.deleteStep }))
  );
  const [open, setOpen] = useState(false);

  if (step.unsure) {
    return (
      <View style={[styles.card, styles.unsureCard]}>
        <View style={[styles.bar, { backgroundColor: colour }]} />
        <View style={styles.cardBody}>
          <Text style={styles.unsureLabel}>Mrs Purl wasn’t sure this is a step</Text>
          <Text style={styles.stepText}>{step.text}</Text>
          <View style={styles.choices}>
            <Pressable
              accessibilityRole="button"
              onPress={() => updateStep(projectId, step.id, { unsure: false })}
              style={[styles.pill, styles.pillDark]}>
              <Icon name="check" size={15} color={C.surface} strokeWidth={2.6} />
              <Text style={[styles.pillText, { color: C.surface }]}>Keep it</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => deleteStep(projectId, step.id)}
              style={styles.pill}>
              <Icon name="trash" size={15} color={C.text} strokeWidth={2.2} />
              <Text style={styles.pillText}>Leave it out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const length = lengthTarget(step.text);
  const tags = [
    step.rows ? `${step.rows} ${step.inRound ? (step.rows === 1 ? 'round' : 'rounds') : step.rows === 1 ? 'row' : 'rows'}` : '',
    step.stitches ? `ends with ${step.stitches} sts` : '',
  ].filter(Boolean);

  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: colour }]} />
      <View style={styles.cardBody}>
        <Text style={styles.stepText}>{step.text}</Text>
        {tags.length || length ? (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
            {length ? <Text style={[styles.tag, styles.tagReached]}>Reached {length}</Text> : null}
          </View>
        ) : null}
        {step.detail ? (
          <>
            {open && (
              <Text style={styles.says}>
                <Text style={{ fontFamily: Fonts.extrabold, color: C.text }}>Pattern says: </Text>
                {step.detail}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpen(!open)}
              hitSlop={8}
              style={styles.toggle}>
              <Text style={styles.toggleText}>{open ? 'Hide' : 'Show'} the pattern’s words</Text>
              <Icon name="chevronDown" size={14} color={C.textSecondary} strokeWidth={2.4} style={open && styles.flip} />
            </Pressable>
          </>
        ) : null}
      </View>
      <HeaderButton icon="edit" label="Edit step" onPress={onEdit} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  missing: { alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row' },
  title: { marginTop: 10, fontFamily: Fonts.display, fontSize: 30, lineHeight: 34, color: C.text },
  subtitle: { marginTop: 4, fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 20, color: C.text, opacity: 0.78 },
  body: {
    paddingHorizontal: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.surface,
  },
  bubbleText: { flex: 1, fontFamily: Fonts.bold, fontSize: 14, lineHeight: 19, color: C.text },
  part: {
    marginTop: 14,
    marginBottom: 8,
    fontFamily: Fonts.display,
    fontSize: 12,
    letterSpacing: 1.6,
    color: C.textSecondary,
  },
  card: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.card,
  },
  unsureCard: { backgroundColor: C.beige, borderColor: '#D6CBA6' },
  bar: { width: 4, borderRadius: 3, alignSelf: 'stretch' },
  cardBody: { flex: 1, gap: 6 },
  stepText: { fontFamily: Fonts.bold, fontSize: 15, lineHeight: 20, color: C.text },
  unsureLabel: { fontFamily: Fonts.extrabold, fontSize: 12.5, color: C.cocoa },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: {
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: C.skySoft,
    fontFamily: Fonts.extrabold,
    fontSize: 12,
    color: C.text,
  },
  tagReached: { backgroundColor: C.primary, color: C.beige },
  says: {
    padding: 10,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.sky,
    backgroundColor: C.surface,
    fontFamily: Fonts.semibold,
    fontSize: 13.5,
    lineHeight: 19,
    color: C.textSecondary,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  toggleText: { fontFamily: Fonts.extrabold, fontSize: 13, color: C.textSecondary },
  flip: { transform: [{ rotate: '180deg' }] },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  pill: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.text,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillDark: { backgroundColor: C.text },
  pillText: { fontFamily: Fonts.extrabold, fontSize: 14, color: C.text },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    backgroundColor: C.background,
    borderTopWidth: 1.5,
    borderTopColor: C.cardLine,
  },
});
