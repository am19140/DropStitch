import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Colors, Fonts, Spacing } from '@/constants/theme';

const C = Colors.light;

type Variant = 'primary' | 'secondary' | 'soft' | 'cocoa' | 'ghost' | 'danger';

type ButtonProps = {
  label?: string;
  icon?: IconName;
  /** Puts the icon after the label (e.g. an arrow). */
  iconAfter?: boolean;
  onPress: () => void;
  variant?: Variant;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const VARIANTS: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: C.text, fg: C.surface },
  secondary: { bg: 'transparent', fg: C.text, border: C.text },
  soft: { bg: C.sky, fg: C.text },
  cocoa: { bg: C.cocoa, fg: '#FFFFFF' },
  ghost: { bg: 'transparent', fg: C.text },
  danger: { bg: 'transparent', fg: C.danger, border: C.danger },
};

/** Pill button: cream on chocolate for the main action. */
export function Button({
  label,
  icon,
  iconAfter,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const height = { small: 44, medium: 48, large: 56 }[size];
  const fontSize = size === 'large' ? 17 : size === 'small' ? 14 : 16;
  const iconEl = icon ? <Icon name={icon} color={v.fg} size={fontSize + 4} /> : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          minHeight: height,
          minWidth: height,
          paddingHorizontal: label ? (size === 'small' ? Spacing.three : Spacing.four) : 0,
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}>
      <View style={styles.content}>
        {!iconAfter && iconEl}
        {label && (
          <Text style={[styles.label, { color: v.fg, fontSize }]}>{label}</Text>
        )}
        {iconAfter && iconEl}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.extrabold,
  },
});
