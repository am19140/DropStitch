import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

const C = Colors.light;

type TextTabsProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** A pill-shaped switch between views; the active one is dark. */
export function TextTabs<T extends string>({ options, value, onChange }: TextTabsProps<T>) {
  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.tab, active && styles.tabOn]}>
            <Text style={[styles.label, active && styles.labelOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 2,
    padding: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.cardLine,
    backgroundColor: C.card,
  },
  tab: { minHeight: 36, paddingHorizontal: 16, borderRadius: 999, justifyContent: 'center' },
  tabOn: { backgroundColor: C.text },
  label: { fontFamily: Fonts.extrabold, fontSize: 14, color: C.textSecondary },
  labelOn: { color: C.surface },
});
