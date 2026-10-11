import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';

import { deleteStoredFile, hasStoredFile, readStoredFile, storeBase64 } from '@/lib/file-store';
import { supabase } from '@/lib/supabase';
import { useProjects, type Project, type SyncMeta, type Yarn } from '@/store/projects';

/**
 * Saving your knitting to your account (Supabase), so it's safe if the phone is lost and the same on
 * every phone you sign in on. The phone keeps working offline; this runs in the background when the
 * app opens, when you come back to it, and a few seconds after you change something.
 *
 * Everything is one row per thing in the `items` table (see supabase/schema.sql), and pattern files sit
 * in the private `patterns` bucket under the account's id. When two phones changed the same thing,
 * the newest change wins.
 */

const BUCKET = 'patterns';
const PROFILE = 'profile:me';

type Kind = 'project' | 'yarn' | 'profile';
type Row = { kind: Kind; id: string; data: unknown; deleted: boolean; updated_at: number; synced_at: string };
type Profile = { knitterName: string; knitLog: Record<string, number> };

export type SyncStatus = 'off' | 'saving' | 'saved' | 'offline';
export const useSyncStatus = create<{ status: SyncStatus; savedAt: number | null }>(() => ({
  status: 'off',
  savedAt: null,
}));

const yarnTime = (y: Yarn) => y.updatedAt ?? y.createdAt;
const setSync = (change: (sync: SyncMeta) => Partial<SyncMeta>) =>
  useProjects.setState((s) => ({ sync: { ...s.sync, ...change(s.sync) } }));

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Takes in every change the account has that this phone hasn't seen yet. */
async function pull(uid: string) {
  if (!supabase) return;
  const { pulledAt } = useProjects.getState().sync;
  // Look a few seconds further back than last time, in case two saves landed at the same moment.
  const since = pulledAt ? new Date(Date.parse(pulledAt) - 5000).toISOString() : null;
  const rows: Row[] = [];
  for (let from = 0; ; from += 500) {
    let query = supabase.from('items').select('kind,id,data,deleted,updated_at,synced_at').eq('user_id', uid);
    if (since) query = query.gt('synced_at', since);
    const { data, error } = await query.order('synced_at').range(from, from + 499);
    if (error) throw error;
    rows.push(...(data as Row[]));
    if (data.length < 500) break;
  }
  if (!rows.length) return;

  const removedFiles: string[] = [];
  useProjects.setState((state) => {
    let projects = state.projects;
    let yarns = state.yarns;
    let { knitterName, knitLog, profileUpdatedAt } = state;
    const deleted = { ...state.deleted };
    const versions = { ...state.sync.versions };
    let newest = state.sync.pulledAt;

    for (const row of rows) {
      const key = `${row.kind}:${row.id}`;
      if (!newest || row.synced_at > newest) newest = row.synced_at;
      // What this phone has, and how recent it is.
      const project = row.kind === 'project' ? projects.find((p) => p.id === row.id) : undefined;
      const yarn = row.kind === 'yarn' ? yarns.find((y) => y.id === row.id) : undefined;
      const localTime =
        deleted[key]?.at ??
        (project ? project.updatedAt : yarn ? yarnTime(yarn) : row.kind === 'profile' ? profileUpdatedAt : 0);
      if (row.updated_at < localTime) continue; // this phone's version is newer; it'll be sent next
      versions[key] = row.updated_at;
      if (row.updated_at === localTime && !(row.kind === 'profile' && localTime === 0)) continue;
      delete deleted[key];

      if (row.kind === 'project') {
        if (row.deleted) {
          if (project) removedFiles.push(...project.files.map((f) => f.storedName));
          projects = projects.filter((p) => p.id !== row.id);
        } else {
          const next = { ...(row.data as Project), updatedAt: row.updated_at };
          projects = project ? projects.map((p) => (p.id === row.id ? next : p)) : [next, ...projects];
        }
      } else if (row.kind === 'yarn') {
        if (row.deleted) yarns = yarns.filter((y) => y.id !== row.id);
        else {
          const next = { ...(row.data as Yarn), updatedAt: row.updated_at };
          yarns = yarn ? yarns.map((y) => (y.id === row.id ? next : y)) : [next, ...yarns];
        }
      } else if (!row.deleted) {
        const profile = row.data as Profile;
        knitterName = profile.knitterName ?? knitterName;
        // Rows counted on any phone count: keep the higher number for each day.
        const merged = { ...knitLog };
        for (const [day, rowsThatDay] of Object.entries(profile.knitLog ?? {})) {
          merged[day] = Math.max(merged[day] ?? 0, rowsThatDay);
        }
        knitLog = merged;
        profileUpdatedAt = row.updated_at;
      }
    }
    projects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      projects,
      yarns,
      knitterName,
      knitLog,
      profileUpdatedAt,
      deleted,
      sync: { ...state.sync, versions, pulledAt: newest },
    };
  });
  for (const name of removedFiles) await deleteStoredFile(name).catch(() => {});
}

