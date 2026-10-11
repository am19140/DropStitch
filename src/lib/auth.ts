import type { AuthError, Session } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/** True once the project's Supabase keys are set, so accounts can be used. */
export const accountsEnabled = !!supabase;

const NOT_SET_UP = 'Accounts aren’t switched on yet. Your knitting is safe on this phone in the meantime.';

/** Supabase's error messages, in plain words. */
function friendly(error: AuthError | Error): Error {
  const message = error.message ?? '';
  if (/invalid login credentials/i.test(message)) return new Error('That email and password don’t match.');
  if (/email not confirmed/i.test(message)) return new Error('Please confirm your email first. Check your inbox for the link.');
  if (/already registered|already exists/i.test(message)) return new Error('There’s already an account with this email. Try signing in.');
  if (/password should be/i.test(message)) return new Error('Please use a password of at least 8 characters.');
  if (/provider is not enabled|unsupported provider/i.test(message)) return new Error('Google sign-in isn’t switched on yet. Please use your email for now.');
  if (/rate limit|too many/i.test(message)) return new Error('Too many tries. Please wait a minute and try again.');
  if (/network|fetch/i.test(message)) return new Error('Couldn’t reach the server. Check your internet connection.');
  return new Error(message || 'Something went wrong. Please try again.');
}

function client() {
  if (!supabase) throw new Error(NOT_SET_UP);
  return supabase;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await client().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw friendly(error);
}

/** Creates an account. Returns true when the account still needs its email confirmed before signing in. */
export async function signUpWithEmail(email: string, password: string) {
  if (password.length < 8) throw new Error('Please use a password of at least 8 characters.');
  const { data, error } = await client().auth.signUp({ email: email.trim(), password });
  if (error) throw friendly(error);
  return !data.session;
}

/** The session carried in the link Google sends you back with. */
async function sessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token) return;
  const { error } = await client().auth.setSession({ access_token, refresh_token });
  if (error) throw friendly(error);
}

/**
 * Signs in with Google. In the browser the page goes to Google and comes back signed in. On phones
 * Google opens in a secure in-app browser and hands the session back to the app through its link.
 */
/** Whether Google sign-in is switched on in the Supabase project (its public settings say). */
async function googleEnabled() {
  try {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    const settings = await response.json();
    return settings?.external?.google !== false;
  } catch {
    // If the settings can't be read, try anyway; Supabase will say what's wrong.
    return true;
  }
}

export async function signInWithGoogle() {
  const auth = client().auth;
  // Otherwise the browser would leave the app for Supabase's error page.
  if (!(await googleEnabled())) throw new Error('Google sign-in isn’t switched on yet. Please use your email for now.');
  if (Platform.OS === 'web') {
    const { error } = await auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) throw friendly(error);
    return;
  }
  const redirectTo = makeRedirectUri();
  const { data, error } = await auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
  if (error) throw friendly(error);
  const result = await WebBrowser.openAuthSessionAsync(data.url ?? '', redirectTo);
  if (result.type === 'success') await sessionFromUrl(result.url);
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw friendly(error);
}

/** The signed-in session, kept up to date; null when signed out (or accounts aren't set up). */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}
