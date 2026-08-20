import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { migrateDatabase } from '@/database/schema';
import { colors } from '@/design-system/tokens';
import { Text } from '@/components/ui';
import { setupNotificationHandler } from '@/services/notificationHandler';
import { FeedbackProvider } from '@/components/feedback';
import { AuthProvider } from '@/components/auth';

void SplashScreen.preventAutoHideAsync();
setupNotificationHandler();

export default function RootLayout() {
  const [databaseError, setDatabaseError] = useState<Error | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    'SUIT-Regular': require('../assets/fonts/SUIT-Regular.ttf'),
    'SUIT-Medium': require('../assets/fonts/SUIT-Medium.ttf'),
    'SUIT-SemiBold': require('../assets/fonts/SUIT-SemiBold.ttf'),
    'SUIT-Bold': require('../assets/fonts/SUIT-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;
  if (fontError) {
    return <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.cream }}><Text accessibilityRole="alert">SUIT 글꼴을 불러오지 못했어요. 앱을 다시 시작해주세요.</Text></View>;
  }
  if (databaseError) {
    const locked = /Access Handle|NoModificationAllowed|locked/i.test(databaseError.message);
    return <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: colors.cream }}><Text variant="title1" accessibilityRole="header">{locked ? 'BEANFOLD가 다른 탭에서 열려 있어요' : '저장 공간을 열지 못했어요'}</Text><Text color={colors.neutral600}>{locked ? '기록을 안전하게 지키기 위해 한 번에 한 탭에서 사용해주세요. 다른 탭을 닫고 이 페이지를 새로고침하세요.' : databaseError.message}</Text></View>;
  }

  return (
    <SQLiteProvider databaseName="beanfold.db" onInit={migrateDatabase} onError={setDatabaseError}>
      <AuthProvider>
        <FeedbackProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream }, animation: 'none' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" options={{ presentation: 'modal', animation: 'none' }} />
            <Stack.Screen name="account" options={{ animation: 'none' }} />
            <Stack.Screen name="legal" options={{ animation: 'none' }} />
            <Stack.Screen name="add-bean" options={{ presentation: 'modal', animation: 'none' }} />
            <Stack.Screen name="record-cafe" options={{ presentation: 'modal', animation: 'none' }} />
            <Stack.Screen name="record-cup/[cupId]" options={{ presentation: 'modal', animation: 'none' }} />
          </Stack>
        </FeedbackProvider>
      </AuthProvider>
    </SQLiteProvider>
  );
}
