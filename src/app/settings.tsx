import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccountActions } from '@/components/account-actions';
import { Icon, type IconName } from '@/components/icon';
import { Purl } from '@/components/purl';
import { ScreenHeader } from '@/components/screen-header';
import { WaveBand } from '@/components/wave-band';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useSession } from '@/lib/auth';
import { useProjects } from '@/store/projects';

const C = Colors.light;

/** An email to hello@ with a few questions to answer, and the app version and device filled in. */
function feedbackMail() {
  const version = Constants.expoConfig?.version ?? '';
  // On the web the version says nothing, but which phone or computer the browser runs on does.
  const device =
    Platform.OS === 'web'
      ? `web on ${(typeof navigator !== 'undefined' && /iPhone|iPad|Android|Macintosh|Windows|Linux/.exec(navigator.userAgent)?.[0]) || 'unknown'}`
      : `${Platform.OS} ${Platform.Version}`;
  const body = [
    'What were you doing?',
    '',
    '',
    'What happened?',
    '',
    '',
    'What did you expect?',
    '',
    '',
    '—',
    `DropStitch ${version} · ${device}`,
  ].join('\n');
  return `mailto:hello@dropstitch.io?subject=${encodeURIComponent('DropStitch feedback')}&body=${encodeURIComponent(body)}`;
}

/** Settings, opened from the gear on Home: Plus (soon), the account, help and the small print. */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSession();
  const resetTours = useProjects((s) => s.resetTours);
  const { signOut, removeAccount, busy, problem, dialog } = useAccountActions();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <WaveBand
          style={{ paddingBottom: 18 }}
          art={<Purl pose="reading" size={132} />}
          artStyle={{ right: 6, bottom: -4 }}>
          <ScreenHeader back="close" round />
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Your account and the app</Text>
        </WaveBand>

        <View style={styles.content}>
          <View style={styles.plus}>
            <View style={styles.plusTop}>
              <View style={styles.star}>
                <Icon name="star" size={22} color={C.primary} strokeWidth={2} />
              </View>
              <View style={styles.soon}>
                <Text style={styles.soonText}>Coming soon</Text>
              </View>
            </View>
            <Text style={styles.plusTitle}>DropStitch Plus</Text>
            <Text style={styles.plusText}>
              Read any pattern, even photos and scans, and keep your patterns on every device. The row counter stays free.
            </Text>
          </View>

          <Text style={styles.section}>Account</Text>
          <View style={styles.list}>
            {session ? (
              <>
                <Row icon="user" label="Your profile" detail={session.user.email} onPress={() => router.push('/account')} />
                <Row
                  icon="arrowRight"
                  label={busy === 'signOut' ? 'Saving…' : 'Sign out'}
                  disabled={!!busy}
                  onPress={signOut}
                />
                <Row
                  icon="trash"
                  label={busy === 'delete' ? 'Deleting…' : 'Delete account'}
                  detail="Deletes your account and everything in it, for good."
                  danger
                  disabled={!!busy}
                  onPress={removeAccount}
                />
              </>
            ) : (
              <>
                <Row icon="user" label="Your profile" onPress={() => router.push('/account')} />
                <Row
                  icon="shield"
                  label="Sign in"
                  detail="Keep your knitting safe in your account."
                  onPress={() => router.push('/login')}
                />
              </>
            )}
          </View>
          {problem && <Text style={styles.problem}>{problem}</Text>}

          <Text style={styles.section}>Help</Text>
          <View style={styles.list}>
            <Row
              icon="reset"
              label="Show me around again"
              onPress={() => {
                resetTours();
                router.dismissTo('/');
              }}
            />
            <Row
              icon="notes"
              label="Send feedback"
              detail="Something broken, confusing or lovely? Tell us."
              onPress={() => Linking.openURL(feedbackMail())}
            />
            <Row
              icon="mail"
              label="Contact us"
              detail="hello@dropstitch.io"
              onPress={() => Linking.openURL('mailto:hello@dropstitch.io')}
            />
            <Row
              icon="shield"
              label="Privacy policy"
              onPress={() => WebBrowser.openBrowserAsync('https://dropstitch.io/privacy')}
            />
          </View>

          <Text style={styles.version}>DropStitch {Constants.expoConfig?.version ?? ''}</Text>
        </View>
      </ScrollView>
      {dialog}
    </View>
  );
}

type RowProps = {
  icon: IconName;
  label: string;
  detail?: string;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function Row({ icon, label, detail, danger, disabled, onPress }: RowProps) {
  const color = danger ? C.danger : C.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, (pressed || disabled) && { opacity: 0.55 }]}>
      <Icon name={icon} size={21} color={color} strokeWidth={2} />
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[styles.rowLabel, { color }]}>{label}</Text>
        {detail ? (
          <Text style={styles.rowDetail} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
      <Icon name="chevronRight" size={18} color={C.textSecondary} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  title: { marginTop: 10, fontFamily: Fonts.display, fontSize: 32, lineHeight: 36, color: C.text },
  subtitle: { marginTop: 6, fontFamily: Fonts.semibold, fontSize: 14.5, color: C.text, opacity: 0.75 },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  plus: { padding: 18, borderRadius: 24, backgroundColor: C.primary, gap: 6 },
  plusTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  star: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soon: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, borderWidth: 1.5, borderColor: C.beige },
  soonText: { fontFamily: Fonts.extrabold, fontSize: 12.5, color: C.beige },
  plusTitle: { fontFamily: Fonts.display, fontSize: 22, color: C.beige },
  plusText: { fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 20, color: C.beige, opacity: 0.9 },
  section: { marginTop: 26, marginBottom: 10, fontFamily: Fonts.display, fontSize: 19, color: C.text },
  list: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.card,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.cardLine,
    marginBottom: -1,
  },
  rowLabel: { fontFamily: Fonts.bold, fontSize: 15.5 },
  rowDetail: { fontFamily: Fonts.semibold, fontSize: 13, lineHeight: 18, color: C.textSecondary },
  problem: { marginTop: 10, fontFamily: Fonts.bold, fontSize: 14, lineHeight: 20, color: C.danger },
  version: { marginTop: 28, fontFamily: Fonts.semibold, fontSize: 13, color: C.textSecondary, textAlign: 'center' },
});
