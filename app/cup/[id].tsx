import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, EmptySection, EmptyState, Icon, IconButton, InfoNote, PageHeader, Screen, Text } from '@/components/ui';
import { deleteCup, getCup, listCups } from '@/database/repository';
import { localizedFlavor, satisfactionLabel, type Cup, type TasteValues } from '@/domain/types';
import { colors, spacing } from '@/design-system/tokens';
import { ConfirmDialog } from '@/components/confirmDialog';
import { useFeedback } from '@/components/feedback';

const tasteLabels: Record<keyof TasteValues, string> = { acidity: '산미', sweetness: '단맛', body: '질감', bitterness: '쓴맛', aroma: '향', aftertaste: '여운', balance: '균형' };

export default function CupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { showFeedback } = useFeedback();
  const [cup, setCup] = useState<Cup | null>(null);
  const [sameBeanCount, setSameBeanCount] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useFocusEffect(useCallback(() => {
    if (!id) return;
    let active = true;
    void getCup(db, id).then(async (value) => {
      if (!active) return;
      setCup(value);
      setSameBeanCount(value?.beanId ? (await listCups(db, { beanId: value.beanId })).filter((item) => item.kind === 'home').length : 0);
    });
    return () => { active = false; };
  }, [db, id]));
  if (!cup) return <Screen><EmptyState title="기록을 찾을 수 없어요" body="기록 탭에서 다른 커피를 골라주세요." /></Screen>;
  const tasteEntries = (Object.entries(cup.taste) as [keyof TasteValues, number | null][]).filter((entry) => entry[1] != null);
  const editLabel = cup.kind === 'cafe' ? '카페 기록 수정' : cup.satisfaction ? '맛 기록 수정' : '맛 남기기';
  const editPath = cup.kind === 'cafe' ? `/record-cafe?cupId=${cup.id}` : `/record-cup/${cup.id}`;
  return <Screen header={<PageHeader title={cup.beanName} backLabel="기록" backHref="/(tabs)/journal" action={<IconButton name="ellipsis" label="기록 메뉴 열기" onPress={() => setMenuOpen(true)} />} />}>
    {cup.imageUri ? <Image source={{ uri: cup.imageUri }} style={styles.photo} accessibilityLabel="이 커피의 사진" /> : null}
    <Card style={styles.hero}><Text variant="title1">{cup.satisfaction ? satisfactionLabel[cup.satisfaction] : '아직 맛을 남기지 않았어요'}</Text><Text>{cup.flavorTags.map(localizedFlavor).join(' · ') || '떠오른 맛은 나중에 추가해도 돼요.'}</Text></Card>
    {cup.recipeSnapshot ? <Card><Text variant="title2">핵심 추출값</Text><View style={styles.metrics}><Metric label="원두" value={`${cup.recipeSnapshot.doseG}g`} /><Metric label="물" value={`${cup.recipeSnapshot.waterMl}ml`} /><Metric label="온도" value={`${cup.recipeSnapshot.temperatureC}℃`} /><Metric label="시간" value={`${Math.floor(cup.recipeSnapshot.totalTimeSec / 60)}분 ${cup.recipeSnapshot.totalTimeSec % 60}초`} /></View><Text variant="title3">사용한 조건</Text><Detail label="분쇄도" value={cup.recipeSnapshot.grindTarget} /><Detail label="드리퍼" value={cup.recipeSnapshot.dripper} /><Detail label="필터" value={cup.recipeSnapshot.filter} /></Card> : null}
    <Card><Text variant="title2">맛 기록</Text>{tasteEntries.length ? tasteEntries.map(([key, value]) => <Detail key={key} label={tasteLabels[key]} value={`${value} / 5`} />) : <EmptySection body="자세한 맛 점수는 기록하지 않았어요." />}{cup.memo ? <View style={styles.memo}><Text variant="label">메모</Text><Text>{cup.memo}</Text></View> : null}<Button label={editLabel} onPress={() => router.push(editPath as never)} style={styles.tasteEdit} /></Card>
    {cup.kind === 'home' ? <InfoNote body="추출값은 당시 브루잉 기록으로 보관해요. 맛과 메모만 수정할 수 있어요." /> : null}
    {cup.beanId && sameBeanCount >= 2 ? <View style={styles.compare}><View style={styles.flex}><Text variant="label">이 원두의 다른 기록과 비교</Text><Text variant="caption" color={colors.neutral600}>추출 조건과 맛의 차이를 살펴보세요.</Text></View><Button label="비교하기" variant="secondary" onPress={() => router.push(`/compare?beanId=${cup.beanId}`)} style={styles.compareButton} /></View> : cup.beanId ? <Card tone="tinted"><Text variant="label">비교하려면 한 잔 더 필요해요</Text><Text color={colors.neutral600}>같은 원두로 한 번 더 내리면 추출값과 맛의 차이를 볼 수 있어요.</Text></Card> : null}
    <CupMenu visible={menuOpen} onClose={() => setMenuOpen(false)} onDelete={() => { setMenuOpen(false); setConfirmDelete(true); }} />
    <ConfirmDialog
      visible={confirmDelete}
      title="이 기록을 삭제할까요?"
      body={cup.kind === 'home' ? '컵 기록만 삭제해요. 실제로 사용한 원두의 남은 양은 되돌리지 않아요.' : '카페에서 마신 이 기록을 완전히 삭제해요.'}
      confirmLabel="삭제"
      destructive
      onCancel={() => setConfirmDelete(false)}
      onConfirm={() => {
        setConfirmDelete(false);
        void deleteCup(db, cup.id).then(() => {
          showFeedback('커피 기록을 삭제했어요.');
          router.replace('/(tabs)/journal');
        });
      }}
    />
  </Screen>;
}

