import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Colors, Fonts } from '@/constants/theme';

const C = Colors.light;

/** Warm cream for type on cobalt. */
const CREAM = '#F6F1E3';

/**
 * The one bold block on a screen: cobalt, with cream type and a banana button. It's for the thing you
 * came to the screen to do, so each screen has at most one. The whole card is the button.
 */
export function CobaltCard({
  onPress,
  accessibilityLabel,
  style,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
      {children}
    </Pressable>
  );
}

/** "Row 15 of 44 … 34%" and a banana bar. Without a fraction, just the label. */
export function CobaltProgress({ label, fraction }: { label: string; fraction?: number }) {
  return (
    <>
      <View style={styles.progressTop}>
        <Text style={styles.progressLabel}>{label}</Text>
        {fraction !== undefined && <Text style={cobaltText.muted}>{Math.round(fraction * 100)}%</Text>}
      </View>
      {fraction !== undefined && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%` }]} />
        </View>
      )}
    </>
  );
}

/** The card's button label: a banana pill. The card itself takes the press. */
export function CobaltButton({ label, icon, iconAfter }: { label: string; icon?: IconName; iconAfter?: boolean }) {
  const iconEl = icon ? <Icon name={icon} size={18} color={C.text} strokeWidth={2.4} /> : null;
  return (
    <View style={styles.go}>
      {!iconAfter && iconEl}
      <Text style={styles.goText}>{label}</Text>
      {iconAfter && iconEl}
    </View>
  );
}

/** Type on cobalt: small cream lines, and a white title. */
export const cobaltText = StyleSheet.create({
  muted: { fontFamily: Fonts.semibold, fontSize: 14, color: 'rgba(246, 241, 227, 0.8)' },
  title: { marginTop: 3, fontFamily: Fonts.display, fontSize: 26, lineHeight: 31, color: '#FFFFFF' },
  text: { fontFamily: Fonts.bold, fontSize: 15, lineHeight: 20, color: CREAM },
});

const styles = StyleSheet.create({
  card: { backgroundColor: C.primary, borderWidth: 1.5, borderColor: C.primary, borderRadius: 22, padding: 18 },
  progressTop: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontFamily: Fonts.extrabold, fontSize: 15, color: CREAM },
  track: { marginTop: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.22)', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.beige },
  go: { height: 44, paddingHorizontal: 18, borderRadius: 999, backgroundColor: C.beige, flexDirection: 'row', alignItems: 'center', gap: 8 },
  goText: { fontFamily: Fonts.extrabold, fontSize: 15, color: C.text },
});
