import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
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
  const [databaseAttempt, setDatabaseAttempt] = useState(0);
  const [fontsLoaded, fontError] = useFonts({
    'SUIT-Regular': require('../assets/fonts/SUIT-Regular.ttf'),
    'SUIT-Medium': require('../assets/fonts/SUIT-Medium.ttf'),
    'SUIT-SemiBold': require('../assets/fonts/SUIT-SemiBold.ttf'),
    'SUIT-Bold': require('../assets/fonts/SUIT-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    const locked = databaseError && /Access Handle|NoModificationAllowed|locked/i.test(databaseError.message);
    if (!locked || databaseAttempt >= 2) return;
    const retry = setTimeout(() => {
      setDatabaseError(null);
      setDatabaseAttempt((attempt) => attempt + 1);
    }, 600);
    return () => clearTimeout(retry);
  }, [databaseAttempt, databaseError]);

  useEffect(() => {
    const invalidVfs = databaseError && /Invalid VFS state/i.test(databaseError.message);
    if (!invalidVfs || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const retryKey = 'beanfold-vfs-restart-at';
    const previousRestart = Number(window.sessionStorage.getItem(retryKey) ?? 0);
    if (Date.now() - previousRestart < 10_000) return;
    window.sessionStorage.setItem(retryKey, String(Date.now()));
    const restart = setTimeout(() => window.location.reload(), 700);
    return () => clearTimeout(restart);
  }, [databaseError]);

  if (!fontsLoaded && !fontError) return null;
  if (fontError) {
    return <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.cream }}><Text accessibilityRole="alert">SUIT 글꼴을 불러오지 못했어요. 앱을 다시 시작해주세요.</Text></View>;
  }
  if (databaseError) {
    const locked = /Access Handle|NoModificationAllowed|locked/i.test(databaseError.message);
    const invalidVfs = /Invalid VFS state/i.test(databaseError.message);
    const retryLabel = invalidVfs ? '페이지 다시 시작' : '다시 연결';
    const retryDatabase = () => {
      if (invalidVfs && Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.reload();
        return;
      }
      setDatabaseError(null);
      setDatabaseAttempt((attempt) => attempt + 1);
    };
    return <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: colors.cream }}><Text variant="title1" accessibilityRole="header">{locked ? '저장 공간에 다시 연결하고 있어요' : invalidVfs ? '저장 공간을 다시 시작하고 있어요' : '저장 공간을 열지 못했어요'}</Text><Text color={colors.neutral600}>{locked ? '이전 연결을 정리한 뒤 다시 시도하고 있어요. 잠시 후에도 열리지 않으면 아래 버튼을 눌러주세요.' : invalidVfs ? '임시 연결을 새로 시작하고 있어요. 자동으로 다시 열리지 않으면 아래 버튼을 눌러주세요.' : databaseError.message}</Text>{(locked || invalidVfs) ? <Pressable accessibilityRole="button" accessibilityLabel={retryLabel} onPress={retryDatabase} style={({ pressed }) => [{ alignSelf: 'flex-start', minHeight: 46, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.action }, pressed && { opacity: 0.7 }]}><Text variant="label" color={colors.white}>{retryLabel}</Text></Pressable> : null}</View>;
  }

  return (
    <SQLiteProvider key={databaseAttempt} databaseName="beanfold.db" onInit={migrateDatabase} onError={setDatabaseError}>
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
