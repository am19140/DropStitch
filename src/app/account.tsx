import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
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

  // Solid blocks in the palette, two by two; the yarn stash gets the full width underneath.
  const stats = [
    { label: 'on the needles', value: String(active), bg: C.sky, fg: C.text },
    { label: 'finished', value: String(finished), bg: C.beige, fg: C.text },
    { label: 'rows counted', value: rows.toLocaleString(), bg: C.primary, fg: C.beige },
    { label: 'knitting time', value: !knitted ? '—' : knitted < 60_000 ? '< 1 min' : knitDuration(knitted), bg: C.cocoa, fg: C.beige },
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
              <Icon name="user" size={44} color={C.beige} strokeWidth={1.8} />
            )}
          </View>
          <Text style={styles.name}>{name.trim() || 'Hello, knitter'}</Text>
        </View>

        <TextField
          label="Your name"
          value={name}
          onChangeText={setName}
          placeholder="First and last name"
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="done"
          hint="Shown as your initials. Everything stays on this phone."
        />

        <Text style={styles.section}>Your knitting so far</Text>
        <View style={styles.grid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.stat, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: s.fg }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: s.fg }]}>{s.label}</Text>
            </View>
          ))}
          <View style={[styles.stat, styles.statWide]}>
            <Text style={styles.statValue}>{yarnCount}</Text>
            <Text style={styles.statLabel}>{yarnCount === 1 ? 'yarn ball' : 'yarn balls'} in your stash</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.four, paddingBottom: 48 },
  hero: { alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 24 },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.display, fontSize: 36, color: C.beige },
  name: { fontFamily: Fonts.display, fontSize: 28, lineHeight: 34, color: C.text, textAlign: 'center' },
  section: { marginTop: 26, fontFamily: Fonts.display, fontSize: 20, color: C.text },
  grid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { flexGrow: 1, flexBasis: '40%', minHeight: 96, padding: 16, borderRadius: 24, justifyContent: 'space-between' },
  statWide: {
    flexBasis: '100%',
    minHeight: 72,
    backgroundColor: C.skySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  statValue: { fontFamily: Fonts.display, fontSize: 30, lineHeight: 36, color: C.text },
  statLabel: { fontFamily: Fonts.bold, fontSize: 13.5, color: C.text },
});
