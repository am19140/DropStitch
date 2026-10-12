import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccountActions, useSavedLine } from '@/components/account-actions';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Purl } from '@/components/purl';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { WaveBand } from '@/components/wave-band';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { knitDuration, monthYear } from '@/lib/dates';
import { useSession } from '@/lib/auth';
import { streakInfo } from '@/lib/streak';
import { initials, knitTime, useProjects } from '@/store/projects';

const C = Colors.light;
const AVATAR = 112;

/** The knitter's corner: their portrait on the wave, a few totals in solid blocks, and their account. */
export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSession();
  const { signOut, busy, dialog } = useAccountActions();
  const saved = useSavedLine();
  const name = useProjects((s) => s.knitterName);
  const setName = useProjects((s) => s.setKnitterName);
  const projects = useProjects((s) => s.projects);
  const yarns = useProjects((s) => s.yarns);
  const knitLog = useProjects((s) => s.knitLog);
  const [editing, setEditing] = useState(!name.trim());

  const active = projects.filter((p) => !p.finishedAt).length;
  const finished = projects.length - active;
  const rows = projects.reduce((sum, p) => sum + p.rowCount, 0);
  const knitted = projects.reduce((sum, p) => sum + knitTime(p), 0);
  const letters = initials(name);
  const streak = streakInfo(knitLog).current;

  // The first thing they ever added or knitted.
  const firstDay = Object.keys(knitLog).sort()[0];
  const since = Math.min(
    ...projects.map((p) => p.createdAt),
    ...yarns.map((y) => y.createdAt),
    firstDay ? new Date(`${firstDay}T12:00:00`).getTime() : Infinity,
  );
  const about = [
    Number.isFinite(since) ? `Knitting since ${monthYear(since)}` : 'Just getting started',
    streak > 0 && `${streak}-day streak`,
  ]
    .filter(Boolean)
    .join(' · ');

  // Solid blocks in the palette, two by two; the yarn stash gets the full width underneath.
  const stats = [
    { label: 'on the needles', value: String(active), bg: C.sky, fg: C.text },
    { label: 'finished', value: String(finished), bg: C.beige, fg: C.text },
    { label: 'rows counted', value: rows.toLocaleString(), bg: C.primary, fg: C.beige },
    { label: 'knitting time', value: !knitted ? '—' : knitted < 60_000 ? '< 1 min' : knitDuration(knitted), bg: C.cocoa, fg: C.beige },
  ];

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <WaveBand style={{ paddingBottom: 58 }}>
          <ScreenHeader back="close" round right={<Purl pose="head" size={52} style={{ marginRight: 4 }} />} />
        </WaveBand>

        {/* The portrait sits half on the wave, half on the page. */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            {letters ? (
              <Text style={styles.avatarText}>{letters}</Text>
            ) : (
              <Icon name="user" size={48} color={C.beige} strokeWidth={1.8} />
            )}
          </View>
          {editing ? (
            <View style={styles.nameEdit}>
              <TextField
                label="Your name"
                value={name}
                onChangeText={setName}
                placeholder="First and last name"
                autoCapitalize="words"
                autoComplete="name"
                autoFocus={!!name.trim()}
                returnKeyType="done"
                onSubmitEditing={() => name.trim() && setEditing(false)}
                hint="Shown as your initials."
              />
              {!!name.trim() && <Button label="Done" size="small" variant="secondary" onPress={() => setEditing(false)} />}
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${name.trim()}. Change your name`}
              onPress={() => setEditing(true)}
              hitSlop={6}
              style={({ pressed }) => [styles.nameRow, pressed && { opacity: 0.6 }]}>
              <Text style={styles.name}>{name.trim()}</Text>
              <Icon name="edit" size={18} color={C.textSecondary} strokeWidth={2} />
            </Pressable>
          )}
          {!editing && <Text style={styles.about}>{about}</Text>}
        </View>

        <View style={styles.content}>
          <View style={styles.grid}>
            {stats.map((s) => (
              <View key={s.label} style={[styles.stat, { backgroundColor: s.bg }]}>
                <Text style={[styles.statValue, { color: s.fg }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: s.fg }]}>{s.label}</Text>
              </View>
            ))}
            <View style={[styles.stat, styles.statWide]}>
              <Text style={styles.statValue}>{yarns.length}</Text>
              <Text style={styles.statLabel}>{yarns.length === 1 ? 'yarn ball' : 'yarn balls'} in your stash</Text>
            </View>
          </View>

          <View style={styles.account}>
            {session ? (
              <>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.accountText} numberOfLines={1}>
                    <Text style={{ fontFamily: Fonts.extrabold }}>{session.user.email}</Text>
                  </Text>
                  <Text style={[styles.savedText, saved.failed && { color: C.danger }]}>{saved.text}</Text>
                </View>
                <Button
                  label={busy === 'signOut' ? 'Saving…' : 'Sign out'}
                  variant="secondary"
                  size="small"
                  disabled={!!busy}
                  onPress={signOut}
                />
              </>
            ) : (
              <>
                <Text style={styles.accountText}>Not signed in. Sign in to keep your knitting safe in your account.</Text>
                <Button label="Sign in" size="small" onPress={() => router.push('/login')} />
              </>
            )}
          </View>
        </View>
      </ScrollView>
      {dialog}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  hero: { zIndex: 2, marginTop: -AVATAR / 2 - 46, alignItems: 'center', paddingHorizontal: Spacing.four },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 5,
    borderColor: C.background,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.display, fontSize: 38, color: C.beige },
  nameRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: Fonts.display, fontSize: 27, lineHeight: 33, color: C.text, textAlign: 'center', flexShrink: 1 },
  nameEdit: { marginTop: 14, alignSelf: 'stretch', gap: 10 },
  about: { marginTop: 4, fontFamily: Fonts.semibold, fontSize: 14, color: C.textSecondary, textAlign: 'center' },
  content: { padding: Spacing.four, paddingTop: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
  account: {
    marginTop: 18,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountText: { flex: 1, fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 20, color: C.text },
  savedText: { fontFamily: Fonts.semibold, fontSize: 12.5, lineHeight: 17, color: C.textSecondary },
});
