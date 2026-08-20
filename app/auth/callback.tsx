import { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen, Text } from '@/components/ui';
import { completeSocialSignIn } from '@/services/auth';
import { colors, spacing } from '@/design-system/tokens';

export default function AuthCallbackScreen() {
  const url = Linking.useURL();
  const handledUrl = useRef<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!url || handledUrl.current === url) return;
    handledUrl.current = url;
    void completeSocialSignIn(url)
      .then(() => router.replace('/(tabs)/profile'))
      .catch((caught) => setError(caught instanceof Error ? caught.message : '로그인을 완료하지 못했어요.'));
  }, [url]);

  return <Screen showNavigation={false} scroll={false} contentContainerStyle={styles.screen}>
    <View style={styles.copy}><Text variant="title2" accessibilityRole="header">{error ? '로그인을 완료하지 못했어요' : '계정을 연결하고 있어요'}</Text><Text color={colors.neutral600}>{error || '잠시만 기다려주세요.'}</Text></View>
    {error ? <Button label="로그인 화면으로 돌아가기" onPress={() => router.replace('/auth/' as never)} /> : null}
  </Screen>;
}

const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', gap: spacing.default }, copy: { gap: spacing.compact } });