function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text variant="caption" color={colors.neutral600}>{label}</Text><Text variant="title3">{value}</Text></View>; }
function Detail({ label, value }: { label: string; value: string }) { if (!value) return null; return <View style={styles.row}><Text variant="label" style={styles.label}>{label}</Text><Text style={styles.flex}>{value}</Text></View>; }
function CupMenu({ visible, onClose, onDelete }: { visible: boolean; onClose: () => void; onDelete: () => void }) { return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.menuLayer}><Pressable accessibilityRole="button" accessibilityLabel="기록 메뉴 닫기" style={StyleSheet.absoluteFill} onPress={onClose} /><View accessibilityViewIsModal style={styles.menu}><Pressable accessibilityRole="button" accessibilityLabel="기록 삭제" onPress={onDelete} style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}><Icon name="trash" size={20} color={colors.error} /><Text variant="label" color={colors.error}>기록 삭제</Text></Pressable></View></View></Modal>; }
const styles = StyleSheet.create({ photo: { width: '100%', height: 250, borderRadius: 18 }, hero: { backgroundColor: colors.warmBeige }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact }, metric: { width: '48%', minHeight: 72, justifyContent: 'center', padding: spacing.small, backgroundColor: colors.creamDeep, borderRadius: 14 }, row: { flexDirection: 'row', gap: spacing.small, paddingTop: spacing.compact }, label: { width: 96 }, flex: { flex: 1 }, memo: { gap: spacing.compact, paddingTop: spacing.small }, tasteEdit: { marginTop: spacing.roomy }, compare: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingHorizontal: spacing.small, paddingVertical: spacing.compact, borderRadius: 14, backgroundColor: colors.creamDeep }, compareButton: { minWidth: 0, minHeight: 38, paddingHorizontal: spacing.small, paddingVertical: 7 }, menuLayer: { flex: 1 }, menu: { position: 'absolute', top: 76, right: 18, width: 180, overflow: 'hidden', borderRadius: 18, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 }, menuAction: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingHorizontal: spacing.small }, pressed: { opacity: 0.62 } });
