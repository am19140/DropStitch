import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'display'
    | 'title'
    | 'subtitle'
    | 'section'
    | 'small'
    | 'smallBold'
    | 'eyebrow'
    | 'note'
    | 'link'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24 },
  /** Fraunces Black for big titles. */
  display: { fontFamily: Fonts.display, fontSize: 46, lineHeight: 48, letterSpacing: -1 },
  title: { fontFamily: Fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.4 },
  subtitle: { fontFamily: Fonts.display, fontSize: 26, lineHeight: 32 },
  section: { fontFamily: Fonts.bold, fontSize: 19, lineHeight: 26 },
  small: { fontFamily: Fonts.medium, fontSize: 14, lineHeight: 20 },
  smallBold: { fontFamily: Fonts.bold, fontSize: 14, lineHeight: 20 },
  eyebrow: { fontFamily: Fonts.bold, fontSize: 11, lineHeight: 16, letterSpacing: 2 },
  /** Caveat, for small handwritten notes. */
  note: { fontFamily: Fonts.note, fontSize: 25, lineHeight: 30 },
  link: { fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 22 },
  code: { fontFamily: Fonts.mono, fontSize: 12 },
});
