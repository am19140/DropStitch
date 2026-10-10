import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      // Switching tabs cross-fades instead of jumping.
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: 180 } },
      }}
      tabBar={(props) => <TabBar state={props.state} navigation={props.navigation} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
      <Tabs.Screen name="yarn" options={{ title: 'Yarn' }} />
    </Tabs>
  );
}
