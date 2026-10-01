import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { notify } from '@/lib/confirm';
import { pickPatternFiles, type FileSource } from '@/lib/pattern-files';
import type { PatternFile } from '@/store/projects';

type FilePickerProps = {
  files: PatternFile[];
  onAdd: (files: PatternFile[]) => void;
  onRemove: (file: PatternFile) => void;
};

/** Lists a pattern's files and offers buttons to add more from files, photos or the camera. */
export function FilePicker({ files, onAdd, onRemove }: FilePickerProps) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  const pick = async (source: FileSource) => {
    setBusy(true);
    try {
      const picked = await pickPatternFiles(source);
      if (picked.length > 0) onAdd(picked);
    } catch (error) {
      notify('Couldn’t add the file', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {files.map((file) => (
        <View key={file.id} style={[styles.file, { backgroundColor: theme.backgroundElement }]}>
          <Icon name={file.kind === 'pdf' ? 'file' : 'photo'} color={theme.textSecondary} />
          <ThemedText style={styles.fileName} numberOfLines={1}>
            {file.name}
          </ThemedText>
          <Button
            icon="close"
            variant="ghost"
            size="small"
            accessibilityLabel={`Remove ${file.name}`}
            onPress={() => onRemove(file)}
          />
        </View>
      ))}

      <View style={styles.buttons}>
        <Button
          label="PDF / file"
          icon="file"
          variant="secondary"
          size="small"
          disabled={busy}
          onPress={() => pick('files')}
        />
        <Button
          label="Photos"
          icon="photo"
          variant="secondary"
          size="small"
          disabled={busy}
          onPress={() => pick('photos')}
        />
        {Platform.OS !== 'web' && (
          <Button
            label="Camera"
            icon="camera"
            variant="secondary"
            size="small"
            disabled={busy}
            onPress={() => pick('camera')}
          />
        )}
        {busy && <ActivityIndicator color={theme.primary} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    borderRadius: 12,
    minHeight: 48,
  },
  fileName: {
    flex: 1,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
