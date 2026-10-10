import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { authStorage } from '@/lib/auth-storage';

// Both values are meant to be public: what each person can read is enforced in the database itself
// (row level security). Never put a secret key or the database password in the app.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * The Supabase client for accounts, or null until the project's keys are set in `.env.local`
 * (see `.env.example`). Without it the app works as before, with everything on this phone.
 */
export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          storage: authStorage,
          autoRefreshToken: true,
          persistSession: true,
          // In the browser, Google sends you back with the session in the address; phones have no address.
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;

// On phones, only keep refreshing the session while the app is open.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
