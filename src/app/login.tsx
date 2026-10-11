import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/button';
import { Purl } from '@/components/purl';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { TextTabs } from '@/components/text-tabs';
import { WaveBand } from '@/components/wave-band';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { accountsEnabled, sendPasswordReset, signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/lib/auth';

const C = Colors.light;
type Mode = 'signIn' | 'signUp';

/** Sign in or create an account, with email and password or with Google. */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // New knitters coming from the welcome screen start on "Create account".
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'signUp' ? 'signUp' : 'signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | 'reset' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const done = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const canSubmit = accountsEnabled && /\S+@\S+\.\S+/.test(email.trim()) && password.length > 0 && !busy;

  const submit = async () => {
    setBusy('email');
    setError(null);
    setNotice(null);
    try {
      if (mode === 'signIn') {
        await signInWithEmail(email, password);
        done();
      } else if (await signUpWithEmail(email, password)) {
        setNotice('Nearly there! We sent you an email. Tap the link in it, then sign in here.');
        setMode('signIn');
      } else {
        done();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const forgot = async () => {
    setError(null);
    setNotice(null);
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Type your email above first, then tap “Forgot password?” again.');
      return;
    }
    setBusy('reset');
    try {
      await sendPasswordReset(email);
      setNotice(`We sent a link to ${email.trim()}. Tap it to choose a new password, then sign in here.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setBusy('google');
    setError(null);
    try {
      await signInWithGoogle();
      // In the browser the page leaves for Google; on phones we're back and signed in.
      if (Platform.OS !== 'web') done();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <WaveBand style={{ paddingBottom: 22 }} art={<Purl pose="head" size={150} />} artStyle={{ right: 18, bottom: 6 }}>
          <ScreenHeader back="close" round />
          <Text style={styles.title}>{mode === 'signIn' ? 'Welcome\nback' : 'Join\nDropStitch'}</Text>
          <Text style={styles.subtitle}>Keep your knitting safe{'\n'}on all your devices.</Text>
        </WaveBand>

        <View style={styles.content}>
          {!accountsEnabled && <Text style={styles.notice}>Accounts aren’t switched on yet. Your knitting stays safe on this phone in the meantime.</Text>}

          <TextTabs<Mode>
            value={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
            }}
            options={[
              { value: 'signIn', label: 'Sign in' },
              { value: 'signUp', label: 'Create account' },
            ]}
          />

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'signUp' ? 'At least 8 characters' : 'Your password'}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
            textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
            returnKeyType="go"
            onSubmitEditing={() => canSubmit && submit()}
          />
          {mode === 'signIn' && accountsEnabled && (
            <Pressable accessibilityRole="button" onPress={forgot} disabled={!!busy} style={styles.forgot}>
              <Text style={styles.forgotText}>{busy === 'reset' ? 'Sending…' : 'Forgot password?'}</Text>
            </Pressable>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
          {notice && <Text style={styles.notice}>{notice}</Text>}

          <Button
            label={busy === 'email' ? 'One moment…' : mode === 'signIn' ? 'Sign in' : 'Create account'}
            size="large"
            disabled={!canSubmit}
            onPress={submit}
          />

          <View style={styles.or}>
            <View style={styles.rule} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.rule} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            disabled={!!busy || !accountsEnabled}
            onPress={google}
            style={({ pressed }) => [styles.google, { opacity: busy || !accountsEnabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            {busy === 'google' ? <ActivityIndicator color={C.text} /> : <GoogleMark />}
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.skip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Google's "G", as its sign-in buttons show it. */
function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  title: { marginTop: 10, fontFamily: Fonts.display, fontSize: 32, lineHeight: 36, color: C.text },
  subtitle: { marginTop: 8, fontFamily: Fonts.semibold, fontSize: 14.5, lineHeight: 20, color: C.text, opacity: 0.75 },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: 18 },
  notice: { padding: 14, borderRadius: 16, backgroundColor: C.skySoft, fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 20, color: C.text },
  error: { fontFamily: Fonts.bold, fontSize: 14, lineHeight: 20, color: C.danger },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: 1, backgroundColor: C.cardLine },
  orText: { fontFamily: Fonts.bold, fontSize: 13, color: C.textSecondary },
  google: {
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.text,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleText: { fontFamily: Fonts.extrabold, fontSize: 16, color: C.text },
  forgot: { alignSelf: 'flex-end', minHeight: 36, justifyContent: 'center', marginTop: -10 },
  forgotText: { fontFamily: Fonts.bold, fontSize: 14, color: C.primary },
  skip: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  skipText: { fontFamily: Fonts.bold, fontSize: 14.5, color: C.textSecondary, textDecorationLine: 'underline' },
});
