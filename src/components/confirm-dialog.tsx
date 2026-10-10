import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { CardShadow, Colors, Fonts } from '@/constants/theme';

const C = Colors.light;

const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

type Question = { title: string; message: string; confirmLabel: string };

/** The system's yes/no alert, for iOS and Android. */
function nativeConfirm({ title, message, confirmLabel }: Question) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

/**
 * Asks a yes/no question before something can't be undone. Phones get the system alert. In the
 * browser the app draws its own dialog: Safari can skip window.confirm without showing it (it then
 * answers "no"), so deleting silently did nothing. Render `dialog` last in the screen's root view.
 */
export function useConfirm() {
  const [question, setQuestion] = useState<(Question & { answer: (ok: boolean) => void }) | null>(null);

  const ask = useCallback((q: Question) => {
    if (Platform.OS !== 'web') return nativeConfirm(q);
    return new Promise<boolean>((resolve) => setQuestion({ ...q, answer: resolve }));
  }, []);

  const answer = (ok: boolean) => {
    question?.answer(ok);
    setQuestion(null);
  };

  const dialog = question ? (
    <View style={styles.layer}>
      <Pressable accessibilityLabel="Cancel" onPress={() => answer(false)} style={styles.backdrop} />
      <View accessibilityRole="alert" style={[styles.card, CardShadow]}>
        <Text style={styles.title}>{question.title}</Text>
        <Text style={styles.message}>{question.message}</Text>
        <View style={styles.buttons}>
          <Button label="Cancel" variant="secondary" onPress={() => answer(false)} style={styles.button} />
          <Button label={question.confirmLabel} variant="danger" onPress={() => answer(true)} style={styles.button} />
        </View>
      </View>
    </View>
  ) : null;

  return { ask, dialog };
}

const styles = StyleSheet.create({
  layer: { ...FILL, zIndex: 10, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backdrop: { ...FILL, backgroundColor: 'rgba(28, 26, 23, 0.4)' },
  card: { width: '100%', maxWidth: 360, padding: 24, borderRadius: 24, backgroundColor: C.surface, gap: 10 },
  title: { fontFamily: Fonts.display, fontSize: 26, lineHeight: 30, color: C.text },
  message: { fontFamily: Fonts.medium, fontSize: 16, lineHeight: 23, color: C.textSecondary },
  buttons: { marginTop: 10, flexDirection: 'row', gap: 10 },
  button: { flex: 1 },
});
