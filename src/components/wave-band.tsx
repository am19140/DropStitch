import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

const C = Colors.light;

type WaveBandProps = {
  children: ReactNode;
  /** An illustration (usually Purl) placed over the band's right side, free to overlap the wave. */
  art?: ReactNode;
  artStyle?: StyleProp<ViewStyle>;
  /** Extra room under the content, before the wave. */
  style?: StyleProp<ViewStyle>;
};

/** The sky-blue band at the top of the main screens, ending in a soft wave into the page. */
export function WaveBand({ children, art, artStyle, style }: WaveBandProps) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <View style={[styles.band, { paddingTop: insets.top + 8 }, style]}>{children}</View>
      <Svg width="100%" height={46} viewBox="0 0 390 46" preserveAspectRatio="none" style={styles.wave}>
        <Path d="M0,0 H390 V18 C330,48 270,44 205,26 C140,8 80,10 0,34 Z" fill={C.band} />
      </Svg>
      {art ? (
        <View pointerEvents="none" style={[styles.art, artStyle]}>
          {art}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { backgroundColor: C.band, paddingHorizontal: 24 },
  wave: { marginTop: -1 },
  art: { position: 'absolute', right: 0, bottom: 0 },
});
