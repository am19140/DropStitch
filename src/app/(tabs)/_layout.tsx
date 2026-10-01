import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar state={props.state} navigation={props.navigation} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
      <Tabs.Screen name="yarn" options={{ title: 'Yarn' }} />
    </Tabs>
  );
}
