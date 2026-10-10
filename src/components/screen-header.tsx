import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Colors } from '@/constants/theme';

const C = Colors.light;

type HeaderButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** A cream circle behind the icon, for buttons on the sky-blue band or on cards. */
  round?: boolean;
};

export function HeaderButton({ icon, label, onPress, round }: HeaderButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}>
      <View style={round && styles.round}>
        <Icon name={icon} size={round ? 20 : 24} strokeWidth={round ? 2.2 : 1.6} color={C.text} />
      </View>
    </Pressable>
  );
}

/** Icon buttons in the top corners. `back` shows a back arrow (or a close cross for sheets). */
export function ScreenHeader({ back, right, round }: { back?: 'back' | 'close'; right?: ReactNode; round?: boolean }) {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={styles.row}>
      {back ? (
        <HeaderButton
          icon={back === 'close' ? 'close' : 'chevronLeft'}
          label={back === 'close' ? 'Close' : 'Back'}
          onPress={goBack}
          round={round}
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
  right: { flexDirection: 'row', alignItems: 'center' },
  button: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
