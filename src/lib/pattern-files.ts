import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { deleteStoredFile, readStoredFile, storeFile } from '@/lib/file-store';
import { newId, type PatternFile } from '@/store/projects';

export type FileSource = 'files' | 'photos' | 'camera';

type Picked = { uri: string; name: string; mimeType?: string | null };

const EXTENSION_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
};

function extensionOf(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

async function pick(source: FileSource): Promise<Picked[]> {
  if (source === 'files') {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      multiple: true,
      copyToCacheDirectory: true,
    });
    return result.canceled ? [] : result.assets;
  }

  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('DropStitch needs camera access to photograph a pattern. You can allow it in Settings.');
    }
    result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      orderedSelection: true,
    });
  }
  if (result.canceled) return [];

  const stamp = new Date().toLocaleDateString();
  return result.assets.map((asset, i) => ({
    uri: asset.uri,
    name: asset.fileName ?? `Photo ${stamp}${result.assets.length > 1 ? ` (${i + 1})` : ''}.jpg`,
    mimeType: asset.mimeType,
  }));
}

/** Lets the user pick pattern files and keeps a copy of each one in the app's own storage. */
export async function pickPatternFiles(source: FileSource): Promise<PatternFile[]> {
  const picked = await pick(source);
  const saved: PatternFile[] = [];

  try {
    for (const item of picked) {
      const extension = extensionOf(item.name);
      const mimeType = item.mimeType || EXTENSION_TYPES[extension] || '';
      const kind =
        mimeType === 'application/pdf' ? 'pdf' : mimeType.startsWith('image/') ? 'image' : null;
      if (!kind) {
        throw new Error(`“${item.name}” isn’t a PDF or an image, so DropStitch can’t show it.`);
      }

      const id = newId();
      const storedName = `${id}.${extension || (kind === 'pdf' ? 'pdf' : 'jpg')}`;
      await storeFile(item.uri, storedName);
      saved.push({ id, name: item.name, kind, mimeType, storedName });
    }
  } catch (error) {
    // Don't leave half of a multi-file pick behind.
    await deletePatternFiles(saved);
    throw error;
  }
  return saved;
}

/** Returns the file's contents as base64, for the pattern viewer. */
export function readPatternFile(file: PatternFile) {
  return readStoredFile(file.storedName);
}

export async function deletePatternFiles(files: PatternFile[]) {
  await Promise.all(files.map((f) => deleteStoredFile(f.storedName).catch(() => {})));
}
