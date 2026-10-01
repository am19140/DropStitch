import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function ProgressBar({ fraction, height = 6 }: { fraction: number; height?: number }) {
  const theme = useTheme();
  const percent = Math.round(Math.max(0, Math.min(1, fraction)) * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.track, { height, backgroundColor: theme.backgroundSelected }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${percent}%`,
            backgroundColor: percent === 100 ? theme.success : theme.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
