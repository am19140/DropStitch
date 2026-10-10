/** Where Supabase keeps the signed-in session in the browser. */
export const authStorage = typeof window === 'undefined' ? undefined : window.localStorage;
