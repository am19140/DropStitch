import { Asset } from 'expo-asset';
import { memo, type CSSProperties } from 'react';
import { View } from 'react-native';

import { LAYERS, yarnPalette, type YarnBallProps } from '@/components/yarn-colors';

export { normalizeYarnHex, yarnPalette, type YarnAppearance } from '@/components/yarn-colors';

const uri = (module: number) => Asset.fromModule(module).uri;

/**
 * The yarn ball in the browser. The phone version tints images; in the browser that's done with an SVG
 * filter that Safari on iPhone doesn't repaint when the colour changes. Here each paint layer is a
 * block of colour cut to the painting's shape with a CSS mask, which repaints straight away.
 */
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
  const layer = (module: number, fill: string, opacity = 1): CSSProperties => {
    const mask = `url(${uri(module)}) center / contain no-repeat`;
    return { position: 'absolute', inset: 0, backgroundColor: fill, opacity, WebkitMask: mask, mask };
  };
  return (
    <View
      style={[style, { width: size, height: size }]}
      pointerEvents="none"
      accessible={!!accessibilityLabel}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}>
      <div style={layer(images.base, palette.base)} />
      <div style={layer(images.shadow, palette.shadow, strength)} />
      <div style={layer(images.highlight, palette.highlight, strength)} />
    </View>
  );
});