/** Downloads pattern files this phone doesn't have yet (projects added on another phone). */
async function fetchMissingFiles(uid: string) {
  if (!supabase) return;
  for (const project of useProjects.getState().projects) {
    for (const file of project.files) {
      if (await hasStoredFile(file.storedName)) continue;
      const { data, error } = await supabase.storage.from(BUCKET).download(`${uid}/${file.storedName}`);
      if (error || !data) continue; // not uploaded yet by the other phone; try again next time
      await storeBase64(await blobToBase64(data), file.storedName);
      setSync((sync) => ({ uploaded: { ...sync.uploaded, [file.storedName]: true } }));
    }
  }
}

/** Sends this phone's changes, deletions and new pattern files to the account. */
async function push(uid: string) {
  if (!supabase) return;
  const state = useProjects.getState();
  const { versions, uploaded, removeFiles } = state.sync;

  // Files first, so another phone never gets a project whose file isn't there yet.
  for (const project of state.projects) {
    for (const file of project.files) {
      if (uploaded[file.storedName] || !(await hasStoredFile(file.storedName))) continue;
      const bytes = base64ToBytes(await readStoredFile(file.storedName));
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(`${uid}/${file.storedName}`, bytes, { contentType: file.mimeType || undefined, upsert: true });
      if (error) throw error;
      setSync((sync) => ({ uploaded: { ...sync.uploaded, [file.storedName]: true } }));
    }
  }

  const rows: Omit<Row, 'synced_at'>[] = [];
  for (const p of state.projects) {
    if (versions[`project:${p.id}`] !== p.updatedAt) {
      rows.push({ kind: 'project', id: p.id, data: p, deleted: false, updated_at: p.updatedAt });
    }
  }
  for (const y of state.yarns) {
    if (versions[`yarn:${y.id}`] !== yarnTime(y)) {
      rows.push({ kind: 'yarn', id: y.id, data: y, deleted: false, updated_at: yarnTime(y) });
    }
  }
  if (state.profileUpdatedAt && versions[PROFILE] !== state.profileUpdatedAt) {
    const profile: Profile = { knitterName: state.knitterName, knitLog: state.knitLog };
    rows.push({ kind: 'profile', id: 'me', data: profile, deleted: false, updated_at: state.profileUpdatedAt });
  }
  const tombstones = Object.entries(state.deleted);
  for (const [key, tombstone] of tombstones) {
    const [kind, id] = key.split(':') as [Kind, string];
    rows.push({ kind, id, data: null, deleted: true, updated_at: tombstone.at });
  }

  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200).map((row) => ({ ...row, user_id: uid }));
    const { error } = await supabase.from('items').upsert(chunk, { onConflict: 'user_id,kind,id' });
    if (error) throw error;
  }

  const filesToRemove = [...new Set([...removeFiles, ...tombstones.flatMap(([, t]) => t.files ?? [])])];
  if (filesToRemove.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(filesToRemove.map((name) => `${uid}/${name}`));
    if (error) throw error;
  }

  useProjects.setState((s) => {
    const nextVersions = { ...s.sync.versions };
    for (const row of rows) nextVersions[`${row.kind}:${row.id}`] = row.updated_at;
    // Forget deletions the account now knows about (unless deleted again since).
    const deleted = { ...s.deleted };
    for (const [key, tombstone] of tombstones) if (deleted[key]?.at === tombstone.at) delete deleted[key];
    const nextUploaded = { ...s.sync.uploaded };
    for (const name of filesToRemove) delete nextUploaded[name];
    return {
      deleted,
      sync: {
        ...s.sync,
        versions: nextVersions,
        uploaded: nextUploaded,
        removeFiles: s.sync.removeFiles.filter((name) => !filesToRemove.includes(name)),
      },
    };
  });
}

/** Removes everything from this phone, files included, without touching the account. */
async function clearPhone() {
  const files = useProjects.getState().projects.flatMap((p) => p.files.map((f) => f.storedName));
  for (const name of files) await deleteStoredFile(name).catch(() => {});
  useProjects.getState().clearLocalData();
}

async function syncOnce(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) {
    useSyncStatus.setState({ status: 'off' });
    return false;
  }
  // Knitting on this phone that belongs to another account is never mixed into this one.
  const owner = useProjects.getState().sync.userId;
  if (owner && owner !== uid) await clearPhone();
  setSync(() => ({ userId: uid }));

  useSyncStatus.setState({ status: 'saving' });
  try {
    await pull(uid);
    await push(uid);
    await fetchMissingFiles(uid);
    useSyncStatus.setState({ status: 'saved', savedAt: Date.now() });
    return true;
  } catch (error) {
    console.warn('Saving to your account failed', error);
    useSyncStatus.setState({ status: 'offline' });
    return false;
  }
}

let running: Promise<boolean> | null = null;
let runAgain = false;

/** Saves now (or right after the save that's already running). Resolves true when everything is saved. */
export function syncNow(): Promise<boolean> {
  if (running) {
    runAgain = true;
    return running;
  }
  running = (async () => {
    let ok = false;
    do {
      runAgain = false;
      ok = await syncOnce();
    } while (runAgain);
    return ok;
  })().finally(() => {
    running = null;
  });
  return running;
}

/** Keeps the account up to date while the app runs. Mount once, near the top of the app. */
export function useAccountSync() {
  useEffect(() => {
    if (!supabase) return;
    const auth = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) syncNow();
      if (!session) useSyncStatus.setState({ status: 'off', savedAt: null });
    });
    const appState = AppState.addEventListener('change', (state) => state === 'active' && syncNow());

    // A few seconds after something changes, save it.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useProjects.subscribe((state, previous) => {
      const changed =
        state.projects !== previous.projects ||
        state.yarns !== previous.yarns ||
        state.profileUpdatedAt !== previous.profileUpdatedAt ||
        state.deleted !== previous.deleted;
      if (!changed || useSyncStatus.getState().status === 'off') return;
      clearTimeout(timer);
      timer = setTimeout(syncNow, 3000);
    });
    return () => {
      auth.data.subscription.unsubscribe();
      appState.remove();
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
}

/**
 * Signs out: saves first, then removes the knitting from this phone (it's in the account and comes
 * back on sign-in). Pass `force` to sign out even when saving failed; anything unsaved is then lost.
 * Returns false when saving failed and `force` wasn't given.
 */
export async function signOutAndClear(force = false) {
  if (!supabase) return true;
  if (!(await syncNow()) && !force) return false;
  await supabase.auth.signOut({ scope: 'local' });
  await clearPhone();
  return true;
}

/** Deletes the account for good: pattern files, saved knitting and the login. Then clears this phone. */
export async function deleteAccount() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error('Please sign in first.');
  const bucket = supabase.storage.from(BUCKET);
  for (;;) {
    const { data: files, error } = await bucket.list(uid, { limit: 100 });
    if (error) throw new Error('Couldn’t reach your account. Check your internet connection and try again.');
    if (!files.length) break;
    const { error: removeError } = await bucket.remove(files.map((f) => `${uid}/${f.name}`));
    if (removeError) throw new Error('Couldn’t remove your pattern files. Please try again.');
  }
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new Error('Couldn’t delete your account. Please try again.');
  await supabase.auth.signOut({ scope: 'local' });
  await clearPhone();
}
