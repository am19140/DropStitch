import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  actionLabel: string;
  onAction: () => void;
  actionDisabled?: boolean;
  children: ReactNode;
};

/** A slide-up modal with Cancel and a primary action, used for small editors. */
export function Sheet({
  visible,
  title,
  onClose,
  actionLabel,
  onAction,
  actionDisabled,
  children,
}: SheetProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.header, { borderColor: theme.border }]}>
            <Button label="Cancel" variant="ghost" size="small" onPress={onClose} />
            <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
              {title}
            </ThemedText>
            <Button
              label={actionLabel}
              size="small"
              disabled={actionDisabled}
              onPress={onAction}
            />
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
