import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Colors, Fonts } from '@/constants/theme';
import { initials, useProjects } from '@/store/projects';

const C = Colors.light;
/** Soft grey for the tabs you're not on. */
const IDLE = '#A19BAA';

const ICON_FOR: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  projects: { icon: 'notes', label: 'Projects' },
  yarn: { icon: 'yarn', label: 'Yarn' },
};

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void; emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } };
};

/** Bottom menu: Home, Projects, a round + for a new project, Yarn, and You. */
export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const letters = useProjects((s) => initials(s.knitterName));

  const tab = (index: number) => {
    const route = state.routes[index];
    if (!route) return null;
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
        <Icon name={item.icon} size={26} strokeWidth={focused ? 2.3 : 1.9} color={focused ? C.text : IDLE} />
        <Text style={[styles.label, focused && styles.labelOn]}>{item.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]}>
      {tab(0)}
      {tab(1)}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start a new project"
        onPress={() => router.push('/new')}
        style={({ pressed }) => [styles.fab, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
        <Icon name="add" size={28} strokeWidth={2.6} color={C.surface} />
      </Pressable>
      {tab(2)}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="You"
        onPress={() => router.push('/account')}
        style={({ pressed }) => [styles.item, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
        <View style={styles.avatar}>
          {letters ? <Text style={styles.avatarText}>{letters}</Text> : <Icon name="user" size={16} color={C.text} strokeWidth={2} />}
        </View>
        <Text style={styles.label}>You</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 10,
    paddingHorizontal: 8,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: '#EFF1F8',
  },
  item: { width: 64, minHeight: 50, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontFamily: Fonts.bold, fontSize: 12, color: IDLE },
  labelOn: { color: C.text, fontFamily: Fonts.extrabold },
  // A dark circle sitting up out of the bar, with a ring of the bar's colour that breaks its top line.
  fab: {
    width: 70,
    height: 70,
    marginTop: -35,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: C.surface,
    backgroundColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F2F4FD', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Fonts.extrabold, fontSize: 11.5, color: C.text },
});
