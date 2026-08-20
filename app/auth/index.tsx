import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { BrandMark, goBackOrReplace, Icon, Screen, TaskHeader, Text } from '@/components/ui';
import { useFeedback } from '@/components/feedback';
import { signOutFromThisDevice, startSocialSignIn, type SocialAuthProvider } from '@/services/auth';
import { colors, radius, shadows, spacing } from '@/design-system/tokens';
import { useAuth } from '@/components/auth';

export default function SignInScreen() {
  const { isAnonymous, isMember } = useAuth();
  const { showFeedback } = useFeedback();
  const [loadingProvider, setLoadingProvider] = useState<SocialAuthProvider | null>(null);

  const signIn = async (provider: SocialAuthProvider) => {
    setLoadingProvider(provider);
    try {
      await startSocialSignIn(provider);
    } catch (caught) {
      showFeedback(caught instanceof Error ? caught.message : '로그인을 시작하지 못했어요.');
    } finally {
      setLoadingProvider(null);
    }
  };
  const signOut = async () => {
    setLoadingProvider('google');
    try {
      await signOutFromThisDevice();
      showFeedback('이 기기에서 로그아웃했어요.');
      router.replace('/(tabs)/profile');
    } catch (caught) {
      showFeedback(caught instanceof Error ? caught.message : '로그아웃하지 못했어요.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <Screen showNavigation={false} header={<TaskHeader title="계정 연결" onClose={() => goBackOrReplace('/(tabs)/profile')} />} contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.mark}><BrandMark size={38} /></View>
        <Text variant="title1" accessibilityRole="header">기록을 안전하게{`\n`}이어가세요</Text>
        <Text color={colors.neutral600}>{isMember ? '연결할 로그인 방식을 추가할 수 있어요.' : isAnonymous ? '현재 기기의 봉투 사진을 계정에 연결할 수 있어요.' : '계정을 연결하면 사진을 안전하게 보관할 수 있어요.'}</Text>
      </View>
      <View style={styles.actions}>
        <SocialButton loading={loadingProvider === 'google'} onPress={() => void signIn('google')} />
      </View>
      {isMember ? <Pressable accessibilityRole="button" accessibilityLabel="이 기기에서 로그아웃" onPress={() => void signOut()} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}><Text variant="caption" color={colors.neutral600}>이 기기에서 로그아웃</Text></Pressable> : null}
      <View style={styles.note}><Icon name="info.circle" size={16} color={colors.neutral600} /><Text variant="caption" color={colors.neutral600}>로그인해도 이 기기의 기록은 그대로 유지돼요.</Text></View>
    </Screen>
  );
}

function SocialButton({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  const label = 'Google로 계속하기';
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ busy: loading }} disabled={loading} onPress={onPress} style={({ pressed }) => [styles.socialButton, styles.googleButton, pressed && styles.pressed, loading && styles.disabled]}><View style={[styles.socialMark, styles.googleMark]}><Text variant="label" color={colors.charcoal}>G</Text></View><Text variant="label" color={colors.charcoal}>{loading ? '로그인 페이지를 여는 중...' : label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: spacing.section, paddingBottom: 56 },
  hero: { alignItems: 'center', gap: spacing.default, paddingHorizontal: spacing.default },
  mark: { width: 76, height: 76, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamDeep },
  actions: { gap: spacing.compact },
  socialButton: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radius.medium, paddingHorizontal: spacing.default },
  googleButton: { borderWidth: 1, borderColor: colors.neutral200, backgroundColor: colors.white, ...shadows.soft },
  socialMark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  googleMark: { backgroundColor: colors.creamDeep },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: spacing.compact },
  signOut: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.small },
  pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
});
