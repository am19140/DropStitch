import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { knitDuration } from '@/lib/dates';
import { initials, knitTime, useProjects } from '@/store/projects';

const C = Colors.light;

/** The knitter's corner: their name (shown as initials on Home) and a few totals. */
export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const name = useProjects((s) => s.knitterName);
  const setName = useProjects((s) => s.setKnitterName);
  const projects = useProjects((s) => s.projects);
  const yarnCount = useProjects((s) => s.yarns.length);

  const active = projects.filter((p) => !p.finishedAt).length;
  const finished = projects.length - active;
  const rows = projects.reduce((sum, p) => sum + p.rowCount, 0);
  const knitted = projects.reduce((sum, p) => sum + knitTime(p), 0);
  const letters = initials(name);

  const stats = [
    { label: 'on the needles', value: String(active) },
    { label: 'finished', value: String(finished) },
    { label: 'rows counted', value: String(rows) },
    { label: 'knitting time', value: knitted ? knitDuration(knitted) : '—' },
    { label: yarnCount === 1 ? 'yarn ball' : 'yarn balls', value: String(yarnCount) },
  ];

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.two }]}>
        <ScreenHeader back="close" />

        <View style={styles.hero}>
          <View style={styles.avatar}>
            {letters ? (
              <Text style={styles.avatarText}>{letters}</Text>
            ) : (
              <Icon name="user" size={44} color={C.text} strokeWidth={1.8} />
            )}
          </View>
          <ThemedText type="title" style={{ textAlign: 'center' }}>
            {name.trim() || 'Hello, knitter'}
          </ThemedText>
        </View>

        <TextField
          label="Your name"
          value={name}
          onChangeText={setName}
          placeholder="First and last name"
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="done"
          hint="Shown as your initials on the home page. Everything stays on this phone."
        />

        <ThemedText type="section" style={{ marginTop: 32 }}>
          Your knitting so far
        </ThemedText>
        <View style={styles.grid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.four, paddingBottom: 48 },
  hero: { alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 28 },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: C.band,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.display, fontSize: 38, color: C.text },
  grid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: {
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: 96,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.card,
    justifyContent: 'space-between',
  },
  statValue: { fontFamily: Fonts.display, fontSize: 28, lineHeight: 34, color: C.text },
  statLabel: { fontFamily: Fonts.semibold, fontSize: 13, color: C.textSecondary },
});
