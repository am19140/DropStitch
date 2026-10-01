import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { HtmlView } from '@/components/html-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { readPatternFile } from '@/lib/pattern-files';
import { buildViewerHtml, type ViewerMessage } from '@/lib/viewer-html';
import { useProjects, type Project } from '@/store/projects';

export function PatternViewer({ project }: { project: Project }) {
  const router = useRouter();
  const theme = useTheme();
  const scheme = useColorScheme();
  const setViewer = useProjects((s) => s.setViewer);
  // Rebuild the page only when the files (or light/dark mode) change. Marker and scroll
  // updates are saved without touching the page, so it doesn't reload while knitting.
  const projectId = project.id;
  const buildKey = [projectId, scheme, ...project.files.map((f) => f.id)].join('|');
  const [page, setPage] = useState<{ key: string; html?: string; failed?: boolean } | null>(null);
  const current = page?.key === buildKey ? page : null;

  useEffect(() => {
    let cancelled = false;
    const latest = useProjects.getState().projects.find((p) => p.id === projectId);
    if (!latest || latest.files.length === 0) return;

    Promise.all(
      latest.files.map(async (file) => ({
        kind: file.kind,
        mimeType: file.mimeType,
        base64: await readPatternFile(file),
      }))
    )
      .then((files) => {
        if (cancelled) return;
        setPage({
          key: buildKey,
          html: buildViewerHtml(
            files,
            {
              background: theme.background,
              text: theme.text,
              textSecondary: theme.textSecondary,
              primary: theme.matcha,
            },
            latest.viewer ?? {}
          ),
        });
      })
      .catch(() => !cancelled && setPage({ key: buildKey, failed: true }));

    return () => {
      cancelled = true;
    };
    // `buildKey` covers the project, files and colour scheme (which `theme` follows).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey]);

  const onMessage = (data: string) => {
    let message: ViewerMessage;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (message.type === 'marker') setViewer(projectId, { markerY: message.y });
    else if (message.type === 'scroll') setViewer(projectId, { scrollY: message.y });
  };

  if (project.files.length === 0) {
    return (
      <View style={styles.center}>
        <ThemedText style={styles.emoji}>📄</ThemedText>
        <ThemedText type="smallBold">No pattern file yet</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Add a PDF, a screenshot or a photo of your paper pattern to read it here while you
          count.
        </ThemedText>
        <Button
          label="Add pattern file"
          icon="add"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/project/[id]/edit', params: { id: projectId } })
          }
        />
      </View>
    );
  }

  if (current?.failed) {
    return (
      <View style={styles.center}>
        <ThemedText type="smallBold">Couldn’t open the pattern file</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          It may have been removed. Try adding it again from Edit.
        </ThemedText>
      </View>
    );
  }

  if (!current?.html) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return <HtmlView html={current.html} onMessage={onMessage} backgroundColor={theme.background} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 60,
  },
});
