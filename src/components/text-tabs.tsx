import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type TextTabsProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Text tabs with a short strawberry underline under the active one. */
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
            style={styles.tab}>
            <Text style={[styles.label, { color: active ? Colors.light.text : Colors.light.textSecondary }]}>
              {o.label}
            </Text>
            <View style={[styles.line, active && { backgroundColor: Colors.light.primary }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 24 },
  tab: { minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 5 },
  label: { fontFamily: Fonts.semibold, fontSize: 15 },
  line: { width: 20, height: 2, borderRadius: 1 },
});
