import { Tabs } from 'expo-router';
import { colors } from '@/design-system/tokens';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { display: 'none' },
      sceneStyle: { backgroundColor: colors.cream },
      animation: 'none',
    }}>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="journal" options={{ title: '기록' }} />
      <Tabs.Screen name="add" options={{ title: '추가' }} />
      <Tabs.Screen name="collection" options={{ title: '보관함' }} />
      <Tabs.Screen name="profile" options={{ title: '프로필' }} />
    </Tabs>
  );
}
