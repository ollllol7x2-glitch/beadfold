import { useCallback, useState } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Icon, PageHeader, Screen, Text, type SymbolName } from '@/components/ui';
import { getSetting, setSetting } from '@/database/repository';
import { colors, spacing } from '@/design-system/tokens';
import { requestTasteReminderPermission } from '@/services/notifications';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [haptics, setHaptics] = useState(true); const [sound, setSound] = useState(false); const [reduceMotion, setReduceMotion] = useState(false);
  const [status, setStatus] = useState('');
  useFocusEffect(useCallback(() => { let active = true; void Promise.all([getSetting(db, 'haptics', 'true'), getSetting(db, 'sound', 'false'), getSetting(db, 'reduce_motion', 'false')]).then(([h, s, r]) => { if (active) { setHaptics(h === 'true'); setSound(s === 'true'); setReduceMotion(r === 'true'); } }); return () => { active = false; }; }, [db]));
  const update = async (key: string, value: boolean, setter: (value: boolean) => void) => { setter(value); await setSetting(db, key, String(value)); };
  const notifications = async () => { const granted = await requestTasteReminderPermission(); await setSetting(db, 'notification_reminders', String(granted)); setStatus(granted ? '브루잉이 끝난 뒤 맛 기록을 잊지 않도록 알려드릴게요.' : '알림을 켜지 않았어요. 필요할 때 다시 선택할 수 있어요.'); };
  const storageCopy = Platform.OS === 'web' ? '기록은 이 브라우저에 저장돼요. 브라우저 데이터를 지우면 함께 사라질 수 있어요.' : '기록은 이 휴대폰에 저장돼요. 앱을 지우면 함께 사라질 수 있어요.';
  return <Screen header={<PageHeader title="설정" backLabel="프로필" backHref="/(tabs)/profile" />} contentContainerStyle={styles.screen}>
    {status ? <Text accessibilityRole="alert" color={colors.neutral800}>{status}</Text> : null}
    <View style={styles.group}><Setting icon="hand.tap.fill" label="단계 알림 진동" body="다음 단계가 되면 짧게 알려줘요" value={haptics} onChange={(value) => void update('haptics', value, setHaptics)} /><Setting icon="speaker.wave.2.fill" label="알림 소리" body="맛 기록 알림에 소리를 사용해요" value={sound} onChange={(value) => void update('sound', value, setSound)} /><Setting icon="figure.walk.motion" label="화면 움직임 줄이기" body="화면 전환과 장식 움직임을 줄여요" value={reduceMotion} onChange={(value) => void update('reduce_motion', value, setReduceMotion)} /></View>
    <Card><Text variant="title3">표시 방식</Text><InfoRow label="단위" value="g, ml, ℃" /><InfoRow label="언어" value="한국어" /><Text variant="caption" color={colors.neutral600}>다른 단위와 언어는 전체 화면에 일관되게 적용할 수 있을 때 제공할게요.</Text></Card>
    <Card tone="tinted"><View style={styles.cardTitle}><Icon name="bell.badge.fill" size={23} /><Text variant="title3">맛 기록 알림</Text></View><Text color={colors.neutral800}>브루잉을 마친 뒤 맛이 선명할 때 한 번 알려드려요.</Text><Button label={Platform.OS === 'web' ? '모바일 앱에서 사용 가능' : '알림 켜기'} variant="secondary" disabled={Platform.OS === 'web'} onPress={() => void notifications()} /></Card>
    <Card><View style={styles.cardTitle}><Icon name="iphone" size={23} /><Text variant="title3">저장 위치</Text></View><Text color={colors.neutral800}>{storageCopy}</Text></Card>
    <Card><Text variant="title3">데이터와 백업</Text><Text color={colors.neutral800}>현재 기록은 이 기기에만 저장됩니다. 내보내기와 복원 기능은 준비 중이에요.</Text><Button label="백업 기능 준비 중" variant="secondary" disabled /></Card>
  </Screen>;
}
function Setting({ icon, label, body, value, onChange }: { icon: SymbolName; label: string; body: string; value: boolean; onChange: (value: boolean) => void }) { return <View style={styles.setting}><View style={styles.settingIcon}><Icon name={icon} size={22} /></View><View style={styles.copy}><Text variant="title3">{label}</Text><Text color={colors.neutral800}>{body}</Text></View><Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ false: colors.neutral400, true: colors.espresso }} thumbColor={colors.cream} /></View>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <View style={styles.infoRow}><Text color={colors.neutral800}>{label}</Text><Text variant="label">{value}</Text></View>; }
const styles = StyleSheet.create({ screen: { gap: spacing.section }, group: { backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden' }, setting: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small }, settingIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 2 }, cardTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact }, infoRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.small, borderBottomWidth: 1, borderBottomColor: colors.neutral200 } });
