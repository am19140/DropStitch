import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & { label?: string; hint?: string };

export function TextField({ label, hint, style, multiline, ...rest }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      {label && (
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {label.toUpperCase()}
        </ThemedText>
      )}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: theme.text,
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
          style,
        ]}
        {...rest}
      />
      {hint && (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    fontFamily: Fonts.regular,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  multiline: {
    minHeight: 120,
    paddingTop: Spacing.three,
  },
});
