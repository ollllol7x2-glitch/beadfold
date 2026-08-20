import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ConfirmDialog } from '@/components/confirmDialog';
import { useAuth } from '@/components/auth';
import { useFeedback } from '@/components/feedback';
import { Icon, Screen, TaskHeader, Text } from '@/components/ui';
import { signOutFromThisDevice, withdrawAccount } from '@/services/auth';
import { colors, radius, spacing } from '@/design-system/tokens';

export default function AccountScreen() {
  const { user, isMember } = useAuth();
  const { showFeedback } = useFeedback();
  const [confirmWithdrawal, setConfirmWithdrawal] = useState(false);
  const [busy, setBusy] = useState<'signout' | 'withdraw' | null>(null);

  const signOut = async () => {
    setBusy('signout');
    try { await signOutFromThisDevice(); showFeedback('이 기기에서 로그아웃했어요.'); router.replace('/(tabs)/profile'); }
    catch (error) { showFeedback(error instanceof Error ? error.message : '로그아웃하지 못했어요.'); }
    finally { setBusy(null); }
  };
  const withdraw = async () => {
    setBusy('withdraw');
    try { await withdrawAccount(); setConfirmWithdrawal(false); showFeedback('회원 탈퇴가 완료됐어요.'); router.replace('/(tabs)/profile'); }
    catch (error) { showFeedback(error instanceof Error ? error.message : '회원 탈퇴를 완료하지 못했어요.'); }
    finally { setBusy(null); }
  };

  if (!isMember) {
    return <Screen header={<TaskHeader title="계정 관리" onClose={() => router.back()} />} contentContainerStyle={styles.screen}><View style={styles.empty}><Icon name="person.crop.circle" size={30} color={colors.cocoa} /><Text variant="title2">로그인이 필요해요</Text><Text color={colors.neutral600}>계정을 연결하면 사진을 안전하게 보관할 수 있어요.</Text><Pressable onPress={() => router.replace('/auth')} style={styles.primary}><Text variant="label" color={colors.white}>Google로 로그인</Text></Pressable></View></Screen>;
  }

  return <Screen header={<TaskHeader title="계정 관리" onClose={() => router.back()} />} contentContainerStyle={styles.screen}>
    <View style={styles.accountCard}><View style={styles.avatar}><Text variant="title2">G</Text></View><View style={styles.copy}><Text variant="title3">Google 계정으로 로그인됨</Text><Text color={colors.neutral600}>{user?.email ?? '연결된 계정'}</Text></View></View>
    <Section title="계정"><Row icon="person.crop.circle" title="로그아웃" body="이 기기에서만 로그아웃해요" onPress={() => void signOut()} disabled={busy != null} /></Section>
    <Section title="문서"><Row icon="book.pages.fill" title="이용약관" onPress={() => router.push('/legal?document=terms' as never)} /><Row icon="hand.tap.fill" title="개인정보처리방침" onPress={() => router.push('/legal?document=privacy' as never)} /></Section>
    <Section title="계정 삭제"><Row icon="trash" title="회원 탈퇴" body="클라우드 사진과 계정을 삭제해요" destructive onPress={() => setConfirmWithdrawal(true)} disabled={busy != null} /></Section>
    <ConfirmDialog visible={confirmWithdrawal} title="회원 탈퇴를 진행할까요?" body="클라우드에 보관한 봉투 사진과 로그인 계정은 삭제되며 복구할 수 없어요. 이 기기의 원두와 커피 기록은 그대로 남아요." confirmLabel={busy === 'withdraw' ? '처리 중...' : '탈퇴하기'} destructive onCancel={() => setConfirmWithdrawal(false)} onConfirm={() => void withdraw()} />
  </Screen>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.section}><Text variant="title3">{title}</Text><View style={styles.rows}>{children}</View></View>; }
function Row({ icon, title, body, destructive, disabled, onPress }: { icon: Parameters<typeof Icon>[0]['name']; title: string; body?: string; destructive?: boolean; disabled?: boolean; onPress: () => void }) { const color = destructive ? '#BF3D43' : colors.espresso; return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}><View style={[styles.rowIcon, destructive && styles.dangerIcon]}><Icon name={icon} size={20} color={color} /></View><View style={styles.copy}><Text variant="label" color={color}>{title}</Text>{body ? <Text variant="caption" color={colors.neutral600}>{body}</Text> : null}</View><Icon name="chevron.right" size={16} color={colors.neutral400} /></Pressable>; }

const styles = StyleSheet.create({ screen: { gap: spacing.section }, accountCard: { minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: spacing.default, padding: spacing.default, borderRadius: radius.large, backgroundColor: colors.warmBeige }, avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, copy: { flex: 1, gap: 3 }, section: { gap: spacing.compact }, rows: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200, borderRadius: radius.large, backgroundColor: colors.white }, row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingHorizontal: spacing.small, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.neutral200 }, rowIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamDeep }, dangerIcon: { backgroundColor: '#FBEAEA' }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.default, paddingHorizontal: spacing.default }, primary: { minHeight: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderRadius: radius.medium, backgroundColor: colors.berry }, pressed: { opacity: 0.7 }, disabled: { opacity: 0.55 } });
