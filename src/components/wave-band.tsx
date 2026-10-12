import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

const C = Colors.light;

/** How far an illustration hangs down past the wave, so Mrs Purl stands a little in front of it. */
const OVERHANG = 28;

type WaveBandProps = {
  children: ReactNode;
  /** An illustration (usually Mrs Purl) on the band's right side, standing a little past the wave. */
  art?: ReactNode;
  artStyle?: StyleProp<ViewStyle>;
  /** Extra room under the content, before the wave. */
  style?: StyleProp<ViewStyle>;
};

/** The sky-blue band at the top of the main screens, ending in a soft wave into the page. */
export function WaveBand({ children, art, artStyle, style }: WaveBandProps) {
  const insets = useSafeAreaInsets();
  return (
    // Drawn above what follows, so nothing below covers the illustration's feet.
    <View style={styles.root}>
      <View style={[styles.band, { paddingTop: insets.top + 8 }, style]}>{children}</View>
      <Svg width="100%" height={46} viewBox="0 0 390 46" preserveAspectRatio="none" style={styles.wave}>
        <Path d="M0,0 H390 V18 C330,48 270,44 205,26 C140,8 80,10 0,34 Z" fill={C.band} />
      </Svg>
      {art ? (
        <>
          {/* Room on the page for the part that hangs past the wave. */}
          <View style={{ height: OVERHANG }} />
          <View pointerEvents="none" style={[styles.art, artStyle]}>
            {art}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 1 },
  band: { backgroundColor: C.band, paddingHorizontal: 24 },
  wave: { marginTop: -1 },
  art: { position: 'absolute', right: 0, bottom: 0 },
});
