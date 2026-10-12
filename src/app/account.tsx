import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useConfirm } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { knitDuration, timeAgo } from '@/lib/dates';
import { useSession } from '@/lib/auth';
import { deleteAccount, signOutAndClear, useSyncStatus } from '@/lib/sync';
import { initials, knitTime, useProjects } from '@/store/projects';

const C = Colors.light;

/** The knitter's corner: their name (shown as initials on Home) and a few totals. */
export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSession();
  const resetTours = useProjects((s) => s.resetTours);
  const { ask, dialog } = useConfirm();
  const syncStatus = useSyncStatus((s) => s.status);
  const savedAt = useSyncStatus((s) => s.savedAt);
  const [busy, setBusy] = useState<'signOut' | 'delete' | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const signOut = async () => {
    const ok = await ask({
      title: 'Sign out?',
      message: 'Your knitting is saved to your account and comes back when you sign in again. It will be removed from this phone.',
      confirmLabel: 'Sign out',
    });
    if (!ok) return;
    setBusy('signOut');
    setProblem(null);
    if (!(await signOutAndClear())) {
      const anyway = await ask({
        title: 'Not everything is saved',
        message: 'Some changes couldn’t be saved to your account (are you offline?). If you sign out now, they’ll be lost.',
        confirmLabel: 'Sign out anyway',
      });
      if (anyway) await signOutAndClear(true);
    }
    setBusy(null);
  };

  const removeAccount = async () => {
    const ok = await ask({
      title: 'Delete your account?',
      message:
        'This deletes your account and everything saved in it, for good: projects, patterns, notes, rows and yarn. It also clears this phone. This can’t be undone.',
      confirmLabel: 'Delete account',
    });
    if (!ok) return;
    setBusy('delete');
    setProblem(null);
    try {
      await deleteAccount();
      router.replace('/');
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const savedLine =
    syncStatus === 'saving'
      ? 'Saving to your account…'
      : syncStatus === 'offline'
        ? 'Not saved yet: you seem to be offline. It will save when you’re back online.'
        : syncStatus === 'failed'
          ? 'Couldn’t save to your account just now. Your knitting is safe on this phone; we’ll keep trying.'
        : savedAt
          ? `Saved to your account ${timeAgo(savedAt)}`
          : 'Saved to your account';
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
          hint="Shown as your initials."
        />

        <View style={styles.account}>
          {session ? (
            <>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.accountText}>
                  Signed in as <Text style={{ fontFamily: Fonts.extrabold }}>{session.user.email}</Text>
                </Text>
                <Text style={[styles.savedText, (syncStatus === 'offline' || syncStatus === 'failed') && { color: C.danger }]}>{savedLine}</Text>
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

        <Button
          label="Show me around again"
          icon="reset"
          variant="secondary"
          onPress={() => {
            resetTours();
            router.replace('/');
          }}
          style={{ marginTop: 24 }}
        />

        {session && (
          <View style={styles.danger}>
            {problem && <Text style={styles.problem}>{problem}</Text>}
            <Button
              label={busy === 'delete' ? 'Deleting…' : 'Delete account'}
              icon="trash"
              variant="danger"
              disabled={!!busy}
              onPress={removeAccount}
            />
            <Text style={styles.dangerHint}>Deletes your account and everything saved in it, for good.</Text>
          </View>
        )}
      </ScrollView>
      {dialog}
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
  danger: { marginTop: 36, gap: 8 },
  dangerHint: { fontFamily: Fonts.semibold, fontSize: 13, color: C.textSecondary, textAlign: 'center' },
  problem: { fontFamily: Fonts.bold, fontSize: 14, lineHeight: 20, color: C.danger },
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
