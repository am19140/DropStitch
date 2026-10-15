import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Purl } from '@/components/purl';
import { WaveBand } from '@/components/wave-band';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useProjects } from '@/store/projects';

const C = Colors.light;
type State = 'checking' | 'signedIn' | 'confirmed' | 'error';

/** An old or used link comes back with the problem in the address instead of a session. */
function linkError() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.hash.slice(1) + '&' + window.location.search.slice(1));
  const error = params.get('error_description') || params.get('error');
  return error ? error.replace(/\+/g, ' ') : null;
}

/**
 * Where the link in the "confirm your email" email lands on the web: the app's own "You're in!",
 * not the website. Supabase signs the browser in from the link by itself (detectSessionInUrl).
 */
export default function ConfirmedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const markWelcomeSeen = useProjects((s) => s.markWelcomeSeen);
  const [error] = useState(linkError);
  const [state, setState] = useState<State>(error ? 'error' : supabase ? 'checking' : 'confirmed');

  useEffect(() => {
    if (state !== 'checking' || !supabase) return;
    supabase.auth.getSession().then(({ data }) => setState(data.session ? 'signedIn' : 'confirmed'));
  }, [state]);

  const start = () => {
    markWelcomeSeen();
    router.replace('/');
  };

  const title = state === 'error' ? 'That link didn’t work' : state === 'checking' ? 'One moment…' : 'You’re in!';
  const message =
    state === 'error'
      ? /expired|invalid/i.test(error ?? '')
        ? 'This link has expired or was already used. Try signing in. Still stuck? Write to hello@dropstitch.io.'
        : `Something went wrong with this link: ${error}. Please try signing in again.`
      : state === 'signedIn'
        ? 'Your email is confirmed and you’re signed in.'
        : state === 'confirmed'
          ? 'Your email is confirmed. Sign in with your email and password to start knitting.'
          : '';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <WaveBand style={{ paddingBottom: 40 }}>
        <View style={styles.brand}>
          <Purl pose="head" size={38} />
          <Text style={styles.brandText}>dropstitch</Text>
        </View>
      </WaveBand>

      <View style={styles.content}>
        <Purl pose={state === 'error' ? 'reading' : 'proud'} size={220} style={styles.art} />
        <Text style={styles.title}>{title}</Text>
        {!!message && <Text style={styles.message}>{message}</Text>}

        {state === 'signedIn' && (
          <>
            <Button label="Start knitting" icon="arrowRight" iconAfter size="large" onPress={start} style={styles.button} />
            {Platform.OS === 'web' && (
              <Text style={styles.hint}>
                Started on DropStitch from your home screen? Go back to it there. If it asks, sign in with your email and password.
              </Text>
            )}
          </>
        )}
        {(state === 'confirmed' || state === 'error') && (
          <Button label="Sign in" size="large" onPress={() => router.replace('/login')} style={styles.button} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  brand: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  brandText: { fontFamily: Fonts.display, fontSize: 20, color: C.text },
  content: { paddingHorizontal: 24, alignItems: 'center' },
  art: { marginTop: 8 },
  title: { marginTop: 12, textAlign: 'center', fontFamily: Fonts.display, fontSize: 34, lineHeight: 38, color: C.text },
  message: { marginTop: 10, maxWidth: 340, textAlign: 'center', fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 24, color: C.textSecondary },
  button: { marginTop: 24, alignSelf: 'stretch' },
  hint: { marginTop: 16, maxWidth: 340, textAlign: 'center', fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 21, color: C.textSecondary },
});
