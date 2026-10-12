import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useConfirm } from '@/components/confirm-dialog';
import { timeAgo } from '@/lib/dates';
import { deleteAccount, signOutAndClear, useSyncStatus } from '@/lib/sync';

/** Signing out and deleting the account, with their questions; used by the profile and Settings. Render `dialog`. */
export function useAccountActions() {
  const router = useRouter();
  const { ask, dialog } = useConfirm();
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

  return { signOut, removeAccount, busy, problem, dialog };
}

/** "Saved to your account · just now", or why it isn't. */
export function useSavedLine() {
  const status = useSyncStatus((s) => s.status);
  const savedAt = useSyncStatus((s) => s.savedAt);
  const failed = status === 'offline' || status === 'failed';
  const text =
    status === 'saving'
      ? 'Saving to your account…'
      : status === 'offline'
        ? 'Not saved yet: you seem to be offline. It will save when you’re back online.'
        : status === 'failed'
          ? 'Couldn’t save to your account just now. Your knitting is safe on this phone; we’ll keep trying.'
          : savedAt
            ? `Saved to your account ${timeAgo(savedAt)}`
            : 'Saved to your account';
  return { text, failed };
}
