import { Directory, File, Paths } from 'expo-file-system';

// Pattern files are kept under <documents>/patterns. Only the file name is saved in the
// project, because the full path to the documents folder can change after an app update.
function patternsDir() {
  const dir = new Directory(Paths.document, 'patterns');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export async function storeFile(sourceUri: string, storedName: string) {
  await new File(sourceUri).copy(new File(patternsDir(), storedName), { overwrite: true });
}

export function readStoredFile(storedName: string): Promise<string> {
  return new File(patternsDir(), storedName).base64();
}

export async function deleteStoredFile(storedName: string) {
  const file = new File(patternsDir(), storedName);
  if (file.exists) file.delete();
}
