import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Colors } from '@/constants/theme';

const C = Colors.light;

const ICON_FOR: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  projects: { icon: 'layers', label: 'Projects' },
  yarn: { icon: 'yarn', label: 'Yarn' },
};

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void; emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } };
};

/** Bottom menu: outline icons, no labels; the active one is strawberry with a matcha dot. */
export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const item = ICON_FOR[route.name] ?? { icon: 'home', label: route.name };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={({ pressed }) => [styles.item, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
            <Icon name={item.icon} size={26} strokeWidth={1.6} color={focused ? C.primary : C.text} />
            <View style={[styles.dot, focused && { backgroundColor: C.matcha }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 40,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  item: { width: 56, height: 52, alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
