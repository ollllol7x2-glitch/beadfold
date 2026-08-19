import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Icon, InfoNote, PageHeader, Screen, Text, type SymbolName } from '@/components/ui';
import { ConfirmDialog } from '@/components/confirmDialog';
import { getSetting, setSetting } from '@/database/repository';
import { colors, radius, spacing } from '@/design-system/tokens';
import { requestTasteReminderPermission } from '@/services/notifications';
import { createBackupArchive, parseBackupArchive, restoreBackupArchive, summarizeBackup, type BackupArchive } from '@/services/backup';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [haptics, setHaptics] = useState(true); const [sound, setSound] = useState(false);
  const [status, setStatus] = useState('');
  const [pendingRestore, setPendingRestore] = useState<BackupArchive | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  useFocusEffect(useCallback(() => { let active = true; void Promise.all([getSetting(db, 'haptics', 'true'), getSetting(db, 'sound', 'false')]).then(([h, s]) => { if (active) { setHaptics(h === 'true'); setSound(s === 'true'); } }); return () => { active = false; }; }, [db]));
  const update = async (key: string, value: boolean, setter: (value: boolean) => void) => { setter(value); await setSetting(db, key, String(value)); };
  const notifications = async () => { const granted = await requestTasteReminderPermission(); await setSetting(db, 'notification_reminders', String(granted)); setStatus(granted ? '브루잉이 끝난 뒤 맛 기록을 잊지 않도록 알려드릴게요.' : '알림을 켜지 않았어요. 필요할 때 다시 선택할 수 있어요.'); };
  const exportBackup = async () => {
    if (Platform.OS !== 'web') return;
    setBackupBusy(true);
    try {
      const archive = await createBackupArchive(db);
      const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `beanfold-backup-${archive.exportedAt.slice(0, 10)}.json`; link.click();
      URL.revokeObjectURL(url);
      setStatus(`백업 파일을 만들었어요. 원두 ${archive.data.beans.length}개, 커피 기록 ${archive.data.cups.length}개가 담겼어요.`);
    } catch { setStatus('백업 파일을 만들지 못했어요. 다시 시도해주세요.'); } finally { setBackupBusy(false); }
  };
  const selectBackup = () => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void file.text().then((source) => setPendingRestore(parseBackupArchive(source))).catch((error: unknown) => setStatus(error instanceof Error ? error.message : '백업 파일을 읽지 못했어요.'));
    };
    input.click();
  };
  const restoreBackup = async () => {
    if (!pendingRestore) return;
    setBackupBusy(true);
    try {
      const summary = await restoreBackupArchive(db, pendingRestore);
      setStatus(`복원했어요. 원두 ${summary.beans}개와 커피 기록 ${summary.cups}개를 다시 가져왔어요.`);
    } catch { setStatus('복원하지 못했어요. 백업 파일을 다시 확인해주세요.'); }
    finally { setPendingRestore(null); setBackupBusy(false); }
  };
  return <Screen header={<PageHeader title="설정" backLabel="마이페이지" backHref="/(tabs)/profile" />} contentContainerStyle={styles.screen}>
    {status ? <Text accessibilityRole="alert" color={colors.neutral600}>{status}</Text> : null}
    <View style={styles.group}><Setting icon="iphone.vibrate" label="단계 알림 진동" body="다음 단계가 되면 짧게 알려줘요" value={haptics} onChange={(value) => void update('haptics', value, setHaptics)} /><Setting icon="speaker.wave.2.fill" label="알림 소리" body="맛 기록 알림을 소리와 함께 받아요" value={sound} onChange={(value) => void update('sound', value, setSound)} /></View>
    {Platform.OS !== 'web' ?
      <Card tone="tinted"><View style={styles.cardTitle}><Icon name="bell.badge.fill" size={23} /><Text variant="title3">맛 기록 알림</Text></View><Text color={colors.neutral600}>브루잉을 마친 뒤 맛이 선명할 때 한 번 알려드려요.</Text><Button label="알림 켜기" variant="secondary" onPress={() => void notifications()} /></Card>
      : null}
    <Card><View style={styles.cardTitle}><Icon name="archivebox.fill" size={23} /><Text variant="title3">데이터와 백업</Text></View>{Platform.OS === 'web' ? <><View style={styles.backupActions}><Button label="백업 파일 만들기" variant="secondary" loading={backupBusy} onPress={() => void exportBackup()} style={styles.flex} /><Button label="백업 파일 불러오기" variant="secondary" disabled={backupBusy} onPress={selectBackup} style={styles.flex} /></View><InfoNote body="기록은 이 브라우저에 저장돼요. 백업 파일을 불러오면 저장 당시 상태로 돌아가며, 사진은 포함되지 않을 수 있어요." /></> : <Text variant="caption" color={colors.neutral600}>이 휴대폰에 저장돼요. 파일 백업과 복원은 웹 버전에서 사용할 수 있어요.</Text>}</Card>
    <ConfirmDialog visible={pendingRestore != null} title="백업 파일로 복원할까요?" body={pendingRestore ? `현재 기록은 바뀌어요. 원두 ${summarizeBackup(pendingRestore).beans}개와 커피 기록 ${summarizeBackup(pendingRestore).cups}개를 가져옵니다.` : ''} confirmLabel="복원하기" destructive onCancel={() => setPendingRestore(null)} onConfirm={() => void restoreBackup()} />
  </Screen>;
}
function Setting({ icon, label, body, value, onChange }: { icon: SymbolName; label: string; body: string; value: boolean; onChange: (value: boolean) => void }) {
  const [progress] = useState(() => new Animated.Value(value ? 1 : 0));
  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: value ? 1 : 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [progress, value]);
  const thumbTranslateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const trackColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.creamDeep, colors.action] });
  const trackBorderColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.neutral200, colors.action] });
  return <View style={styles.setting}><View style={styles.settingIcon}><Icon name={icon} size={22} /></View><View style={styles.copy}><Text variant="title3">{label}</Text><Text color={colors.neutral600}>{body}</Text></View><Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} onPress={() => onChange(!value)} style={({ pressed }) => [styles.toggleHit, pressed && styles.togglePressed]}><Animated.View style={[styles.toggleTrack, { backgroundColor: trackColor, borderColor: trackBorderColor }]}><Animated.View style={[styles.toggleThumb, { transform: [{ translateX: thumbTranslateX }] }]} /></Animated.View></Pressable></View>;
}
const styles = StyleSheet.create({ screen: { gap: spacing.section }, flex: { flex: 1 }, group: { backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden' }, setting: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small }, settingIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 2 }, toggleHit: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, toggleTrack: { width: 44, height: 28, flexDirection: 'row', padding: 3, borderRadius: radius.full, borderWidth: 1 }, toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white, shadowColor: colors.espresso, shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }, togglePressed: { opacity: 0.88, transform: [{ scale: 0.96 }] }, cardTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact }, backupActions: { flexDirection: 'row', gap: spacing.compact } });
