import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { LAYERS, yarnPalette, type YarnBallProps } from '@/components/yarn-colors';

export { normalizeYarnHex, yarnPalette, type YarnAppearance } from '@/components/yarn-colors';

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
