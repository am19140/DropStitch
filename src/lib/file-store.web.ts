import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Pattern files in the browser version live in IndexedDB, which (unlike localStorage's
 * ~5 MB) has room for real PDFs. Files are kept as raw bytes (ArrayBuffer): Safari can't store
 * Blobs in IndexedDB reliably, and bytes aren't inflated the way base64 text is.
 */
const DB_NAME = 'dropstitch';
const STORE = 'pattern-files';
/** Where earlier versions kept files (localStorage, via AsyncStorage). Still read for old projects. */
const LEGACY_KEY = 'dropstitch-file:';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error ?? request.error);
    tx.onabort = () => reject(tx.error ?? request.error);
  });
}

function toBase64(data: Blob | ArrayBuffer) {
  const blob = data instanceof Blob ? data : new Blob([data]);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function storeFile(sourceUri: string, storedName: string) {
  const bytes = await (await fetch(sourceUri)).arrayBuffer();
  try {
    await run('readwrite', (store) => store.put(bytes, storedName));
  } catch {
    throw new Error('Your browser ran out of space for this file. Try freeing up space, or use the app instead.');
  }
}

export async function readStoredFile(storedName: string) {
  const saved = await run<Blob | ArrayBuffer | undefined>('readonly', (store) => store.get(storedName)).catch(
    () => undefined
  );
  if (saved) return toBase64(saved);
  const legacy = await AsyncStorage.getItem(LEGACY_KEY + storedName);
  if (legacy === null) throw new Error('File not found');
  return legacy;
}

export async function deleteStoredFile(storedName: string) {
  await run('readwrite', (store) => store.delete(storedName)).catch(() => {});
  await AsyncStorage.removeItem(LEGACY_KEY + storedName);
}
