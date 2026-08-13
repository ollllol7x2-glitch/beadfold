import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, EmptyState, PageHeader, Screen, Text } from '@/components/ui';
import { getCup, listCups } from '@/database/repository';
import { localizedFlavor, satisfactionLabel, type Cup, type TasteValues } from '@/domain/types';
import { colors, spacing } from '@/design-system/tokens';

const tasteLabels: Record<keyof TasteValues, string> = { acidity: '산미', sweetness: '단맛', body: '질감', bitterness: '쓴맛', aroma: '향', aftertaste: '여운', balance: '균형' };

export default function CupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [cup, setCup] = useState<Cup | null>(null);
  const [sameBeanCount, setSameBeanCount] = useState(0);
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
  return <Screen>
    <PageHeader title={cup.beanName} description={new Date(cup.createdAt).toLocaleString('ko-KR')} backLabel="기록" />
    {cup.imageUri ? <Image source={{ uri: cup.imageUri }} style={styles.photo} accessibilityLabel="이 커피의 사진" /> : null}
    <Card style={styles.hero}><Text variant="title1">{cup.satisfaction ? satisfactionLabel[cup.satisfaction] : '아직 맛을 남기지 않았어요'}</Text><Text>{cup.flavorTags.map(localizedFlavor).join(' · ') || '떠오른 맛은 나중에 추가해도 돼요.'}</Text></Card>
    {cup.recipeSnapshot ? <Card><Text variant="title2">핵심 추출값</Text><View style={styles.metrics}><Metric label="원두" value={`${cup.recipeSnapshot.doseG}g`} /><Metric label="물" value={`${cup.recipeSnapshot.waterMl}ml`} /><Metric label="온도" value={`${cup.recipeSnapshot.temperatureC}℃`} /><Metric label="시간" value={`${Math.floor(cup.recipeSnapshot.totalTimeSec / 60)}분 ${cup.recipeSnapshot.totalTimeSec % 60}초`} /></View><Text variant="title3">사용한 조건</Text><Detail label="분쇄도" value={cup.recipeSnapshot.grindTarget} /><Detail label="드리퍼" value={cup.recipeSnapshot.dripper} /><Detail label="필터" value={cup.recipeSnapshot.filter} /></Card> : null}
    <Card><Text variant="title2">맛 기록</Text>{tasteEntries.length ? tasteEntries.map(([key, value]) => <Detail key={key} label={tasteLabels[key]} value={`${value} / 5`} />) : <Text color={colors.neutral800}>자세한 맛 점수는 기록하지 않았어요.</Text>}{cup.memo ? <View style={styles.memo}><Text variant="label">메모</Text><Text>{cup.memo}</Text></View> : null}</Card>
    <Button label={cup.satisfaction ? '맛 기록 수정' : '맛 남기기'} onPress={() => router.push(`/record-cup/${cup.id}`)} />
    {cup.beanId && sameBeanCount >= 2 ? <Button label="이 원두의 다른 기록과 비교" variant="secondary" onPress={() => router.push(`/compare?beanId=${cup.beanId}`)} /> : cup.beanId ? <Card tone="tinted"><Text variant="label">비교하려면 한 잔 더 필요해요</Text><Text color={colors.neutral800}>같은 원두로 한 번 더 내리면 추출값과 맛의 차이를 볼 수 있어요.</Text></Card> : null}
  </Screen>;
}

function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text variant="caption" color={colors.neutral600}>{label}</Text><Text variant="title3">{value}</Text></View>; }
function Detail({ label, value }: { label: string; value: string }) { if (!value) return null; return <View style={styles.row}><Text variant="label" style={styles.label}>{label}</Text><Text style={styles.flex}>{value}</Text></View>; }
const styles = StyleSheet.create({ photo: { width: '100%', height: 250, borderRadius: 18 }, hero: { backgroundColor: colors.warmBeige }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact }, metric: { width: '48%', minHeight: 72, justifyContent: 'center', padding: spacing.small, backgroundColor: colors.creamDeep, borderRadius: 14 }, row: { flexDirection: 'row', gap: spacing.small, paddingTop: spacing.compact }, label: { width: 96 }, flex: { flex: 1 }, memo: { gap: spacing.compact, paddingTop: spacing.small } });
