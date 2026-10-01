import AsyncStorage from '@react-native-async-storage/async-storage';

// The web build is only a preview, so files go in browser storage (a few MB at most).
const KEY = 'dropstitch-file:';

function toBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function storeFile(sourceUri: string, storedName: string) {
  const blob = await (await fetch(sourceUri)).blob();
  try {
    await AsyncStorage.setItem(KEY + storedName, await toBase64(blob));
  } catch {
    throw new Error('This file is too big for the browser preview. Try it in the app instead.');
  }
}

export async function readStoredFile(storedName: string) {
  const base64 = await AsyncStorage.getItem(KEY + storedName);
  if (base64 === null) throw new Error('File not found');
  return base64;
}

export async function deleteStoredFile(storedName: string) {
  await AsyncStorage.removeItem(KEY + storedName);
}
