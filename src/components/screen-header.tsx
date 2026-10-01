import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Colors } from '@/constants/theme';

type HeaderButtonProps = { icon: IconName; label: string; onPress: () => void };

export function HeaderButton({ icon, label, onPress }: HeaderButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}>
      <Icon name={icon} size={24} strokeWidth={1.6} color={Colors.light.text} />
    </Pressable>
  );
}

/** Thin icon buttons in the top corners. `back` shows a back arrow (or a close cross for sheets). */
export function ScreenHeader({ back, right }: { back?: 'back' | 'close'; right?: ReactNode }) {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={styles.row}>
      {back ? (
        <HeaderButton
          icon={back === 'close' ? 'close' : 'chevronLeft'}
          label={back === 'close' ? 'Close' : 'Back'}
          onPress={goBack}
        />
      ) : (
        <View />
      )}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -10,
  },
  right: { flexDirection: 'row' },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
