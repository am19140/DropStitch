import { memo } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** How the yarn looks: thin and fuzzy, the original painting, or thick and chunky. Not a yarn weight. */
export type YarnAppearance = 'fine' | 'smooth' | 'chunky';

/** Accepts #RGB / RGB / #RRGGBB / RRGGBB. Anything else falls back to sky blue. */
export function normalizeYarnHex(value: string): string {
  const h = typeof value === 'string' ? value.trim().replace(/^#/, '') : '';
  if (/^[0-9a-f]{3}$/i.test(h)) return `#${h.split('').map((c) => c + c).join('').toUpperCase()}`;
  if (/^[0-9a-f]{6}$/i.test(h)) return `#${h.toUpperCase()}`;
  return '#80ABD7';
}

/** The yarn's colour, plus the darker and lighter tints painted over it for shading. */
export function yarnPalette(value: string) {
  const base = normalizeYarnHex(value);
  const rgb = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16));
  const hex = (values: number[]) => `#${values.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  return { base, shadow: hex(rgb.map((v) => v * 0.48)), highlight: hex(rgb.map((v) => v + (255 - v) * 0.38)) };
}

// Three aligned paint masks per look; only their tint changes, so any colour works.
const LAYERS = {
  fine: {
    base: require('@/assets/images/yarn/fine-base.png'),
    shadow: require('@/assets/images/yarn/fine-shadow.png'),
    highlight: require('@/assets/images/yarn/fine-highlight.png'),
  },
  smooth: {
    base: require('@/assets/images/yarn/smooth-base.png'),
    shadow: require('@/assets/images/yarn/smooth-shadow.png'),
    highlight: require('@/assets/images/yarn/smooth-highlight.png'),
  },
  chunky: {
    base: require('@/assets/images/yarn/chunky-base.png'),
    shadow: require('@/assets/images/yarn/chunky-shadow.png'),
    highlight: require('@/assets/images/yarn/chunky-highlight.png'),
  },
};

type YarnBallProps = {
  color: string;
  appearance?: YarnAppearance;
  /** Square footprint; the painting has a little transparent room around it. */
  size?: number;
  /** 0 = flat silhouette, 1 = full painted shading. */
  texture?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** A painted yarn ball in any colour, matching Purl's gouache style. */
export const YarnBall = memo(function YarnBall({
  color,
  appearance = 'smooth',
  size = 120,
  texture = 1,
  style,
  accessibilityLabel,
}: YarnBallProps) {
  const palette = yarnPalette(color);
  const images = LAYERS[appearance] ?? LAYERS.smooth;
  const strength = Number.isFinite(texture) ? Math.max(0, Math.min(1, texture)) : 1;
  return (
    <View
      style={[style, { width: size, height: size }]}
      pointerEvents="none"
      accessible={!!accessibilityLabel}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}>
      <Image source={images.base} resizeMode="contain" fadeDuration={0} style={[styles.layer, { tintColor: palette.base }]} />
      <Image
        source={images.shadow}
        resizeMode="contain"
        fadeDuration={0}
        style={[styles.layer, { tintColor: palette.shadow, opacity: strength }]}
      />
      <Image
        source={images.highlight}
        resizeMode="contain"
        fadeDuration={0}
        style={[styles.layer, { tintColor: palette.highlight, opacity: strength }]}
      />
    </View>
  );
});

const styles = StyleSheet.create({ layer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } });
