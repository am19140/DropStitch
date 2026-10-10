import 'expo-sqlite/localStorage/install';

/** Where Supabase keeps the signed-in session on the phone: expo-sqlite's localStorage, kept across launches. */
export const authStorage = globalThis.localStorage;
